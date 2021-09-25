---
title: 엔진엑스로 알아보는 리버스 프록시
date: 2021-09-25
tags:
- Nginx
---

안녕하세요 Mambo 입니다.

![](https://digital.com/wp-content/uploads/what-is-nginx.png)

오늘은 웹 서비스 인프라에서 리버스 프록시 구성을 위해 사용되는 Nginx와 함께 리버스 프록시에 대해 알아보고자 합니다.

## Nginx
Nginx는 정적 파일을 배포할 수 있는 HTTP 웹 서버입니다. 최근 애플리케이션 서버를 배포하는 경우 단독으로 구성하지 않고 Nginx를 함께 사용합니다. 아마존 웹 서비스의 Elastic Beanstalk 환경에서는 리버스 프록시 구성을 위하여 Nginx를 기본적으로 제공하고 있습니다. 이렇게 애플리케이션 서버 앞에서 먼저 트래픽을 처리하도록 구성하는 리버스 프록시를 사용하는 이유는 무엇일까요?

### 리버스 프록시
리버스 프록시는 **사용자의 요청에 대한 사후처리를 수행하여 애플리케이션 서버로 트래픽을 전달되도록 하는 것**을 말합니다. 리버스 프록시 구성의 장점은 사용자에게 애플리케이션 서버가 실행되는 아이피 또는 포트를 공개하지 않거나 잘못된 요청을 애플리케이션 서버까지 전달되지 않도록하여 보호할 수 있습니다. 

### 로드 밸런싱
리버스 프록시를 구성함으로써 사용자는 특정 애플리케이션 서버로 직접 요청하는 구조가 아니므로 동시에 발생하는 수 많은 웹 요청을 1개 이상으로 실행된 다수의 애플리케이션 서버로 **로드밸런싱(트래픽을 분산)** 함으로써 애플리케이션 서버에 대한 부하를 줄일 수 있습니다.

물론, 에픽 게임즈의 [340만 동접자 이후 서비스 다운 관련 사후 분석 내용](https://www.epicgames.com/fortnite/ko/news/postmortem-of-service-outage-at-3-4m-ccu)처럼 리버스 프록시를 구성한다고해서 모든 트래픽을 감당할 수 있는 것은 아닙니다.

### SSL 오프로드
Nginx로 리버스 프록시를 구성함으로써 수행할 수 있는 사후처리 중 하나는 **SSL 오프로드**입니다. 리버스 프록시를 수행하는 웹 서버에서 SSL 인증서를 관리하고 [SSL Termination](https://www.f5.com/services/resources/glossary/ssl-termination)을 수행함으로써 애플리케이션 서버가 트래픽 암호화를 위해 수행하던 부하와 관리 포인트를 줄일 수 있습니다.

### 정적 파일 캐시
애플리케이션 서버가 배포하는 정적 파일에 대해서 Nginx 자체적으로 캐시하여 정적 파일을 응답할 수 있습니다. 애플리케이션 서버로 전달되는 트래픽이 많아질 경우 정적 파일을 응답하기 위한 요청을 처리하는 것도 부담이 될 수 있습니다. 많은 트래픽을 적은 리소스를 사용하여 처리할 수 있는 웹 서버에서 정적 파일에 대한 요청을 처리하여 애플리케이션 서버의 부담을 줄일 수 있게 됩니다.

창천향로님의 [Nginx Cache 문제 해결 시리즈](https://jojoldu.tistory.com/60)처럼 캐시를 잘 구성해야할 수 있습니다.

## Nginx 도커 컨테이너 학습
도커는 어떠한 기술을 학습하기 위한 환경을 구성하기에 적합한 도구입니다. 도커를 사용하여 애플리케이션 서버와 함께 리버스 프록시를 구성하는 Nginx를 설정해보며 학습해보도록 하겠습니다.

저의 학습 환경은 다음과 같습니다. 환경이 다른 경우 다른 부분이 존재할 수 있으니 주의해야합니다. 
- Docker version 20.10.8, build 3967b7d  
- Nginx 1.21.3  
- Amazon Corretto 11  

그리고 학습에 활용된 파일들은 [깃허브](https://github.com/kdevkr/mambo-box/tree/main/docker/nginx)에 공유되어있으니 참고하셔도 좋습니다.

### 기본 컨테이너 환경
도커 컴포즈를 활용하여 스프링 부트 애플리케이션과 Nginx가 구동되도록 컨테이너 환경을 구성했습니다.

```yaml
version: '3.8'
services: 
  nginx:
    image: nginx:1.21.3-alpine
    ports: 
      - 80:80
      - 443:443
  app:
    image: amazoncorretto:11-alpine
    ports:
      - 8080:8080
    command: 'java -jar /etc/app.jar'
    volumes:
      - ./demo-0.0.1-SNAPSHOT.jar:/etc/app.jar
```

도커 컴포즈 명령어로 컨테이너 환경을 실행합니다.

```ps
docker compose up -d
[+] Running 3/3
 - Network nginx_default    Created
 - Container nginx_nginx_1  Started
 - Container nginx_app_1    Started
```

제 컴퓨터 **호스트 파일에 127.0.0.1에 대하여 mambo.kr가 지정**되어있으므로 다음과 같이 Nginx가 80포트에 대한 요청에 대해 기본 페이지를 응답하였습니다.

![](/images/posts/reverse-proxy-using-nginx/nginx-02.png)

### 기본 Nginx 설정
도커 컴포즈 명령어로 컨테이너 진입 후 기본으로 적용되어있는 Nginx 설정을 확인해보도록 하겠습니다.

```ps
docker compose exec nginx sh
/ # cat /etc/nginx/nginx.conf
```

![](/images/posts/reverse-proxy-using-nginx/nginx-03.png)

80포트를 수신하는 웹 서버 설정은 **/etc/nginx/conf.d/default.conf**에 위치하고 있었습니다. 다음은 default.conf에 정의된 내용 중 일부입니다.

```ps
/etc/nginx/conf.d # cat default.conf
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
    # ...
}
```

server 블록을 통해 80포트를 수신(listen)하였고 루트 경로(/)에 대한 요청을 **/usr/share/nginx/html에 위치한 index.html**이라는 정적 파일을 응답하도록 정의되어있습니다. 

### 사용자 정의 Nginx 설정
기본으로 적용되어있는 nginx.conf를 볼륨으로 지정하여 사용자 정의할 수 있도록 해보겠습니다. 도커 컴포즈 문서에 Nginx 서비스에 볼륨을 지정하여 로컬 파일로 저장되어있는 nginx.conf를 지정하겠습니다.

```yaml
version: '3.8'
services: 
  nginx:
    image: nginx:1.21.3-alpine
    ports: 
      - 80:80
      - 443:443
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
  #app:
  #  ...
```

호스트의 443포트를 Nginx 서비스에 바인딩하였으므로 443포트를 수신하도록 정의해보겠습니다.

```nginx
http {
    server {
        listen 443 ssl;
        server_name localhost 127.0.0.1 mambo.kr;
        ssl_certificate /etc/nginx/server.crt;
        ssl_certificate_key /etc/nginx/server.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://app:8080;
        }
    }
    include /etc/nginx/conf.d/*.conf;
}
```

도커 컴포즈로 컨테이너 환경을 다시 실행하면 정상적으로...

```ps
nginx: [emerg] no "events" section in configuration
```

오류가 발생했네요. nginx.conf에 events 블록은 필수로 존재해야하는 듯 합니다.

#### 프로세스 및 처리 옵션
Nginx는 마스터 프로세스와 워커 프로세스로 구성되어 실제로 요청을 처리하는 것은 워커 프로세스가 담당합니다. 사용가능한 CPU 코어 수 만큼 워커 프로세스를 할당하는게 좋으며 워커 프로세스별로 사용할 수 있는 최대 열린 파일 개수 제한을 설정하는 것이 좋습니다.

```nginx
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}
```

![Optimizations - Event Models](/images/posts/reverse-proxy-using-nginx/nginx-01.png)

운영체제별 [효율적인 연결 처리 방식](https://www.nginx.com/resources/wiki/start/topics/tutorials/optimizations/#event-models)이 있으며 리눅스 커널 2.6+에서는 **epoll**을 사용할 수 있습니다.

Nginx 서비스 컨테이너가 정상적으로 실행되지 않은 상태이므로 도커 컴포즈로 컨테이너 환경을 실행해야합니다.

```ps
docker compose up -d
[+] Running 2/2
 - Container nginx_nginx_1  Started
 - Container nginx_app_1    Running
```

잘 실행된것으로 보이니 https://mambo.kr으로 접속해보도록 하겠습니다.

![](/images/posts/reverse-proxy-using-nginx/nginx-04.png)

443 포트로 요청된 트래픽이 Nginx를 경유하여 8080포트로 실행된 애플리케이션 서버로 전달되고 응답을 받았습니다. 바로 이것을 **리버스 프록시**라고 합니다.

#### 리버스 프록시
리버스 프록시를 구성하면 애플리케이션 서버는 어디서 요청했는지에 대한 정보를 알 수 없습니다. 그래서 Nginx와 같은 리버시 프록시를 구성하는 웹 서버에서는 프록시 관련 헤더를 함께 전달하여 어디서 요청되었는지를 전달할 수 있도록 설정할 수 있습니다.

```nginx
http {
    server {
        listen 443 ssl;
        server_name localhost 127.0.0.1 mambo.kr;
        ssl_certificate /etc/nginx/server.crt;
        ssl_certificate_key /etc/nginx/server.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://app:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    include /etc/nginx/conf.d/*.conf;
}
```

#### 웹소켓 프록시
HTTP 1.1 프로토콜은 Hop-By-Hop이라고 하는 Upgrade 헤더를 사용하여 커넥션을 변경하는 매커니즘을 제공합니다. [Upgrading to a WebSocket connection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism#upgrading_to_a_websocket_connection)과 [WebSocket proxying](http://nginx.org/en/docs/http/websocket.html) 문서를 참고하여 다음과 같이 웹소켓 프록시에 대한 설정을 구성할 수 있습니다.

```nginx
server {
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 65s;
    }
}
```

> 프록시 서버는 기본적으로 60초 이내에 전달되는 데이터가 없는 경우 연결을 해지합니다. 예를 들어, 1분마다 웹소켓으로 전달되는 데이터가 있는 경우를 위해 proxy_read_timeout을 조정해야합니다.

#### 이벤트 스트림 프록시
리버스 프록시 구성에서 SSE(Server Sent Event)와 같은 이벤트 스트림을 사용하는 경우 버퍼링 옵션을 비활성화 해야합니다.

- [EventSource / Server-Sent Events through Nginx](https://stackoverflow.com/questions/13672743/eventsource-server-sent-events-through-nginx)
- [For Server-Sent Events (SSE) what Nginx proxy configuration is appropriate?](https://serverfault.com/questions/801628/for-server-sent-events-sse-what-nginx-proxy-configuration-is-appropriate)

```nginx
server {
    location / {
        proxy_buffering off;
        proxy_cache off;
    }
}
```

#### HTTPS 리다이렉트
일반 HTTP를 사용하여 80포트로 요청한 것을 HTTPS를 사용하도록 유도하기 위해서 HTTPS 리다이렉트 응답을 적용할 수 있습니다.

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

#### 정적 파일 배포
추가적으로 정적 파일이 포함된 폴더를 볼륨으로 지정하여 Nginx에서 정적 파일을 응답할 수 있도록 설정하겠습니다.

```yaml
version: '3.8'
services: 
  nginx:
    image: nginx:1.21.3-alpine
    ports: 
      - 80:80
      - 443:443
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./server.crt:/etc/nginx/server.crt
      - ./server.key:/etc/nginx/server.key
      - ./static:/etc/nginx/static
```

```nginx
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name localhost 127.0.0.1 mambo.kr;
        ssl_certificate /etc/nginx/server.crt;
        ssl_certificate_key /etc/nginx/server.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://app:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /dist/ {
            alias /etc/nginx/static/;
            limit_except GET {
                deny all;
            }
        }
    }
    include /etc/nginx/conf.d/*.conf;
}
```

![](/images/posts/reverse-proxy-using-nginx/nginx-05.png)

정적 파일까지 응답할 수 있도록 설정하였습니다.

### Nginx 설정 최적화
사용자 정의한 Nginx 설정만으로도 리버스 프록시 및 정적 파일을 배포하는데에는 문제가 없습니다. 그러나 Nginx에서는 더 효율적으로 동작할 수 있도록 다양한 옵션을 제공합니다. 여러가지 옵션들을 적용해보면서 최적화해보도록 합시다.

Nginx 설정 최적화에 대해서는 다음의 글을 참고하면 좋습니다.

- [NGINX Tuning For Best Performance](https://github.com/denji/nginx-tuning/blob/master/README.md)  
- [[꿀팁] 고성능 Nginx를위한 튜닝](https://couplewith.tistory.com/m/entry/%EA%BF%80%ED%8C%81-%EA%B3%A0%EC%84%B1%EB%8A%A5-Nginx%EB%A5%BC%EC%9C%84%ED%95%9C-%ED%8A%9C%EB%8B%9D-1-%EB%94%94%EC%8A%A4%ED%81%AC%EC%9D%98-IO-%EB%B3%91%EB%AA%A9-%EC%A4%84%EC%9D%B4%EA%B8%B0?category=212810)

#### TCP 옵션
[Nginx Optimization: understanding sendfile, tcp_nodelay and tcp_nopush](https://thoughts.t37.net/nginx-optimization-understanding-sendfile-tcp-nodelay-and-tcp-nopush-c55cdd276765)에서는 TCP 옵션을 지정하는 이유에 대해서 설명합니다. 네트워크 환경이 빠른 경우 TCP 스택에서 Nagle 알고리즘을 사용하는 것이 비효율적일 수 있다고 합니다.

```nginx
http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
}
```

#### 압축 옵션
웹 요청에 대한 응답 데이터를 압축하는 것은 네트워크 비용을 줄이고 빠르게 응답할 수 있는 좋은 방법입니다. 서버 성능에 따라 압축 레벨을 최대한으로 지정하는 것이 좋습니다. 또한, 작은 크기에 데이터에 대하여 압축을 시도하는 것도 비효율적입니다.

```nginx
http {
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 9;
    gzip_vary on;
    gzip_disable msie6;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        # text/html is always compressed by HttpGzipModule
        text/css
        text/javascript
        text/xml
        text/plain
        application/javascript
        application/json
        application/xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;
}
```

일반적으로 텍스트 유형의 데이터를 압축하도록 지정합니다.

#### 로그 옵션
모든 요청에 대해 액세스 로그를 저장하는 것은 비효율적으로 I/O를 발생시킬 수 있습니다.

```nginx
error_log /var/log/nginx/error.log crit;
http {
    access_log off;
    server {
        listen 80;
        access_log /var/log/nginx/access.log;
    }
}
```

#### 보안 옵션
많은 사람들이 server_tokens 옵션을 비활성화하여 응답 헤더에 Nginx 버전을 명시하지 않도록 권장합니다. 공격자는 Nginx의 특정 버전을 알 수 없으므로 더 많은 취약점에 대한 공격을 시도해야합니다.


```nginx
http {
    server_tokens off;
}
```

#### 클라이언트 옵션
연결 유지 클라이언트 수와 최대 유지 시간 그리고 클라이언트 요청 크기를 조정할 수 있습니다.

```nginx
http {
    keepalive_timeout 65;
    keepalive_requests 10000;
    client_max_body_size 100m;
}
```

#### 리눅스 커널 파라미터
Nginx 옵션을 지정하더라도 실제로 허용할 수 있는지 리눅스 커널 파라미터를 검토해야할 수 있습니다. 

- [Linux increase ip_local_port_range TCP port range](https://ma.ttias.be/linux-increase-ip_local_port_range-tcp-port-range/)
- [TCP 관련 처리량 늘리기 - 리눅스 커널 튜닝](https://couplewith.tistory.com/entry/%EA%BF%80%ED%8C%81-%EA%B3%A0%EC%84%B1%EB%8A%A5-Nginx%EB%A5%BC%EC%9C%84%ED%95%9C-%ED%8A%9C%EB%8B%9D-3-TCP-%EA%B4%80%EB%A0%A8-%EC%B2%98%EB%A6%AC%EB%9F%89-%EB%8A%98%EB%A6%AC%EA%B8%B0-%EB%A6%AC%EB%88%85%EC%8A%A4%EC%BB%A4%EB%84%90%ED%8A%9C%EB%8B%9D)

### Nginx 설정 마무리
알아본 내용을 조합하면 다음과 같이 Nginx 설정을 정의할 수 있게 됩니다.

```nginx
user nginx;

# 프로세스 옵션
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

pid /var/run/nginx.pid;
error_log /var/log/nginx/error.log crit;
#thread_pool backend threads=32 max_queue=65536;

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    access_log off;

    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    upstream backend {
        server app:8080;
        keepalive 128;
    }

    # HTTPS 리다이렉트
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS 및 HTTP2 지원
    server {
        listen 443 ssl http2;
        server_name localhost 127.0.0.1 mambo.kr;
        ssl_certificate /etc/nginx/server.crt;
        ssl_certificate_key /etc/nginx/server.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # 리버스 프록시
        location / {
            proxy_pass http://backend;
            proxy_redirect off;
            proxy_buffering off;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            #aio threads=backend;
            access_log /var/log/nginx/access.log;
        }

        # 리버스 웹소켓 프록시
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

        location /dist/ {
            alias /etc/nginx/static/;
            limit_except GET {
                deny all;
            }
        }
    }

    # Optimization
    server_tokens off;

    keepalive_timeout 65s;
    client_max_body_size 100m;

    # TCP 옵션
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Gzip 압축 옵션
    gzip on;
    gzip_min_length 10k;
    gzip_comp_level 9;
    gzip_vary on;
    gzip_disable msie6;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        # text/html is always compressed
        text/css
        text/javascript
        text/xml
        text/plain
        application/javascript
        application/json
        application/xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;

    # 파일 리스트 비활성화
    autoindex off;

    include /etc/nginx/conf.d/*.conf;
}
```

도커 컴포즈를 사용하여 실행되어있는 Nginx 프로세스에 변경된 설정을 반영하면서 마치도록 하겠습니다.

```ps
docker compose exec nginx nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful

docker compose exec nginx nginx -s reload
2021/09/25 09:38:03 [notice] 34#34: signal process started
```

감사합니다.
