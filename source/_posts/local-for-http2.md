---
title: HTTP/2를 사용하는 개발 환경
date: 2022-02-22
tags:
- Spring Boot
- Nginx
- TLS
- HTTP2
- mkcert
---

지난 [SSL 인증서](/ssl-certificate)와 [TLS 오프로드](/tls-offload)라는 글을 통해 HTTPS에 대해서 살펴본 적이 있습니다. 이처럼 HTTPS는 사용자의 요청이 안전하게 서버로 전달되는 것을 목적으로 도입하지만 [HTTP/2](https://developers.google.com/web/fundamentals/performance/http2?hl=ko)를 사용하기 위함도 있습니다. 일반 사용자의 컴퓨터나 모바일 디바이스에 대한 성능이 좋아지면서 TLS 핸드쉐이킹에 대한 비용은 그다지 크지 않습니다. 그러나 HTTP 1.1에서의 Keep Alive 도입은 이미 연결중인 TCP를 다시 사용하므로 어느정도의 TLS 핸드쉐이킹에 대한 비용을 줄일 수 있지만 수 많은 요청이 발생하는 애플리케이션에서는 이미 응답을 기다리는 요청이 끝나기를 현재 요청이 대기해야하는 문제를 가지고 있습니다.

> HTTP 1.1은 keep-alive 커넥션을 통해 여러개의 TCP 연결을 일정 시간 열어놓고 요청을 차례대로 수행하기 때문에 브라우저에서는 [HTTP 1.1를 사용할 때 도메인 당 최대 연결 수를 제한](https://stackoverflow.com/a/985704)합니다.

## HTTP/2
HTTP 1.1이 이미 연결된 TCP 커넥션을 다시 재사용한다면 HTTP2는 단일 TCP 연결을 수행하고 수 많은 요청을 스트림으로 처리합니다. 그렇기에 꽤 많은 요청을 동시에 수행해도 브라우저는 이를 제한하지 않습니다. 예를 들어, 자바스크립트에서 **프로미스로 여러개 요청을 동시에 수행하도록** 코드를 작성하더라도 다른 요청이 끝나기까지 요청이 대기하는 현상이 줄어들게되며, 웹팩을 통해 클라이언트 UI를 구성하는 에셋 파일들을 **여러개의 작은 사이즈로 나누는 청크를 수행**하고 웹 페이지 로딩 시 분할된 청크를 빠르게 응답받을 수 있습니다.

> 브라우저에서 HTTP/2도 도메인 당 TCP 연결을 수행합니다. 그리고 대부분의 브라우저와 서버에서는 HTTP/2 연결을 위해 TLS 사용을 요구합니다.

### ALPN
HTTP2.Pro 사이트를 사용해서 [네이버](https://http2.pro/check?url=https%3A//naver.com/)와 [오키](https://http2.pro/check?url=https%3A//okky.kr/) 서비스 주소를 입력해보면 ALPN 지원 여부에 대한 정보가 표시됩니다. ALPN은 TLS 핸드쉐이크를 수행하고 서버와 클라이언트간 연결에서 어떤 HTTP 프로토콜을 사용할 것인지를 결정하기 위한 정책입니다. 아마존 웹 서비스는 [NLB](https://aws.amazon.com/ko/about-aws/whats-new/2020/05/network-load-balancer-now-supports-tls-alpn-policies/)에서도 TLS ALPN 정책을 지원하기도 하죠.

> HTTP/2 연결을 우선적으로 요구하고 클라이언트가 불가능하다면 HTTP 1.1로 연결할 수 있습니다.

### Local CA with mkcert
[스프링 부트 애플리케이션](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.webserver.configure-http2.undertow) 뿐만 아니라 [엔진엑스](/reverse-proxy-using-nginx)에서도 TLS 구성을 위해서는 인증서가 필요합니다. 그래서 지난 SSL 인증서 글에서는 [자체 서명 CA 인증서 발급](/ssl-certificate/#자체-서명-CA-인증서-발급)을 한것처럼 로컬 개발 환경을 위한 인증서를 만들고 적용하는 과정을 공유했습니다. 이 과정들은 생각보다 까다롭고 불편한 부분이 많습니다. 결국 불편한 것을 극히 싫어하는 개발자들은 [mkcert](https://github.com/FiloSottile/mkcert)라고 하는 로컬 환경을 위한 CA 인증서를 자동으로 신뢰 기관에 등록하는 도구를 만들어냅니다.

```ps
PS C:\Users\Mambo\cert> mkcert -install
The local CA is now installed in the system trust store! ⚡️

PS C:\Users\Mambo\docker\nginx.conf> mkcert -ecdsa localhost 127.0.0.1 ::1 mambo.kr

Created a new certificate valid for the following names 📜
 - "localhost"
 - "127.0.0.1"
 - "::1"
 - "mambo.kr"

The certificate is at "./localhost+3.pem" and the key at "./localhost+3-key.pem" ✅

It will expire on 22 May 2024 🗓
```

> 간단하게 CA 인증서를 신뢰 기관에 등록하고 로컬 컴퓨터를 위한 인증서를 발급했습니다.
> 로컬 컴퓨터를 위한 인증서에 대한 신뢰 인증서를 등록한다는 점을 잊지 마세요.

## 로컬 개발 환경
일반적으로 TLS 핸드쉐이크를 수행하는 이후의 트래픽 전달에는 TLS 연결을 수행하도록 하지 않도록 구성합니다. 일부 엔지니어들은 모든 트래픽 전달에 TLS 연결을 해야한다고 말합니다. 어느정도의 보안적인 구성을 하느냐는 조직에서 결정해야할 일입니다. 현재 조직은 아마존 웹 서비스의 로드밸런서에서 TLS 핸드쉐이크를 수행하도록 하고 내부적인 트래픽 전달에는 TLS를 사용하여 패킷을 보호하지 않습니다. 

TLS 오프로드 및 리버스 프록시를 위한 엔진엑스를 구성하고 HTTP로 실행된 애플리케이션에 트래픽을 전달하며 HTTP/2를 사용할 수 있게 만들겠습니다. 이미 사용중인 엔진엑스가 없다면 제 깃허브 리파지토리 [nginx.conf](https://github.com/kdevkr/nginx.conf)의 코드를 활용해서 도커 컴포즈로 엔진엑스 컨테이너를 실행하셔도 좋습니다.

```yaml
version: '3.8'
services: 
  nginx:
    image: nginx:1.21.3-alpine
    ports: 
      - 80:80
      - 443:443
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./localhost+3.pem:/etc/nginx/server.crt
      - ./localhost+3-key.pem:/etc/nginx/server.key
      - ./static:/etc/nginx/static
  app:
    image: amazoncorretto:11-alpine
    command: 'java -jar /etc/app.jar'
    volumes:
      - ./demo-0.0.1-SNAPSHOT.jar:/etc/app.jar

```

> 저는 리파지토리에 있는 사설 인증서 대신에 mkcert를 통해 만들어진 인증서를 사용하도록 변경했습니다.

리파지토리에 저장된 샘플 애플리케이션을 그대로 사용했지만 로컬 호스트에서 인텔리제이와 같은 개발 도구로 애플리케이션을 실행하셨다면 nginx.conf 파일의 백엔드 스트림에 대한 주소를 `host.docker.internal`로 변경하세요. 컨테이너로 실행된 엔진엑스에서 로컬 호스트로 트래픽이 전달되게 됩니다.

![TLS Handshake](/images/posts/local-for-http2/security-overview.png)
![HTTP/2](/images/posts/local-for-http2/network-overview.png)

> mkcert가 자동으로 신뢰 기관 목록에 자신의 CA 인증서를 등록하였기 때문에 브라우저는 인증서를 신뢰할 수 있다고 판단했고 HTTPS 연결이 정상적으로 수행되었습니다.

이제 여러분들도 로컬 환경에서 개발하실때 HTTPS와 그리고 HTTP 1.1이 아닌 HTTP/2를 사용해보시기 바랍니다.

감사합니다.