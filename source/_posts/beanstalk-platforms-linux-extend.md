---
title: Beanstalk Linux 플랫폼 확장에 대해서
date: 2023-12-10T22:00+0900
tags:
- AWS Beanstalk
- Java SE Platform
---

> 오랜만에 신규 프로젝트로 인하여 아마존 웹 서비스의 빈스톡 환경 구성에 대해서 살펴볼 기회가 있어 리눅스 플랫폼의 확장에 대해 더 자세하게 학습하고 어떻게 이용할 수 있는지 정리해보고자 한다. 예전과 다르게 변경되는 부분이 생각보다 많아서 오래전에 정리했던 [AWS Elastic Beanstalk Java SE 플랫폼 환경으로 애플리케이션 배포하기](/deploy-application-to-the-aws-elastic-beanstalk-java-se-platform-enviroment/)라는 글은 올바르지 않은 내용을 포함하고 있음을 알린다.

AWS Elastic Beanstalk 은 애플리케이션을 운영하기 위한 인프라를 쉽게 구성하고 배포할 수 있도록 관리해준다. 개발자가 인프라에 대해서 신경쓰지 않아도 트래픽이나 일정 임계값 기반으로 스케일 아웃이 가능하도록 설정할 수 있으며 다양한 언어로 작성되는 애플리케이션에 대해서 지원하고 심지어는 도커 컨테이너 내에서 실행하는 환경까지도 제공한다. Amazon EKS와 같은 쿠버네티스 인프라 환경을 구성할 필요가 없는 작은 규모의 프로젝트라면 AWS Elastic Beanstalk은 좋은 선택에 해당할 수 있다.

> 개발 조직에서 쿠버네티스를 고민하고 있다면 정말로 쿠버네티스가 필요한 규모인가에 대해서 고민해볼 필요가 있다. 개인적으로 쿠버네티스가 필요해보이는 규모의 프로젝트는 생각보다 많지 않을거라고 생각하는 편이다. 최소한 쿠버네티스를 제대로 관리할 수 있는 운영 조직을 구성할 수 있어야한다.

#### 샘플 애플리케이션

AWS Elastic Beanstalk 을 사용하면 애플리케이션을 쉽게 배포할 수 있는 환경을 만들 수 있지만 개인적인 경험을 기반으로 이야기해보자면 처음에 환경을 구성해보고자하는 경우 생각보다 많은 오류를 경험하고 실패해서 환경을 지웠다가 새로 생성하는 경우가 많을 것이다. 빈스톡 환경에 대한 경험이 있더라도 최소한 처음에는 샘플 애플리케이션을 사용해서 환경을 시작하는 것을 권장한다. AWS CloudFormation 을 이용하여 Elastic Beanstalk 환경 스택을 구성하기 때문에 빈스톡 서비스에서 조차 해결할 수 없는 상태가 된다면 CloudFormation 에서 직접 스택을 수정하거나 삭제해야한다.

#### 애플리케이션 소스 번들

플랫폼 확장에 대해서 이야기하기 앞서 빈스톡 환경에 애플리케이션 배포 시 사용되는 애플리케이션 소스 번들에 대해서 정리해보자. [애플리케이션 소스 번들](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/applications-sourcebundle.html)에 대한 주의사항으로 인해 애플리케이션 배포가 실패하여 롤백되는 경우도 있기 때문이다.

- 단일 ZIP 파일 또는 WAR 파일이어야 한다.
- 소스 번들의 크기는 500 MB를 초과하지 않아야 한다.

> 단일 애플리케이션을 배포하더라도 ZIP 파일로 구성된 소스 번들을 사용하여 Procfile을 반드시 이용하기를 권장한다.

#### Elastic Beanstalk Linux 플랫폼 확장

[Elastic Beanstalk Linux 플랫폼](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/platforms-linux.html)은 아마존 웹 서비스에서 제공하는 Amazon Linux를 기반으로 리눅스를 구성하는 환경을 말한다. 기본적으로 일반적인 리눅스 환경 설정을 제공하기는 하지만 애플리케이션 요구사항에 따라 보안 조치를 해야하거나 시간 설정 또는 모니터링 솔루션과의 연계를 위해 별도의 에이전트나 패키지를 설치하여 환경 구성을 확장해야할 수 있다. Elastic Beanstalk Linux 플랫폼 에서는 애플리케이션 소스 번들에 포함되는 .platform 또는 .ebextensions 폴더를 통해 [플랫폼에 대해서 확장을 지원](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/platforms-linux-extend.html)한다.

> 2023년 10월 19일부터 Amazon Liunx 2와 Amazon Linux 2023을 지원하고 있으며 AL2에 대해서는 2025년 6월 30일까지 지원 예정이다. AL2023 으로의 마이그레이션을 충분히 제공하기 위해 Amazon Linux 2 지원 종료 날짜(EOL)가 2023년 6월 30일에서 2025년 6월 30일로 2년 연장되었다.

본 글에서는 자바 스프링 기반의 백엔드 개발자 기준의 Java SE 플랫폼에 대해서만 설명한다. 나머지 플랫폼에 대해서는 경험할 기회가 없기에 플랫폼 구성 확장 시 발생할 수 있는 여러가지 트러블슈팅에 대해서 공유하기가 어렵다. 아무튼 Elastic Beanstalk 에서 애플리케이션을 배포하기 위한 환경을 구성하는 과정, 애플리케이션을 배포하는 과정에 대해서 이해한다면 어떤 문제가 발생했을 때 어떤 부분의 로그를 확인해야하는지를 알 수 있다.

#### 리버스 프록시를 위한 Nginx 웹서버 구성

Elastic Beanstalk Java SE 플랫폼에는 리버스 프록시 역할을 하며 캐시된 정적 콘텐츠를 제공하고 요청을 애플리케이션에 전달하는 nginx 서버가 포함되어 있다. 기본적인 설정을 제공하고 있어 .conf 파일을 포함시킬수도 있고 nginx.conf 파일을 완전히 대체할 수도 있다. Nginx 웹서버 구성을 확장하기 전에 기본적인 설정을 어떻게 제공하며 불필요한 확장을 수행하는 건 아닌지 확인하는 것이 좋다. [AWS Beanstalk을 이용한 성능 튜닝 시리즈의 Nginx 튜닝](https://jojoldu.tistory.com/322) 에서 확인할 수 있는 [커넥션 처리를 위한 방식](https://nginx.org/en/docs/events.html)을 epoll로 선택하고자 하는 경우는 고려해볼만 하다.

> events 디렉티브 위치 상 epoll 방식을 적용하기 위해서는 .platform/nginx/nginx.conf로 완전히 대체할 수 밖에 없다.

다음은 Amazon Linux 2023 기반에서의 기본값을 토대로 일부 옵션을 적용한 것이다. include 위치에 따라서 어느 폴더에 설정 파일을 둘 수 있는지 잘 살펴보기를 바란다. 어차피 nginx.conf로 대체할 것이라면 nginx.conf 파일에 모든 설정을 두어도 상관이 없다.

```conf .platform/nginx/nginx.conf
user                    nginx;
error_log               /var/log/nginx/error.log warn;
pid                     /var/run/nginx.pid;
worker_processes        auto;
worker_rlimit_nofile    200000;

events {
    use epoll;
    worker_connections  1024;
    multi_accept on;
}

http {
    server_tokens off;

    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    include       conf.d/*.conf;

    map $http_upgrade $connection_upgrade {
        default     "upgrade";
    }

    server {
        listen        80 default_server;
        access_log    /var/log/nginx/access.log main;

        client_header_timeout 60;
        client_body_timeout   60;
        keepalive_timeout     60;
        gzip                  off;
        gzip_comp_level       4;
        gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

        # Include the Elastic Beanstalk generated locations
        include conf.d/elasticbeanstalk/*.conf;
    }
}
```

```conf .platform/nginx/conf.d/upstream.conf
upstream web {
    server 127.0.0.1:5000;
    keepalive 1024;
}
```

```conf .platform/nginx/conf.d/elasticbeanstalk/00_application.conf
location / {
  proxy_pass          http://web;
  proxy_http_version  1.1;
  proxy_set_header    Connection          $connection_upgrade;
  proxy_set_header    Upgrade             $http_upgrade;

  proxy_set_header    Host                $host;
  proxy_set_header    X-Real-IP           $remote_addr;
  proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
}
```

#### 플랫폼 스크립트 도구

`/opt/elasticbeanstalk/bin/get-config`는 Amazon Linux 플랫폼을 사용하는 환경에 대해 AWS Elastic Beanstalk가 제공하는 도구이다. 플랫폼 혹은 컨테이너 정보를 조회하거나 환경 변수를 가져오는데 사용할 수 있다. 만약, 빈스톡에 의해 만들어진 EC2 인스턴스에 접속하여 현재 실행중인 애플리케이션 번들이 위치하는 폴더 또는 확인하고자 하는 로그가 어떤 위치에 있는지 알고 싶다면 아래와 같이 명령어를 수행하여 확인할 수 있다.

```sh
# /opt/elasticbeanstalk/bin/get-config --output YAML platformconfig
generalconfig:
    appuser: webapp
    appdeploydir: /var/app/current/
    appstagingdir: /var/app/staging/
    proxyserver: nginx
    defaultinstanceport: "80"
platformspecificconfig:
    ApplicationPort: "5000"
    JavaVersion: "11"

# /opt/elasticbeanstalk/bin/get-config --output YAML container
common_log_list:
    - /var/log/eb-engine.log
    - /var/log/eb-hooks.log
default_log_list:
    - /var/log/nginx/access.log
    - /var/log/nginx/error.log
    - /var/log/web.stdout.log
environment_name: test-env
instance_port: "80"
log_group_name_prefix: /aws/elasticbeanstalk
proxy_server: nginx
static_files:
    - ""
xray_enabled: "false"
```

> AWS Elastic Beanstalk 환경에서 뉴렐릭 인프라 및 자바 에이전트를 설치하는 과정에서 활용할 예정이다.

#### 인스턴스 메타데이터 서비스 구성

현재 사용하고 있는 플랫폼 버전과 설정에 따라서 [IMDS에 대한 플랫폼 지원 여부](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/environments-cfg-ec2-imds.html#environments-cfg-ec2-imds.plat)를 확인해보는게 좋다. 플랫폼 확장 구성 시 인스턴스 메타데이터 서비스를 이용해야할 필요성이 요구된다면 `IMDSv2`를 이용해야하는 환경에서는 인스턴스 메타데이터 서비스 접근을 위한 토큰을 먼저 발급한 뒤에 인스턴스 메타데이터 서비스에 요청해야한다.

```yaml .ebextensions/00_init.config
option_settings:
  aws:autoscaling:launchconfiguration:
    DisableIMDSv1: true
```

```yaml .ebextensions/02_newrelic-infra.config
commands:
  02_configure-newrelic-infra:
    command: |
      NEW_RELIC_LICENSE_KEY=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_LICENSE_KEY`
      METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
      INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`
      ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
      NEW_RELIC_HOSTNAME="${ENVIRONMENT_NAME}_${INSTANCE_ID}"

      sudo sed -i "s/^license_key:.*/license_key: ${NEW_RELIC_LICENSE_KEY}/g" /etc/newrelic-infra.yml
      sudo sed -i "s/^display_name:.*/display_name: ${NEW_RELIC_HOSTNAME}/g" /etc/newrelic-infra.yml
      sudo systemctl restart newrelic-infra
      sudo rm -r /etc/newrelic-infra.*.bak
```

> 조직에서 구성한 Beanstalk 환경마다 IMDSv1 옵션 설정이 다름을 확인했으나 다행히도 인스턴스 메타데이터 서비스를 활용하는 부분은 없었다. 참고로, IMDSv1의 경우 권한을 요구하지 않으므로 보안 취약점에 해당하므로 IMDSv1 옵션을 비활성화하는 것을 권고한다.

#### 인스턴스 배포 워크플로우

[인스턴스 배포 워크플로우](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/platforms-linux-extend.html#platforms-linux-extend.workflow)를 살펴보면 빈스톡에서 어떠한 과정으로 배포 단계를 거치는지를 설명한다. 구성 파일(.ebextensions)으로 뉴렐릭 에이전트를 설치할수도 있으나 플랫폼 확장(.platform)의 플랫폼 후크 스크립트로도 설치 명령어를 수행할 수 있다.

```sh .platform/hooks/predeploy/01_newrelic.sh
#!/bin/bash
NEW_RELIC_LICENSE_KEY=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_LICENSE_KEY`
NEW_RELIC_APP_NAME=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_APP_NAME`
METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`
ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
NEW_RELIC_HOSTNAME="${ENVIRONMENT_NAME}_${INSTANCE_ID}"

sed -i "s/^license_key:.*/license_key: ${NEW_RELIC_LICENSE_KEY}/g" /var/app/newrelic/newrelic.yml
sed -i "s/^app_name:.*/app_name: ${NEW_RELIC_APP_NAME}/g" /var/app/newrelic/newrelic.yml
sed -i "s/^hostname:.*/hostname: $NEW_RELIC_HOSTNAME/g" /var/app/newrelic/newrelic.yml
```

#### 뉴렐릭 인프라스트럭처 및 자바 에이전트 설치해보기

```yaml .ebextensions/01_newrelic.config
files:
  "/var/app/newrelic/newrelic.jar":
    mode: "000755"
    owner: webapp
    group: webapp
    source: https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar
  "/var/app/newrelic/newrelic.yml":
    mode: "000755"
    owner: webapp
    group: webapp
    source: https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.yml

commands:
  01_configure_newrelic:
    command: |
      NEW_RELIC_LICENSE_KEY=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_LICENSE_KEY`
      NEW_RELIC_APP_NAME=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_APP_NAME`
      sed -i "s/<%= license_key %>/${NEW_RELIC_LICENSE_KEY}/g" /var/app/newrelic/newrelic.yml
      sed -i "s/My Application/${NEW_RELIC_APP_NAME}/g" /var/app/newrelic/newrelic.yml
  02_configure_newrelic_instance:
    command: |
      METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
      INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`
      ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
      NEW_RELIC_HOSTNAME="${ENVIRONMENT_NAME}_${INSTANCE_ID}"
      sed -i "s/^hostname:.*/hostname: $NEW_RELIC_HOSTNAME/g" /var/app/newrelic/newrelic.yml
  03_clear_newrelic_bak_files:
    command: sudo rm -r /var/app/newrelic/newrelic.*.bak
```

![NEW_RELIC_APP_NAME 과 NEW_RELIC_LICENSE_KEY 예시](/images/posts/beanstalk-platforms-linux-extend/00.png)  

```yaml .ebextensions/02_newrelic-infra.config
files:
  "/etc/newrelic-infra.yml" :
    mode: "000644"
    owner: root
    group: root
    content: |
      license_key:
      display_name:

commands:
  01_install-newrelic-infra:
    command: |
      source "/etc/os-release"
      ARCH=`uname -m`
      sudo curl -o /etc/yum.repos.d/newrelic-infra.repo "https://download.newrelic.com/infrastructure_agent/linux/yum/amazonlinux/$VERSION_ID/$ARCH/newrelic-infra.repo"
      sudo yum -q makecache -y --disablerepo='*' --enablerepo='newrelic-infra'
      sudo yum install newrelic-infra -y
  02_configure-newrelic-infra:
    command: |
      NEW_RELIC_LICENSE_KEY=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_LICENSE_KEY`
      METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
      INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`
      ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
      NEW_RELIC_HOSTNAME="${ENVIRONMENT_NAME}_${INSTANCE_ID}"

      sudo sed -i "s/^license_key:.*/license_key: ${NEW_RELIC_LICENSE_KEY}/g" /etc/newrelic-infra.yml
      sudo sed -i "s/^display_name:.*/display_name: ${NEW_RELIC_HOSTNAME}/g" /etc/newrelic-infra.yml
      sudo systemctl restart newrelic-infra
      sudo rm -r /etc/newrelic-infra.*.bak
```

> 뉴렐릭 인프라 에이전트 설치 시 Amazon Linux 버전과 ARM 아키텍처도 확인하여 설치될 수 있도록 하였다. 

```sh .platform/confighooks/prebuild/00_hostname.sh
#!/bin/bash
ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`

sudo hostnamectl set-hostname "${ENVIRONMENT_NAME}_${INSTANCE_ID}"
```

```sh .platform/hooks/predeploy/01_newrelic.sh
#!/bin/bash
NEW_RELIC_LICENSE_KEY=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_LICENSE_KEY`
NEW_RELIC_APP_NAME=`/opt/elasticbeanstalk/bin/get-config environment -k NEW_RELIC_APP_NAME`

sed -i "s/^license_key:.*/license_key: ${NEW_RELIC_LICENSE_KEY}/g" /var/app/newrelic/newrelic.yml
sed -i "s/^app_name:.*/app_name: ${NEW_RELIC_APP_NAME}/g" /var/app/newrelic/newrelic.yml
```

> [호스트이름 로직](https://docs.newrelic.com/docs/apm/agents/java-agent/configuration/hostname-logic-java/)에 대해서는 조금 더 살펴보아야할 부분 같다. 문서 상으로는 newrelic.yml 에 process_host.display_name 속성을 추가로 기재해야한다. 기본적으로 host:port 를 참조하므로 EC2 인스턴스의 호스트이름 자체를 변경하였다.

#### Elastic Beanstalk 주의사항 정리

- 애플리케이션 소스 번들에 항상 Procfile을 포함시키기
- 소스 번들 크기가 500MB를 넘지 않도록 체크하기
- 환경 구성 시 샘플 애플리케이션으로 시작하기
- 환경 속성을 최대한 활용하도록 플랫폼 확장 스크립트 정의하기

> Elastic Beanstalk 배포 시 전환이 완료되기 까지 상당한 시간이 소요되는 건 너무 큰 단점 같다.
