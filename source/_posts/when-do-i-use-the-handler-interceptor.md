---
title: HandlerInterceptor은 언제 사용하나요?
date: 2021-08-09
tags:
 - Spring MVC
---

![](../images/logo/spring.png#compact)

안녕하세요 Mambo입니다. 오늘은 스프링 MVC 모듈에 포함되어있는 HandlerInterceptor 인터페이스를 언제 사용하는가에 대해서 알아보겠습니다.

## HandlerInterceptor
> A HandlerInterceptor gets called before the appropriate HandlerAdapter triggers the execution of the handler itself. This mechanism can be used for a large field of preprocessing aspects, e.g. for authorization checks, or common handler behavior like locale or theme changes. Its main purpose is to allow for factoring out repetitive handler code.

**HandlerInterceptor**는 컨트롤러 핸들러 함수에 대한 전처리 동작을 수행할 수 있는 방법을 제공합니다. 필터도 전처리 동작을 수행할 수 있지만 web.xml에 정의되는 필터와 다르게 HandlerInterceptor는 애플리케이션 컨텍스트에서 관리하므로 요청 정보를 분석하여 사용자를 인증하거나 응답 뷰를 렌더링하기 전에 부가 데이터를 주입하는 동작을 수행할 수 있습니다.

예를 들어, 기본으로 제공되는 HandlerInterceptor 구현체인 **LocaleChangeInterceptor**는 로케일 파라미터에 따라 현재 로케일을 변경하는 동작을 수행하죠.

### 정적 리소스 패턴 제외
**ResourceHandlerRegistry**는 정적 리소스를 배포하기 위한 핸들러를 등록하는 것을 지원하는 클래스입니다. 이때, 리소스 핸들러가 처리할 경로를 매칭하기 위하여 AntPathMatcher 또는 PathPattern을 사용하게 되는데 Ant 스타일의 패턴 매칭을 사용하므로 특정 패턴을 제외하기 위한 Regex 같은 방식을 사용할 수 없습니다. 

리소스 핸들러가 처리하는 경로에 대해서 특정 패턴을 제외하기 위해서는 해당 패턴을 처리하지 않도록 패턴별로 등록하여야합니다. 하지만, 이렇게 올바른 패턴마다 리소스 핸들러를 등록하는 것은 불편합니다.

```java ResourceHandlerRegistry
@Configuration(proxyBeanMethods = false)
public class MvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**").addResourceLocations("classpath:/static/images/");
    }
}
```

위 예시는 **/images/**** 패턴의 경로에 대해서 클래스패스의 **static/images** 폴더에 있는 정적 리소스로 처리하기 위한 핸들러를 등록합니다. images 폴더에는 이미지 파일만 있다고 가정했으나 개발자의 실수로 images 폴더에 이미지가 아닌 동영상 파일이나 오디오 파일이 들어있다면 해당 리소스도 처리하게 됩니다.

이렇게 특정 패턴을 방지해야하는 경우에 HandlerInterceptor를 등록하여 요청을 분석하여 리소스를 응답하지 않도록 전처리 동작을 구현할 수 있습니다.

다음과 같이 **이미지 파일 패턴이 아니라면 요청을 404 Not Found로 처리**하는 동작을 수행할 수 있습니다.

```java
@Configuration
public class MvcConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(onlyServeImagesHandlerInterceptor()).addPathPatterns("/images/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**").addResourceLocations("classpath:/static/images/");
    }

    @Bean
    OnlyServeImagesHandlerInterceptor onlyServeImagesHandlerInterceptor() {
        return new OnlyServeImagesHandlerInterceptor();
    }

    public static class OnlyServeImagesHandlerInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String requestURI = request.getRequestURI();
            if(!requestURI.matches(".*\\/.*\\.(jpg|jpeg|png|gif)")) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return false;
            }
            return true;
        }
    }
}
```

위 인터셉터가 정말로 이미지 파일에 대해서만 처리할 수 있게 사전 처리를 수행하는지 확인해보겠습니다.

![](/images/posts/handler-interceptor-01.gif)

위 결과를 보면 이미지 파일은 정적 리소스로 배포되도록 처리되었지만 동영상 파일은 처리되지 않게 된걸 확인할 수 있습니다. 

### 뷰 응답 시 부가 정보 주입 
두번째로는 뷰를 응답하는 핸들러 함수에 대하여 **부가 정보를 주입**하는데에 사용할 수 있습니다. 

다음의 코드는 뷰를 응답하게되는 핸들러 함수에 사용 가능한 언어와 함께 현재 로케일에 대한 메시지 코드 목록을 주입하는 인터셉터 예시입니다.

```java InjectionLocalesInterceptor
public static class InjectionLocalesInterceptor extends HandlerInterceptorAdapter {
    private MessagePool messagePool = null;

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        if(modelAndView != null && messagePool != null) {
            Locale locale = messagePool.getLocale();
            if(locale == null) {
                locale = Locale.getDefault();
            }

            modelAndView.addObject("lang", locale.getLanguage());
            modelAndView.addObject("locale", locale.toString());

            if(handler instanceof HandlerMethod) {
                HandlerMethod handlerMethod = (HandlerMethod) handler;
                Class<?> beanType = handlerMethod.getBeanType();
                Controller controller = beanType.getAnnotation(Controller.class);
                if(controller != null) {
                    modelAndView.addObject("locales", messagePool.getLocales());
                    modelAndView.addObject("messages", messagePool.getMessagesInJson().toString());
                }
            }
        }
        super.postHandle(request, response, handler, modelAndView);
    }
}
```

이제 템플릿 엔진에서 주입된 부가 정보를 사용하여 렌더링을 할 수 있게 됩니다.

### 인증을 위한 인터셉터
또 다른 인터셉터의 활용 방안은 인증 처리입니다. 사용자에게 이메일 또는 카카오톡 메시지등을 발송하여 어떤 행동을 할 수 있는 링크를 주게 된다고 가정해보면 해당 링크를 통해 들어오는 사용자은 인증을 수행하기 전일 수 있습니다. 이때 주어지는 링크에 임시적으로 인증에 사용할 수 있는 만료성 토큰 파라미터를 포함시킴으로써 사용자를 인증하는 로직을 추가할 수 있습니다.

![코인원의 이메일 인증하기 버튼](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31015797034/original/89mawYXJeO_K082-5HF52bd73j_SN60nLQ.png)

위 예시 이미지의 이메일 인증하기 버튼에 대한 링크에는 코인원에서 분석할 수 있는 어떠한 파라미터에 인증을 위한 식별 정보가 있을거라 추측합니다.

다음은 토큰 파라미터 유무를 확인하고 토큰 파라미터를 분석하여 인증을 수행하는 인터셉터 구현의 예시입니다.

```java TokenBasedAuthenticationInterceptor
public static class TokenBasedAuthenticationInterceptor implements HandlerInterceptor {
    private static final String TOKEN_PARAMETER_NAME = "token";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String parameter = request.getParameter(TOKEN_PARAMETER_NAME);
        if(parameter != null && !parameter.equals("")) {
            // NOTE: 토큰 파라미터 분석 및 검증
            String token = analyticsToken(parameter);
            boolean valid = validateToken(token);
            if(valid) {
                // NOTE: 토큰 기반 인증 처리
                authenticationByToken(token);
            }
            return valid;
        }

        return false;
    }
}
```

**일정 시간이 만료**되면 해당 토큰으로는 인증할 수 없고 이미 인증을 수행하여 **사용이 완료된 토큰**으로 확인하는 것은 토큰 파라미터 분석 및 검증 로직에 포함될겁니다.

간단하게 HandlerInterceptor의 활용 방안 3가지를 확인해보았습니다. 애플리케이션 마다 요구사항이 다르고 무궁무진 하기 때문에 HandlerInterceptor는 더 다양한 방식으로 활용할 수 있을 겁니다. 이상으로 HandlerInterceptor은 언제 사용하나요?를 마치겠습니다. 감사합니다.