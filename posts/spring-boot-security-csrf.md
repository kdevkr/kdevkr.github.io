---
title: Cross Site Request Forgery (CSRF)
date: 2023-10-21T09:00+0900
tags:
- Spring Security
- Axios
- CSRF
- XSRF
---

> 프론트엔드와 백엔드 애플리케이션이 분리되어있어도 [Cross Site Request Forgery (CSRF)](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)를 비활성화하지 말자.

CSRF 자체에 대해서 잘 모르는 개발자라면 [Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)를 참고해보도록 하자. 애플리케이션 보안 가이드에서 [로그인과 로그아웃 행위에 대해서는 CSRF 토큰을 사용한 검증을 요구](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-considerations)하는 편이다. 스프링 시큐리티에서는 [CSRF 공격에 방어하는 매커니즘](https://docs.spring.io/spring-security/reference/features/exploits/csrf.html#csrf-protection)을 제공하여 쉽게 CSRF 토큰을 적용할 수 있다.

- HttpSessionCsrfTokenRepository
- CookieCsrfTokenRepository
- XorCsrfTokenRequestAttributeHandler
- XorCsrfChannelInterceptor
- CsrfFilter
- CsrfLogoutHandler

스프링 시큐리티의 SecurityFilterChain을 구성하는 과정의 `CsrfConfigurer`를 살펴보면 `CsrfFilter`를 필터에 등록하는데 CsrfTokenRepository와 CsrfTokenRequestHandler가 사용되도록 전달된다. 공식 문서를 참고해보면 기본적으로는 스프링 시큐리티 6 부터 `HttpSessionCsrfTokenRepository`와 `XorCsrfTokenRequestAttributeHandler`가 사용되도록 되어있으며 HTTP가 아닌 웹소켓을 위한 보안 설정 시(@EnableWebSocketSecurity)에는 `XorCsrfChannelInterceptor`이 적용되어 동작한다.

```java
@Configuration
public SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
       http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));
    }
}
```

#### CSRF 토큰 API 엔드포인트

백엔드와 프론트엔드 애플리케이션이 분리되어있다고 해서 HttpOnly 속성이 지정되지 않은 CSRF 쿠키를 전달하기 위해 `CookieCsrfTokenRepository`를 사용할 필요는 없다. 프론트엔드 애플리케이션을 위한 CSRF 토큰이 필요하다면 아래와 같은 CSRF 토큰을 응답해주는 API를 만들어서 제공하자. 기본적으로 GET 요청은 안전한 메소드로 간주하여 스프링 시큐리티는 CSRF 토큰에 대한 검증을 처리하지 않는다.

```java
@RestController
public class CsrfController {
    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken csrfToken) {
        return csrfToken;
    }
}
```

[애플리케이션 보안 가이드](https://www.data.go.kr/data/15049185/fileData.do)에서는 로그인과 로그아웃 요청에 대해 CSRF 공격에 대한 방어를 요구한다. 간혹 백엔드와 프론트엔드 애플리케이션이 분리되어 JWT와 같은 토큰 기반 인증을 수행한다면 비활성화하거나 조치할 필요가 없다는 것을 기록한 블로그가 보이는데 이것은 잘못된 정보이다. 브라우저에서 토큰을 전달할 방법은 쿠키나 별도의 헤더 뿐이며 쿠키도 사실 상 헤더 중 하나일 뿐이다. 

```java
private static final class DefaultRequiresCsrfMatcher implements RequestMatcher {
    private final HashSet<String> allowedMethods = new HashSet<>(Arrays.asList("GET", "HEAD", "TRACE", "OPTIONS"));

    @Override
    public boolean matches(HttpServletRequest request) {
        return !this.allowedMethods.contains(request.getMethod());
    }
}
```

스프링 시큐리티에서는 기본적으로 `GET, HEAD, TRACE, OPTIONS`에 대해서는 안전한 메소드로 판단하여 CSRF 검증을 무시한다. 만약, GET을 안전하지 않는 행위로 사용한다면 CSRF 검증을 별도로 수행해야한다. 예를 들어, 쉽게 로그아웃 하기 위해서 POST 요청이 아닌 GET 요청으로 구현했다면 CSRF 필터에서 무시되고 넘어가므로 `requireCsrfProtectionMatcher` 를 수정하자.

#### CSRF 토큰을 전달하는 방법

CSRF 토큰은 일반적으로 HTML 폼 전송 시 _csrf 파라미터로 전달하는데 X-CSRF-TOKEN 또는 X-XSRF-TOKEN 헤더로도 전달할 수 있도록 스프링 시큐리티에서 지원한다. 기본적으로는 HttpSessionCsrfTokenRepository 가 사용되는데 `X-CSRF-TOKEN` 이라는 헤더를 CookieCsrfTokenRepository는 `X-XSRF-TOKEN` 헤더를 매칭한다. 그러니까, 기본적으로는 X-CSRF-TOKEN 헤더로 전달해야하지만 쿠키 기반의 CookieCsrfTokenRepository를 적용했다면 X-XSRF-TOKEN 헤더로 요청 시 전달해야 CSRF 토큰을 제대로 검증할 수 있다.

```java
@FunctionalInterface
public interface CsrfTokenRequestHandler extends CsrfTokenRequestResolver {
    void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken);

    @Override
    default String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        Assert.notNull(request, "request cannot be null");
        Assert.notNull(csrfToken, "csrfToken cannot be null");
        String actualToken = request.getHeader(csrfToken.getHeaderName());
        if (actualToken == null) {
            actualToken = request.getParameter(csrfToken.getParameterName());
        }
        return actualToken;
    }
}
```

앞서 CSRF 토큰을 응답하는 API 에서는 토큰 뿐만 아니라 요청 파라미터를 전달할 이름과 헤더를 함께 제공해준다. 따라서, Axios와 같은 HTTP 요청 라이브러리를 통해 XHR 요청을 수행한다면 아래와 같이 전달할 수 있다. 

```js
axios.get('/csrf').then(res => {
    const csrf = res.data
    axios.defaults.headers.post[csrf.headerName] = csrf.token
    axios.defaults.headers.put[csrf.headerName] = csrf.token
    axios.defaults.headers.delete[csrf.headerName] = csrf.token
})
```
