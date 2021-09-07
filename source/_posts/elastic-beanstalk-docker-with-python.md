---
title: Elastic Beanstalk Docker Platform
date: 2021-09-06
tags:
- Beanstalk
- Docker
- Python
---

안녕하세요 Mambo 입니다.

오늘은 아마존 웹 서비스의 **Elastic Beanstalk에서 지원하는 도커 컨테이너 환경을 통해 애플리케이션을 배포하는 방법**에 대하여 알아봅니다. 이 글에서는 애플리케이션을 도커 이미지화하고 사설 도커 레지스트리 서버에 저장된 도커 이미지를 기반으로 Elastic Beanstalk 환경에서 도커 컴포즈를 활용해 애플리케이션을 실행하는 것을 설명합니다.


## 도커 플랫폼
Elastic Beanstalk의 [도커 플랫폼](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/docker.html)은 도커 컨테이너 환경에서 애플리케이션을 실행하는 기능을 지원합니다. 도커 플랫폼을 사용해 애플리케이션을 배포하기 위해서는 도커 컨테이너와 Elastic Beanstalk에 대한 이해가 필요합니다. 도커 플랫폼에서는 Dockerfile을 사용하여 직접 도커 이미지를 빌드하여 도커 컨테이너를 실행하거나 **Dockerrun.aws.json** 파일로 컨테이너 환경을 정의할 수 있도록 지원합니다. 또한, [도커 레지스트리 서버](https://docs.docker.com/registry/deploying/)에 저장된 이미지를 기반으로 컨테이너를 구성할 수 있는 **도커 컴포즈** 방식도 사용할 수 있습니다.


도커 플랫폼에서 도커 이미지화된 애플리케이션을 도커 컴포즈로 배포하기 위해서는 다음의 항목들을 작성해야합니다.

- 애플리케이션 도커 이미지
- 플랫폼 확장 및 환경 구성 파일
- 도커 컴포즈 문서
- 도커 레지스트리 서버 인증 파일
- 도커 구성 파일

> 이 글에서는 도커 레지스트리 서버가 구축되어있다고 가정합니다.

### 애플리케이션 도커 이미지
Python으로 작성된 간단한 Flask 웹 애플리케이션을 작성하고 도커 이미지로 빌드하기 위한 **Dockerfile** 파일을 정의합니다. 

```python application.py
from flask import Flask

# print a nice greeting.
def say_hello(username = "World"):
    return '<p>Hello %s!</p>\n' % username

# EB looks for an 'application' callable by default.
application = Flask(__name__)

# add a rule for the index page.
application.add_url_rule('/', 'index', (lambda: say_hello()))

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()
```

> 저는 파이썬을 다루지 않는 개발자이므로 파이썬을 설치하고 가상 환경을 시작하는 것은 생략하겠습니다.

PIP 명령어를 사용하여 Python 애플리케이션에서 사용하는 패키지를 설치하기 위한 **requirements.txt**을 준비합니다.

```txt requirements.txt
click==8.0.1
Flask==1.1.2
itsdangerous==2.0.1
Jinja2==3.0.1
MarkupSafe==2.0.1
Werkzeug==2.0.1
```

그리고 도커 허브에 등록된 Python 이미지를 기반으로 requirements.txt을 기준의 패키지를 설치하는 **Dockerfile**을 정의합니다. 

```Dockerfile Dockerfile
FROM python:3.8

WORKDIR /app

ARG PORT=8000
ARG MAIN=application
ARG MAIN_APP=application
ARG WORKERS=application
ARG WORKERS=2
ARG WORKERCLASS=gevent

ENV PORT ${PORT}
ENV MAIN ${MAIN}
ENV MAIN_APP ${MAIN_APP}
ENV WORKERS ${WORKERS}
ENV WORKERCLASS ${WORKERCLASS}

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn
COPY . .

EXPOSE ${PORT}

RUN ["chmod", "+x", "./entrypoint.sh"]
ENTRYPOINT "./entrypoint.sh"
```

마지막으로 [Gunicorn WSGI 서버](https://docs.gunicorn.org/en/stable/)를 사용하여 Flask 웹 애플리케이션을 실행하는 **엔트리포인트**를 작성합니다.

```sh entrypoint.sh
#!/bin/sh
source venv/bin/activate
gunicorn ${MAIN}:${MAIN_APP} -b 0.0.0.0:${PORT} -w ${WORKERS}
```

Dockerfile을 기반으로 애플리케이션을 도커 이미지로 생성하고 도커 레지스트리 서버에 빌드된 이미지를 저장합니다.

```zsh Terminal
docker login https://registry.mambo.kr:5000
Username: mambo
Password:
Login Succeeded

docker build -t registry.mambo.kr:5000/mambo-py:test
docker push registry.mambo.kr:5000/mambo-py:test
docker logout registry.mambo.kr:5000/mambo-py:test
```

### 플랫폼 확장 구성 파일
Elastic Beanstalk에서도 Nginx 프록시 옵션을 설정할 수 있지만 도커 컴포즈를 사용하여 도커 컨테이너 환경을 구성하는 경우 Nginx 프록시 옵션을 활성화되어 있더라도 무시됩니다. Nginx 프록시 옵션을 무시한다는 의미는 애플리케이션 소스 번들에 도커 컴포즈 문서와 함께 **.platform 폴더를 포함시키더라도 Nginx 구성 파일로 복사하여 확장하지 않는다**는 이야기입니다.

하지만 애플리케이션 소스 번들에 포함시킨 **.platform 폴더는 /var/app/current에 추출**되므로 도커 컴포즈 문서에 도커 컨테이너에 볼륨을 지정하여 전달할 수 있습니다.

```nginx docker-nginx.conf
user                    nginx;
error_log               /var/log/nginx/error.log warn;
pid                     /var/run/nginx.pid;
worker_processes        auto;
worker_rlimit_nofile    32768;

events {
    use  epoll;
    worker_connections  1024;
}

http {
    include         /etc/nginx/mime.types;
    default_type    application/octet-stream;

    log_format      main    '$remote_addr - $remote_user [$time_local] "$request" '
                            '$status $body_bytes_sent "$http_referer" '
                            '"$http_user_agent" "$http_x_forwarded_for"';

    include conf.d/*.conf;

    map $http_upgrade $connection_upgrade {
      default     "upgrade";
    }

    server {
      listen                80 default_server;
      access_log            /var/log/nginx/access.log main;

      client_header_timeout 60;
      client_body_timeout   60;
      keepalive_timeout     60;
      gzip                  off;
      gzip_comp_level       4;
      gzip_types            text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

      # Include the Elastic Beanstalk generated locations
      include conf.d/elasticbeanstalk/*.conf;
    }

    server {
           listen                   443 ssl default_server;
           server_name              mambo.kr;
           ssl_certificate          /etc/nginx/cert/server-ca-bundle.pem;
           ssl_certificate_key      /etc/nginx/cert/server.key;
           ssl_protocols            TLSv1.2 TLSv1.3;
           ssl_ciphers              HIGH:!aNULL:!MD5;
           ssl_verify_client        optional_no_ca;

           location / {
               proxy_pass          http://app:8000;
               proxy_http_version  1.1;
               proxy_set_header    Connection          $connection_upgrade;
               proxy_set_header    Upgrade             $http_upgrade;
               proxy_set_header    Host                $host;
               proxy_set_header    X-Real-IP           $remote_addr;
               proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
               proxy_set_header    X-SSL-CERT          $ssl_client_escaped_cert;
               proxy_buffering     off;
           }
    }
}
```

단일 컨테이너를 구성하고 ELB로 전달되는 트래픽을 애플리케이션 컨테이너에 직접 전달할 수 있지만 도커 컴포즈를 사용하여 컨테이너 구성하더라도 직접 Nginx 컨테이너를 함께 구성할 수 있음을 보여줍니다. 위 Nginx 구성 파일은 일반적인 Elastic Beanstalk의 다양한 언어로 지원하는 플랫폼에서 제공하는 Nginx 확장 구성 파일과 동일하지만 **애플리케이션과 Nginx가 별도의 독립적인 컨테이너로 실행되므로 호스트 이름으로 접근해야함**을 보여줍니다.

### 도커 컴포즈 문서
애플리케이션과 Nginx 컨테이너를 구성하는 도커 컴포즈 문서를 정의합니다. 

```yaml docker-compose.yml
version: "3.8"
services:
  nginx:
    image: nginx:1.21.1
    restart: always
    env_file:
      - .env
    volumes:
      - .platform/nginx/conf.d/elasticbeanstalk:/etc/nginx/conf.d/elasticbeanstalk
      - .platform/nginx/docker-nginx.conf:/etc/nginx/nginx.conf
      - /etc/nginx/cert:/etc/nginx/cert
      - "${EB_LOG_BASE_DIR}/nginx:/var/log/nginx"
    ports:
      - '80:80'
      - '443:443'
    networks: 
      - nginx_app
  app:
    image: registry.mambo.kr:5000/mambo-py:test
    restart: always
    env_file:
      - .env
    networks: 
      - nginx_app
networks:
  nginx_app:
```

Elastic Beanstalk 환경 구성 파일에 의해 가져온 Nginx 인증서와 애플리케이션 소스 번들에 포함된 플랫폼 확장 파일을 Nginx 컨테이너 볼륨에 연결합니다. 그리고 애플리케이션 로드 밸런서 또는 네트워크 로드 밸런서에서 전달되는 트래픽은 Nginx 컨테이너로 경유하여 애플리케이션 컨테이너로 전달되므로 애플리케이션에 대한 포트는 호스트로 노출하지 않도록 하여 직접 접근이 불가능하도록 합니다.

#### 컨테이너 환경 변수
Beanstalk 콘솔에서 설정하는 환경 변수는 애플리케이션 소스 번들이 추출되는 /var/app/current 경로에 .env 파일에 환경 변수가 정의됩니다. 그리고 이 파일을 도커 컨테이너의 환경 변수 참조 파일로 추가할 수 있습니다.

> 도커 컴포즈 문서에 정의한 환경 변수가 우선 순위를 갖습니다. 도커 컴포즈 문서에 설정된 환경 변수를 Beanstalk 환경 변수로 설정하더라도 무시되니 주의하셔야합니다.

### 도커 레지스트리 서버 인증 파일
도커 레지스트리 서버에서 도커 이미지를 받아오기 위해서는 레지스트리 서버에 대한 인증 파일이 필요합니다. 만약, 기본 도커 레지스트리 서버인 도커 허브를 사용하는 것이 아니라 직접 구축한 도커 레지스트리 서버과 통신해야한다면 **TLS 통신을 위한 인증서 파일이 필요**합니다.

예를 들어, 도커 레지스트리 서버에 대한 인증서는 다음과 같이 참조하게 됩니다.

```sh
/etc/docker/certs.d/         <-- Certificate directory
└── registry.mambo.kr:5000   <-- Hostname:port
    ├── client.cert          <-- Client certificate
    ├── client.key           <-- Client key
    └── ca.crt               <-- Certificate authority that signed the registry certificate
```

> 윈도우와 MacOS 에서는 $USER/.docker/certs.d 입니다.

도커 레지스트리 서버에 로그인하면 **.dockercfg** 파일에 크레덴셜 정보가 저장됩니다.

```json .dockercfg 
{
    "https://registry.mambo.kr:5000": {
        "auth": "[Base64]username:password"
    }
}
```

윈도우 또는 Mac OS에서는 **윈도우 자격 증명 관리자** 또는 **OSX Keychain**에 크레덴셜을 저장할 수 있는데요. 이 경우에는 **.dockercfg 또는 config.json** 파일을 살펴보더라도 크레덴셜을 확인할 수 없습니다. 도커 로그인 시 사용되는 크레덴셜은 사용자 이름과 패스워드(username:password)를 [Base64로 인코딩](https://codebeautify.org/base64-encode)한 값이기 때문에 **직접 Base64로 인코딩**하고 위와 같이 **도커 레지스트리 서버에 대한 .dockercfg를 정의**하시기 바랍니다.

### 환경 구성 파일
도커 레지스트리 서버에 대한 인증서 파일들을 S3 버킷에서 가져오는 구성 파일을 정의합니다. 지난 [Elastic Beanstalk S3 Authentication](../elastic-beanstalk-s3-auth)를 참고하여 다음과 같이 작성하였습니다.

```yaml .ebextensions/registry-cert.config
Resources:
    AWSEBAutoScalingGroup:
        Metadata:
            AWS::CloudFormation::Authentication:
                S3Auth:
                    type: S3
                    buckets:
                        - mambo-cert
                    roleName:
                        Fn::GetOptionSetting:
                            Namespace: aws:autoscaling:launchconfiguration
                            OptionName: IamInstanceProfile
                            DefaultValue: aws-elasticbeanstalk-ec2-role
files:
    "/etc/docker/certs.d/registry.mambo.kr:5000/client.cert":
        mode: "000400"
        owner: root
        group: root
        source: https://mambo-cert.s3.ap-northeast-2.amazonaws.com/registry/client.cert
        authentication: S3Auth
    "/etc/docker/certs.d/registry.mambo.kr:5000/client.key":
        mode: "000400"
        owner: root
        group: root
        source: https://mambo-cert.s3.ap-northeast-2.amazonaws.com/registry/client.key
        authentication: S3Auth
    "/etc/docker/certs.d/registry.mambo.kr:5000/ca.crt":
        mode: "000400"
        owner: root
        group: root
        source: https://mambo-cert.s3.ap-northeast-2.amazonaws.com/registry/ca.crt
        authentication: S3Auth

commands:
    99-remove-bak:
        cwd: /etc/docker/certs.d/registry.mambo.kr:5000
        command: rm -f *.bak
```

### 도커 구성 파일
로컬 환경에서는 도커의 로그인 명령어를 사용하여 도커 레지스트리 서버에 인증하고 이미지를 등록하거나 가져올 수 있습니다. 그러나 Elastic Beanstalk 환경에서는 직접 로그인 명령어를 사용하는 것이 아니므로 도커에서 도커 레지스트리 서버에 대한 인증 파일을 사용할 수 있도록 앞서 알아본 **.dockercfg** 파일을 가져와야 합니다.

```json Dockerrun.aws.json
{
  "AWSEBDockerrunVersion": "3",
  "Authentication": {
    "bucket": "mambo-cert",
    "key": "registry/.dockercfg"
  }
}
```

도커 컴포즈 문서와 함께 애플리케이션 소스 번들에 포함되는 위 도커 구성 파일은 Dockerrun.aws.json v3을 사용하며 **mambo-cert/registry/.dockercfg** 파일을 **/root/.docker/config.json**에 크레덴셜 정보를 복사합니다.

> EC2 인스턴스의 IAM Role이 S3 버킷에 대한 읽기 권한을 가져야합니다.

### 애플리케이션 소스 번들
Elastic Beanstalk의 도커 플랫폼 환경에 배포할 애플리케이션 소스 번들에는 다음과 같은 파일들이 포함됩니다. 

- docker-compose.yml
- Dockerrun.aws.json
- .platform
- .ebextensions

위 파일들을 **zip 명령어로 애플리케이션 소스 번들 파일을 생성**합니다.

```sh Terminal
zip app-bundle.zip -r docker-compose.yml Dockerrun.aws.json .platform .ebextensions
```

이제 애플리케이션 소스 번들 파일을 업로드하면 다음과 같이 Hello World가 표시되는 것을 확인할 수 있습니다.

![](/images/posts/beanstalk-docker-platform/web.png)

이렇게해서 애플리케이션을 도커 이미지로 만들고 사설로 구축한 도커 레지스트리 서버에 등록된 이미지를 통해 Elastic Beanstalk의 도커 플랫폼을 활용하여 애플리케이션을 배포해보았습니다.

감사합니다.

