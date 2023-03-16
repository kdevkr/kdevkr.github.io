---
title: 스프링 부트 언더토우
date: 2023-03-16
tags:
- Spring Boot
- Undertow
---

인텔리제이 또는 [스프링 이니셜라이저](https://start.spring.io/)를 통해 스프링 부트 프로젝트를 간단하게 생성할 수 있다. 스프링 이니셜라이저를 통해 만들고자 하는 프로젝트에서 필요한 모듈을 쉽게 선택할 수 있게 지원하지만 세부적인 모듈의 선택은 지원하지 않기 때문에 만들어진 프로젝트를 수정해야할 필요성이 생길 수 있다. 아파치 톰캣은 기본적으로 지원하는 기본 컨테이너로써 충분히 입증된 기술이지만 현재 조직과 같이 일부 실무 프로젝트에서는 언더토우를 사용하는 편이다.

``` groovy build.gradle
configurations.configureEach {
    exclude group: 'org.springframework.boot', module: 'spring-boot-starter-tomcat'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'org.springframework.boot:spring-boot-starter-undertow'
}
```

> 위 예시에서 spring-boot-starter-websocket 모듈에 의해 spring-boot-starter-web은 명시할 필요가 없다.

#### WebSocketDeploymentInfo 경고 로그 없애기
spring-boot-starter-websocket 모듈을 추가하면 아래처럼 WebSocketDeploymentInfo가 설정되지 않아 기본 버퍼 풀이 사용된다는 경고 로그가 출력된다. 로그 레벨 조정을 통해 무시해도 되지만 WebServerFactoryCustomizer를 통해서 WebSocketDeploymentInfo가 등록되도록 구현할 수 있다.

```
2023-03-16T21:49:43.249+09:00  WARN 35488 --- [main] io.undertow.websockets.jsr : UT026010: Buffer pool was not set on WebSocketDeploymentInfo, the default pool will be used
```

```java UndertowWebsocketCustomizer
@Component
public class UndertowWebsocketCustomizer implements WebServerFactoryCustomizer<UndertowServletWebServerFactory> {

    private final ServerProperties.Undertow undertow;

    public UndertowWebsocketCustomizer(final ServerProperties serverProperties) {
        this.undertow = serverProperties.getUndertow();
    }

    @Override
    public void customize(UndertowServletWebServerFactory factory) {
        factory.addDeploymentInfoCustomizers(deploymentInfo -> {
            boolean direct = this.undertow.getDirectBuffers() != null && this.undertow.getDirectBuffers();
            int bufferSize = this.undertow.getBufferSize() != null ? (int) this.undertow.getBufferSize().toBytes() : 1024;
            WebSocketDeploymentInfo webSocketDeploymentInfo = new WebSocketDeploymentInfo();
            webSocketDeploymentInfo.setBuffers(new DefaultByteBufferPool(direct, bufferSize));
            deploymentInfo.addServletContextAttribute("io.undertow.websockets.jsr.WebSocketDeploymentInfo", webSocketDeploymentInfo);
        });
    }
}
```

#### HTTPS 포트로 리다이렉트
이제는 AWS ELB와 같은 로드밸런서 또는 엔진엑스와 같은 웹 서버들을 통해서 리버스 프록시를 구성하므로 애플리케이션이 HTTP/2를 지원하도록 구동하지 않는 편이지만 TLS 오프로드가 필요하다면 아래와 같이 HTTP로 연결되었을때 HTTPS로 연결되도록 구성할 수 있다.

```java UndertowHttp2Customizer
@Component
public class UndertowHttp2Customizer
    implements WebServerFactoryCustomizer<UndertowServletWebServerFactory> {

    private final ServerProperties serverProperties;
    private final int httpPort;

    public UndertowHttp2Customizer(final ServerProperties serverProperties,
                                   final Environment environment) {
        this.serverProperties = serverProperties;
        this.httpPort = environment.getProperty("server.http-port", Integer.class, 8080);
    }

    @Override
    public void customize(UndertowServletWebServerFactory factory) {
        factory.addBuilderCustomizers(builder -> builder.addHttpListener(this.httpPort, "0.0.0.0"));
        factory.addDeploymentInfoCustomizers(deploymentInfo -> deploymentInfo.addSecurityConstraint(
                new SecurityConstraint()
                    .addWebResourceCollection(new WebResourceCollection().addUrlPattern("/*"))
                    .setTransportGuaranteeType(TransportGuaranteeType.CONFIDENTIAL)
                    .setEmptyRoleSemantic(SecurityInfo.EmptyRoleSemantic.PERMIT))
            .setConfidentialPortManager(exchange -> serverProperties.getPort()));
    }
}
```
