---
title: HAProxy
date: 2024-06-29T15:00+09:00
tags:
- HAProxy
- TCP Proxy
---

일반적으로 애플리케이션 서버에 대한 HTTP 프록시는 엔진엑스(Nginx)를 많이 사용하고 있지만 L4 레벨의 `TCP 프록시`가 필요한 경우 stream 모듈을 별도로 설치해야하는 과정이 필요하므로 `HAProxy`가 더 좋은 선택일 수 있다. 사내 개발 환경에서 연결할 수 있는 배스천 호스트에 HAProxy를 구성하고 프라이빗 네트워크 환경으로 구성되어있는 테스트 환경의 TCP 통신이 필요한 인스턴스에 연결할 수 있도록 `포트 포워딩`을 구성해보도록 하자.

#### TCP 프록시

[TCP 프록시](https://www.haproxy.com/documentation/haproxy-configuration-tutorials/load-balancing/tcp/)는 TCP 연결에 대한 리버스 프록시에 해당된다. 일반적으로 TCP 연결을 수행해야하는 인스턴스에는 Redis 또는 PostgreSQL이 있는데 현재 조직에서 활용하고 있는 시계열 데이터베이스인 [KDB+](https://kx.com/products/kdb/)에 대해 프록시를 구성해보려고 한다. 다음은 KDB에서 사용해야하는 포트 범위를 수신하도록 설정한 예시이다.

```cfg haproxy.cfg
listen kdb_proxy_for_dev
    mode tcp
    bind *:5010-5013
    server kdb_dev 192.168.149.88
```

#### HAProxy 구성 테스트

현재 설정 파일에 문법적인 문제가 없는지 `check mode(-c)` 옵션을 사용해서 현재 설정에 대해 검증을 수행해볼 수 있다.

```sh
[ec2-user@ip-192-169-14-62 ~]$ haproxy -c -f /etc/haproxy/haproxy.cfg
Configuration file is valid
```

#### TCP 프록시 테스트

NetCat(nc) 명령어를 사용해서 HAProxy에서 수신하고 있는 포트를 통해 테스트 환경에 실행된 인스턴스에 연결할 수 있는지 테스트를 해보자.

```sh
[ec2-user@ip-192-169-14-62 ~]$ nc -znv 127.0.0.1 5013
Ncat: Version 7.50 ( https://nmap.org/ncat )
Ncat: Connected to 127.0.0.1:5013.
Ncat: 0 bytes sent, 0 bytes received in 0.01 seconds.
```

> 배스천 호스트에 TCP 프록시를 구성하기 전까지는 배스천 호스트에 대한 SSH 터널링을 필요할때마다 수행해야 했습니다.
> 기본적으로 SSH 터널링을 구성하는게 일반적이지만 보안 수준을 검토하고 TCP 프록시를 구성해보도록 하세요.