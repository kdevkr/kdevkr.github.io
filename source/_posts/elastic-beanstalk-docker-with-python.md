---
title: Elastic Beanstalk Docker Platform
date: 2021-09-06
tags:
- Beanstalk
- Docker
- Python
---

안녕하세요 Mambo 입니다.

오늘은 Elastic Beanstalk의 도커 플랫폼을 통해 애플리케이션을 배포하는 방법을 정리하고자 합니다. 요즘 회사에서 여러가지 환경에서 애플리케이션을 배포하기 위한 테스트를 진행하고 있으며 그 중에서 Elastic Beanstalk에서 지원하는 도커 플랫폼을 활용하여 **Python으로 작성된 웹 애플리케이션을 도커 컨테이너 환경으로 배포**하는 것을 시도하였고 이에 대한 내용을 공유하려고 합니다.

## Beanstalk Docker Platform
Elastic Beanstalk에서 지원하는 도커 플랫폼은 다양한 언어로 작성된 애플리케이션을 도커 이미지로 빌드하여 도커 컨테이너 환경에서 실행되도록 배포할 수 있는 기능을 제공합니다. [도커 플랫폼](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/docker.html)에서는 Dockerfile을 사용하여 직접 이미지를 빌드하여 도커 컨테이너를 실행하거나 **도커 레지스트리 서버**에 저장된 이미지를 가져와서 도커 컴포즈로 컨테이너 환경을 구성할 수 있습니다. 

이 글에서는 [사설 도커 레지스트리 서버](https://docs.docker.com/registry/deploying/)에 등록된 이미지를 사용하도록 정의된 도커 컴포즈 문서를 작성하여 도커 이미지화 된 애플리케이션을 컨테이너 환경으로 배포하는 과정을 설명합니다. 도커 플랫폼에서 애플리케이션을 배포하기 위해서는 다음의 항목들을 작성해야합니다.

- 애플리케이션 도커 이미지
- 도커 레지스트리 서버 크레덴셜
- 플랫폼 확장 및 환경 구성 파일
- 도커 컴포즈 문서
- 도커 구성 파일

### 애플리케이션 도커 이미지
Python으로 작성된 간단한 Flask 웹 애플리케이션을 도커 이미지로 빌드하기 위한 Dockerfile을 정의하고 도커 레지스트리 서버에 등록합니다.

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

그리고 [Gunicorn WSGI 서버](https://docs.gunicorn.org/en/stable/)를 사용하여 Flask 웹 애플리케이션을 실행하는 **엔트리포인트**를 작성합니다.

```sh entrypoint.sh
#!/bin/sh
source venv/bin/activate
gunicorn ${MAIN}:${MAIN_APP} -b 0.0.0.0:${PORT} -w ${WORKERS}
```

다음의 명령어를 사용하여 도커 레지스트리 서버에 빌드된 이미지를 저장합니다.

```zsh Terminal
docker login https://registry.mambo.kr:5000
Username: mambo
Password:
Login Succeeded

docker build -t registry.mambo.kr:5000/mambo-py:test
docker push registry.mambo.kr:5000/mambo-py:test
docker logout registry.mambo.kr:5000/mambo-py:test
```

### 도커 레지스트리 서버 크레덴셜
Elastic Beanstalk의 도커에서 사설 레지스트리 서버에 인증하기 위해서는 사설 레지스트리 서버의 인증서 파일과 함께 크레덴셜 정보가 필요합니다.

도커 레지스트리 서버에 대한 인증서는 다음과 같이 참조하게 됩니다.

```sh
/etc/docker/certs.d/         <-- Certificate directory
└── registry.mambo.kr:5000   <-- Hostname:port
    ├── client.cert          <-- Client certificate
    ├── client.key           <-- Client key
    └── ca.crt               <-- Certificate authority that signed the registry certificate
```

도커 레지스트리 서버 인증서를 등록하고 도커 로그인 명령어를 사용하면 크레덴셜 정보가 저장됩니다.

```json .dockercfg 
{
    "https://registry.mambo.kr:5000": {
        "auth": "[Base64]username:password"
    }
}
```

윈도우 또는 Mac OS에서는 **윈도우 자격 증명 관리자** 또는 **OSX Keychain**에 크레덴셜을 저장할 수 있습니다. 따라서, **.dockercfg 또는 config.json** 파일을 살펴보더라도 크레덴셜을 확인할 수 없습니다. 도커 로그인 시 사용되는 크레덴셜은 사용자 이름과 패스워드(username:password)를 [Base64로 인코딩](https://codebeautify.org/base64-encode)한 값이기 때문에 **직접 Base64로 인코딩**하고 위와 같이 **도커 레지스트리 서버에 대한 .dockercfg를 정의**해도 됩니다.

### 환경 구성 파일
도커 레지스트리 서버에 대한 파일들을 S3 버킷에서 가져오는 구성 파일을 정의합니다. 지난 [Elastic Beanstalk S3 Authentication](../elastic-beanstalk-s3-auth)를 참고하여 다음과 같이 작성하였습니다.

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

### 플랫폼 확장 파일
지난 Elastic Beanstalk 관련 글에서 .platform 폴더에 Nginx에 대한 확장을 구성하였습니다. Elastic Beanstalk의 도커 플랫폼은 기본적으로 Nginx에 대한 프록시를 활성화하지 않습니다. 어차피 **도커 컴포즈를 사용하면 Nginx 프록시 설정이 무시**되므로 굳이 활성화할 필요는 없습니다.

따라서, 애플리케이션 **소스 번들에 .platform 폴더를 포함시키더라도 Nginx 구성 파일로 복사하여 확장하지 않습니다.** 하지만 우리는 .platform 폴더를 소스 번들에 포함시켜 도커 컴포즈에 정의된 Nginx에서 사용할 수 있도록 볼륨을 지정할 예정입니다. 그리고 **Nginx도 컨테이너로 실행**하기 때문에 애플리케이션 주소를 127.0.0.1로 사용할 수 없으며 Flask 웹 애플리케이션의 **서비스 이름**으로 사용해야 합니다.

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

### 도커 컴포즈 문서
Elastic Beanstalk 환경의 도커가 실행할 도커 컴포즈 문서를 정의합니다. 도커 컴포즈를 사용하는 도커 플랫폼은 Nginx 프록시를 구성하지 않는다고 하였으므로 애플리케이션과 함께 Nginx 서비스도 정의하겠습니다.

```yaml docker-compose.yml
version: "3.8"
services:
  nginx:
    image: nginx:1.21.1
    restart: always
    volumes:
      - .platform/nginx/conf.d:/etc/nginx/conf.d
      - .platform/nginx/docker-nginx.conf:/etc/nginx/nginx.conf
      - /etc/nginx/cert:/etc/nginx/cert
    ports:
      - '80:80'
      - '443:443'
    networks: 
      - nginx_app
  app:
    image: registry.mambo.kr:5000/mambo-py:test
    restart: always
    networks: 
      - nginx_app
networks:
  nginx_app:
```

애플리케이션 로드 밸런서 또는 네트워크 로드 밸런서에서 트래픽을 80 또는 443 포트로 전달할 예정이므로 **애플리케이션의 8000 포트는 호스트로 노출되지 않도록** 했습니다.

### 도커 구성 파일
앞서 준비한 도커 레지스트리 서버의 인증서와 크레덴셜을 S3 버킷에 저장하고 이를 가져올 수 있도록 도커 구성 파일이라고 하는 **Dockerrun.aws.json**를 정의해야합니다.

```json Dockerrun.aws.json
{
  "AWSEBDockerrunVersion": "3",
  "Authentication": {
    "bucket": "mambo-cert",
    "key": "registry/.dockercfg"
  }
}
```

위와 같이 정의하면 도커 플랫폼에서는 **mambo-cert/registry/.dockercfg** 파일을 **/root/.docker/config.json**에 복사하게 됩니다. 이렇게 함으로써 도커 레지스트리 서버에 등록된 이미지를 **config.json에 정의된 크레덴셜을 사용**하여 가져올 수 있게 됩니다.

### 애플리케이션 소스 번들
이제 Elastic Beanstalk의 도커 플랫폼 환경에 배포할 애플리케이션 소스 번들을 준비해야합니다. 애플리케이션 소스 번들에는 다음과 같은 파일이 포함됩니다.

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

> 회사에서 진행한 내용이므로 전체적인 예제 파일을 제공하지 못하는 점 양해바랍니다.

감사합니다.

