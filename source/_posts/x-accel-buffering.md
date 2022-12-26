---
title: X-Accel-Buffering
date: 2022-12-26
tags:
- SSE
- X-Accel
---

오래전에 개인적으로 [엔진엑스로 알아보는 리버스 프록시](/reverse-proxy-using-nginx/)를 학습하면서 이벤트 스트림에 대한 프록시 구성 시 [proxy_buffering](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering) 과 같은 버퍼링 옵션을 비활성화 해야한다고 정리하였습니다. HTTP/2 연결과 함께 [SSE(Server Sent Event)](https://www.baeldung.com/spring-server-sent-events)를 활용하면 굳이 웹소켓 구현을 하지 않아도 서버 측에서 클라이언트로 원하는 데이터를 지속적으로 전달할 수 있습니다. 

하지만, Nginx 측에서는 Nginx 구성에 대한 10가지 실수에서 [Mistake 5: The proxy_buffering off Directive](https://www.nginx.com/blog/avoiding-top-10-nginx-configuration-mistakes/#proxy_buffering-off)으로 버퍼링 옵션에 대한 비활성화에 대해서 이야기합니다. 

> Buffering can also be enabled or disabled by passing "yes" or "no" in the "X-Accel-Buffering" response header field. This capability can be disabled using the [proxy_ignore_headers](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ignore_headers) directive.

위와 같이 엔진엑스 공식 문서 상에는 프록시 버퍼링을 무시할 수 있는 헤더에 대한 설명을 해주고 있으며 회사 내 인프라 엔지니어 분의 의견에 따라서 프록시 구성 시 버퍼링 옵션을 일괄적으로 변경하기보다는 애플리케이션 서버에서 이벤트 스트림에 대한 응답을 수행할 때 [X-Accel-Buffering 헤더를 응답](https://serverfault.com/a/801629)하는 것으로 최종 결정했습니다. 

#### X-Accel-Buffering 헤더 응답하기
스프링 프레임워크에서는 [SseEmitter](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html)를 제공하므로 간단하게 SSE 연결을 구현할 수 있으며 이 클래스는 ResponseBodyEmitter를 확장하였기에 extendResponse 함수를 통해 응답하기 전 HTTP 상태코드 또는 응답 헤더를 변경할 수 있게 지원합니다. 따라서, 컨트롤러 핸들러 함수에서 HttpServletResponse를 인자로 받은 후 X-Accel-Buffering 헤더에 대한 값을 no로 설정하면 됩니다.

```java
@Slf4j
@RestController
public class SseController {

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sse(HttpServletResponse response) {
        response.setHeader("X-Accel-Buffering", "no");
        return new SseEmitter();
    }
}
```

![](/images/posts/x-accel-buffering/01.png)

감사합니다.