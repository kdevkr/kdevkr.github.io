---
title: Unsupported allowDuplicateContentLengths in Spring Cloud Gateway of Hoxton version
date: 2021-12-19
tags:
- Spring Cloud Gateway
- RFC 7230
- Reactor Netty
---

안녕하세요 Mambo 입니다.

오늘은 스프링 클라우드 게이트웨이에서 발생하는 Content-Length 헤더의 값이 단일이 아닌 복수로 지정될 때 발생하는 오류에 대해 다루어보려고 합니다.

## RFC 7230
[RFC 7230 - 3.3.2. Content-Length](https://datatracker.ietf.org/doc/html/rfc7230#section-3.3.2)를 참고해보면 다른 헤더들과는 다르게 Content-Length 헤더는 단일로 구성되어야 한다고 규정합니다. 다만, 다음과 내용을 통해 Content-Length 헤더 값이 복수로 구성되는 경우는 수신자가 오류로 처리하거나 단일 값으로 처리해야한다고 설명하고 있습니다.

> If a message is received that has multiple Content-Length header fields with field-values consisting of the same decimal value, or a single Content-Length header field with a field value containing a list of identical decimal values (e.g., "Content-Length: 42, 42"), indicating that duplicate Content-Length header fields have been generated or combined by an upstream message processor, then the recipient MUST either reject the message as invalid or replace the duplicated field-values with a single valid Content-Length field containing that decimal value prior to determining the message body length or forwarding the message.

## 오류 및 원인 분석
스프링 클라우드 게이트웨이에서 발생한 오류에 대한 내용은 [Multiple Content-Length values found: [229455, 229455]](https://github.com/spring-cloud/spring-cloud-gateway/issues/2465)에서 확인할 수 있습니다.

모든 스프링 클라우드 게이트웨이 버전에서 발생하는 상황은 아니었으며 스프링 부트 2.3.x와 호환성이 검증된 스프링 클라우드 Hoxton 릴리즈 트레인으로 관리되는 스프링 클라우드 게이트웨이 서버에서 발생하였습니다. Content-Length 헤더 값이 복수로 지정되는 것은 브라우저에서 실행간으한 wav, mp3, webm 파일을 요청할 때 발생한 것으로 일반적인 curl 또는 Postman을 통해서는 정상적으로 응답이 수행되었습니다.

### HttpUtil#normalizeAndGetContentLength
```java
java.lang.IllegalArgumentException: Multiple Content-Length values found: [229455, 229455]
	at io.netty.handler.codec.http.HttpUtil.normalizeAndGetContentLength(HttpUtil.java:595) ~[netty-codec-http-4.1.65.Final.jar:4.1.65.Final]
	Suppressed: reactor.core.publisher.FluxOnAssembly$OnAssemblyException: 
Error has been observed at the following site(s):
```

위 스택트레이스 내용에 따르면 Netty 라이브러리의 netty-codec-http 모듈에서 HttpUtil.normalizeAndGetContentLength 함수로 처리될 때 오류가 던져졌음을 확인할 수 있습니다. 또한, netty-codec-http 모듈의 [HttpUtil#normarlizeAndGetContentLength](https://github.com/netty/netty/blob/c08beb543a6b8db0c7f3cee225042361b4025e4c/codec-http/src/main/java/io/netty/handler/codec/http/HttpUtil.java#L555-L560)에는 allowDuplicateContentLengths 파라미터를 통해 복수의 동일한 값이 지정되더라도 단일 값으로 처리되도록 구현되어있는 상태입니다.

### Reactor Netty - HttpDecoderSpec
이미 allowDuplicateContentLengths 옵션을 지원하는데도 불구하고 스프링 클라우드 Hoxton 버전에서 의존하는 reactor-netty:0.9.x.RELEASE 에서는 HttpDecoderSpec 클래스가 allowDuplicateContentLengths 옵션을 지원하지 않았습니다.

더 자세한 정보를 찾아본 결과 HttpDecoderSpec에서 allowDuplicateContentLengths 옵션이 지원되는 것은 [Add HttpDecoderSpec#allowDuplicateContentLengths(boolean) #1638](https://github.com/reactor/reactor-netty/pull/1638/commits/978ba8a737f26376d1caab4806e25420e7aac7b7)으로 처리되었으며 [Reactor Netty 1.0.8](https://github.com/reactor/reactor-netty/releases/tag/v1.0.8)에서부터 추가되어 반영되었음을 확인할 수 있었습니다. 그러나 위 반영 내용은 Reactor Netty 0.9.x 사용자들을 위한 Dysprosium 릴리즈 트레인에서 [Reactor Netty 0.9.25.RELEASE](https://github.com/reactor/reactor-netty/releases/tag/v0.9.25.RELEASE)로 릴리즈 계획이 종료되기까지 반영되지 않은 사항입니다. 

> Reactor Netty 0.9.x 사용자들을 위해 allowDuplicateContentLengths 옵션 지원을 반영할 수 있는지 [allowDuplicateContentLengths for Reactor Netty 0.9.x users #1942](https://github.com/reactor/reactor-netty/issues/1942) 이슈를 등록해두었습니다. 이 이슈가 처리되기전까지는 HttpDecoderSpec에서 allowDuplicateContentLengths 파라미터를 활성화할 수 없습니다.

## 해결방안
Content-Length 헤더에 중복된 동일한 값이 설정되는 문제를 해결하기 위해서는 allowDuplicateContentLengths 옵션이 적용될 수 있도록 해야만합니다. 스프링 클라우드 게이트웨이 서버 스타터에서 자동 구성할 때 HttpClient에 대한 HttpClientCustomizer를 지원함에도 불구하고 의존하고 있는 HttpDecoderSpec에서 allowDuplicateContentLengths를 적용할 수 있어야만 합니다. 따라서, Reactor Netty 의존성 버전을 1.0.8 이상으로 변경할 수 밖에 없습니다.

### 첫번째 시도 - Reactor Bom 변경
혹시나 Reactor Netty 의존성 버전을 변경하여 가능할지도 모른다는 생각으로 버전 업그레이드를 시도해보았습니다.

```groovy
ext {
    set('springCloudVersion', 'Hoxton.SR12'),
    set('reactorNettyVersion', '2020.0.8')
}
dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
        mavenBom "io.projectreactor:reactor-bom:${reactorNettyVersion}"
    }
}
```

Reactor Netty 버전을 변경하기 위해 Reactor Bom을 적용해본 결과 다음과 같이 reactor.netty.tcp.ProxyProvider를 클래스로더에서 찾을 수 없는 상태가 되었습니다.

```java
Caused by: java.lang.NoClassDefFoundError: reactor/netty/tcp/ProxyProvider$Builder
	at java.base/java.lang.Class.getDeclaredMethods0(Native Method) ~[na:na]
	at java.base/java.lang.Class.privateGetDeclaredMethods(Class.java:3166) ~[na:na]
	at java.base/java.lang.Class.getDeclaredMethods(Class.java:2309) ~[na:na]
	at org.springframework.util.ReflectionUtils.getDeclaredMethods(ReflectionUtils.java:463) ~[spring-core-5.2.15.RELEASE.jar:5.2.15.RELEASE]
	... 19 common frames omitted
Caused by: java.lang.ClassNotFoundException: reactor.netty.tcp.ProxyProvider$Builder
	at java.base/jdk.internal.loader.BuiltinClassLoader.loadClass(BuiltinClassLoader.java:581) ~[na:na]
	at java.base/jdk.internal.loader.ClassLoaders$AppClassLoader.loadClass(ClassLoaders.java:178) ~[na:na]
	at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:522) ~[na:na]
	... 23 common frames omitted
```

이러한 문제가 발생하는 이유는 [Reactor Netty 1.0.0](https://github.com/reactor/reactor-netty/releases/tag/v1.0.0)에서부터 reactor.netty.tcp.ProxyProvider가 reactor.netty.transport.ProxyProvider로 변경되었기 때문입니다. 스프링 클라우드 Hoxton에서는 Reactor Netty 0.9.x의 클래스들을 사용하기 때문에 단순하게 Reactor Netty 의존성 버전을 변경할 수는 없습니다.

### 두번째 시도 - Spring Cloud 버전 업그레이드
Reactor Netty 1.0.8을 사용하기 위해서는 스프링 클라우드 2020.0.x aka Ilford 릴리즈 트레인의 스프링 클라우드와 함께 스프링 부트 2.4.x로 업그레이드해야합니다. 테스트 중인 프로젝트에서는 그래들 멀티 프로젝트로 구성되어 스프링 클라우드 게이트웨이 서버와 애플리케이션 서버가 동일한 스프링 부트 버전을 사용하고 있었습니다.

```groovy
plugins {
    id 'rog.springframework.boot' version '2.4.13'
}
ext {
    set('springCloudVersion', '2020.0.0'),
    set('reactorNettyVersion', '2020.0.8')
}
dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
        mavenBom "io.projectreactor:reactor-bom:${reactorNettyVersion}"
    }
}
```

> 스프링 부트 2.4 부터 변경된 사항에 대해서 검토하여야합니다.

아쉽게도 스프링 부트 버전과 스프링 클라우드 버전을 업그레이드 하고나서는 Content-Length에 복수로 설정되던 파일들이 정상적으로 단일 값으로 처리되어 allowDuplicateContentLengths 적용이 필요하지 않은 상태가 되었습니다. 만약, allowDuplicateContentLengths 적용이 필요하다면 다음과 같이 HttpClientCustomzier를 통해 구성할 수 있습니다.

```java
@Component
public class NettyHttpClientCustomizer implements HttpClientCustomizer {
    @Override
    public HttpClient customize(HttpClient httpClient) {
        return httpClient.httpResponseDecoder(decoderSpec -> 
            decoderSpec
                .allowDuplicateContentLengths(true)
        );
    }
}
```

이 내용은 Okky 커뮤니티에 [Spring Cloud Hoxton의 Spring Cloud Gateway에서는 allowDuplicateContentLengths을 지원하지 않음](https://okky.kr/article/1122985)로 공유되었음을 알려드리며 마치도록 하겠습니다.

감사합니다.

## 참고

- [RFC 7230](https://datatracker.ietf.org/doc/html/rfc7230)  
- [Spring Cloud Release train Spring Boot compatibility](https://spring.io/projects/spring-cloud)
- [spring-cloud/spring-cloud-gateway](https://github.com/spring-cloud/spring-cloud-gateway)
- [Reactor Netty 1.0.8 Release](https://github.com/reactor/reactor-netty/releases/tag/v1.0.8)






