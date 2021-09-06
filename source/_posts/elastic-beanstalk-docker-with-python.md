---
title: Elastic Beanstalk Docker Platform
date: 2021-09-06
tags:
- Beanstalk
- Docker
- Python
---

안녕하세요 Mambo 입니다.

오늘은 아마존 웹 서비스의 **Elastic Beanstalk에서 지원하는 도커 컨테이너 환경을 통해 애플리케이션을 배포하는 방법**에 대하여 알아봅니다. 요즘 회사에서는 운영중인 웹 서비스를 다양한 클라우드 환경에서 쿠버네티스를 사용하여 운영하기 위한 테스트를 진행하고 있습니다. 쿠버네티스에서는 애플리케이션을 도커 이미지화하여 사용해야하므로 도커 이미지화한 애플리케이션을 현재 사용중인 Elastic Beanstalk에 배포하기 위한 작업을 진행하였고 그 내용을 공유하려고 합니다.

## 도커 플랫폼
Elastic Beanstalk [도커 플랫폼](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/docker.html)은 애플리케이션을 도커 컨테이너에서 실행하기 위한 환경을 제공합니다. Dockerfile으로 부터 직접 이미지를 빌드하여 도커 컨테이너를 실행하거나 [사설 도커 레지스트리 서버](https://docs.docker.com/registry/deploying/)에 저장된 도커 이미지를 가져와서 **도커 컴포즈**로 컨테이너 환경을 구성할 수 있습니다. 

도커 플랫폼에서 도커 이미지화된 애플리케이션을 배포하기 위해서 다음의 항목들을 작성해야합니다.

- 애플리케이션 도커 이미지
- 도커 레지스트리 서버 크레덴셜
- 플랫폼 확장 및 환경 구성 파일
- 도커 컴포즈 문서
- 도커 구성 파일

> 이 글에서는 도커 사설 레지스트리 서버를 구축하는 것은 설명하지 않으니 참고하시기 바랍니다.

### 애플리케이션 도커 이미지
Python으로 작성된 간단한 Flask 웹 애플리케이션을 도커 이미지로 빌드하기 위해 Dockerfile을 정의합니다.

다음은 간단하게 Hello World를 출력하는 Flask 웹 애플리케이션 예시입니다.

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

도커 빌드 명령어를 사용하여 애플리케이션을 도커 이미지화하고 도커 레지스트리 서버에 빌드된 이미지를 저장합니다.

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

예를 들어, 도커 레지스트리 서버에 대한 인증서는 다음과 같이 참조하게 됩니다.

```sh
/etc/docker/certs.d/         <-- Certificate directory
└── registry.mambo.kr:5000   <-- Hostname:port
    ├── client.cert          <-- Client certificate
    ├── client.key           <-- Client key
    └── ca.crt               <-- Certificate authority that signed the registry certificate
```

> 윈도우와 MacOS 에서는 $USER/.docker/certs.d 입니다.

도커 레지스트리 서버 인증서를 사용하여 도커 로그인 명령어를 사용하면 **.dockercfg** 파일에 크레덴셜 정보가 저장됩니다.

```json .dockercfg 
{
    "https://registry.mambo.kr:5000": {
        "auth": "[Base64]username:password"
    }
}
```

윈도우 또는 Mac OS에서는 **윈도우 자격 증명 관리자** 또는 **OSX Keychain**에 크레덴셜을 저장할 수 있는데요. 이 경우에는 **.dockercfg 또는 config.json** 파일을 살펴보더라도 크레덴셜을 확인할 수 없습니다. 도커 로그인 시 사용되는 크레덴셜은 사용자 이름과 패스워드(username:password)를 [Base64로 인코딩](https://codebeautify.org/base64-encode)한 값이기 때문에 **직접 Base64로 인코딩**하고 위와 같이 **도커 레지스트리 서버에 대한 .dockercfg를 정의**하시기 바랍니다.

> 이 파일은 Beanstalk 도커에서 레지스트리 서버에 인증할 수 있게 사용될 예정입니다.

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

### 플랫폼 확장 구성 파일
Elastic Beanstalk에서 Nginx 프록시 구성을 확장하기 위해서는 .platform 폴더에 확장 구성 파일을 정의해야했습니다. 하지만, Elastic Beanstalk의 도커 플랫폼은 기본적으로 Nginx에 대한 프록시를 활성화하지 않습니다.

애플리케이션 **소스 번들에 .platform 폴더를 포함시키더라도 Nginx 구성 파일로 복사하여 확장하지 않습니다.** 그리고 **도커 컴포즈를 사용하면 Nginx 프록시 설정이 무시**되므로 굳이 별도로 활성화할 이유가 없습니다.

하지만 저는 .platform 폴더를 애플리케이션 소스 번들에 포함시키고 도커 컴포즈에 정의된 Nginx에서 사용할 수 있도록 볼륨을 지정하도록 하겠습니다. 

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

> Nginx가 트래픽을 전달하게 될 애플리케이션 주소가 애플리케이션 컨테이너의 호스트 이름으로 변경되었음을 주의하세요.

### 도커 컴포즈 문서
도커 컴포즈 문서는 도커 이미지화 된 애플리케이션과 함께 Nginx가 같이 실행되도록 컨테이너 환경을 구성하도록 작성합니다. 앞서 애플리케이션 소스 번들에 플랫폼 파일을 포함시키므로 Nginx 컨테이너에서 사용될 구성 파일과 인증서를 볼륨으로 연결합니다.

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
로컬 환경에서는 도커 로그인 명령어를 사용하여 도커 레지스트리 서버에 인증하고 이미지를 등록하였습니다. 그러나 Elastic Beanstalk 환경의 도커에서는 도커 로그인 명령어를 실행할 수 없습니다. 도커 플랫폼에서는 도커 구성 파일을 작성하여 도커 레지스트리 서버에 대한 크레덴셜을 정의할 수 있도록 지원합니다.

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

> EC2 인스턴스의 IAM Role이 S3 버킷에 대한 읽기 권한을 가져야한다는 것에 주의하세요.

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

