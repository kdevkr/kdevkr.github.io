---
title: 클라이언트 HTTP 요청부터 스프링 애플리케이션 응답하기까지의 과정
date: 2021-03-17
tags:
- HTTP
- Content-Type
- MediaType
- MessageConverter
---

안녕하세요 Mambo 입니다. 오늘은 **클라이언트의 HTTP 요청부터 스프링 애플리케이션의 응답까지의 과정** 에 대하여 이야기를 해보려고합니다. 제가 진행하는 공부방식 중 하나는 [OKKY](https://okky.kr/articles/questions)에 올라오는 질문들을 살펴보면서 문제점을 파악하고 해결책을 찾아보는 과정을 진행하는 것입니다. 그런데 OKKY에 등록되는 질문들 중 대부분이 `AJAX`으로 데이터를 보내고 `스프링 컨트롤러`에서 데이터를 받는게 안된다는 유형이 많은 편입니다. 해당 질문 작성자들은 스프링 경험이 많지 않은 초보 개발자 이거나 스프링에 대한 이해없이 빠르게 예제를 통해 학습한 국비지원 수강생으로 보입니다.

> 국비지원에 대한 비하로 느껴질 수 있으시겠습니다만, 스프링은 여러가지 프로그래밍 개념이 복합적으로 이루어진 프레임워크로 일반적으로 컴퓨터 공학과에서 배우는 전공 지식과는 별개로 쉽게 이해하기에는 어렵습니다. 그러니까 비전공자이기 때문에 어려운 것이 아니라 개념적으로 어려운 것이니 우울해하지 않으셔도 됩니다.

4년 동안 스프링 기반으로 웹 애플리케이션을 개발하고 있는 저 또한 스프링을 제대로 이해하지는 못했습니다. 처음에 토비님이 작성하신 `토비의 스프링 3.1` 서적을 앞에서 읽다가 뒤부터 읽다가 이해가 안되서 대충이라도 최소한 4번은 읽은 것 같습니다. 

그런데 앞서 언급한 질문들은 스프링의 개념을 이해를 못했다기보다는 HTTP 웹 요청 과정에 대한 이해가 부족하기 때문에 발생하는 문제라고 볼 수 있습니다. 스프링에 포함된 여러가지 모듈 중 웹 요청과 관련된 모듈은 `spring-web`과 `spring-webmvc` 인데요. 이 모듈들은 여러분이 스프링 기반의 웹 애플리케이션을 작성하는데 도움을 제공하는 클래스들이 포함되어있습니다. 

이 글의 주요 내용인 클라이언트의 HTTP 요청부터 스프링 애플리케이션의 응답까지의 과정을 위 두개의 모듈이 제공하는 클래스들의 연관성을 찾아가면 쉽게 이해할 수 있습니다. 이 글을 통해 HTTP 요청과 응답 과정을 이해하신다면 제가 예전에 작성하였던 [초보 및 신입 개발자들을 위한 spring to ajax에 대한 정리](https://okky.kr/article/374594)의 여러가지 케이스를 좀 더 쉽게 받아들일 수 있을거라 봅니다.

> 관련 코드 : [kdevkr/spring-demo-ajax](https://github.com/kdevkr/spring-demo-ajax)

## HTTP 요청
먼저, 웹 브라우저와 같은 클라이언트에서 HTTP 요청을 수행하는 과정을 이해해야합니다. MDN 개발자 문서에서는 [HTTP 메시지](https://developer.mozilla.org/ko/docs/Web/HTTP/Messages)에 대해 자세하게 설명해주고 있습니다.

### HTTP 메시지
![출처 : MDN HTTP Messages](https://mdn.mozillademos.org/files/13827/HTTPMsgStructure2.png)

위 그림에서처럼 여러분이 웹 브라우저를 통해 어떤 웹 사이트로 접근하는 것도 위와 같은 메시지를 요청하고 응답받습니다. 예를 들어, OKKY 사이트에 접속하기 위해서 `okky.kr` 주소를 입력하면 웹 브라우저가 대신해서 다음과 같은 정보로 HTTP 메시지를 보내고 응답을 받은 것을 브라우저에서 보여주는 것입니다.

![[GET] okky.kr](/images/posts/http-requests-responses-01.png)

> 지금 이 글을 보고 계시니까 이 과정은 다 이해하실테지요 :)

### HTTP Headers
앞선 그림에서 웹 브라우저는 요청 헤더(Request Headers)에 무언가 많이 포함하고 있는 것을 볼 수 있을겁니다. 이 HTTP 요청 헤더는 HTTP 요청에 대한 부가정보를 제공한다고 볼 수 있는데요. 여러가지 [헤더](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)를 통해서 요청자를 식별할 수 있게 하거나 인증 정보를 포함하기도 하고 서버에게 요청에 대해 내가 응답받으려는 형태를 알려주기도 합니다.

Accept, Accept-Encoding, Accept-Language는 [컨텐츠 협상(Content negotiation)](https://developer.mozilla.org/ko/docs/Web/HTTP/Content_negotiation)이라고 해서 HTTP 요청에 대하여 응답하는 서버가 어떤 형태로 내려주는게 가장 알맞는 것인지 알려주는 역할을 합니다. 그리고 HTTP 요청을 통해 데이터를 포함해서 보낼때 포함되는 [컨텐트 타입(Content-Type)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)도 있고 파일 다운로드할 때 사용되는 [Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition) 헤더도 있죠.

우선 기본적으로 알고 있어야하는 요청 헤더는 `Accept`, `Content-Type` 이라고 할 수 있습니다. Accept 헤더는 서버가 응답하기 위해 HTTP 메시지를 구성할 때 알맞는 형태로 제공해달라는 정보이고 Content-Type 헤더는 HTTP 메시지에 포함된 데이터가 어떤 형태로 구성되는지를 서버에게 알려주는 역할을 합니다. 따라서, 클라이언트에서 HTTP 요청할 때 HTTP 메시지에 포함되는 메시지 형태에 따라 Content-Type 헤더를 제공해야하고 서버로부터 특정 메시지 형태로 받고 싶다면 Accept 헤더에 알맞는 값을 지정해야하죠.

> 위 예시에서 OKKY 서버는 웹 브라우저가 요청한 Accept 헤더 중 첫번째인 text/html으로 HTTP 메시지를 응답했습니다.

#### Accept
Accept 헤더의 값은 `<MIME_type>/<MIME_subtype>` 형태로 구성하는데 대부분 `*/*` 으로 지정하여 서버가 알아서 응답 메시지 형태를 구성하거나 AJAX으로 요청하는 경우 `application/json`으로 설정하기도 하죠.

다음은 주로 사용되는 Accept 값이며 이외에도 많으니 한번 찾아보시는 것을 추천드립니다.

- text/plain, text/html, text/css, text/javascript
- image/png, image/jpeg
- application/json, application/xml, application/octet-stream

#### Content-Type
Content-Type 헤더는 HTTP 메시지에 포함된 데이터의 형태를 알려주는 값이라고 했습니다. OKKY에 로그인하기 위해서 구글 OAuth 인증에 대한 HTTP 요청 정보를 확인해보면 다음과 같이 구성됨을 확인할 수 있습니다.

![구글 계정으로 인증 시 요청 메시지](/images/posts/http-requests-responses-02.png)

구글 계정으로 인증 시 포함하는 요청 데이터가 `폼 데이터` 형태로 구성되어있다는 것을 알려주기 위해서 Content-Type에 `application/x-www-form-urlencoded`을 지정하였습니다.

![구글 계정으로 인증 시 응답 메시지](/images/posts/http-requests-responses-03.png)

구글 인증 서버는 구글 계정 인증에 대한 결과가 JSON 형태의 문자열인 것을 알려주기 위해서 Content-Type에 `application/json`을 지정한 것을 확인할 수 있습니다. 이렇게 서버로 어떤 데이터가 포함되어야하는 요청이라면 요청 메시지를 구성하고 메시지 형태에 따라 Content-Type을 지정해야함을 알 수 있습니다.

## 스프링 웹 모듈
스프링 5부터는 리액티브 스택 기반의 애플리케이션을 작성할 수 있는 모듈이 있지만 일반적으로 사용되는 서블릿 기반의 `spring-webmvc` 모듈을 통해 HTTP 요청을 어떻게 처리하는지 알아보도록 합시다. 모듈 이름에서 확인할 수 있듯이 서블릿 기반의 웹 애플리케이션은 MVC 아키텍처 형태로 동작합니다. 스프링 웹 모듈에는 모든 HTTP 요청의 진입점이 되는 DispatcherServlet 클래스가 있으며 HTTP 요청에 대한 핸들러를 찾아 처리를 위임하게 됩니다.

### DispatcherServlet
다음은 DispatcherServlet 클래스의 doDispatch 함수의 일부분입니다.
```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...
    // Determine handler for the current request.
    mappedHandler = getHandler(processedRequest);
    if (mappedHandler == null) {
        noHandlerFound(processedRequest, response);
        return;
    }

    // Determine handler adapter for the current request.
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
    ...
}
```

굉장히 단순한 코드라고 할 수 있는데요. 현재 처리중인 요청에 대한 핸들러가 존재하지 않는 경우 noHandlerFound 함수를 호출해서 오류를 발생시킬 지 404 NotFound 응답을 제공할지 결정하고 현재 요청을 처리할 수 있는 핸들러가 있다면 해당 핸들러에 대한 핸들러 어댑터를 찾아 처리를 수행하죠. 핸들러를 찾았지만 다시 핸들러 어댑터를 찾아 처리가 되도록하는 이유가 궁금하지 않으신가요? 그럼 핸들러 어댑터(HandlerAdapter)를 찾아가보도록 합시다.

### HandlerAdapter
HandlerAdapter는 인터페이스로 추상화되어있으니 실제 동작을 수행하는 구현체를 찾아야 합니다.

![HandlerAdapter 구현체](/images/posts/http-requests-responses-04.png)

다른 클래스와 달리 AbstractHandlerMethodAdapter는 추상클래스로 되어있으니 한번 더 클래스를 찾아봅니다.

![RequestMappingHandlerAdapter](/images/posts/http-requests-responses-05.png)

한번이라도 스프링의 컨트롤러를 작성하신분들이라면 눈에 들어오는 것이 있습니다. 바로 `RequestMapping` 어노테이션입니다. RequestMappingHandlerAdapter 클래스의 주석을 살펴보면 핸들러 함수에 선언된 RequestMapping을 지원하는 AbstractHandlerMethodAdapter의 `확장`이라고 합니다. 그러니까 여러분이 @RequestMapping이나 @GetMapping, @PostMapping등의 어노테이션을 선언하여 컨트롤러의 핸들러 함수를 작성하면 RequestMappingHandlerAdapter를 통해 처리가 수행된다는 거죠.

직접 찾아보시는 분들이라면 RequestMappingHandlerAdapter의 수많은 함수 중에서 handleInternal으로 요청이 처리됨을 확인할 수 있을겁니다. 그리고 invokeHandlerMethod를 호출해서 여러분이 작성한 핸들러 함수를 실행합니다. 

![Spring 4.2+ invokeHandlerMethod](/images/posts/http-requests-responses-06.png)

> 위 invokeHandlerMethod는 스프링 5 기준의 코드인데 스프링 4.2가 명시되어있는 것을 보면 이전에는 다른 함수를 호출했을 것 같습니다. 스프링 4.2 이전 버전으로 개발하고 있으신 분들이라면 직접 찾아보시기 바랍니다. 귀찮아요...ㅠㅠ

RequestMappingHandlerAdapter는 스프링 3.1부터 추가되었으니 RequestMappingHandlerAdapter를 바로 찾으시면 됩니다. 

여러분이 작성한 컨트롤러의 핸들러 함수를 호출하는 부분이므로 코드를 좀 자세히 보도록 하겠습니다.

```java invokeHandlerMethod
@Nullable
protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
        HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {

    ServletWebRequest webRequest = new ServletWebRequest(request, response);
    try {
        WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);
        ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);

        ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);
        if (this.argumentResolvers != null) {
            invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
        }
        if (this.returnValueHandlers != null) {
            invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
        }
        invocableMethod.setDataBinderFactory(binderFactory);
        invocableMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);

        ModelAndViewContainer mavContainer = new ModelAndViewContainer();
        mavContainer.addAllAttributes(RequestContextUtils.getInputFlashMap(request));
        modelFactory.initModel(webRequest, mavContainer, invocableMethod);
        mavContainer.setIgnoreDefaultModelOnRedirect(this.ignoreDefaultModelOnRedirect);

        AsyncWebRequest asyncWebRequest = WebAsyncUtils.createAsyncWebRequest(request, response);
        asyncWebRequest.setTimeout(this.asyncRequestTimeout);

        WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
        asyncManager.setTaskExecutor(this.taskExecutor);
        asyncManager.setAsyncWebRequest(asyncWebRequest);
        asyncManager.registerCallableInterceptors(this.callableInterceptors);
        asyncManager.registerDeferredResultInterceptors(this.deferredResultInterceptors);

        if (asyncManager.hasConcurrentResult()) {
            Object result = asyncManager.getConcurrentResult();
            mavContainer = (ModelAndViewContainer) asyncManager.getConcurrentResultContext()[0];
            asyncManager.clearConcurrentResult();
            LogFormatUtils.traceDebug(logger, traceOn -> {
                String formatted = LogFormatUtils.formatValue(result, !traceOn);
                return "Resume with async result [" + formatted + "]";
            });
            invocableMethod = invocableMethod.wrapConcurrentResult(result);
        }

        invocableMethod.invokeAndHandle(webRequest, mavContainer);
        if (asyncManager.isConcurrentHandlingStarted()) {
            return null;
        }

        return getModelAndView(mavContainer, modelFactory, webRequest);
    }
    finally {
        webRequest.requestCompleted();
    }
}
```

아직까지 용도는 모르겠으나 핸들러 함수를 기반으로 WebDataBinderFactory, ModelFactory, ServletInvocableHandlerMethod를 구성하고 ServletInvocableHandlerMethod를 통해 ServletWebRequest와 ModelAndViewContainer로 핸들러 함수를 실행하고 처리하는 것을 확인할 수 있습니다.

처리하는 부분이 ServletInvocableHandlerMethod로 감싸져있는 것 같으니 다시 찾아가봅시다.

```java ServletInvocableHandlerMethod.invokeAndHandle
public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,
        Object... providedArgs) throws Exception {

    Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);
    setResponseStatus(webRequest);

    if (returnValue == null) {
        if (isRequestNotModified(webRequest) || getResponseStatus() != null || mavContainer.isRequestHandled()) {
            disableContentCachingIfNecessary(webRequest);
            mavContainer.setRequestHandled(true);
            return;
        }
    }
    else if (StringUtils.hasText(getResponseStatusReason())) {
        mavContainer.setRequestHandled(true);
        return;
    }

    mavContainer.setRequestHandled(false);
    Assert.state(this.returnValueHandlers != null, "No return value handlers");
    try {
        this.returnValueHandlers.handleReturnValue(
                returnValue, getReturnValueType(returnValue), mavContainer, webRequest);
    }
    catch (Exception ex) {
        if (logger.isTraceEnabled()) {
            logger.trace(formatErrorForReturnValue(returnValue), ex);
        }
        throw ex;
    }
}
```

invokeForRequest 함수로 요청을 처리하고 리턴된 값을 returnValueHandlers로 다시 처리하는 것을 확인할 수 있습니다. 코드의 순서를 볼때 invokeForRequest가 여러분이 작성한 핸들러 함수가 호출되는 부분이고 핸들러 함수에서 리턴한 값을 스프링에서 returnValueHandlers로 다시 처리하는 거라고 예상할 수 있습니다.

returnValueHandlers 유형을 찾아보면 `HandlerMethodReturnValueHandlerComposite`인 것을 확인할 수 있습니다. HandlerMethodReturnValueHandlerComposite는 `HandlerMethodReturnValueHandler` 구현체로 HandlerMethodReturnValueHandler의 목록을 통해 여러분이 핸들러 함수에서 리턴한 유형에 따라 HandlerMethodReturnValueHandler으로 처리하도록 구현되어있습니다.

```java HandlerMethodReturnValueHandlerComposite
@Override
public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
        ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {

    HandlerMethodReturnValueHandler handler = selectHandler(returnValue, returnType);
    if (handler == null) {
        throw new IllegalArgumentException("Unknown return value type: " + returnType.getParameterType().getName());
    }
    handler.handleReturnValue(returnValue, returnType, mavContainer, webRequest);
}
```

그러면 여러분이 핸들러 함수에서 리턴한 값에 따라 처리를 담당하는 HandlerMethodReturnValueHandler 구현체가 있다는 것으로 이해할 수 있습니다. 

#### HandlerMethodReturnValueHandler
HandlerMethodReturnValueHandler 구현체를 찾아보면 다음과 같이 나옵니다.

![HandlerMethodReturnValueHandler 구현체](/images/posts/http-requests-responses-07.png)

사실 HandlerMethodReturnValueHandler 구현체 목록은 스프링 공식 레퍼런스를 참고하시는 분들이라면 [Handler Methods Return Values](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-return-types)에서 확인하셨을 겁니다.

> 이 글을 보는 대부분의 초보 개발자는 레퍼런스를 참고하지 않을 수 있습니다. 이게 바로 공식 레퍼런스를 참고하는 이유라고 할 수 있겠죠?

간단하게 정리해보면 다음과 같습니다.

|Return Value|HandlerMethodReturnValueHandler|Description|
|:---|:---|:---|
|String|ViewNameMethodReturnValueHandler|ViewResolver 구현체에 의해 View Name으로 처리|
|View|ViewMethodReturnValueHandler|View 인스턴스로 렌더링|
|Map|MapMethodProcessor|Map을 ModelAndView 속성으로 처리|
|Model|ModelMethodProcessor|Model을 Map으로 변환하여 ModelAndView 속성으로 처리|
|@ResponseBody|AbstractMessageConverterMethodProcessor|리턴 값을 HttpMessageConverter 구현체로 변환해서 응답|
|void|ModelAndViewMethodReturnValueHandler|ServletResponse 또는 @ResponseStatus로 처리|
|ModelAndView|ModelAndViewMethodReturnValueHandler|View, Model Attritube, Response Status로 처리|

여러분이 작성한 컨트롤러 핸들러 함수가 리턴한 값에 `@ResponseBody` 어노테이션을 명시하는 것은 `AbstractMessageConverterMethodProcessor`를 통해 메시지 컨버터로 변환해서 응답한다는 것을 의미합니다. 또한, @ResponseBody 없이 `Map`을 리턴한다는 것은 `MapMethodProcessor`을 통해 Map에 있는 값들을 ModelAndView의 애트리뷰트로 넣어서 응답한다는 것을 의미하죠.

결국 `@ResponseBody`를 사용한다는 것은 리턴 값에 대한 `메시지 컨버터`를 알고 있어야 한다는 것을 의미합니다. 예를 들어, OKKY에 공유한 [스프링 버전별 Jackson 관련 라이브러리 및 메시지 컨버터 정보](https://okky.kr/article/387101)에 따르면 스프링 버전에 따라 JSON으로 변환하기 위한 메시지 컨버터 지원이 다르기 때문에 여러분이 사용중인 스프링 버전에 따라 라이브러리를 의존해야하고 알맞는 메시지 컨버터가 등록되어있어야함을 뜻합니다.

`스프링 4 이상`의 버전을 사용중인데 대부분의 블로그에서 제시하는 `MappingJacksonHttpMessageConverter`는 미지원하기 때문에 `org.codehaus.jackson` 라이브러리를 의존성에 가지고 있다고 해도 메시지 컨버터는 등록되지 않습니다. 반대로 `스프링 4 미만`의 버전을 사용중인데 `MappingJackson2HttpMessageConverter`를 등록하고 `com.fasterxml.jackson.core` 라이브러리를 의존하는 것도 의미 없는 행위라고 할 수 있죠.

이렇게 스프링 버전에 따라 의존해야하는 라이브러리 버전이 존재함에 따라 의존성 라이브러리 버전을 관리하는 [
Spring Framework (Bill of Materials)](https://mvnrepository.com/artifact/org.springframework/spring-framework-bom)을 제공하기도 합니다.

여기까지 확인한 바로는 HandlerAdapter로 여러분이 작성한 핸들러를 찾아 호출하고 핸들러 함수의 리턴값에 따라 HandlerMethodReturnValueHandler로 응답하는 것을 확인했습니다. 그런데 눈치 빠르신분들은 한가지 과정을 빼먹었다고 느끼실 것입니다. 바로 HTTP 요청에 포함된 데이터를 가져오는 부분인데 스프링에서는 `데이터 바인딩`이라고 부르는 과정입니다. 이 데이터 바인딩 과정은 RequestMappingHandlerAdapter의 invokeHandlerMethod에 이미 포함되어있습니다.

바로 WebDataBinderFactory를 만들고 ServletInvocableHandlerMethod에 setHandlerMethodArgumentResolvers로 HandlerMethodArgumentResolverComposite를 설정하는 부분입니다.

#### WebDataBinder
WebDataBinder는 HTTP 요청 파라미터를 자바 빈즈 오브젝트로 데이터를 바인딩하는데 여러분이 HTTP 요청 시 데이터를 쿼리 파라미터로 전송하거나 폼 데이터 형식으로 보내는 경우 스프링은 WebDataBinder로 여러분의 도메인 클래스에 데이터를 주입합니다. 이때 [JavaBeans 스펙](https://www.oracle.com/java/technologies/javase/javabeans-spec.html)에 따르므로 프로퍼티 표현식과 Getter, Setter에 따라 데이터를 바인딩합니다.

#### HandlerMethodArgumentResolver
HandlerMethodReturnValueHandler가 리턴 값에 따라 응답을 처리한다면 HandlerMethodArgumentResolver는 컨트롤러 핸들러 함수에 존재하는 매개변수 유형에 따라 데이터 주입을 해주는 역할을 수행합니다. HandlerMethodArgumentResolver도 인터페이스 이므로 실제로 동작을 수행하는 구현체를 찾아야합니다.

스프링 5 기준의 RequestMappingHandlerAdapter에는 기본적으로 적용되는 HandlerMethodArgumentResolver 목록이 있습니다.
```java RequestMappingHandlerAdapter.getDefaultArgumentResolvers
private List<HandlerMethodArgumentResolver> getDefaultArgumentResolvers() {
    List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>(30);

    // Annotation-based argument resolution
    resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), false));
    resolvers.add(new RequestParamMapMethodArgumentResolver());
    resolvers.add(new PathVariableMethodArgumentResolver());
    resolvers.add(new PathVariableMapMethodArgumentResolver());
    resolvers.add(new MatrixVariableMethodArgumentResolver());
    resolvers.add(new MatrixVariableMapMethodArgumentResolver());
    resolvers.add(new ServletModelAttributeMethodProcessor(false));
    resolvers.add(new RequestResponseBodyMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
    resolvers.add(new RequestPartMethodArgumentResolver(getMessageConverters(), this.requestResponseBodyAdvice));
    resolvers.add(new RequestHeaderMethodArgumentResolver(getBeanFactory()));
    resolvers.add(new RequestHeaderMapMethodArgumentResolver());
    resolvers.add(new ServletCookieValueMethodArgumentResolver(getBeanFactory()));
    resolvers.add(new ExpressionValueMethodArgumentResolver(getBeanFactory()));
    resolvers.add(new SessionAttributeMethodArgumentResolver());
    resolvers.add(new RequestAttributeMethodArgumentResolver());

    // Type-based argument resolution
    resolvers.add(new ServletRequestMethodArgumentResolver());
    resolvers.add(new ServletResponseMethodArgumentResolver());
    resolvers.add(new HttpEntityMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
    resolvers.add(new RedirectAttributesMethodArgumentResolver());
    resolvers.add(new ModelMethodProcessor());
    resolvers.add(new MapMethodProcessor());
    resolvers.add(new ErrorsMethodArgumentResolver());
    resolvers.add(new SessionStatusMethodArgumentResolver());
    resolvers.add(new UriComponentsBuilderMethodArgumentResolver());
    if (KotlinDetector.isKotlinPresent()) {
        resolvers.add(new ContinuationHandlerMethodArgumentResolver());
    }

    // Custom arguments
    if (getCustomArgumentResolvers() != null) {
        resolvers.addAll(getCustomArgumentResolvers());
    }

    // Catch-all
    resolvers.add(new PrincipalMethodArgumentResolver());
    resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), true));
    resolvers.add(new ServletModelAttributeMethodProcessor(true));

    return resolvers;
}
```

여러분이 주로 사용하거나 대부분의 예제에서 사용하는 몇가지 HandlerMethodArgumentResolver 구현체는 다음과 같습니다.

|Argument Type|HandlerMethodArgumentResolver|Description|
|:---|:---|:---|
|@RequestParam|RequestParamMethodArgumentResolver||
|@PathVariable|PathVariableMethodArgumentResolver||
|@ModelAttribute|ServletModelAttributeMethodProcessor||
|@RequestBody|RequestResponseBodyMethodProcessor||
|@RequestPart, MultipartFile, Part|RequestPartMethodArgumentResolver||
|WebRequest, ServletRequest, MultipartRequest, InputStream|ServletRequestMethodArgumentResolver||
|HttpSession, Principal, Locale, TimeZone, ZoneId|ServletRequestMethodArgumentResolver||
|ServletResponse, OutputStream, Writer|ServletResponseMethodArgumentResolver||

예를 들어, `@ModelAttribute`를 핸들러 함수 매개변수에 선언하는 것은 `ServletModelAttributeMethodProcessor`에 의해 WebDataBinder로 데이터 바인딩을 수행하는 것이며 `@RequestBody`를 핸들러 함수 매개변수에 선언하는 것은 `RequestResponseBodyMethodProcessor`에 의해 HTTP 요청 페이로드를 매개변수 형식으로 메시지 컨버터로 변환한다는 것을 의미합니다.

여기까지 확인함으로써 스프링 웹 애플리케이션에서 HTTP 요청을 처리할 핸들러 함수를 작성하는 것에 따라 어떻게 데이터 바인딩하고 리턴값에 따른 응답을 처리하는 지 알게되었습니다. 상세하게 알아본 것은 아니기 때문에 아쉬움이 있지만 요청과 응답 과정에서 사용되는 클래스만 알아도 무방합니다.

시간이 있다면 각 클래스가 어떤식으로 작성되어있는지를 확인해보시는 것도 여러분의 코드 작성 스타일에 도움이 됩니다. 스프링 프레임워크를 담당하는 개발자들은 여러분보다 확실히 뛰어난 개발자이고 정해진 스타일에 따라 코드를 작성합니다.

## 요청 응답 케이스
그냥 마무리하기에는 아쉬움이 많으므로 OKKY에 올라오는 질문글 중 HTTP 요청과 응답에 대한 여러가지 케이스를 정리해보도록 하겠습니다.

### 415 Unsupported Media Type
클라이언트 요청에 대하여 서버가 415 오류를 응답하는 경우 핸들러 함수가 클라이언트가 설정한 Content-Type 유형을 처리할 수 없는 것을 말합니다. 

https://okky.kr/article/558309

위 질문글의 일차적인 문제점은 컨트롤러 핸들러 함수는 `application/x-www-form-urlencoded`를 처리하도록 작성해놓고 정작 클라이언트에서는 `application/json`으로 요청해버렸습니다. 그런데 Content-Type을 정상적으로 설정해도 또 다른 문제점을 내포하고 있었습니다. 이 글에서 다루었던 스프링 버전별 Jackson 라이브러리 의존성이 다르다는 부분입니다. 질문자는 스프링 4 이상부터 사용할 수 있는 Jackson 2 라이브러리를 추가하였고 vernum님이 남기신 링크로 해결하신 것 같아보이는데 해당 링크로 들어가보면 MappingJacksonHttpMessageConverter를 사용하고 org.codehaus.jackson 라이브러리를 의존성에 추가한 것을 확인할 수 있습니다.

### 406 Not Acceptable
클라이언트 요청에 대하여 서버가 406 오류를 응답하는 경우 클라이언트가 지정한 Accept 헤더에 따라 서버에서 HTTP 메시지를 구성할 수 없음을 말합니다. 

https://okky.kr/article/876362
https://okky.kr/article/878053
https://okky.kr/article/878257

위 질문자님은 무려 3번이나 406 오류에 대한 질문을 하지만 애초에 HTTP 요청과 응답에 대한 이해가 없었기 때문에 답변해주시는 분들이 뭐를 바꿔바라 이걸 지정해라해줘도 바꿔봤는데 안된다는 말만 되풀이하십니다.

핸들러 함수에서 System.out은 잘 출력된다는 것을 보면 핸들러 함수 리턴값을 HTTP 응답으로 변환할 때 클라이언트가 요청한 형식으로 바꾸지 못한다는 것을 예상할 수 있겠습니다. 이 글에서 @ResponseBody를 선언하면 응답 유형에 따른 메시지 컨버터를 찾아 응답으로 변환하는 것을 확인했었습니다. 그래서 메시지 컨버터가 잘 등록되어있는지를 의심해봐야합니다. 이분의 경우 **Jackson 2 라이브러리를 의존** 하고 메시지 컨버터로 **MappingJacksonHttpMessageConverter** 를 사용하고 있기 때문에 잘못된 구성을 하셔서 발생하셨을 겁니다. MappingJacksonHttpMessageConverter는 스프링 웹 모듈이 가지고 있기 때문에 오류는 나지 않겠지만 MappingJacksonHttpMessageConverter가 필요로 하는 Jackson 라이브러리가 없기 때문에 처리할 수 없습니다.

### 데이터 바인딩 규칙
스프링 뿐만 아니라 Jackson 이나 Lombok과 같은 라이브러리도 기본적으로 `JavaBeans` 스펙에 따라 동작합니다. 다시 말해서 HTTP 요청에 포함된 데이터를 자바 도메인 클래스에 주입하기 위한 `규칙`이 있다는 말인데요. 

먼저, 다음 질문을 살펴봅시다.

https://okky.kr/article/532781

위 질문의 경우 @RequestBody 어노테이션을 지정해서 데이터 바인딩을 시도했으나 DTO에 데이터가 주입되지 않은 상황입니다. 그런데 DTO에는 필드명을 UpperCase로 작성하셨습니다. 그런데 Jackson 라이브러리는 기본적으로 일반적인 자바 네이밍 규칙에 따라 소문자로 시작하는 카멜 케이스로 데이터를 바인딩하도록 되어있습니다. 필드명을 바꿔서 해결하신지는 모르겠으나 만약, 필드명을 UpperCase로 하고 데이터 바인딩을 적용하고 싶다면 클래스 단위로 `@JsonNaming`을 선언하거나 필드에 `@JsonProperty`를 지정하시면 됩니다.

두번째 데이터 바인딩 규칙은 데이터가 포함되는 위치라고 할 수 있습니다. 

https://okky.kr/article/780096

위 질문은 HTTP 요청 페이로드에 데이터를 포함시키고 @Modelattribute를 선언하여 데이터 바인딩을 시도하려고 하신 경우입니다. @Modelattribute는 URL에 포함되는 `쿼리 파라미터` 또는 `폼 데이터` 형식으로부터 데이터 바인딩을 수행하기 때문에 HTTP 요청 페이로드가 폼 데이터 형식이 아니므로 `@Modelattribute`로는 데이터 바인딩을 수행할 수 없습니다.

해당 질문자님도 정말로 @Modelattribute를 사용하고 싶었다면 클라이언트에서 Content-Type을 application/json이 아닌 application/x-www-form-urlencoded 형식으로 보내야겠죠?

## 끝마치며
월요일부터 퇴근하고나서 짬짬히 작성한 글이므로 전체적으로 정리가 안되었을 수 있습니다. 이 부분은 양해해주시기 바라며 스프링 경험이 많지 않으신 개발자 분들에게 조금이나마 도움이 되었으면 하는 바램입니다. 이상으로 클라이언트 HTTP 요청부터 스프링 애플리케이션 응답하기까지의 과정을 마치도록 하겠습니다.

감사합니다.
