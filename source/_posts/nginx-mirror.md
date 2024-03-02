---
title: 엔진엑스 트래픽 미러링
date: 2024-03-02T12:00+0900
tags:
- nginx
- mirror
---

엔진엑스(Nginx)의 `ngx_http_mirror_module` 모듈을 사용하면 리버스 프록시로 애플리케이션에 전달하는 [일부 트래픽을 복제하여 다른 애플리케이션으로 전달](https://medium.com/gaurav-shukla/testing-your-code-against-production-using-nginx-mirroring-567b3c2f4921)할 수 있다. 우리는 이것을 활용해서 애플리케이션에 전달하는 트래픽을 알 수 없는 상황이지만 어떠한 문제가 발생하고 있을때 테스트를 위한 애플리케이션을 만들어서 구동하고 디버그할 수 있는 환경을 만들 수 있다.

#### 트래픽 미러링 설정

```conf nginx.conf
http {
    upstream backend_for_test {
        server app:8081;
        keepalive 128;
    }
    server {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # hop-by-hop
        proxy_http_version 1.1;

        location /mtls/ {
            proxy_pass http://backend;

            mirror /mirror;
            mirror_request_body on;
        }

        location /mtls_mirror {
            internal;
            proxy_pass http://backend_for_test$request_uri;
        }
    }
}
```

> 문제에 대한 원인을 파악하기 위한 요청에 바디 정보가 필요하지 않은 경우 mirror_request_body 옵션을 비활성화(off) 하세요.

#### 트래픽 미러링 출력

일반적으로 서버 포트 오픈을 확인하는데 사용하는 Netcat 명령어를 통해 간단한 서버를 실행하고 복제된 트래픽에 대한 정보를 출력해볼 수 있다.

```sh
nc -lp localhost 8081
```

> AWS 환경에서 운영하는 애플리케이션에 대한 트래픽 미러링은 [VPC 트래픽 미러링](https://aws.amazon.com/ko/blogs/tech/mirror-production-traffic-to-test-environment-with-vpc-traffic-mirroring/)을 구성하는 것이 적합합니다.
