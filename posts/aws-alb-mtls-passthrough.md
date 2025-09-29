---
title: AWS ALB 에서 mTLS를 지원하지 않았다고?!
date: 2024-01-20T17:00+0900
tags:
- ALB
- Mutual TLS
- X-Amzn-Mtls-Clientcert
---

#### OpenADR 요청 시 451 오류가 발생합니다 💥

OpenADR 프로토콜에서 NOT_ALLOWED(451)은 요청이 올바르지 않을때 응답되는 메시지이다. 처음에는 OpenADR 클라이언트 요청 시 전달한 인증서가 올바르지 않은 것을 체크했으나 테스트 환경에서 확인해보니 인증서가 서버까지 전달되지 않음을 확인할 수 있었다. 해당 테스트 환경은 그동안 조직에서 구성한 인프라 방식이 아닌 일본 고객 환경을 최대한 모방해서 만든 신규 환경에 해당된다. 현재 조직에서 제공하는 솔루션은 아마존 웹 서비스에서 인프라를 구성하는 경우 Elastic Beanstalk 와 (ELB 중 L4에 해당하는) NLB 로 구성된다.

> 로드밸런서를 ALB로 구성하지 않는 이유는 빠른 트래픽 전달과 에너지 관련 시스템 특성 상 외부에서 고정되어야하는 아이피가 필요하기 때문이다.

#### AWS ALB 는 mTLS를 지원해요 🌼

2023년 12월에 [Application Load Balancer 상호 인증 기능](https://aws.amazon.com/ko/blogs/korea/mutual-authentication-for-application-load-balancer-to-reliably-verify-certificate-based-client-identities/)을 지원하게 되었고 아래와 같이 [Application Load Balancer용 HTTPS 리스너 생성](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/create-https-listener.html)문서에는 그동안 ALB 에서 mTLS 적용을 할 수 없다는 정보가 남아있는 걸 확인할 수 있다. 고객 환경과 동일한 인프라를 구성하면서도 ALB 에서 mTLS를 지원하지 않는다는 부분에 제약이 있다는 것을 알아채지 못했다.

![](/images/posts/aws-alb-mtls-passthrough/03.png)

##### 원래는 지원하지 않았다는걸 알 수 있는 스택오버플로우 답변 링크

- [https://stackoverflow.com/a/41596778](https://stackoverflow.com/a/41596778)
- [https://stackoverflow.com/a/42027781](https://stackoverflow.com/a/42027781)

#### mTLS 패스스루 옵션

> 상호 인증 옵션은 두 가지가 있습니다. **패스스루** 옵션을 선택하면 HTTP 헤더를 사용하여 클라이언트로부터 받은 모든 클라이언트 인증서 체인을 백엔드 애플리케이션으로 보냅니다. mTLS가 활성화된 Application Load Balancer는 핸드셰이크에서 클라이언트 인증서를 가져오고, TLS 연결을 설정한 다음, HTTPS 헤더에 있는 모든 항목을 대상 애플리케이션으로 보냅니다. 애플리케이션은 클라이언트를 인증하기 위해 클라이언트 인증서 체인을 확인해야 합니다.

위 문장으로만 해석하면 ALB 에서 패스스루 옵션을 적용한 뒤 백엔드 애플리케이션까지 클라이언트 인증서가 도달해야하지만 패스스루 옵션을 활성화하여도 해당 증상은 동일하게 발생했다. 최근 갱신된 페이지라 한국어로 번역이 되지 않은 [Mutual authentication with TLS in Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/mutual-authentication.html#mtls-http-headers)를 참고하면 `X-Amzn-Mtls-Clientcert` 헤더의 URL-encoded PEM 형태의 값으로 로드밸런서의 대상으로 전달되는 것을 확인할 수 있었다.

![](/images/posts/aws-alb-mtls-passthrough/01.png)
![](/images/posts/aws-alb-mtls-passthrough/02.png)

#### URL-encoded PEM with `+=/` as safe characters 로 인한 오류 ⚡️

원래는 NLB를 사용하더라도 AWS Elastic Beanstalk 환경의 Nginx에 전달되는 인증서를 백엔드 애플리케이션에 전달하기 위해서 [$ssl_client_escaped_cert](https://nginx.org/en/docs/http/ngx_http_ssl_module.html?#var_ssl_client_escaped_cert) 변수를 `X-SSL-CERT` 헤더에 포함하여 전달하면 헤더의 값을 추출하여 인증서로 변환하여 사용하도록 조치되어 있었기에 `X-Amzn-Mtls-Clientcert` 헤더로 전달되는 인증서 정보를 그대로 `X-SSL-CERT` 헤더에 전달하는 조치로 해결하려 했으나 오류가 발생했다. 알고보니 일반적인 URL 인코딩이 아니라 +=/ 와 같은 일부 문자는 인코딩에서 제외되었기 때문에 코드에서 사용하고 있던 `URLDecoder`로 디코딩하는 경우 올바르지 않은 인증서가 되어버리는 상황이 되었다.

> 위와 같은 상황으로 애플리케이션 코드 수정없이는 조치가 불가능하기 때문에 X-SSL-CERT 헤더 이외에 X-Amzn-Mtls-Clientcert 가 있다면 인증서로 변환하도록 하는 코드를 추가했습니다. 또한, 긴급한 상황은 아니었기에 예정된 릴리즈에 포함해서 배포하기로 했습니다.

#### Tip. 클라이언트 또는 로드밸런서에서 전달한 요청 헤더의 값을 Nginx에서 다른 헤더로 바꾸어서 전달하는 방법

Nginx 설정에서 X-Amzn-Mtls-Clientcert 헤더의 값을 X-SSL-CERT 으로 전달하는 것은 아래와 같이 할 수 있다.

```txt
server {
    underscores_in_headers on;
  
    location / {
        proxy_set_header X-SSL-CERT $http_x_amzn_mtls_clientcert;
    }
}
```

> 클라이언트 또는 로드밸런서에서 전달한 커스텀 헤더를 Nginx 에서 다시 설정하여 포함시키는 방법을 찾고 있는 분에게 도움이 되길 바랍니다.

#### 관련 링크

- [Mutual authentication with TLS in Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/mutual-authentication.html)
- [Application Load Balancer 상호 인증 기능 – 인증서 기반 클라이언트 ID 인증 가능](https://aws.amazon.com/ko/blogs/korea/mutual-authentication-for-application-load-balancer-to-reliably-verify-certificate-based-client-identities/)
