---
title: 스프링 부트 웹소켓
date: 2023-10-14T22:00+0900
tags:
- WebSocket
- SockJS
- STOMP
---

> 본 글에서 언급하는 관련 코드는 [github.com/kdevkr/spring-boot-demo/websocket-demo](https://github.com/kdevkr/spring-boot-demo/tree/main/websocket-demo)에서 확인할 수 있습니다.

일반적인 스프링 부트 스타터와는 다르게 스타터 웹소켓 모듈에는 웹소켓 연결에 대한 자동 구성을 수행하지는 않는다. 웹소켓 관련한 자동 구성(WebSocketServletAutoConfiguration)은 프로젝트에서 사용중인 서블릿 컨테이너에 따라 웹소켓에 대해 처리할 수 있도록 확장하며 WebSocketMessagingAutoConfiguration 에서는 Stomp 방식의 웹소켓을 위한 메시지 브로커를 구성할 때 사용되는 메시지 컨버터를 설정한다.

```java
@Configuration
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new TextWebSocketHandler(){}, "/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new HttpSessionHandshakeInterceptor())
                .withSockJS();
    }
}
```

[WebSocket API](https://docs.spring.io/spring-framework/reference/web/websocket/server.html)의 WebSocketConfigurer 인터페이스를 구현하여 웹소켓 연결에 대해서 처리할 수 있는 핸들러를 추가할 수 있다. 그러나, 일반적인 웹소켓 연결 방식에는 여러가지 단점이 있는데 세션과 시큐리티와 같은 부가적인 기능과의 연계를 직접적으로 구현해야한다는 것이다.

#### SockJS Fallback

[SockJS](https://docs.spring.io/spring-framework/reference/web/websocket/fallback.html)는 웹소켓 연결에 대한 문제를 보완하기 위해서 도입하는 기술이며 SockJS 클라이언트는 웹소켓 연결 주소를 기준으로 서버에게 /info 엔드포인트를 요청하여 웹소켓 연결 방식에 대해 질의를 하고 응답받은 결과를 토대로 연결을 시도한다. 스프링 웹소켓 모듈의 DefaultSockJsService 에서는 아래와 같은 연결을 지원한다.

```java DefaultSockJsService.java
private static Set<TransportHandler> getDefaultTransportHandlers(@Nullable Collection<TransportHandler> overrides) {
    Set<TransportHandler> result = new LinkedHashSet<>(8);
    result.add(new XhrPollingTransportHandler());
    result.add(new XhrReceivingTransportHandler());
    result.add(new XhrStreamingTransportHandler());
    result.add(new EventSourceTransportHandler());
    result.add(new HtmlFileTransportHandler());
    try {
        result.add(new WebSocketTransportHandler(new DefaultHandshakeHandler()));
    }
    // ...
    if (overrides != null) {
        result.addAll(overrides);
    }
    return result;
}
```

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

> 기본적으로 SockJsServiceRegistration의 웹소켓 연결 설정이 활성화되어있고 일부 로드밸런서에서 웹소켓을 지원하지 않는다면 비활성화할 수 있도록 지원한다.

#### Stomp over WebSocket




#### Webjars

리액트나 뷰와 같은 프론트엔드 개발 환경을 구성한다면 자체적으로 라이브러리 패키지를 설치하고 관리하겠지만 백엔드 애플리케이션에서 라이브러리를 제공하고 싶다면 Webjars를 이용할 수도 있다.

```groovy build.gradle
dependencies {
    implementation 'org.webjars:webjars-locator-core:0.53'
    implementation 'org.webjars:sockjs-client:1.5.1'
    implementation 'org.webjars:stomp-websocket:2.3.4'
}
```

#### 스프링 세션과의 통합

Stomp 방식의 웹 소켓 연결을 구성하는 경우에는 WebSocketMessageBrokerConfigurer를 직접 구현하기보다 스프링 세션 모듈에 포함되어있는 AbstractSessionWebSocketMessageBrokerConfigurer를 확장하는 것이 더 편리하다. 스프링 세션과 연계되는 미리 구현된 클래스들을 빈으로 등록하여 웹소켓 세션(WebSocketSession)에서 사용자 정보를 주입하고 쉽게 가져올 수 있도록 지원한다.

```groovy build.gradle
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

```java StompController.java
@AllArgsConstructor
@Slf4j
@RestController
public class StompController {

    private final SimpMessagingTemplate template;

    @SendTo("/topic/hello")
    @MessageMapping("/hello")
    public Map<String, String> hello(GenericMessage<String> message,
                                     @Header(name = "simpSessionId") String wsSessionId,
                                     @Header(name = "simpSessionAttributes") Map<String, Object> sessionAttributes,
                                     Principal principal) {
        String username = SessionRepositoryMessageInterceptor.getSessionId(sessionAttributes);
        if (principal instanceof Authentication) {
            username = principal.getName();
        }

        Map<String, String> payload = new HashMap<>();
        payload.put("message", "Hello, %s".formatted(username));
        payload.put("from", "StompController");

        // NOTE: similar @SendToUser
        template.convertAndSendToUser(wsSessionId, "/queue/hello", payload, message.getHeaders());
        return payload;
    }
}
```

#### 스프링 시큐리티와의 통합

Stomp 방식의 웹 소켓 연결의 경우 스프링 세션과의 통합처럼 스프링 시큐리티와의 통합도 지원한다. 스프링 시큐리티가 기본 HTTP 보안을 설정한다면 @EnableWebSocketSecurity가 선언된 구성 클래스를 통해서 Stomp 메시지에 대해 보안 규칙을 설정할 수 있다. 일반적인 웹 소켓 연결을 구성하는 경우에 보안적인 로직을 직접 구현해야하지만 더 간단하게 적용할 수 있다.

```groovy build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.security:spring-security-messaging'
    testImplementation 'org.springframework.security:spring-security-test'
}
```

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

#### WebSocketSession Management

스케줄링 기능을 통해 특정 상황에서 웹소켓에 연결된 사용자에게 메시지를 전달할 필요성이 있다. 웹 소켓 연결에 대한 세션 관리를 해주지만 세션이 연결중인 WebSocketSession 목록은 관리해주지 않는다. 앞서, WebSocketRegistryListener를 통해 연결과 해지 그리고 메시지 수신 구독에 대한 이벤트를 처리할 핸들러를 구현할 수 있으므로 웹 소켓 세션을 저장하는 클래스를 구현해보도록 하자.

- [WebSocketRepository.java](https://github.com/kdevkr/spring-boot-demo/blob/main/websocket-demo/src/main/java/kr/kdev/demo/WebSocketRepository.java)
- [WebSocketEventHandler.java](https://github.com/kdevkr/spring-boot-demo/blob/main/websocket-demo/src/main/java/kr/kdev/demo/WebSocketEventHandler.java)

일부 예제에서는 WebSocketHandlerDecorator 클래스를 확장하여 웹 소켓 세션 관리를 구현하는 것을 찾아볼 수 있으나 이미 구현되어있고 굳이 핸들러를 교체할 필요가 없이 위와 같이 이벤트만을 받아서 처리하는게 더 간단하다. 또한, 굳이 핸들러 위치가 아니더라도 SimpMessagingTemplate를 통해 [메시지를 송신](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-send.html)할 수 있다. SessionSubscribeEvent 와 SessionUnsubscribeEvent는 세션 자체를 전달해주지는 않지만 웹소켓 세션 아이디를 가져올 수 있으므로 특정 패턴의 구독 주소를 감지하여 세션 아이디 목록을 관리하고 애플리케이션에서 어떠한 데이터를 전달할 수 있도록 구현할 수 있을 것이다.

> 스프링 세션 모듈과 연계된 웹소켓 연결을 구성하는 경우에 SimpMessaingTemplate를 통해 웹소켓 세션 아이디가 아닌 사용자 이름으로도 전달할 수 있다.

#### 웹 소켓 관련 문서

- [Spring Framework - WebSockets](https://docs.spring.io/spring-framework/reference/web/websocket.html)
- [Spring Session - WebSocket Integration](https://docs.spring.io/spring-session/reference/web-socket.html)
- [Spring Security - WebSocket Security](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html)