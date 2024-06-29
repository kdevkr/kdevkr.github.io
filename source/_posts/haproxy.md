---
title: HAProxy
date: 2024-06-29T15:00+09:00
tags:
- HAProxy
- TCP Proxy
---

일반적으로 애플리케이션 서버에 대한 로드밸런서는 엔진엑스(Nginx)를 많이 사용한다. 그러나, Nginx로 TCP 프록시를 구성하려면 stream 모듈을 별도로 설치해야하므로 L4 레벨의 `TCP 프록시`가 필요한 경우에는 `HAProxy` 가 더 좋은 선택지일 수 있다.

#### Test HAProxy Configuration

`check mode(-c)` 옵션을 사용해서 현재 설정에 대한 검증을 수행해볼 수 있다.

```sh
[ec2-user@ip-192-169-14-62 ~]$ haproxy -f /etc/haproxy/haproxy.cfg -c
Configuration file is valid
```

#### TCP Proxy

[TCP 프록시](https://www.haproxy.com/documentation/haproxy-configuration-tutorials/load-balancing/tcp/)를 통해 Redis 또는 PostgreSQL 와 같이 TCP 통신을 수행하는 인스턴스에 대한 프록시를 구성할 수 있다. 아래는 TCP 통신을 요구하는 [kdb+](https://kx.com/products/kdb/)에 대해 프록시를 제공하도록 설정한 예시이다.

```cfg haproxy.cfg
listen kdb_proxy_for_dev
    mode tcp
    bind *:5010-5013
    server kdb_dev 192.168.149.88
```

```sh
[ec2-user@ip-192-169-14-62 ~]$ nc -znv 127.0.0.1 5013
Ncat: Version 7.50 ( https://nmap.org/ncat )
Ncat: Connected to 127.0.0.1:5013.
Ncat: 0 bytes sent, 0 bytes received in 0.01 seconds.
```

#### 참고 링크

- [L4/L7 스위치의 대안, 오픈 소스 로드 밸런서 HAProxy](https://d2.naver.com/helloworld/284659) 
- [Validating HAProxy Config Files](https://www.baeldung.com/linux/haproxy-config-files)
