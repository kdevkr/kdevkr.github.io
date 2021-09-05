---
title: SSL 인증서
date: 2021-08-27
tags:
- HTTPS
- TLS
---

안녕하세요 Mambo 입니다.

오늘은 웹사이트 접속 시 필수적으로 사용되는 HTTPS 그리고 SSL 인증서에 대해 이야기하려합니다. 회사에서 운영중인 웹 서비스를 HTTPS로 배포되고있으나 정작 SSL에 대한 부분은 머리속에서 복잡하게 얽혀 제대로 정리되지않은 상태입니다. 이 글을 작성하면서 얽혀있는 부분을 하나씩 풀어나가면서 SSL에 대한 개념을 확립해보고자 합니다.

## HTTPS
일반 사람들이 브라우저를 이용해서 웹 사이트에 접속할 때 HTTPS가 적용되었는지에 대해서 신경쓰지 않습니다. 하지만, 애플리케이션 서버를 운영하는 사람들에게 HTTPS는 사용자의 민감한 정보를 암호화해서 위조 또는 변조되는 것을 방지할 수 있는 아주 중요한 표준 보안 기술입니다. 

크롬과 같은 브라우저에서는 HTTPS와 같은 보안 프로토콜이 적용되었는지를 확인하고 사용자들에게 신뢰할 수 있는 사이트인지를 안내합니다. 브라우저 주소창 옆에 느낌표나 자물쇠 아이콘을 보신적 있으신가요? 여러분의 웹 사이트가 자물쇠 아이콘을 가진다면 보안 프로토콜을 사용하고 있으며 신뢰할 수 있는 사이트라고 할 수 있습니다.

HTTPS는 HTTP라는 전송 프로토콜과 함께 데이터를 암복호화하기 위한 보안 프로토콜을 같이 사용해야하기 때문에 추가적인 오버헤드가 발생하는 부분에 대해서는 감안해야합니다. 하지만, 최근 컴퓨터들의 CPU 성능이 좋아짐에 따라서 암복호화 걸리는 시간은 상당히 미미하며 네트워크 기술의 발전으로 레이턴시도 줄어들었기 때문에 HTTPS을 사용한다고해서 사용자가 요청하고 응답하기까지의 시간이 큰 차이를 보이지는 않습니다.

### TLS 핸드쉐이크
HTTPS가 적용된 애플리케이션 서버와 통신하기 위해서는 클라이언트인 브라우저가 애플리케이션 서버와 TLS 핸드쉐이크 과정을 수행해야합니다.

![Cloudflare - What is a TLS handshake?](https://images.ctfassets.net/slt3lc6tev37/5aYOr5erfyNBq20X5djTco/3c859532c91f25d961b2884bf521c1eb/tls-ssl-handshake.png)

**TLS 핸드쉐이크**는 웹 요청에 대한 신뢰성 여부를 확인하거나 통신 데이터를 암복호화하기 위한 방식을 서로 교환하기 위해 수행하는 과정입니다. 위 클라우드플레어에서 설명하는 TLS 핸드쉐이크 과정을 살펴보면 애플리케이션 서버가 클라이언트에게 인증서(Certificate)를 제공하고 서로 암호화 방식(CipherSpec)을 교환하는 것을 확인할 수 있습니다.

크롬 브라우저의 개발자 도구 중 보안 탭에서 TLS 핸드쉐이크 과정에 의해 결정된 여러가지 사항들을 확인할 수 있습니다.

![네이버 웹 사이트](/images/posts/ssl-certificate/ssl-certificate-01.png)

![회사 웹 사이트](/images/posts/ssl-certificate/ssl-certificate-02.png)
 
네이버 웹 사이트는 **DigiCert**라는 인증기관에서 발행한 SSL 인증서를 제공하였고 **TLS 1.3** 버전과 함께 **[X25519](https://en.wikipedia.org/wiki/Curve25519)** 방식으로 키를 교환하고 **AES_256_GCM**으로 암호화하며 회사에서 운영중인 웹 서비스는 네이버와 다르게 **TLS 1.2**, **ECDHE_ECDSA**, **AES_128_GCM**을 사용합니다. 여러분들도 HTTPS를 적용한 웹 사이트를 운영중이거나 궁금한 사이트가 있다면 어떤 사항으로 결정되었는지 확인해보시기 바랍니다. TLS 핸드쉐이크 과정에 의해 결정되는 사항들은 애플리케이션 서버가 지원하는 사항들과 클라이언트에 따라 다를 수 있습니다. 이제 우리는 이러한 사항들에 대해서 하나씩 알아보도록 하죠.

### TLS 버전
TLS 버전은 TLS 핸드쉐이크 과정을 수행하는 방식을 말합니다. 당연스럽게도 버전이 높은 TLS 1.3이 TLS 1.2보다 효율적인 방식이라고 할 수 있습니다. 클라이언트는 애플리케이션 서버에서 지원하는 TLS 버전 중 가장 높은 버전으로 TLS 핸드쉐이크를 수행할 수 있습니다. 만약, 클라이언트가 TLS 1.1까지만 사용할 수 있는데 애플리케이션 서버가 TLS 1.2 이상을 요구한다면 일치하는 TLS 버전이 없기 때문에 애플리케이션 서버는 TLS 1.1을 사용하고자하는 클라이언트 요청을 거부하게 됩니다.

크롬 브라우저는 이미 [TLS 1.0과 TLS 1.1 버전을 사용하지 않기 때문에](https://www.chromestatus.com/feature/5759116003770368) 여러분의 애플리케이션 서버는 최소한 TLS 1.2 버전을 사용할 수 있도록 지원해야합니다. 

![](/images/posts/ssl-certificate/ssl-certificate-12.png)

위는 회사에서 운영중인 애플리케이션 서버의 로그를 살펴본 경우로 **SSLv3, TLSv1.0, TLS v1.1**등의 TLS 버전을 사용하려는 클라이언트 요청이 거부된 것이 오류 로그로 출력된 상황을 보여줍니다. 이 애플리케이션 서버는 AWS Beanstalk와 함께 NLB(Network Load Balancer)를 사용하며 NLB는 TCP 트래픽에 대하여 분산된 애플리케이션 서버로 프록시되도록 구성했기때문에 L4 로드밸런서에서 TLS 핸드쉐이크가 처리되지 않았음을 보여주는 것이기도 합니다.

> NLB에서 TLS 핸드쉐이크를 수행하도록 설정할 수도 있으며 IT 인프라 상 TLS 핸드쉐이크를 애플리케이션 서버에서 수행하는 것이 잘못된 구성은 아닙니다.

#### HTTP/3 그리고 QUIC
통신 프로토콜에 대해서 관심이 있는 분들은 QUIC 이라고하는 전송 프로토콜에 대해서 들어보신 적 있으실 겁니다. TCP가 아닌 오버헤드가 적은 UDP를 사용하는 프로토콜로 구글 웹 사이트에 대해 TLS 핸드쉐이크 과정에 의해 결정된 사항을 확인해보면 다음과 같이 TLS가 아닌 QUIC을 사용한 것으로 확인할 수 있습니다.

![](/images/posts/ssl-certificate/ssl-certificate-03.png)

QUIC은 TLS를 기본으로 사용하도록 되어있으며 TLS는 보안 프로토콜이기 때문에 HTTP가 아닌 전송 프로토콜과도 사용할 수 있다는 것을 보여주는 예 입니다. 구글 웹 사이트 뿐만 아니라 여러분이 라이브러리등 정적 컨텐츠를 받아오기 위해 사용하는 CDN 서버를 살펴보면 **h3-29**라고 하는 QUIC의 표준 이름을 확인할 수 있습니다.

아무튼 다시 TLS 버전에 대한 사항을 더 알아보도록 하겠습니다. 국내 개발자 커뮤니티 중 하나인 OKKY 사이트의 애플리케이션 서버에서 지원하는 TLS 버전을 확인해보기 위해 [Check TLS Version](https://gf.dev/tls-test)을 수행해본 결과입니다.

![](/images/posts/ssl-certificate/ssl-certificate-04.png)

TLS 1.3을 제외한 나머지 버전을 지원하는 것으로 리포트 되었습니다. 다시 말하지만 크롬 브라우저는 TLS 1.2 이상을 지원하기 때문에 애플리케이션 서버가 TLS 1.3을 지원하지 않더라도 아무런 문제가 없습니다. 사람들이 많이 사용하는 크롬 브라우저에서 TLS 1.2 지원하지않도록 발표하면 애플리케이션 서버에서 TLS 1.3을 지원하도록 변경하는 것은 불가피한 상황이긴 합니다. 물론, 회사에서 운영중인 애플리케이션 서버도 마찬가지인 상황입니다.

### 암호화 스위트
암호화 스위트(Cipher Suite)는 **키 교환**, **전자 서명**, **암호화** 그리고 **데이터 무결성**에 대한 알고리즘을 조합한 암호화 방식을 지칭합니다. 앞서 TLS 핸드쉐이크 과정에서 결정된 사항 중 **ECDHE_ECDSA** 그리고 **AES_128_GCM**이 암호화 스위트라고 할 수 있습니다.

```sh
# [프로토콜]_[키 교환 알고리즘]_[전자 서명 알고리즘]_WITH_[암호화 알고리즘]_[데이터 무결성]
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
```

암호화 스위트는 위와 같은 구조를 가지도록 조합된 문자열으로 표현하기 때문에 아래와 같이 다시 나열해보겠습니다.

- TLS : 프로토콜
- ECDHE : 타원 곡선 디피 헬만 키 교환
- ECDSA : 타원 곡선 디지털 서명
- AES_128_GCM : 128 비트 블록 갈루와/카운트 모드의 AES 암호화
- SHA256 : 256비트 해시 알고리즘

보안 전문가가 아니라면 ECDHE-ECDSA가 어떤 원리도 동작하는지까지는 알 필요는 없으며 어떻게 키 교환을 하고 어떤 방식으로 서명하며 어떻게 암호화하는지만 구분할 수 있으면 됩니다. 검색해보시더라도 보안 기술을 이해하기는 쉽지 않으실 겁니다. (우리의 시간은 소중하니까요...)

이러한 암호화 스위트는 [AWS의 ELB(Elastic Load Balancing)의 보안 정책](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/network/create-tls-listener.html)에서도 정책별 지원 여부를 확인할 수 있습니다. 

![ELB Security Policy](/images/posts/ssl-certificate/ssl-certificate-13.png)

## SSL 인증서
TLS 핸드쉐이크 과정에서 클라이언트가 애플리케이션 서버로부터 받는 SSL 인증서는 브라우저 해당 사이트를 신뢰할 수 있는지를 판단할 수 있는 중요한 사항입니다. 브라우저에서는 자체적으로 **신뢰할 수 있는 인증 기관(CA)** 에 대해 관리하거나 운영체제에 등록된 루트 인증 기관에 대한 정보를 활용해서 서버에서 제공하는 SSL 인증서가 신뢰할 수 있는 기관으로부터 발급된 것인지 확인하는 과정을 거치게 됩니다.

일반적으로 서버에서 제공받은 SSL 인증서는 루트 인증 기관(CA)에서 인증하는 **중간 인증 기관(ICA)** 으로부터 발급받은 인증서이며 이를 **체인 인증서**라고 합니다. [Sectigo](https://sectigo.com/)와 [DigiCert](https://www.digicert.com/kr/) 그리고 [GlobalSign](https://www.globalsign.com/en)은 많이 사용되어지는 신뢰할 수 있는 루트 인증 기관입니다. 

암호화 스위트 중 ECDSA와 같은 타원 곡선 디지털 서명으로 발급된 인증서를 **ECC 인증서**라고하며 일반적으로 많이 사용해왔던 RSA 기반의 인증서보다 트래픽이 많은 서비스에서 암복호화에 대한 부하를 줄이기 위해 사용하는 인증서입니다.

이 글에서는 타원 곡선형 서명 방식으로 발급하는 ECC 인증서를 만들어볼 예정입니다.

### 자체 서명 인증서
자체 서명 인증서는 신뢰할 수 있는 인증 기관으로부터 발급받지 않고 직접 만드는 인증서를 말합니다. 애플리케이션 개발 단계에서 자체 서명 인증서를 발급하여 사용하는 것은 도메인을 구입하고 인증 기관으로부터 인증서를 받기까지의 과정을 당장 수행하지 않아도 되는 좋은 방법입니다.

보유중인 도메인이 있다면 [Let's Encrypt](https://letsencrypt.org/)을 통해 무료로 SSL 인증서를 발급받을수도 있습니다. 저는 보유중인 도메인이 없기 때문에 OpenSSL 또는 자바의 Keystore 도구를 사용해서 자체 서명 인증서를 만들어볼 예정입니다.

이 글에서는 인증 기관에서 애플리케이션 서버에 대한 인증서를 발급할 때 서명해주는 것과 동일하게 자체 서명 CA 인증서를 만들고 이것으로 서명된 서버 인증서를 발급하는 과정을 보여줍니다. 이 과정을 통해 여러분은 발급받은 SSL 서버 인증서가 어떤 과정을 거쳐 발급되었는지를 이해할 수 있습니다.

#### 자체 서명 CA 인증서 발급
먼저, 로컬 호스트에서는 신뢰할 수 있다고 보장하는 CA 인증서를 발급합니다. 인증서는 [다양한 형식]((https://www.sslcert.co.kr/guides/kb/54))으로 만들어질 수 있으나 OpenSSL 도구를 사용하여 인증서를 만들면 PEM 형식을 가지게 됩니다. 만약, 여러분이 인증 기관으로부터 발급받는 인증서 형식이 다르더라도 다른 형식의 인증서로 변환할 수 있으니 걱정하지 않으셔도 됩니다. 예를 들어, 발급된 PEM 형식의 서버 인증서를 스프링 애플리케이션에서 사용하기 위해 KeyStore 형식의 인증서로 변환해야하는 경우를 말합니다.

OpenSSL으로 자체 서명 CA 인증서를 만들기 위해서는 개인키와 인증서 서명 요청(CSR)을 먼저 생성해야합니다. 앞서 언급했던 것 처럼 일반적으로 발급하는 RSA 기반의 개인키가 아닌 ECC 인증서를 발급하기 위한 **ECDSA 기반의 개인키**를 만들겠습니다.

```ps Windows Terminal
# ECDSA 기반의 개인키 생성
PS openssl ecparam -out ca.key -name prime256v1 -genkey

# 인증서 서명 요청(CSR) 생성
PS openssl req -new -sha256 -subj /C=KO/ST=None/L=None/O=None/CN=CA -key ca.key -out ca.csr
```

위 명령어 예시에서 개인키를 만들때 사용된 **prime256v1**은 타원 곡선형 서명 방식을 지칭하는 이름입니다. 명령어를 수행하고나서 개인키와 인증서 서명 요청 파일이 만들어졌으면 다음의 명령어를 수행해서 자체 서명 CA 인증서를 발급합니다.

```ps Windows Terminal
PS openssl x509 -req -sha256 -days 1095 -in ca.csr -signkey ca.key -out ca.crt
Signature ok
subject=C = KO, ST = None, L = None, O = None, CN = CA
Getting Private key
```

-days 옵션으로 인해 만들어진 자체 서명 CA 인증서는 3년(1095일)까지 유효하게 됩니다. 일반적으로 인증 기관의 인증서는 서버 인증서보다 긴 만료일자를 가지게 됩니다. 서버 인증서 뿐만 아니라 루트 인증 기관의 CA 인증서가 언제 만료되는지를 확인하는 것도 중요합니다.

#### 자체 서명 서버 인증서 발급
자체 서명한 CA 인증서가 준비되었으니 CA 인증서로 서명한 서버 인증서를 발급합니다. CA 인증서를 만들때와 동일하게 개인키와 인증서 서명 요청 파일을 생성합니다.

```ps Windows Terminal
PS openssl ecparam -out server.key -name prime256v1 -genkey
PS openssl req -new -sha256 -subj /C=KO/ST=None/L=None/O=None/CN=localhost -key server.key -out server.csr
```

자체 서명 서버 인증서를 만들때는 CA 옵션을 사용해서 서버 인증서가 CA 인증서에 의해 서명되도록 해야합니다. 

서버 인증서를 만들기에 앞서 주체 이름인 localhost 대신에 사용할 수 있는 식별 이름인 SAN(Subject Alternative Name)을 적용하기 위한 파일을 만듭니다. SAN을 적용해보는 이유는 하나의 인증서로 여러 도메인을 식별할 수 있음을 확인하기 위함입니다.

```ext san.ext
authorityKeyIdentifier=keyid,issuer
subjectAltName = @alt_names

[alt_names]
IP.1 = 127.0.0.1
DNS.1 = localhost
DNS.2 = mambo.kr
```

인증 기관에서 발급하는 SSL 인증서는 유효 기간을 1년으로 설정하므로 398일 동안 유효하도록 만듭니다.

```ps Windows Terminal
# 서버 인증서 발급
PS openssl x509 -req -sha256 -days 398 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -extfile san.ext

# 서버 인증서 조회
PS openssl x509 -in server.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            66:ab:bb:ed:19:f3:c7:37:9d:d6:5d:29:da:03:7d:b9:4f:53:7c:b7
        Signature Algorithm: ecdsa-with-SHA256
        Issuer: C = KO, ST = None, L = None, O = None, CN = CA
        Validity
            Not Before: Aug 27 11:27:54 2021 GMT
            Not After : Sep 29 11:27:54 2022 GMT
        Subject: C = KO, ST = None, L = None, O = None, CN = localhost
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub:
                    04:74:06:a3:39:91:2e:4b:cc:45:40:e8:b0:f8:a3:
                    96:69:91:66:ef:d3:b3:93:8d:e5:09:78:aa:a5:af:
                    67:9d:47:13:78:54:7e:d9:02:ba:e4:ca:aa:d4:9f:
                    8b:f3:be:d7:40:1e:f5:c4:8d:7a:23:5b:09:c3:57:
                    75:38:7e:4d:e6
                ASN1 OID: prime256v1
                NIST CURVE: P-256
        X509v3 extensions:
            X509v3 Authority Key Identifier:
                DirName:/C=KO/ST=None/L=None/O=None/CN=CA
                serial:5D:98:7B:BF:10:35:6B:9C:11:97:2C:AC:21:E3:28:C2:FF:AF:2D:3D

            X509v3 Subject Alternative Name:
                IP Address:127.0.0.1, DNS:localhost, DNS:mambo.kr
    Signature Algorithm: ecdsa-with-SHA256
         30:46:02:21:00:ce:5d:3a:68:e9:04:dc:a9:fd:e6:14:de:bb:
         11:5c:5a:a1:bf:b4:f9:1a:61:08:cd:da:47:d1:b4:68:80:81:
         d1:02:21:00:e7:a1:b4:cb:06:6d:ad:80:d3:89:09:c1:1e:ca:
         6e:c7:2e:14:fd:99:d9:df:44:14:cb:47:39:df:ea:5e:e0:1e
```

인증서 정보를 확인하는 명령어를 실행하여 CA 인증서로 서명되었고 SAN이 설정되어있는 것을 확인했으므로 자체 서명 인증서 발급이 완료되었다고 할 수 있습니다.

## 서버 인증서
앞서, 애플리케이션 서버에서 사용할 자체 서명된 SSL 인증서를 발급했습니다. 웹 서비스를 HTTPS로 운영하기 위해서는 SSL 인증서를 **애플리케이션 서버에 직접 등록**하거나 **Nginx와 같은 L7 로드밸런서에 SSL 인증서를 등록**해야합니다. 스프링 부트 애플리케이션을 만들어서 SSL 인증서를 등록해보고 Nginx 서버를 추가로 구성하여 애플리케이션 서버가 아닌 로드밸런서에서 TLS 핸드쉐이킹을 수행함을 검증해봅니다.

### JKS 형식의 인증서로 변환
스프링 부트 애플리케이션에서 HTTPS를 활성화하기 위해서는 KeyStore 형식의 SSL 인증서를 사용해야합니다. 우리는 OpenSSL을 사용해서 PEM 형식의 인증서를 만들었기 때문에 KeyStore 형식의 인증서로 변환해야합니다. PEM 형식의 인증서를 KeyStore 형식으로 변환하기 위해서는 다음의 과정을 거쳐야합니다.

1. PEM 인증서를 PFX 인증서로 변환
2. PFX 인증서를 JKS 인증서로 변환 

#### PEM 인증서를 PFX 인증서로
OpenSSL을 사용해서 다음의 명령어를 수행하면 PEM 형식의 인증서를 PKCS12 형식의 인증서로 변환할 수 있습니다. PKCS12 형식의 인증서로 변환할 때 입력한 비밀번호는 KeyStore 형식의 인증서로 변환할 때 인증용으로 사용됩니다.

```ps Windows Terminal
PS openssl pkcs12 -export -inkey server.key -in server.crt -out server.pfx
Enter Export Password: [비밀번호 입력:passwd]
Verifying - Enter Export Password: [비밀번호 입력:passwd]
```

#### PFX 인증서를 JKS 인증서로
자바의 Keytool 도구를 사용해서 PKCS12 형식의 인증서를 KeyStore 형식의 인증서로 변환할 수 있습니다.

```ps Windows Terminal
PS keytool -importkeystore -srckeystore server.pfx -srcstoretype pkcs12 -destkeystore server.jks -deststoretype pkcs12
키 저장소 server.pfx을(를) server.jks(으)로 임포트하는 중...
대상 키 저장소 비밀번호 입력: [비밀번호 입력:passwd]
새 비밀번호 다시 입력: [비밀번호 입력:passwd]
소스 키 저장소 비밀번호 입력: [PFX 비밀번호 입력:passwd]
1 별칭에 대한 항목이 성공적으로 임포트되었습니다.
임포트 명령 완료: 성공적으로 임포트된 항목은 1개, 실패하거나 취소된 항목은 0개입니다.
```

### 스프링 부트 애플리케이션
KeyStore 형식의 서버 인증서가 준비되었으니 스프링 부트 애플리케이션을 만든 후 HTTPS로 실행하기 위한 프로퍼티를 설정하고 애플리케이션을 구동합니다.

```properties application.properties
server.port=8080
server.ssl.enabled=true
server.ssl.protocol=TLS
server.ssl.enabled-protocols=TLSv1.2,TLSv1.3
server.ssl.key-store=classpath:cert/server.jks
server.ssl.key-store-password=passwd
server.ssl.key-store-type=pkcs12
```

![](/images/posts/ssl-certificate/ssl-certificate-06.png)

실행된 애플리케이션 서버는 자체 서명된 서버 인증서이기 때문에 발급자인 CA에 대한 정보를 브라우저가 확인할 수 없습니다. 따라서, 브라우저가 신뢰할 수 없는 사이트라고 알려주는 것은 당연한 부분으로 이 경고를 무시하고 접근할 수도 있지만 우리는 **자체 서명 CA 인증서를 보유하고 있으므로 브라우저가 신뢰할 수 있는 기관으로 등록**하겠습니다.

![](/images/posts/ssl-certificate/ssl-certificate-07.png)

**설정 > 개인정보 및 보안 > 보안 > 인증서 관리**로 들어가서 자체 서명된 CA 인증서를 루트 인증 기관으로 등록할 수 있습니다.

![](/images/posts/ssl-certificate/ssl-certificate-08.png)

루트 인증 기관 목록에 자체 서명 CA 인증서를 추가했으므로 다음과 같이 신뢰할 수 없던 애플리케이션 서버 인증서를 신뢰할 수 있게 됩니다. 

![127.0.0.1](/images/posts/ssl-certificate/ssl-certificate-09.png)
![mambo.kr](/images/posts/ssl-certificate/ssl-certificate-10.png)

로컬호스트 대신에 SAN으로 지정하였던 127.0.0.1과 mambo.kr에 대해서도 신뢰하였습니다. 만약, 따라해보고 계시는 분들 중에서 여전히 신뢰할 수 없다고 나오는 경우 브라우저를 종료하고 다시 실행해보시기 바랍니다.

이제 Nginx을 추가적으로 구성하여 애플리케이션 서버가 아닌 Nginx에서 서버 인증서를 등록하여 TLS 핸드쉐이크를 수행하는 지 확인해보겠습니다. 실행했던 애플리케이션 서버는 종료합니다.

### PEM 형식의 인증서로 변환
인증 기관 대행 업체에서 발급해준 인증서가 KeyStore 형식의 인증서라면 PEM 형식의 인증서로 변환해야합니다. 이미 우리는 PEM 형식의 서버 인증서가 있는 상태이지만 없는 상태라고 가정하고 KeyStore 형식의 인증서를 PEM 형식으로 변환해봅니다.

변환 과정은 다음과 같이 KeyStore 인증서로 변환할 때의 반대 과정을 거칩니다.

1. JKS 인증서를 PFX 인증서로 변환
2. PFX 인증서를 PEM 인증서로 변환

```ps Windows Terminal
# JKS 인증서를 PFX 인증서로 변환
PS keytool -importkeystore -srckeystore server.jks -destkeystore server.pfx -deststoretype pkcs12
키 저장소 server.jks을(를) server.pfx(으)로 임포트하는 중...
대상 키 저장소 비밀번호 입력: [비밀번호 입력:passwd]
새 비밀번호 다시 입력: [비밀번호 입력:passwd]
소스 키 저장소 비밀번호 입력: [JKS 비밀번호 입력:passwd]
1 별칭에 대한 항목이 성공적으로 임포트되었습니다.
임포트 명령 완료: 성공적으로 임포트된 항목은 1개, 실패하거나 취소된 항목은 0개입니다.

# PFX 인증서에서 PEM 형식의 인증서로 변환
PS openssl pkcs12 -in server.pfx -out server.crt -clcerts -nokeys
Enter Import Password: [PFX 비밀번호 입력:passwd]

# PFX 인증서에서 개인키 추출
PS openssl pkcs12 -in server.pfx -out server.key -nocerts
Enter Import Password: [PFX 비밀번호 입력:passwd]
Enter PEM pass phrase: [비밀번호 입력:passwd]
Verifying - Enter PEM pass phrase: [비밀번호 입력:passwd]
```

PFX 인증서를 PEM 형식으로 변환하고나서는 부가적인 헤더가 들어가있으므로 PEM 형식에 관련된 부분만 별도로 다시 저장합니다. 예를 들어, 개인키의 경우 \-\-\-\-\-BEGIN PRIVATE KEY\-\-\-\-\-으로 시작해서 \-\-\-\-\-END PRIVATE KEY\-\-\-\-\-으로 끝나는 부분을 말합니다.

### Nginx
Nginx와 애플리케이션 서버를 실행하는 환경은 도커 컴포즈로 실행하겠습니다. 먼저, 앞선 스프링 부트 애플리케이션을 실행가능한 JAR 파일로 패키징하여 준비합니다.

```sh Windows Terminal
gradle bootJar
> Task :compileJava UP-TO-DATE
> Task :processResources UP-TO-DATE
> Task :classes UP-TO-DATE
> Task :bootJarMainClassName
> Task :bootJar
# build/libs/demo-0.0.1-SNAPSHOT.jar
```

그리고 다음의 도커 컴포즈 문서를 작성하고 패키징된 애플리케이션과 서버 인증서 그리고 개인키 파일을 복사합니다.

```yaml docker-compose.yaml
version: '3.8'
services: 
  nginx:
    image: nginx
    ports: 
      - 80:80
      - 443:443
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./server.crt:/etc/nginx/server.crt
      - ./server.key:/etc/nginx/server.key
  app:
    image: adoptopenjdk/openjdk11
    command: 'java -jar /etc/app.jar'
    volumes:
      - ./demo-0.0.1-SNAPSHOT.jar:/etc/app.jar

```

도커 컴포즈가 참조하는 Nginx 설정 파일에 443 포트에 SSL을 활성화하고 SSL 인증서를 지정하도록 작성합니다.

```conf nginx.conf
worker_processes auto;

events {
    worker_connections  1024;
}

http {
    access_log      /var/log/nginx/access.log;
    error_log       /var/log/nginx/error.log;

    include         /etc/nginx/mime.types;

    server {
        listen              443 ssl;
        server_name         localhost 127.0.0.1 mambo.kr;
        ssl_certificate     /etc/nginx/server.crt;
        ssl_certificate_key /etc/nginx/server.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        location / {
            proxy_pass         http://app:8080;
            proxy_redirect     off;
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    keepalive_timeout  60;
    include /etc/nginx/conf.d/*.conf;
}
```

도커 컴포즈 명령어로 Nginx와 함께 애플리케이션을 구동합니다.

```ps Windows Terminal
docker-compose up -d
```

정상적으로 실행되었다면 Nginx의 443 포트를 통해 애플리케이션 서버와의 통신을 수행할 수 있습니다. 그리고 다음 처럼 TLS 핸드쉐이크 과정이 Nginx에 의해 제대로 수행되었음을 확인할 수 있습니다.

![](/images/posts/ssl-certificate/ssl-certificate-11.png)

이상으로 SSL 인증서에 대한 정리를 마치도록 하겠습니다. 

인프라 구조상 SSL 인증서를 어디에 등록하고 TLS 핸드쉐이킹 과정을 수행하는지도 중요한 부분일 수 있습니다. 운영중인 웹 서비스를 분산 애플리케이션으로 로드밸런싱을 수행하고 있다면 로드밸런싱을 수행하는 Nginx 또는 NLB에서 TLS 핸드쉐이킹을 수행할 수 있도록 SSL 인증서를 등록하는 것이 좋을 수 있습니다. 이렇게 구성하면 애플리케이션 서버에서 지원하지 않는 요청에 대해서 애플리케이션 서버까지 도달하지 않도록 하여 서버 부하를 방지할 수 있습니다. 물론, 로드밸런서에서 TLS 핸드쉐이크를 수행하므로 상대적으로 로드밸런서 서버의 부하가 커지는 것은 감안해야합니다.

감사합니다.

## 참고
- [Network Load Balancer를 위한 TLS 리스너](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/network/create-tls-listener.html)
- [X509 인증서 생성 및 서명](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/configuring-https-ssl.html)
- [Converting a Java Keystore Into PEM Format](https://www.baeldung.com/java-keystore-convert-to-pem-format)
- [Convert .pem to .crt and .key](https://stackoverflow.com/questions/13732826/convert-pem-to-crt-and-key)
- [Convert Certificate Format SSL 인증서 변환 가이드](https://www.sslcert.co.kr/guides/SSL-Certificate-Convert-Format)
- [localhost를 위한 인증서](https://letsencrypt.org/ko/docs/certificates-for-localhost/)