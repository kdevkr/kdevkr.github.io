---
title: 스프링 부트 웹소켓
date: 2023-10-08T17:00+0900
tags:
- WebSocket
- SockJS
- STOMP
---

> 본 글은 신규 프로젝트에서의 웹 소켓 기능 적용을 위해 학습한 내용을 정리한 것 입니다.
> 관련 코드는 [github.com/kdevkr/spring-boot-demo/websocket-demo](https://github.com/kdevkr/spring-boot-demo/tree/main/websocket-demo)에서 확인할 수 있습니다.

웹 소켓은 일반적인 HTTP 프로토콜과는 다르게 클라이언트와 서버 간 연결을 맺는 커넥션을 유지하여 서로 상호작용을 할 수 있는 TCP 기술이다. HTTP 연결 시 Upgrade 헤더를 통해서 웹 소켓으로 전환한다. 전환 과정에 대해서는 이전 [Tracing Handshake Websocket with Undertow](/undertow-websocket-tracing/) 글을 통해서 확인한 적이 있다.

#### SockJS

SockJS는 브라우저와 서버 구현에 따라 여러가지 방식으로 웹 소켓 연결을 수행할 수 있도록 제공한다. 먼저, /info 엔드포인트를 통해 서버에서의 웹 소켓 지원 스펙을 조회하고 어떤 방식으로 연결을 수행할 지 결정한다. 그리고 결정된 방식으로 웹 소켓 연결을 시도한다.

```sh
# http://localhost:8080/ws/info?t=1696757550304
{
  "entropy": 1279751018,
  "origins": [
    "*:*"
  ],
  "cookie_needed": true,
  "websocket": true
}

# {websocket-protocol}://{host}:{port}/{websocket-endpoint}/{server-id}/{session-id}/{transport}
ws://localhost:8080/ws/712/yyfmvviz/websocket
```

> 웹 소켓 연결 URL 에서 {session-id} 는 HTTP 세션에 대한 아이디는 아님에 주의해야한다.

#### Spring Session Integration

스프링에서는 웹 소켓 연결 시 HTTP 세션 아이디를 주입할 수 있도록 HttpSessionHandshakeInterceptor를 제공한다. HttpSessionHandshakeInterceptor 에서는 `HTTP.SESSION.ID` 속성으로 세션 아이디를 저장한다.  

```java
@EnableWebSocket
@Configuration
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(simpleHandler(), "/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new HttpSessionHandshakeInterceptor())
                .withSockJS();
    }

    private String getSessionId(WebSocketSession session) {
        return (String) session.getAttributes().get(HttpSessionHandshakeInterceptor.HTTP_SESSION_ID_ATTR_NAME);
    }
}
```

#### STOMP Integration

> STOMP (Simple Text Oriented Messaging Protocol) was originally created for scripting languages (such as Ruby, Python, and Perl) to connect to enterprise message brokers. It is designed to address a minimal subset of commonly used messaging patterns. STOMP can be used over any reliable two-way streaming network protocol, such as TCP and WebSocket. Although STOMP is a text-oriented protocol, message payloads can be either text or binary.

스프링 프레임워크에서는 웹 소켓에 대해서 STOMP 도 지원하는데 [여러가지 장점](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/benefits.html)이 있다고 한다. 

```java
@EnableWebSocketMessageBroker
@Configuration
public class StompConfig extends AbstractSessionWebSocketMessageBrokerConfigurer<MapSession> {
    @Override
    protected void configureStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setInterceptors(new HttpSessionHandshakeInterceptor());
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // NOTE: /topic: Broadcast, /queue: Unicast
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setPreservePublishOrder(true);
    }
}
```

기본적으로 /topic과 /queue의 차이는 없으며 Boradcast와 Unicast에 대한 구분으로 사용하는 편인 것 같다. 웹 소켓 세션에 대한 관리에 대해서는 별도 구현 방안을 찾아보아야 할 것 같다.
