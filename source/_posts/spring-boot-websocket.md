---
title: 스프링 부트 웹소켓
date: 2023-10-14T22:00+0900
tags:
- WebSocket
- SockJS
- STOMP
---

> 본 글에서 언급하는 관련 코드는 [github.com/kdevkr/spring-boot-demo/websocket-demo](https://github.com/kdevkr/spring-boot-demo/tree/main/websocket-demo)에서 확인할 수 있습니다.

웹 소켓은 요청과 응답을 할때마다 커넥션을 맺는 HTTP 프로토콜과는 다르게 클라이언트와 서버 간의 연결을 유지하고 서로 상호작용을 할 수 있는 통신 기술 이다. 일반적으로 HTTP 연결 시 Upgrade 헤더에 websocket을 포함하여 웹 소켓으로 전환하도록 서버에게 요구할 수 있다. 대략적인 전환 과정에 대해서는 이전 [Tracing Handshake Websocket with Undertow](/undertow-websocket-tracing/) 글을 통해서 확인한 적이 있다. 아무튼 `spring-boot-starter-websocket` 를 추가하더라도 웹 소켓에 대한 자동 구성은 이루어지지 않는다.

```groovy build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
}
```

일반적인 웹 소켓 연결을 구현할 것이라면 @EnableWebSocket 과 함께 WebSocketConfigurer 인터페이스를 구현하여 설정 클래스를 작성하면 되며 STOMP(Simple Text Oriented Messaging Protocol) 방식의 메시지 송 • 수신을 구성하고자 한다면 @EnableWebSocketMessageBroker 과 함께 WebSocketMessageBrokerConfigurer 인터페이스를 구현하여 설정 클래스를 작성하면 된다.

#### SockJS Fallback

[SockJS](https://github.com/sockjs/sockjs-client)는 브라우저와 서버 구현에 따라 여러가지 방식으로 웹 소켓 연결을 수행할 수 있도록 제공한다. 먼저, `/info` 엔드포인트를 통해 서버에서의 웹 소켓 지원 스펙을 조회하고 어떤 방식으로 연결을 수행할 지 결정한다. 그리고 결정된 방식으로 웹 소켓 연결을 시도한다. 모던 브라우저에서 웹 소켓 연결을 지원하겠지만 사용자가 어떤 브라우저를 사용할 지는 개발자 입장에서는 알기 어려우므로 마음 편하게 SockJS 기반으로 구현하는 것이 좋을 것 같다.

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

#### HTTP Session Integration

스프링에서는 웹 소켓 연결 시 HTTP 세션 아이디를 주입할 수 있도록 HttpSessionHandshakeInterceptor를 제공한다. HttpSessionHandshakeInterceptor 에서는 `HTTP.SESSION.ID` 속성으로 세션 아이디를 저장한다. 따라서, 웹 소켓 세션에 대한 일반 세션 아이디를 가져올 수 있고 특정 사용자 정보를 구분할 수 있다. 

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

스프링 프레임워크 공식 문서에서는 웹 소켓에 대하여 STOMP 를 구성하게 되면 [여러가지 장점](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/benefits.html)이 있다고 한다.  기본적으로 WebSocketMessageBrokerConfigurer 인터페이스를 구현하면 STOMP 를 위한 설정 클래스를 작성할 수 있지만 [스프링 세션 모듈](https://docs.spring.io/spring-session/reference/web-socket.html)에 포함되어있는 AbstractSessionWebSocketMessageBrokerConfigurer 추상 클래스를 확장하여 만드는게 좋다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'org.springframework.session:spring-session-core'
}
```

```java
@EnableWebSocketMessageBroker
@Configuration
public class StompConfig extends AbstractSessionWebSocketMessageBrokerConfigurer<MapSession> {
    @Override
    protected void configureStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS();
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

참고로 스프링 세션에서 제공하는 AbstractSessionWebSocketMessageBrokerConfigurer 에서는 아래의 클래스를 빈으로 등록하도록 되어있다. 각 클래스에 용도가 자세히 알고 싶다면 별도로 찾아보도록 하자.

- WebSocketRegistryListener
- WebSocketConnectHandlerDecoratorFactory
- SessionRepositoryMessageInterceptor

대략적으로 설명하자면 WebSocketConnectHandlerDecoratorFactory 과 WebSocketRegistryListener 는 [웹 소켓과 관련된 이벤트](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/application-context-events.html)들을 발생시키도록 되어있어 우리는 해당 이벤트들을 처리하는 @EventListener가 선언된 핸들러를 구현하여 원하는 작업을 할 수 있다. 또한, SessionRepositoryMessageInterceptor 에서 세션 리파지토리에 세션 정보를 저장하도록 구현되어 있으므로 아래와 같이 `SPRING.SESSION.ID`로 저장된 속성의 세션 아이디를 가져올 수 있다.

```java
@SendTo("/topic/hello")
@MessageMapping("/hello")
public Map<String, String> hello(GenericMessage<String> message,
                                    @Header(name = "simpSessionId") String wsSessionId,
                                    @Header(name = "simpSessionAttributes") Map<String, Object> sessionAttributes) {
    String sessionId = SessionRepositoryMessageInterceptor.getSessionId(sessionAttributes);

    Map<String, String> payload = new HashMap<>();
    payload.put("message", "Hello, %s".formatted(sessionId));
    return payload;
}
```

> 처음에는 STOMP 방식의 웹 소켓 동작이 이해되지 않을 수 있는데 공식 문서의 [Flow of Messages](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/message-flow.html)를 잘 읽어보고 이해하도록 하자.

#### WebSocketSession Management

스케줄링 기능을 통해 특정 상황에서 웹소켓에 연결된 사용자에게 메시지를 전달할 필요성이 있다. 웹 소켓 연결에 대한 세션 관리를 해주지만 세션이 연결중인 WebSocketSession 목록은 관리해주지 않는다. 앞서, WebSocketRegistryListener를 통해 연결과 해지 그리고 메시지 수신 구독에 대한 이벤트를 처리할 핸들러를 구현할 수 있으므로 웹 소켓 세션을 저장하는 클래스를 구현해보도록 하자.

```java WebSocketRepository.java
@Component
public class WebSocketRepository {

    private final Map<String, Set<WebSocketSession>> store = new ConcurrentHashMap<>();

    public Set<WebSocketSession> findById(String sessionId) {
        return store.get(sessionId);
    }

    public void save(WebSocketSession session) {
        String sessionId = getSessionId(session);

        if (sessionId != null) {
            Set<WebSocketSession> sessions = store.computeIfAbsent(sessionId, s -> new CopyOnWriteArraySet<>());
            sessions.add(session);

            store.put(sessionId, sessions);
        }
    }

    public void remove(WebSocketSession session) {
        String sessionId = getSessionId(session);

        if (sessionId != null && store.containsKey(sessionId)) {
            Set<WebSocketSession> sessions = store.get(sessionId);
            sessions.remove(session);

            if (sessions.isEmpty()) {
                store.remove(sessionId);
            }
        }
    }

    public void remove(String sessionId, String wsSessionId) {
        if (sessionId != null && store.containsKey(sessionId)) {
            Set<WebSocketSession> sessions = store.get(sessionId);
            Optional<WebSocketSession> sessionOptional = Optional.empty();
            for (WebSocketSession session : sessions) {
                if (session.getId().equals(wsSessionId)) {
                    sessionOptional = Optional.of(session);
                    break;
                }
            }

            sessionOptional.ifPresent(this::remove);
        }
    }

    public String getSessionId(WebSocketSession session) {
        return getSessionId(session.getAttributes());
    }

    public String getSessionId(Map<String, Object> sessionAttributes) {
        String sessionId = (String) sessionAttributes.get(HttpSessionHandshakeInterceptor.HTTP_SESSION_ID_ATTR_NAME);
        if (sessionId != null) {
            sessionId = SessionRepositoryMessageInterceptor.getSessionId(sessionAttributes);
        }
        return sessionId;
    }
}
```

```java WebSocketEventHandler.java
@AllArgsConstructor
@Component
public class WebSocketEventHandler {

    private final WebSocketRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handle(SessionConnectEvent event) {
        repository.save(event.getWebSocketSession());
    }

    @EventListener
    public void handle(SessionConnectedEvent event) {
        MessageHeaders headers = event.getMessage().getHeaders();
        String wsSessionId = SimpMessageHeaderAccessor.getSessionId(headers);
        if (wsSessionId != null) {
            String username = "anonymous";
            Principal user = event.getUser();
            if (user != null) {
                username = user.getName();
            }
            String message = "Hi, %s".formatted(username);
            messagingTemplate.convertAndSendToUser(wsSessionId, "/queue/hello", Map.of("message", message));
        }
    }

    @EventListener
    public void handle(SessionDisconnectEvent event) {
        MessageHeaders headers = event.getMessage().getHeaders();
        Map<String, Object> sessionAttributes = SimpMessageHeaderAccessor.getSessionAttributes(headers);
        if (sessionAttributes != null) {
            String sessionId = repository.getSessionId(sessionAttributes);
            repository.remove(sessionId, event.getSessionId());
        }
    }

    @EventListener
    public void handle(SessionSubscribeEvent event) {
        // TODO: implementation
    }

    @EventListener
    public void handle(SessionUnsubscribeEvent event) {
        // TODO: implementation
    }
}
```

일부 예제에서는 WebSocketHandlerDecorator 클래스를 확장하여 웹 소켓 세션 관리를 구현하는 것을 찾아볼 수 있으나 이미 구현되어있고 굳이 핸들러를 교체할 필요가 없이 위와 같이 이벤트만을 받아서 처리하는게 더 간단하다.  또한, 굳이 핸들러 위치가 아니더라도 SimpMessagingTemplate를 통해 [메시지를 송신](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-send.html)할 수 있다.

#### 웹 소켓 관련 문서

- [Spring Framework - WebSockets](https://docs.spring.io/spring-framework/reference/web/websocket.html)
- [Spring Session - WebSocket Integration](https://docs.spring.io/spring-session/reference/web-socket.html)
- [Spring Security - WebSocket Security](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html)
- [rstoyanchev/spring-websocket-portfolio](https://github.com/rstoyanchev/spring-websocket-portfolio)
- [spring-session-samples/spring-session-sample-boot-websocket](https://github.com/spring-projects/spring-session/tree/main/spring-session-samples/spring-session-sample-boot-websocket)