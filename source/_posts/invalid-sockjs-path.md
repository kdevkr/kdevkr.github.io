---
title: Invalid SockJS path.
date: 2023-10-16T22:00+0900
tags:
- Spring
- Nginx
- SockJS
- Stomp
---

> Invalid SockJS path 'XXX' required to have 3 path segments.

구글에 [Invalid SockJS path](https://www.google.com/search?q=Invalid+SockJS+path) 라는 키워드로 검색해보면 이와 같은 오류 로그에 대한 조치로 [Stomp 클라이언트를 사용하라는 답변](https://stackoverflow.com/a/64576478)이나 [스택 오버플로우에 질문하라는 답변](https://github.com/spring-projects/spring-framework/issues/28103)을 찾아볼 수 있다. 아무튼 위 상황에 대한 원인은 명확히 알 수 없는 상황에서 아래와 같은 구조에서 해당 오류가 발생했다.

1. Nginx Websocket Proxy
2. Spring WebSocket with Stomp + SockJS
3. `sockjs-client@1.6.1`
4. `@stomp/stompjs@7.0.0`

#### 이슈 파악

[nginx.conf](https://github.com/kdevkr/nginx.conf)와 같이 엔진엑스에서 웹소켓 주소 패턴에 대해 백엔드 애플리케이션으로의 리버스 프록시 구성을 아래와 같이 해둔 상태였다. 그리고 Stomp 방식의 웹 소켓 연결을 수행하는 엔드포인트는 `/ws/stomp` 로 정의되어있었다. 본래 `/ws` 는 일반적인 웹 소켓 연결을 수행하고 `/ws/stmop`로 시작되는 것은 Stomp로 동작하는 것을 의도한 것이다.

```conf nginx.conf
http {
    upstream backend {
        server app:8080;
        keepalive 128;
    }

    server {
        location /ws/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            # hop-by-hop
            proxy_http_version 1.1;
            proxy_set_header Connection "upgrade";
            proxy_set_header Upgrade $http_upgrade;
            proxy_read_timeout 65s;
        }
    }
}
```

> Vite 개발 서버에서의 Proxy 구성의 경우 올바르게 Stomp 방식의 웹소켓 연결을 수행된다.

하지만, 엔진엑스와 함께 동작중인 배포 환경에서는 Stomp 클라이언트가 SockJS를 사용하여 연결을 수행하려고 할때 `/ws/stomp/info?t=0` 엔드포인트에 대해 404 응답을 받게되고 애플리케이션 로그에는 `Invalid SockJS path ...`가 출력되는 것을 확인했다.

#### 솔루션

이리저리 시도해본 결과 해결책은 일반적인 웹 소켓 연결과 Stomp 방식의 연결을 아예 분리하는 것이다. `/ws/` 이외에 `/ws-stomp/`로 Stomp 방식의 웹 소켓 연결을 위한 별도의 엔드포인트 패턴을 사용하고 리버스 프록시 구성을 하고나니 해당 증상은 발생하지 않았다.

```conf nginx.conf
http {
    upstream backend {
        server app:8080;
        keepalive 128;
    }

    server {
        location ~ ^/(ws|ws-stomp)/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            # hop-by-hop
            proxy_http_version 1.1;
            proxy_set_header Connection "upgrade";
            proxy_set_header Upgrade $http_upgrade;
            proxy_read_timeout 65s;
        }
    }
}
```

아무튼 정확한 원인에 대해서는 별도로 찾아보아야겠지만 기록으로 남기고자 한다.
