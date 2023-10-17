---
title: 스프링 부트 보안 설정
date: 2023-10-17T22:00+0900
tags:
- Spring Security
- Protection Aganinst Exploits
---

> 본 글은 스프링 부트 프로젝트로 만들어진 애플리케이션에서 스프링 시큐리티 모듈을 적용하는 경우에 보안 설정에 대해 정리한 것 입니다. 일반적으로 오해하고 있거나 신경쓰지 않는 부분에 대해서 다루고자 합니다.

#### 더 안전한 CSRF 토큰 설정

리액트나 뷰와 같은 프론트엔드 개발 환경이어도 서버 애플리케이션에서 CSRF 토큰을 프론트엔드로 전달하기 위해 쿠키를 이용할 필요는 없다. 자바스크립트에서 쿠키에 저장된 XSRF-TOKEN 값을 가져올 수 있도록 httpOnly 설정을 비활성화하지 말자. 이것에 대안으로 CSRF 토큰을 제공하는 API를 만들어서 응답하면 된다.

```java WebSecurityConfig.java
@AllArgsConstructor
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    private final ServerProperties serverProperties;

    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        Session.Cookie cookie = serverProperties.getServlet().getSession().getCookie();
        CookieCsrfTokenRepository tokenRepository = new CookieCsrfTokenRepository();
        tokenRepository.setCookieCustomizer(c -> c.secure(cookie.getSecure())
                .path(cookie.getPath())
                .httpOnly(cookie.getHttpOnly())
                .sameSite(cookie.getSameSite().attributeValue())
                .maxAge(Duration.ofMinutes(30)));
        return tokenRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.csrfTokenRepository(csrfTokenRepository()));
        return http.build();
    }
}
```

```java CsrfController.java
@AllArgsConstructor
@RestController
public class CsrfController {

    private final CsrfTokenRepository csrfTokenRepository;

    @RequestMapping("/csrf")
    public CsrfToken csrf(HttpServletRequest request, HttpServletResponse response) {
        return csrfTokenRepository.loadDeferredToken(request, response).get();
    }
}
```

> 자바스크립트 애플리케이션을 위한 더 다양한 방법은 [공식 문서를 참고](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript)하세요.

애플리케이션 보안에서 더 중요한 것은 로그인 및 로그아웃 요청에 대해 CSRF를 사용해서 로그인 시도를 위조하지 못하도록 하는 것이다. 스프링 시큐리티의 기본 폼 로그인이나 HTTP 베이직 인증이 아니라 별도의 API를 작성한다면 반드시 [CSRF 토큰이 적용되는지 검증](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-testing)하도록 하자.

#### 리버스 프록시 보안

스프링 시큐리티는 기본적으로 [보안을 위한 응답 헤더](https://docs.spring.io/spring-security/reference/features/exploits/headers.html)를 추가해준다. 다만, [HSTS](https://docs.spring.io/spring-security/reference/features/exploits/headers.html#headers-hsts)의 경우는 애플리케이션 자체가 HTTPS 프로토콜로 실행되었을때 활성화된다. 따라서, 엔진엑스와 같은 웹 서버나 로드밸런서를 통해 리버스 프록시를 구성하는 경우에는 HTTP 포트를 사용해서 애플리케이션을 실행하므로 `엔진엑스와 같은 웹 서버에서 HSTS 헤더를 응답`하도록 하자.

```conf nginx.conf
server {
    listen 443 ssl http2;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    location /api/ {
        limit_except GET POST PUT DELETE OPTIONS {
            deny all;
        }
    }
}
```

> 리액트 또는 뷰의 빌드 에셋을 애플리케이션이 배포하지 않는다면 웹 서버에서 보안 응답 헤더를 동일하게 전달되도록 구성해야합니다.

#### 웹소켓 보안

스프링 시큐리티는 기본적으로 HTTP 통신에 대한 보안 설정을 제공한다. 만약, 애플리케이션 기능 요구사항을 위해 웹소켓 프로토콜을 사용한다면 [웹소켓에 대한 보안](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html)에 대해 별도로 체크해야한다. 스프링 시큐리티 모듈을 사용한다면 일반적인 웹소켓 구현보다는 STOMP 방식의 웹소켓 연결을 구성하는 것이 좋다. [CSRF](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html#websocket-sameorigin-csrf)을 적용하거나 SockJS를 위한 [iFrame](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html#websocket-sockjs-sameorigin) 옵션을 체크하도록 하자.

```java WebSocketSecurity.java
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurity {
    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        // NOTE: Failed to send message to ExecutorSubscribableChannel[clientInboundChannel]: Access Denied
        messages
                .nullDestMatcher().authenticated()
                .simpDestMatchers("/app/**").hasRole("USER")
                .simpSubscribeDestMatchers("/user/queue/error").authenticated()
                .simpSubscribeDestMatchers("/user/**", "/topic/hello").hasRole("USER")
                .anyMessage().denyAll();
        return messages.build();
    }
}
```

> SockJS의 웹소켓 연결을 위해 사전에 요청하는 /info 엔드포인트는 일반적인 HTTP 통신임에 주의하도록 해야합니다.

애플리케이션 보안 점검으로 인해 다시 한번 학습하는 것은 안 비밀이다.
