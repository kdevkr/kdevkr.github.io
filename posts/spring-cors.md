---
title: 스프링 백엔드 개발자가 CORS를 테스트 하는 방법
date: 2023-07-22T21:00+0900
tags:
- CORS
- Preflight Request
---

![](/images/posts/spring-cors/01.png)

위와 같은 짤의 내용처럼 프론트엔드 개발자에게 고통을 주는 것은 CORS 이다. 그런데 CORS는 브라우저에서의 정책임에도 불구하고 프론트엔드 개발자가 대응할 수 있는 부분은 없으며 브라우저에서의 CORS 매커니즘을 이해하고 서버 백엔드 개발자가 처리해야할 부분이다. MDN의 [Preflight Request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) 문서에서 다루는 내용처럼 대부분의 CORS 문제는 프론트엔드 애플리케이션에서의 XHR 요청에 의해 프리플라이트 요청(Preflight Request)에 의한 CORS 위배 응답을 받고 브라우저에서 제한하기 때문에 발생한다.

#### 프리플라이트 요청
프리플라이트 요청은 `Origin` 헤더와 `Access-Control-Request-Method` 헤더 그리고 `OPTIONS` 메소드를 사용하여 수행된다. 

```text HTTP
OPTIONS /resource/foo
Access-Control-Request-Method: DELETE 
Access-Control-Request-Headers: origin, x-requested-with 
Origin: https://foo.bar.org 
```

참고로, 스프링 프레임워크에서 [CorsUtils](https://github.com/spring-projects/spring-framework/blob/main/spring-web/src/main/java/org/springframework/web/cors/CorsUtils.java)에 의해 프리플라이트 요청을 구분하는 조건은 아래와 같이 구현되어있다.

```java Java
public abstract class CorsUtils {
	public static boolean isPreFlightRequest(HttpServletRequest request) {
		return (HttpMethod.OPTIONS.matches(request.getMethod()) &&
				request.getHeader(HttpHeaders.ORIGIN) != null &&
				request.getHeader(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD) != null);
	}
}
```

#### 스프링 CORS 디버그
CORS 요청에 대한 검증은 CorsFilter에서 기본적으로 사용되도록 구현된 [DefaultCorsProcessor](https://github.com/spring-projects/spring-framework/blob/main/spring-web/src/main/java/org/springframework/web/cors/DefaultCorsProcessor.java)에 의해 수행된다. CORS 요청에 의해 위배되는 상황에 대해서 원인을 로그로 출력해보려는 경우 DefaultCorsProcessor에 대한 로그 레벨을 TRACE 또는 DEBUG로 지정하면 된다. 개발 환경에서는 CorsFilter 또는 DefaultCorsProcessor의 코드 라인에 중단점을 걸어서 확인할 수 있겠지만 운영 환경에서는 로그 레벨로 체크할 수 있을 것이다.

```yml application.yml
logging.level:
  org.springframework.web.cors.DefaultCorsProcessor: TRACE
```

![CORS의 프리플라이트 요청을 이해한 백엔드 개발자](/images/posts/spring-cors/03.gif)

#### 스프링 MockMvc로 CORS 테스트
스프링 프레임워크를 사용중이며 **CorsConfiguration** 설정을 해두었다면 아래와 같이 **MockMvc**를 활용한 테스트 코드를 작성할 수 있다. 

```java
@Test
@DisplayName("Preflight request")
void TestPreflightRequest() {
    Assertions.assertDoesNotThrow(() -> {
        List<String> allowedOrigins = corsConfiguration.getAllowedOrigins();
        if (allowedOrigins == null) {
            allowedOrigins = new ArrayList<>();
        }

        List<String> allowedMethods = corsConfiguration.getAllowedMethods();
        if (allowedMethods == null) {
            allowedMethods = new ArrayList<>();
        }

        mockMvc.perform(options("/")
                .header("Origin", allowedOrigins)
                .header("Access-Control-Request-Method", "GET")
            )
            .andExpect(status().isOk())
            .andExpect(header().stringValues("Access-Control-Allow-Origin", allowedOrigins.toArray(new String[]{})))
            .andExpect(header().string("Access-Control-Allow-Methods", String.join(",", allowedMethods)))
            .andDo(print());
    });
}
```

#### cURL로 테스트하는 방법
포스트맨 도구로 HTTP 요청을 수행한 것처럼 cURL로도 프리플라이트 요청을 수행해볼 수 있다. 포스트맨과는 다르게 OPTIONS를 직접적으로 사용해야한다. DefaultCorsProcessor에 의해 CORS에 위배된 상황이 있다면 `Invalid CORS request`이라는 응답과 함께 403 상태 코드가 확인 될 것이다.

```powershell Windows Terminal
PS C:\Users\Mambo> curl -X OPTIONS 'http://localhost:5000' -H 'Origin: http://localhost' -H 'Access-Control-Request-Method: GET' -v

*   Trying 127.0.0.1:5000...
* Connected to localhost (127.0.0.1) port 5000 (#0)
> OPTIONS / HTTP/1.1
> Host: localhost:5000
> User-Agent: curl/8.0.1
> Accept: */*
> Origin: http://localhost
> Access-Control-Request-Method: GET
>
< HTTP/1.1 403 Forbidden
< Expires: 0
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< X-XSS-Protection: 0
< Pragma: no-cache
< X-Frame-Options: DENY
< Date: Sat, 22 Jul 2023 12:56:00 GMT
< Connection: keep-alive
< Vary: Origin
< Vary: Access-Control-Request-Method
< Vary: Access-Control-Request-Headers
< X-Content-Type-Options: nosniff
< Transfer-Encoding: chunked
<
Invalid CORS request* Connection #0 to host localhost left intact
```

#### Postman으로 테스트하는 방법
HTTP 요청을 수행해볼 수 있는 포스트맨에서 프리플라이트 요청을 수행하기 위해서는 Origin 헤더를 포함하면 된다. 포스트맨에서 알아서 OPTIONS를 수행하므로 간단하게 테스트해볼 수 있다.

![](/images/posts/spring-cors/02.png)

만약, CORS는 프론트엔드 영역에서 해결해야할 문제라고 생각하고 있는 개발자가 있다면 CORS에 대해서 다시 학습하길 바란다. 
프론트엔드 개발자가 CORS의 고통에서 벗어날 수 있도록 백엔드 개발자는 책임을 다해야 할 것이다. 