---
title: Tracing handshake websocket with undertow
date: 2022-08-12
tags:
- Undertow
- WebSocket
---

> Handshake failed due to invalid Upgrade header: null

본 글은 위와 같은 웹 소켓 연결 시에 애플리케이션 오류 로그가 발생한 건에 대한 관련 내용을 기록하기 위한 것 입니다. 이 오류 로그는 스프링 웹 소켓 모듈에서 DefaultHandshakeHandler를 통해 핸드쉐이크를 수행하는 과정에서 올바르지 않은 웹 소켓 연결에 대해 오류 로그로 기록하도록 되어있는데 Upgrade 헤더에 올바르지 않은 값이 전달되었다는 의미입니다.

> Connection: Upgrade
> Upgrade: websocket

일반적으로 웹 소켓 연결은 [Protocol upgrade mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism)으로 HTTP 통신에 대해 커넥션을 전환하는 과정을 거치게 되는데 서버에서는 웹소켓 엔드포인트에 해당하는 요청에 대해서는 Upgrade 헤더를 확인하고 websocket 이 전달되었는지를 확인합니다.

## 웹소켓 프록시
시스템이 동작하는 인프라 환경은 AWS 클라우드 서비스로 구성되어 있습니다. 일반적으로 로드밸런싱을 위해서 사용하는 [Elastic Load Balancing 기능](https://aws.amazon.com/ko/elasticloadbalancing/features/#Product_comparisons)에 따르면 ALB, NLB 모두 웹소켓을 지원한다고 되어있으므로 웹소켓 연결에 제한적인 환경은 아닙니다. 현재 조직에서 플랫폼으로써 제공하는 환경은 EC 키 기반의 인증서의 제약사항으로 NLB를 사용해서 TCP 프록시를 수행하고 SSL 오프로드는 Nginx에서 수행한 후 애플리케이션 서버로 트래픽이 전달되는 구조입니다.

다만, 위 문제가 발생했다고 안내된 특정 고객이 직접 구성하는 환경에서는 ELB 레벨에서 SSL 오프로드를 수행한 후의 트래픽만 Nginx로 전달되어 애플리케이션 서버로 프록시되므로 약간의 요청이 전달되는 방식이 다릅니다. 따라서, ELB 레벨에서 트래픽을 전달하는 과정에서 Upgrade 헤더가 유실될 가능성도 의심해볼 수 있습니다. 

> 각 환경의 Nginx에는 [Upgarde 헤더에 대한 프록시 구성](http://nginx.org/en/docs/http/websocket.html)에 따라 Upgarde 헤더 값을 애플리케이션으로 전달되도록 $http_upgrade 변수가 설정되어 있습니다.

### 타임아웃
일반적으로 AWS 클라우드 환경에서 ELB를 사용할 때 웹소켓 연결 문제가 발생할 수 있습니다. 이는 [ELB 로드밸런서 속성](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/application-load-balancers.html#load-balancer-attributes)의 idle_timeout.timeout_seconds 기본값이 60초 이어서 발생하는 부분에 대해서는 타임아웃을 90초로 설정되어 웹 소켓 연결에 대한 부분은 정상적으로 유지하는 상태입니다.

> 클라이언트의 초기 연결을 제외하고는 서버에서 1분마다 스케줄에 의해 어떠한 메시지를 전달하는데 서버가 전달하는 타이밍 상 60초 이내에 전달되는 트래픽이 없다고 판단되어 연결이 해지될 수 있습니다.

### HTTP2
일반적인 웹 요청은 HTTP2로 연결될 수 있도록 지원하고 있는데 웹소켓에 대한 연결에 대해서는 HTTP 1.1의 업그레이드 매커니즘을 사용해야 합니다.

```sh
curl --include \
     --no-buffer \
     --http1.1 \
     --location \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: example.com" \
     --header "Origin: https://example.com" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     https://example.com/websocket/server/sessionid/websocket
```

그런데 위 cURL 명령어에서 --http1.1 옵션을 제외하면 Upgarde 헤더에 websocket에 전달되지 않는 상황이 발생함을 확인하였습니다. 결국 일반적인 브라우저를 통한 요청이 아니라 특정 클라이언트가 직접 웹소켓 연결을 시도할 가능성도 있다는 이야기 입니다.

> [wscat](https://github.com/websockets/wscat) 또는 [postman](https://learning.postman.com/docs/sending-requests/websocket/websocket/) 으로도 웹 소켓 연결을 시도해보았지만 정상적으로 연결됨을 확인할 수 있었습니다.

## 스프링 웹 소켓
시스템 입장에서는 올바르지 않은 웹소켓 연결이 요청되는 부분이므로 해당 오류 로그만으로는 어떻게 요청되었는가를 검토할 수 있는 방안이 없습니다. 스프링 웹 소켓 모듈에서 요청 정보를 기록할 수 있는 방안을 찾아보도록 합시다. 

### RequestUpgradeStrategy
RequestUpgradeStrategy는 HTTP 요청에 대해서 웹 소켓 연결로 업그레이드하기 위한 전략이며 언더토우를 사용하고 있다면 UndertowRequestUpgradeStrategy가 사용됩니다. 

```java
public class CustomRequestUpgradeStrategy extends UndertowRequestUpgradeStrategy {
    @Override
    protected void upgradeInternal(ServerHttpRequest request, ServerHttpResponse response, String selectedProtocol, List<Extension> selectedExtensions, Endpoint endpoint) throws HandshakeFailureException {
        // NOTE: 핸드쉐이크 과정에서 검증된 요청에 대해서 업그레이드를 수행한다.
        super.upgradeInternal(request, response, selectedProtocol, selectedExtensions, endpoint);
    }
}
```

위 처럼 업그레이드를 수행하는 과정에서 요청과 응답에 대해 부가 처리를 수행할 수 있습니다만 DefaultHandshakeHandler 라는 클래스에서 upgradeInternal 함수가 호출되는 위치를 살펴보면 웹 소켓 연결 요청에 대해서 검증을 수행하고나서 마지막에 upgradeInternal 함수가 호출되므로 본 문제가 발생했을때는 요청 정보를 파악할 수 없습니다.


### DefaultHandshakeHandler
DefaultHandshakeHandler는 스프링 웹 소켓 모듈에서 기본적으로 사용하는 웹 소켓 연결을 수행하는 핸들러로 HandshakeHandler로 등록된 빈이 없다면 내부적으로 DefaultHandshakeHandler를 생성하여 사용하도록 되어있습니다. 앞서 RequestUpgradeStrategy를 이용할 수 없는 이유를 확인하기 위해 핸드쉐이크를 수행하는 코드를 살펴보도록 하겠습니다.

```java
public static class AbstractHandshakeHandler implements HandshakeHandler {
    @Override
	public final boolean doHandshake(ServerHttpRequest request, ServerHttpResponse response,
			WebSocketHandler wsHandler, Map<String, Object> attributes) throws HandshakeFailureException {

		WebSocketHttpHeaders headers = new WebSocketHttpHeaders(request.getHeaders());
		if (logger.isTraceEnabled()) {
			logger.trace("Processing request " + request.getURI() + " with headers=" + headers);
		}
		try {
			if (HttpMethod.GET != request.getMethod()) {
				response.setStatusCode(HttpStatus.METHOD_NOT_ALLOWED);
				response.getHeaders().setAllow(Collections.singleton(HttpMethod.GET));
				if (logger.isErrorEnabled()) {
					logger.error("Handshake failed due to unexpected HTTP method: " + request.getMethod());
				}
				return false;
			}
			if (!"WebSocket".equalsIgnoreCase(headers.getUpgrade())) {
				handleInvalidUpgradeHeader(request, response);
				return false;
			}
			if (!headers.getConnection().contains("Upgrade") && !headers.getConnection().contains("upgrade")) {
				handleInvalidConnectHeader(request, response);
				return false;
			}
			if (!isWebSocketVersionSupported(headers)) {
				handleWebSocketVersionNotSupported(request, response);
				return false;
			}
			if (!isValidOrigin(request)) {
				response.setStatusCode(HttpStatus.FORBIDDEN);
				return false;
			}
			String wsKey = headers.getSecWebSocketKey();
			if (wsKey == null) {
				if (logger.isErrorEnabled()) {
					logger.error("Missing \"Sec-WebSocket-Key\" header");
				}
				response.setStatusCode(HttpStatus.BAD_REQUEST);
				return false;
			}
		}
		catch (IOException ex) {
			throw new HandshakeFailureException(
					"Response update failed during upgrade to WebSocket: " + request.getURI(), ex);
		}

		String subProtocol = selectProtocol(headers.getSecWebSocketProtocol(), wsHandler);
		List<WebSocketExtension> requested = headers.getSecWebSocketExtensions();
		List<WebSocketExtension> supported = this.requestUpgradeStrategy.getSupportedExtensions(request);
		List<WebSocketExtension> extensions = filterRequestedExtensions(request, requested, supported);
		Principal user = determineUser(request, wsHandler, attributes);

		if (logger.isTraceEnabled()) {
			logger.trace("Upgrading to WebSocket, subProtocol=" + subProtocol + ", extensions=" + extensions);
		}
		this.requestUpgradeStrategy.upgrade(request, response, subProtocol, extensions, user, wsHandler, attributes);
		return true;
	}
}
```

> AbstractHandshakeHandler 클래스에 대해 로그 레벨을 Trace로 설정하면 요청 정보를 로그로 기록할 수 있지만 모든 요청에 대해서 기록하므로 문제가 발생했을때만 요청 정보를 남길 수 없습니다.

#### AbstractHandshakeHandler.handleInvalidUpgradeHeader
앞서 doHandshake 함수를 살펴본 결과 Upgrade 헤더에 올바르지 않은 값이 전달되는 경우에는 handleInvalidUpgradeHeader 함수를 호출하는 것을 확인할 수 있습니다. 이제 우리는 handleInvalidUpgradeHeader 함수를 오버라이드 하여 요청 정보를 확인하고 오류 로그로 기록할 수 있는 위치를 알게 되었습니다.

```java
@Slf4j
public class CustomHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected void handleInvalidUpgradeHeader(ServerHttpRequest request, ServerHttpResponse response) throws IOException {
        // NOTE: Upgrade 헤더에 올바르지 않은 값이 전달되었을때 호출된다.
        log.error("Method: {}, URI: {}, Principal: {}, Headers: {}", request.getMethodValue(), request.getURI(), request.getPrincipal(), request.getHeaders()); 
        super.handleInvalidUpgradeHeader(request, response);
    }
}
```

애플리케이션 레벨에서는 Upgrade 헤더에 올바르지 않은 값이 전달되는 경우에 대해서 원인을 파악하기는 어렵습니다. 그럼에도 불구하고 본 문제가 다시 발생했을 때 어떤 정보로 요청되었는지에 대한 로그가 기록되었으므로 원인 파악을 위한 실마리를 찾을 수 있는 방안을 마련할 수 있게 됩니다.

## 참고
- [Protocol upgrade mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism)
- [Elastic Load Balancing 기능](https://aws.amazon.com/ko/elasticloadbalancing/features/#Product_comparisons)
- [WebSocket proxying](http://nginx.org/en/docs/http/websocket.html)