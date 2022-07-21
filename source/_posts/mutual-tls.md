---
title: Mutual TLS
date: 2022-07-13
tags:
- X.509
- mTLS
- X-SSL-CERT
---

> 본 글은 에너지 분야에서 수요 반응(DR) 이벤트를 송수신하기 위해서 사용하는 [OpenADR 프로토콜](https://www.openadr.org/)에서 VTN과 VEN이 서로 상호 인증(Mutual Authentication)을 수행하는 구조를 이해하기 위해 정리한 것입니다.

## Mutual Authentication
_Client certificates must be used for HTTP client authentication. The entity initiating the request(the client) must have an X.509 certificate that is validated by the server during the TLS handshake. If no client certificate is supplied, or if the certificate is not valid (e.g., it is not signed by a trusted CA, or it is expired) the server must terminate the connection during the TLS handshake._

OpenADR 프로토콜에서 VTN 시스템과 VEN 디바이스 간 통신을 위해서는 HTTP 또는 XMPP를 이용해야합니다. HTTP 클라이언트 통신을 위해서는 VTN과 VEN은 서로를 신뢰할 수 있는 X.509 공개키 인증서를 제공해야합니다. 클라이언트 요청에 서버가 신뢰할 수 있는 기관으로부터 서명된 X.509 인증서가 포함되지 않으면 서버 시스템에서는 TLS 핸드쉐이크 과정에서 연결을 해지할 수 있습니다. 

### X.509 Client Certificate
OpenADR 프로토콜에서의 보안은 공개키 기반 인프라(PKI)의 X.509 인증서로 수행하며 더 높은 보안 레벨을 요구하는 시스템을 구성하고 싶다면 XML 페이로드에 대한 서명을 지원할 수 있습니다. 2048 비트 이상의 RSA 또는 256 비트 이상의 ECC 키 기반의 공개키 인증서를 사용할 수 있습니다. 일반적으로 VEN은 임베디드 디바이스이므로 RSA 보다는 ECC 키 기반의 인증서를 사용하는 것이 더 효율적일 수 있습니다. OpenADR 프로토콜에서 TLS 핸드쉐이크 과정에서 최소한 TLS 1.2 버전과 함께 그에 상응하는 암호화 스위트를 사용해야합니다.

- Transport Layer Security: TLS 1.2+
- Cipher Suites: TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256, TLS_RSA_WITH_AES_128_CBC_SHA256

#### cURL
리눅스 시스템에서 주로 사용되는 HTTP 클라이언트 통신 도구인 [cURL](https://curl.se/)를 사용해서 EiRegisterParty 서비스 엔드포인트에 대해 요청하면 VTN 과의 상호 TLS 핸드쉐이크 과정을 정상적으로 수행할 수 있는지 검증할 수 있습니다. [how to curl an endpoint protected by mutual tls (mtls)](https://downey.io/notes/dev/curl-using-mutual-tls/)에서는 cURL로 클라이언트 인증서를 포함하는 방법을 소개하고 있어 다음과 같이 명령어를 실행하면 됩니다.

```sh
curl -v --tlsv1.2 --tls-max 1.3 --cert ./cert.pem --key ./privkey.pem https://Host/OpenADR2/Simple/2.0b/EiRegisterParty
```

#### Java
웹 애플리케이션 서버 뿐만 아니라 VEN 디바이스를 구현하는 가장 일반적인 방법은 자바 언어로 구현하는 것입니다. 자바 애플리케이션에서는 KeyStore라는 별도의 키 저장소 클래스를 제공하므로 HTTP 클라이언트 요청 시 X.509 클라이언트 인증서를 포함시키기 위해서는 PKI 및 PKCS 표준에 대한 일련의 클래스들을 알아야합니다. X.509 클라이언트 인증서는 PEM 형식으로 교환되므로 KeyStore로 변환하는 과정이 필요할 수 있습니다. 다음은 [BouncyCastle API](https://www.bouncycastle.org/java.html) 자바 라이브러리를 통해서 X.509 인증서와 개인키를 불러와서 HTTP 클라이언트 요청을 시도하는 코드를 보여줍니다.

```java
class MutualTlsTest {
    private final Logger log = LoggerFactory.getLogger(MutualTlsTest.class);
    private final ClassLoader classLoader = this.getClass().getClassLoader();

    @DisplayName("Test mutual authentication")
    @Test
    void testMutualAuthentication() {
        Assertions.assertDoesNotThrow(() -> {
            System.setProperty("javax.net.debug", "ssl");

            String certPemText = IOUtils.toString(classLoader.getResourceAsStream("cert.pem"), StandardCharsets.UTF_8);
            String privateKeyText = IOUtils.toString(classLoader.getResourceAsStream("privkey.pem"), StandardCharsets.UTF_8);

            final byte[] certPem = new PemReader(new StringReader(certPemText)).readPemObject().getContent();
            final byte[] privateKey = new PemReader(new StringReader(privateKeyText)).readPemObject().getContent();

            KeyStore clientKeyStore = KeyStore.getInstance("jks");
            clientKeyStore.load(null, null);

            final Collection<? extends Certificate> chain = CertificateFactory.getInstance("X.509").generateCertificates(new ByteArrayInputStream(certPem));
            final char[] password = new SecureRandom().toString().toCharArray();
            final Key key = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(privateKey));
            clientKeyStore.setKeyEntry("client", key, password, chain.toArray(new Certificate[0]));

            KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance("SunX509");
            keyManagerFactory.init(clientKeyStore, password);

            // NOTE: If server generate client certificate from self-signed root CA, you can use trustKeyStore.
            KeyStore trustKeyStore = KeyStore.getInstance("jks");
            trustKeyStore.load(classLoader.getResourceAsStream("ca.jks"), "password".toCharArray());
            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            trustManagerFactory.init(trustKeyStore);

            SSLContext sslcontext = SSLContexts.custom().loadTrustMaterial(null, new TrustAllStrategy()).build();
            sslcontext.init(keyManagerFactory.getKeyManagers(), trustManagerFactory.getTrustManagers(), null);

            String[] tlsVersions = new String[]{"TLSv1.2","TLSv1.3"};
            String[] cipherSuites = SSLContext.getDefault().getDefaultSSLParameters().getCipherSuites();
            SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(sslcontext, tlsVersions, cipherSuites, new NoopHostnameVerifier());

            CloseableHttpClient client = HttpClientBuilder.create().setSSLSocketFactory(sslSocketFactory).build();

            HttpPost httpPost = new HttpPost("https://Host/OpenADR2/Simple/2.0b/EiRegisterParty");
            httpPost.addHeader("Content-Type", "application/xml; charset=UTF-8");

            String payload = IOUtils.toString(classLoader.getResourceAsStream("payload.xml"), StandardCharsets.UTF_8);
            httpPost.setEntity(new StringEntity(payload));

            CloseableHttpResponse httpResponse = client.execute(httpPost);
            String response = EntityUtils.toString(httpResponse.getEntity(), StandardCharsets.UTF_8);
            Assertions.assertNotNull(response);
            Assertions.assertTrue(response.startsWith("<?xml"));
        });
    }
}
```

#### Go
개인적으로 학습중인 Go 언어에서 HTTP 클라이언트 요청과 함께 X.509 클라이언트 인증서를 포함시키는 방법을 찾아보았습니다. [A step by step guide to mTLS in Go](https://venilnoronha.io/a-step-by-step-guide-to-mtls-in-go)에 잘 설명되어있으므로 다음과 같이 간단하게 테스트해볼 수 있습니다.

```go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
)

func main() {
	cert, err := tls.LoadX509KeyPair("cert.pem", "privkey.pem")
	if err != nil {
		log.Fatal(err)
	}

	caCert, err := ioutil.ReadFile("ca.pem")
	if err != nil {
		log.Fatal(err)
	}
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				ClientAuth:   tls.RequireAndVerifyClientCert,
				ClientCAs:    caCertPool,
				Certificates: []tls.Certificate{cert},
				MinVersion:   tls.VersionTLS12,
			},
		},
	}

	payloadXml, err := os.Open("payload.xml")
	if err != nil {
		log.Fatal(err)
	}
	defer payloadXml.Close()

	payload, _ := ioutil.ReadAll(payloadXml)
	r, err := client.Post("https://Host/OpenADR2/Simple/2.0b/EiRegisterParty", "application/xml", strings.NewReader(string(payload)))
	if err != nil {
		log.Fatal(err)
	}

	defer r.Body.Close()
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("%s\n", body)
}
``` 

### X.509 Client Certificate Proxy
오늘날의 인프라 시스템은 애플리케이션 서버 정보를 감추고 클라이언트 요청에 대해 전처리 동작을 수행하고 넘겨주는 리버스 프록시를 구성하는 것이 일반적입니다. 리버스 프록시는 Nginx와 같은 웹 서버 또는 로드밸런서에서 지원하며 이러한 리버스 프록시를 수행하는 인프라 구성에서는 클라이언트 요청에 대한 TLS 핸드쉐이크 과정에서 전달된 클라이언트 인증서를 별도의 프록시 헤더에 포함시켜 넘겨주어야합니다.

#### X-SSL-CERT
일반적으로 클라이언트 인증서에 대한 프록시 헤더의 표준은 없으므로 X-SSL-CERT와 같이 애플리케이션 서버에서 읽을 수 있는 헤더를 정하여 클라이언트 인증서를 포함시켜 전달하도록 구성하면 됩니다. 다음은 Nginx에서의 리버스 프록시 구성 시 X-SSL-CERT 헤더에 클라이언트 인증서를 포함시키는 예시입니다.

```conf
server {
    ssl_verify_client optional_no_ca;

    location / {
        proxy_set_header X-SSL-CERT $ssl_client_escaped_cert;
    }
}
```

> 일반적으로 mTLS를 수행할 때 전달되는 클라이언트 인증서도 신뢰할 수 있는 인증 기관에서 발급된 것인지를 판단합니다. 시스템 자체적으로 서명한 클라이언트 인증서는 신뢰할 수 없으므로 클라이언트 인증서의 검증은 애플리케이션 서버로 위임할 수 있습니다.

#### Webpack Certificate Proxy
일반적으로 프론트엔드 개발을 위해서 사용하는 Webpack에서는 자체적으로 프록시 구성을 지원하는 [webpack-dev-server](https://github.com/webpack/webpack-dev-server)를 제공합니다. 이는 리버스 프록시 구성과 동일하므로 모든 요청에 대해서 Webpack 프록시 서버를 경유하도록 한다면 다음과 같이 클라이언트 인증서를 포함할 수 있도록 설정해야합니다.

```js
{
    devServer: {
        server: {
            type: 'spdy', // https
            options: {
                cert: fs.readFileSync('cert.pem'),
                key: fs.readFileSync('privkey.pem'),
                requestCert: true,
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            }
        },
        proxy: {
            '/': {
                target: 'http://127.0.0.1:5000',
                secure: true,
                xfwd: true,
                changeOrigin: true,
                rejectUnauthorized: false,
                onProxyReq(proxyReq, req, res) {
                    const cert = req.socket.getPeerCertificate();
                    if (cert && cert.raw) {
                        const pem = '-----BEGIN CERTIFICATE-----' + cert.raw.toString('base64') + '-----END CERTIFICATE-----';
                        proxyReq.setHeader('X-SSL-CERT', pem)
                    }
                }
            }
        }
    }
}
```

> requestCert 옵션을 켜야 onProxyReq 함수내에서 클라이언트 인증서를 가져와서 전달할 수 있습니다.

## 참고  
- [What protocols support mutual authentication?](https://www.cloudflare.com/ko-kr/learning/access-management/what-is-mutual-authentication/)
- [What is mutual TLS (mTLS)?](https://www.cloudflare.com/ko-kr/learning/access-management/what-is-mutual-tls/)
- [how to curl an endpoint protected by mutual tls (mtls)](https://downey.io/notes/dev/curl-using-mutual-tls/)
- [Nginx SSL Client Cert](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#var_ssl_client_escaped_cert)
- [Webpack DevServer.server](https://webpack.js.org/configuration/dev-server/#devserverserver)