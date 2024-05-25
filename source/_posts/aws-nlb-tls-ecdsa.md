---
title: AWS NLB ECDSA TLS 오프로드
date: 2024-05-25T23:00+0900
tags:
- AWS NLB
- ECDSA
---

#### AWS 인증서 관련 히스토리

- [AWS Certificate Manager, 가져온 ECDSA 및 RSA 인증서의 확장된 사용 제공](https://aws.amazon.com/ko/about-aws/whats-new/2021/07/aws-certificate-manager-provides-expanded-usage-imported-ecdsa-rsa-certificates/)
- [AWS Certificate Manager, 이제 Elliptic Curve Digital Signature Algorithm TLS 인증서 지원](https://aws.amazon.com/ko/about-aws/whats-new/2022/11/aws-certificate-manager-elliptic-curve-digital-signature-algorithm-tls-certificates/)
- [Network Load Balancer, 이제 AWS Certificate Manager를 통한 RSA 3072-비트, ECDSA 256/384/521-비트 인증서 지원](https://aws.amazon.com/ko/about-aws/whats-new/2024/01/network-load-balancer-rsa-3072-bit-ecdsa-256-384-521-bit-certificates/)

위 기록처럼 2021년 7월 부터 AWS Certificate Manager에서 외부에서 발급된 ECDSA 인증서를 가져와서 등록할 수 있게 지원하였고 2022년 11월 부터는 ACM 자체적으로 ECDSA 인증서 발급을 지원한다. 그리고 시간이 흘러 2024년 1월부터는 [Network Load Balancer 에서도 ECDSA 인증서 등록을 지원](https://aws.amazon.com/ko/about-aws/whats-new/2024/01/network-load-balancer-rsa-3072-bit-ecdsa-256-384-521-bit-certificates/)한다.

![](/images/posts/aws-nlb-tls-ecdsa/01.png)

> 위 화면은 ACM 외부에서 발급된 ECDSA 인증서를 가져온 예시를 보여줍니다.

#### Network Load Balancer TLS 리스너 구성

그동안 ELB 에서 ECDSA 인증서로 TLS 오프로드를 처리하기 위해서는 오직 ALB(Application Load Balancer)를 구성해야했다. 이제는 `NLB(Network Load Balancer)`로 구성하고 [TLS 리스너](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/network/create-tls-listener.html)에서 ACM에 추가되어있는 `ECDSA 인증서`를 선택하여 구성할 수 있다.

![](/images/posts/aws-nlb-tls-ecdsa/02.png)

> 하지만, NLB가 TLS 리스너를 사용하는 경우 mTLS는 지원하지 못하는 구성이 되는 것은 일부 시스템에서 중요한 부분일 수 있습니다.

#### 대상 그룹 - 프록시 프로토콜 v2

NLB 는 ALB와는 다르게 L4 레벨로 동작하므로 HTTP 트래픽을 HTTPS로 리다이렉트하는 것을 지원하지 못한다. ChatGPT에게 물어보더라도 TCP 리스너로 구성하고 Nginx와 같은 별도의 로드밸런서에서 TLS 오프로드를 처리함과 동시에 `Forward http to https` 를 적용하는 예시를 설명한다.

사내 엔지니어와 삽질을 해본결과 로드 밸런서에 연결되는 대상 그룹에서 `프록시 프로토콜 v2`를 활성화하면 Elastic Beanstalk의 Nginx 플랫폼에서 [PROXY Protocol](https://docs.nginx.com/nginx/admin-guide/load-balancer/using-proxy-protocol/)을 통해 `$proxy_protocol_server_port` 속성을 사용할 수 있음을 확인했다. 더 나아가서는 `$proxy_protocol_addr` 속성으로 실제로 트래픽을 전달한 `클라이언트 IP`를 액세스 로그에 출력하거나 `X-Forwarded-For` 헤더로 애플리케이션까지 전달할 수 있어보인다.

![](/images/posts/aws-nlb-tls-ecdsa/03.png)

```conf
http {
    server {
        listen 80 proxy_protocol;
        if ($proxy_protocol_server_port = 80) {
            return 301 https://$host$request_uri;
        }
    }
}
```

> NLB 에서 Nginx로 전달할 때 사용한 포트가 80 이라면 HTTP 요청으로 간주하고 HTTPS 요청으로 전달될 수 있도록 301 응답을 처리했습니다.
