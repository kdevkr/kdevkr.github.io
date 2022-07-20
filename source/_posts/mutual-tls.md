---
title: Mutual TLS
date: 2022-07-13
tags:
- X.509
- mTLS
- X-SSL-CERT
---

> 본 글은 에너지 분야에서 수요 반응(DR) 이벤트를 송수신하기 위해서 사용하는 [OpenADR 프로토콜](https://www.openadr.org/)에서 VTN과 VEN이 서로 상호 인증(Mutual Authentication)을 수행하는 구조를 이해하기 위해 정리한 것입니다. 서버와 클라이언트 간 상호 인증을 수행하는 방법 중에서 OpenADR 프로토콜에서 HTTP를 이용한다면 TLS 상호 인증을 수행합니다.

## Mutual Authentication
_Mutual authentication or two-way authentication (not to be confused with two-factor authentication) refers to two parties authenticating each other at the same time in an authentication protocol. It is a default mode of authentication in some protocols (IKE, SSH) and optional in others (TLS)._

위키피디아에서 설명하는 것처럼 [AWS IoT](https://docs.aws.amazon.com/ko_kr/iot/latest/developerguide/client-authentication.html)와 같은 디바이스의 신원을 검증할 수 있도록 IoT 시스템에서는 디바이스를 위한 X.509 클라이언트 인증서를 제공하는 것을 확인할 수 있습니다. 일반적으로 HTTPS 프로토콜에서 TLS 핸드쉐이크 과정에서는 서버의 공개키가 포함된 X.509 인증서를 클라이언트에게 전달하여 서버의 신원을 검증하고 서로 데이터를 안전하게 전송하기 위해서 사용할 대칭키를 교환하기 위한 일련의 작업을 수행합니다. 따라서, HTTPS 프로토콜에서 상호 인증을 구성하기 위해서는 서버가 자신의 인증서를 전달하는 것과 별개로 클라이언트에서도 서버가 신뢰할 수 있는 것으로부터 서명된 클라이언트 인증서를 전달해야만 합니다.

### X.509 Client Certificate
일반적으로 X.509 클라이언트 인증서는 서버 시스템에서 신뢰할 수 있는 기관으로부터 클라이언트에게 발급해준 공개키 인증서를 말합니다. 그러나, 시스템이 자체적으로 서명하여 만들어지는 자체 서명 인증서와 개인키를 발급하여 클라이언트에게 제공할 수도 있습니다. 신뢰할 수 있는 기관들로부터 발급된 것이 아니므로 서버 시스템에서는 인프라 구성에 따라서 자체 서명된 CA 인증서를 별도로 제공해야할 수 있습니다.

#### cURL
리눅스 시스템에서 주로 사용되는 HTTP 클라이언트 통신 도구인 [cURL](https://curl.se/)에서 클라이언트 인증서를 포함하여 요청하는 방법은 [how to curl an endpoint protected by mutual tls (mtls)](https://downey.io/notes/dev/curl-using-mutual-tls/)에서 확인할 수 있습니다.

```sh
curl -v --tlsv1.2 --tls-max 1.3 --cert ./cert.pem --key ./privkey.pem https://uri/OpenADR-Endpoint
```

#### Java
자바 애플리케이션에서는 KeyStore라는 별도의 키 저장소를 사용하므로 HTTP 통신 요청 시 클라이언트 인증서를 포함하기 위한 코드가 장황해보일 수 있습니다. 일반적으로 X.509 클라이언트 인증서는 PEM 형식으로 교환되므로 KeyStore로 변환하는 과정이 필요로 합니다. 다음은 [BouncyCastle API](https://www.bouncycastle.org/java.html) 라이브러리를 사용하여 X.509 인증서와 개인키를 불러와서 HTTP 요청 시 포함하는 코드의 예시를 보여줍니다.

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

            HttpPost httpPost = new HttpPost("https://uri/OpenADR-Endpoint");
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
실무에서 사용하고 있지는 않지만 개인적으로 학습중인 Go 언어에서 클라이언트 인증서를 포함하는 방법은 [A step by step guide to mTLS in Go](https://venilnoronha.io/a-step-by-step-guide-to-mtls-in-go)에 잘 설명되어있어 다음과 같이 간단하게 작성할 수 있었습니다.

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
	r, err := client.Post("https://uri/OpenADR-Endpoint", "application/xml", strings.NewReader(string(payload)))
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
요즘의 인프라 시스템은 애플리케이션 서버를 감추고 요청 트래픽에 대해서 전처리하고 넘겨주는 리버스 프록시 구성하는 경우가 많습니다. 일반적으로 리버스 프록시 구성을 위해서 Nginx와 같은 웹서버를 사용할 것입니다. 이러한 인프라 구성에서는 클라이언트 요청에 대한 SSL 오프로드를 수행하는 곳에서 클라이언트가 전달한 클라이언트 인증서를 별도의 프록시 헤더에 넘겨주어야합니다.

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