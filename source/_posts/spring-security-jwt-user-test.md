---
title: 스프링 시큐리티 JWT 사용자 테스트
date: 2024-03-27T21:00+0900
tags:
- WithSecurityContext
- WithSecurityContextFactory
- RequestContextListener
---

JWT 기반의 인증을 구성한 프로젝트에서 테스트 코드에 대한 사용자를 만들기 위해서 `WithSecurityContext` 와 `WithSecurityContextFactory` 를 사용해서 가상의 사용자와 토큰을 발급하는 코드를 구현하면 되는 것으로 알려져 있다. 하지만, 신규 프로젝트에서는 단일 애플리케이션이 아닌 인증의 기반이 되는 외부 플랫폼 애플리케이션에 요청하여 인증을 수행하고 권한을 처리하도록 로직을 구성하여 단순히 **가상의 사용자가 아닌 실제로 존재하는 사용자로 인증할 수 있는 컨텍스트**를 만들어야 했다. 사용자 테스트를 위한 컨텍스트를 적용하기 위해 아래와 같이 작성했다.

```java WithMockUser
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockUserSecurityContextFactory.class)
public @interface WithMockUser {
    String id() default "kdevkr@gmail.com";
}
```


```java WithMockUserSecurityContextFactory
@RequiredArgsConstructor
@Component
public class WithMockUserSecurityContextFactory implements WithSecurityContextFactory<WithMockUser> {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public SecurityContext createSecurityContext(WithMockUser mockUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext()
        Optional<User> optionalUser = getUserById(mockUser.id());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            Optional<JwtToken> token = getToken(user);
            if (token.isPresent()) {
                String accessToken = token.get().getAccessToken();
                Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
                context.setAuthentication(authentication);
            }
        }

        return context;
    }
}
```

#### No thread-bound request found

> java.lang.IllegalStateException: No thread-bound request found: Are you referring to request attributes outside of an actual web request, or processing a request outside of the originally receiving thread? If you are actually operating within a web request and still receive this message, your code is probably running outside of DispatcherServlet: In this case, use RequestContextListener or RequestContextFilter to expose the current request.

서비스 레이어의 클래스에서 요청 스레드에서 토큰 정보를 조회하기 위해 `RequestContextHolder` 를 사용하여 현재 요청에 대한 `Authorization` 헤더를 가져오는 로직으로 인해 발생한 문제라고 할 수 있다. 서비스 레벨의 테스트 코드에서는 컨트롤러를 통한 로직을 수행한 스레드가 아니기 때문에 기본적으로는 조회할 수 없다. 오류 메시지에 포함된 `RequestContextListener` 가 해결방안이 될 수 있다. [RequestContextListenerTests.java](https://github.com/spring-projects/spring-framework/blob/main/spring-web/src/test/java/org/springframework/web/context/request/RequestContextListenerTests.java) 를 참고하여 RequestContextListener 클래스를 통해 요청에 대한 스레드를 구성할 수 있음을 확인했으며 MockHttpServletRequest를 통해 ServletRequestAttributes를 RequestContextHolder의 스레드 로컬에 반영되게 하여 컨트롤러 레벨이 아닌 서비스 레벨에서도 인증된 사용자 기반의 테스트를 수행할 수 있게 하였다. 


```java WithMockUserSecurityContextFactory
@RequiredArgsConstructor
@Component
public class WithMockUserSecurityContextFactory implements WithSecurityContextFactory<WithMockUser> {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public SecurityContext createSecurityContext(WithMockUser mockUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();

        RequestContextListener listener = new RequestContextListener();
        MockServletContext servletContext = new MockServletContext();
        MockHttpServletRequest request = new MockHttpServletRequest(servletContext);
        listener.requestInitialized(new ServletRequestEvent(servletContext, request));

        Optional<User> optionalUser = getUserById(mockUser.id());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            Optional<JwtToken> token = getToken(user);
            if (token.isPresent()) {
                String accessToken = token.get().getAccessToken();
                Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
                context.setAuthentication(authentication);

                request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer %s".formatted(accessToken));
                ServletRequestAttributes requestAttributes = new ServletRequestAttributes(request);
                RequestContextHolder.setRequestAttributes(requestAttributes, true);
            }
        }

        return context;
    }
}
```

#### 참고 링크

- [Spring Security가 적용된 곳을 효율적으로 테스트하자.](https://tecoble.techcourse.co.kr/post/2020-09-30-spring-security-test/)
- https://stackoverflow.com/a/9430545