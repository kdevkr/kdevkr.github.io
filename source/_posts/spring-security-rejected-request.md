---
title: Spring Security - Rejected Request
date: 2024-08-18T11:00+09:00
tags:
- Spring Security
- Firewall
---

```java
org.springframework.security.web.firewall.RequestRejectedException: 
The request was rejected because the URL contained a potentially malicious String "//"
```

- [Spring Security – Request Rejected Exception](https://www.baeldung.com/spring-security-request-rejected-exception)

#### 요청이 거부되는 이유

일반적으로 스프링 부트 기반의 애플리케이션에서 **스프링 시큐리티를 사용했다면** 기본적으로 적용되는 HttpFirewall 구현체에 의해 연속되는 슬래시 문자를 허용하지 않도록 되어있다. REST API로 디자인하는 경우 **PathVariable** 로 경로 상의 리소스 아이디를 검증하는 경우가 대부분이다. 따라서, 대부분의 경우 **URL 경로 상 연속된 슬래시 문자는 서버 입장에서 잘못된 요청**에 해당된다.

```java
@Bean
public WebSecurityCustomizer webSecurityCustomizer() {
    return webSecurity -> webSecurity.httpFirewall(httpFirewall())
            .ignoring().requestMatchers("/error");
}

@Bean
public HttpFirewall httpFirewall() {
    // NOTE: Spring Security provides DefaultHttpFirewall and StrictHttpFirewall.
    StrictHttpFirewall httpFirewall = new StrictHttpFirewall();
    httpFirewall.setAllowSemicolon(false);
    httpFirewall.setAllowNull(false);
    httpFirewall.setAllowBackSlash(false);
    httpFirewall.setAllowUrlEncodedDoubleSlash(false);

    List<String> allowedHttpMethods = Stream.of(
                    HttpMethod.GET,
                    HttpMethod.POST,
                    HttpMethod.PUT,
                    HttpMethod.DELETE,
                    HttpMethod.OPTIONS)
            .map(HttpMethod::name)
            .toList();
    httpFirewall.setAllowedHttpMethods(allowedHttpMethods);
    return httpFirewall;
}
```

#### 거부된 요청을 무시하지 말고 추적하세요

올바른 클라이언트가 아닌 봇에 의한 잘못된 요청일 수 있으나 **프론트엔드 개발자가 서버에서 요구하는 REST API 설계대로 요청하지 않았을 가능성**을 간과해서는 안된다. 서버에서는 최소한 이러한 요청에 대해서 **오류 메시지 또는 [Sentry](https://engineering.linecorp.com/ko/blog/log-collection-system-sentry-on-premise)와 같은 오류 추적 솔루션으로 분석할 수 있도록 남겨야**한다.

> 만약, [AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/classic-web-acl-string-conditions.html)를 사용한다면 설정과 규칙에 따라 더블 슬래시가 포함된 요청이 서버 애플리케이션까지 도달하지 않을 수 있음을 백엔드 개발자는 알고 있어야 합니다.

