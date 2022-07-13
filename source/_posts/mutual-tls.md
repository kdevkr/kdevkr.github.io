---
title: Mutual TLS
date: 2022-07-13
tags:
- X.509
- mTLS
- X-SSL-CERT
---

## Mutual Authentication
**mTLS(Mutual TLS)** 는 TLS 프로토콜을 사용하면서 서버와 클라이언트 간 상호 인증을 수행하는 방법을 말한다. 일반적으로 대부분의 웹 애플리케이션에서는 HTTPS 프로토콜을 사용하여 연결을 할 때 브라우저인 클라이언트에서 서버 또는 웹 서버가 제공하는 SSL 인증서를 검증하여 올바른 곳으로 요청하는 지 검증하도록 요구합니다. 그러나, [OpenADR](https://www.openadr.org/)와 같은 일부 프로토콜에서는 서버에서도 클라이언트의 신원을 확인하여 더 확실한 보안성을 요구하기도 합니다.

### X.509 Client Certificate
PEM 형식으로 되어있는 X.509 인증서와 개인키를 사용하여 HTTP 요청 시 클라이언트 인증서로 전달하는 방법에 대해서 알아보겠습니다.


#### cURL
가장 일반적으로 사용되는 HTTP 클라이언트 통신 도구인 [cURL](https://curl.se/)에서 클라이언트 인증서를 포함하기 위해서는 [how to curl an endpoint protected by mutual tls (mtls)](https://downey.io/notes/dev/curl-using-mutual-tls/)를 참고하여 다음과 같이 수행할 수 있음을 확인하였습니다.


```sh
curl -v --tlsv1.2 --tls-max 1.3 --cert ./cert.pem --key ./privkey.pem https://uri
```

#### Java
자바 애플리케이션에서 클라이언트 인증서를 포함하여 요청하기 위해서는 KeyStore가 필요로 합니다. JKS 또는 PKCS12 형식의 파일이라면 쉽게 KeyStore로 불러올 수 있지만, 일반적으로 X.509 인증서 형식으로 사용되는 PEM 파일이라면 KeyStore로 변경하는 과정이 필요로 합니다. Base64로 인코딩된 PEM 형식을 변환할 수도 있지만 [BouncyCastle API](https://www.bouncycastle.org/java.html)와 같은 라이브러리를 사용하는게 더 간단합니다. 다음은 PEM 형식의 인증서와 개인키를 변환하는 두가지 방법에 대한 예시입니다.

```java
class MutualTlsTest {
    private final Logger log = LoggerFactory.getLogger(MutualTlsTest.class);
    private final ClassLoader classLoader = this.getClass().getClassLoader();

    @DisplayName("Convert PEM to KeyStore")
    @Test
    void testConvertPemToKeyStore() {
        Assertions.assertDoesNotThrow(() -> {
            String certPemText = IOUtils.toString(classLoader.getResourceAsStream("cert.pem"), StandardCharsets.UTF_8);
            String privateKeyText = IOUtils.toString(classLoader.getResourceAsStream("privkey.pem"), StandardCharsets.UTF_8);

            String escapeCertPemText = certPemText.replace("-----BEGIN CERTIFICATE-----", "").replaceAll(System.lineSeparator(), "").replace("-----END CERTIFICATE-----", "");
            String escapePrivateKeyText = privateKeyText.replace("-----BEGIN PRIVATE KEY-----", "").replaceAll(System.lineSeparator(), "").replace("-----END PRIVATE KEY-----", "");

            final byte[] certPem = Base64.decodeBase64(escapeCertPemText);
            final byte[] privateKey = Base64.decodeBase64(escapePrivateKeyText);

            final byte[] certPemUsingBC = new PemReader(new StringReader(certPemText)).readPemObject().getContent();
            final byte[] privateKeyUsingBC = new PemReader(new StringReader(privateKeyText)).readPemObject().getContent();

            Assertions.assertArrayEquals(certPem, certPemUsingBC);
            Assertions.assertArrayEquals(privateKey, privateKeyUsingBC);
        });
    }

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

            HttpPost httpPost = new HttpPost("https://uri");
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
Go 언어는 실무에서 사용하지는 않지만 개인적으로 학습중이므로 [A step by step guide to mTLS in Go](https://venilnoronha.io/a-step-by-step-guide-to-mtls-in-go)를 참고하여 다음과 같이 클라이언트 인증서를 전달할 수 있음을 확인하였습니다.

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
	r, err := client.Post("https://uri", "application/xml", strings.NewReader(string(payload)))
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

### X-SSL-CERT
일반적으로 Nginx와 같은 웹 서버를 통해서 리버스 프록시를 구성하는 경우 TLS 핸드쉐이크를 웹 서버에서 수행하도록 TLS Termination Proxy가 되도록 합니다. TLS 핸드쉐이크를 수행하는 과정에서 클라이언트가 전달한 인증서를 애플리케이션 서버까지 전달해야하므로 X-SSL-CERT와 같은 헤더에 클라이언트 인증서를 제공해야합니다.

```conf
server {
    ssl_verify_client optional_no_ca;

    location / {
        proxy_set_header X-SSL-CERT $ssl_client_escaped_cert;
    }
}
```

> 일반적으로 mTLS를 수행할 때 전달되는 클라이언트 인증서도 신뢰할 수 있는 인증 기관에서 발급된 것인지를 판단합니다. 그러나, 현재 조직의 시스템처럼 사설 루트 인증 기관을 만들고서 클라이언트 인증서를 전달하고 요청받을 수 있습니다. 이와 같은 상호 인증 구성이라면 ssl_verify_client 옵션을 고려하셔야 합니다.


## 참고  
- [What protocols support mutual authentication?](https://www.cloudflare.com/ko-kr/learning/access-management/what-is-mutual-authentication/)
- [What is mutual TLS (mTLS)?](https://www.cloudflare.com/ko-kr/learning/access-management/what-is-mutual-tls/)
- [how to curl an endpoint protected by mutual tls (mtls)](https://downey.io/notes/dev/curl-using-mutual-tls/)
- [Nginx SSL Client Cert](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#var_ssl_client_escaped_cert)