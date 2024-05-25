---
title: AWS NLB ECC TLS 오프로드
date: 2024-05-24T22:00+0900
tags:
- AWS NLB
- ECC
---

2022년 11월 부터 [AWS Certificate Manager 에서 ECC 인증서 등록](https://aws.amazon.com/ko/about-aws/whats-new/2022/11/aws-certificate-manager-elliptic-curve-digital-signature-algorithm-tls-certificates/)을 지원했지만 NLB 에서는 TLS 서버 인증서로 사용할 수 없었다. 그리고 시간이 흘러 2024년 1월 [Network Load Balancer, 이제 AWS Certificate Manager를 통한 RSA 3072-비트, ECDSA 256/384/521-비트 인증서 지원](https://aws.amazon.com/ko/about-aws/whats-new/2024/01/network-load-balancer-rsa-3072-bit-ecdsa-256-384-521-bit-certificates/) 소식이 있었으며 조직에서 사용중이던 ECC 인증서를 NLB에 등록하여 TLS 오프로드를 수행할 수 있도록 구성할 수 있게 되었다.

![](/images/posts/aws-nlb-tls-ecc-cert/01.png)

#### Network Load Balancer 리스너 구성

기존에 TCP 리스너를 통해서 트래픽을 그대로 Nginx 플랫폼으로 전달하던 구성을 [TLS 리스너](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/network/create-tls-listener.html)로 변경하고 ACM에 추가한 ECC 인증서를 선택하여 TLS 오프로드를 처리할 수 있게 구성해야한다. TLS 리스너를 구성할 때 443 포트로 전달되는 트래픽을 80 포트로 수신하고 있는 Nginx에 전달하도록 하자.

![](/images/posts/aws-nlb-tls-ecc-cert/02.png)

> 단, NLB가 TLS 리스너를 사용하는 경우 mTLS는 지원하지 못하는 구성이 됩니다.

#### HTTP 트래픽을 HTTPS 로 리다이렉트 해보기

NLB를 오랫동안 사용해오면서도 몰랐던 정보인데 ALB와 다르게 `Forward http to https` 을 위한 리다이렉트 설정이 불가능하다. 사내 엔지니어와 삽질을 해본결과 대상 그룹에서 지원하는 `프록시 프로토콜 v2`을 활성화하면 Nginx 에서 [PROXY Protocol](https://docs.nginx.com/nginx/admin-guide/load-balancer/using-proxy-protocol/)을 통해 `$proxy_protocol_server_port` 속성을 사용할 수 있음을 확인했다. HTTP 요청에 대해서 NLB 에서 80 포트로 트래픽을 전달한 것을 HTTPS 로 요구할 수 있도록 Nginx 플랫폼을 재구성할 수 있게 된다.

![](/images/posts/aws-nlb-tls-ecc-cert/03.png)

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

이제 운영중인 시스템의 인증서 교체에 대한 계획 수립 및 작업만 남았다.
