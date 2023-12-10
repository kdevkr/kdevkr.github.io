---
title: Beanstalk Linux 플랫폼 확장에 대해서
date: 2023-12-10T22:00+0900
tags:
- AWS Beanstalk
- Java SE Platform
---

오래전에 [AWS Elastic Beanstalk Java SE 플랫폼 환경으로 애플리케이션 배포하기](/deploy-application-to-the-aws-elastic-beanstalk-java-se-platform-enviroment/)라는 글을 통해 [Elastic Beanstalk 플랫폼](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/concepts-all-platforms.html) 으로 애플리케이션 배포 구성을 하는 방법에 대해서 정리했었다. 오랜만에 신규 프로젝트로 인하여 빈스톡 구성에 대해서 살펴볼 기회가 있어서 리눅스 플랫폼의 확장 구성에 대해서 더 자세하게 학습하고 어떻게 이용할 수 있는지 정리해보고자 한다.

#### 플랫폼 확장

애플리케이션 소스 번들에 포함되는 .platform 또는 .ebextensions 폴더를 통해 [플랫폼에 대해서 확장을 지원](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/platforms-linux-extend.html)한다. Procfile 에서는 비용 절감을 위하여 여러개의 애플리케이션을 구동할 수도 있으며 플랫폼 후크를 통해 애플리케이션에서 필요한 설정이나 더 적합한 환경을 구성할 수 있다. 예를 들어 NLB 에서의 EC 키로 구성된 인증서를 지원하지 않음으로 인하여 Nginx 에서 처리할 수 있도록 설정할 수 있으며 시스템 모니터링을 위해 CloudWatch 이외에 Newrelic 또는 pinpoint와 같은 에이전트를 애플리케이션 실행할 수 있도록 설치할 수 있다.

```yaml .ebextensions/01_newrelic.config
files:
  "/var/app/current/newrelic.jar":
    mode: "000755"
    owner: webapp
    group: webapp
    source: https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar
  "/var/app/current/newrelic.yml":
    mode: "000755"
    owner: webapp
    group: webapp
    source: https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.yml

commands:
  01_configure_newrelic:
    command: |
      sed -i 's/<%= license_key %>/${NEW_RELIC_LICENSE_KEY}/g' /var/app/current/newrelic.yml
      sed -i 's/My Application/${NEW_RELIC_APP_NAME}/g' /var/app/current/newrelic.yml
```

#### 인스턴스 메타데이터 서비스 구성

현재 사용하고 있는 플랫폼 버전과 설정에 따라서 [IMDS에 대한 플랫폼 지원 여부](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/environments-cfg-ec2-imds.html#environments-cfg-ec2-imds.plat)를 확인해보는게 좋다. 플랫폼 확장 구성 시 인스턴스 메타데이터 서비스를 이용해야할 필요성이 요구된다면 `IMDSv2`를 이용해야하는 환경에서는 인스턴스 메타데이터 서비스 접근을 위한 토큰을 먼저 발급한 뒤에 인스턴스 메타데이터 서비스에 요청해야한다.

```yaml .ebextensions/00_init.config
option_settings:
  aws:autoscaling:launchconfiguration:
    DisableIMDSv1: true
```

```yaml .ebextensions/01_newrelic.config
commands:
  02_configure_newrelic_instance:
    command: |
      METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
      INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`
      ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
      NEW_RELIC_HOSTNAME="${ENVIRONMENT_NAME}_${INSTANCE_ID}"
      sed -i 's/^hostname:.*/hostname: $NEW_RELIC_HOSTNAME/g' /var/app/current/newrelic.yml
```

> 조직에서 구성한 Beanstalk 환경마다 IMDSv1 옵션 설정이 다름을 확인했으나 다행히도 인스턴스 메타데이터 서비스를 활용하는 부분은 없었다. 참고로, IMDSv1의 경우 권한을 요구하지 않으므로 보안 취약점에 해당하므로 IMDSv1 옵션을 비활성화하는 것을 권고한다.

#### 플랫폼 스크립트 도구  

앞서 뉴렐릭 에이전트 구성 시 호스트네임을 변경하기 위해서 환경 이름을 가져오는데 사용된 `/opt/elasticbeanstalk/bin/get-config`는 Amazon Linux 플랫폼을 사용하는 환경에 대해 AWS Elastic Beanstalk가 제공하는 도구이다. 플랫폼 혹은 컨테이너 정보를 조회하거나 환경 변수를 가져오는데 사용할 수 있다. 만약, 빈스톡에 의해 만들어진 EC2 인스턴스에 접속하여 현재 실행중인 애플리케이션 번들이 위치하는 폴더 또는 확인하고자 하는 로그가 어떤 위치에 있는지 알고 싶다면 아래와 같이 명령어를 수행하여 확인할 수 있다.

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

#### 인스턴스 배포 워크플로우

[인스턴스 배포 워크플로우](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/platforms-linux-extend.html#platforms-linux-extend.workflow)를 살펴보면 빈스톡에서 어떠한 과정으로 배포 단계를 거치는지를 설명한다. 앞서 구성 파일(.ebextensions)을 통해 뉴렐릭 에이전트를 설치하는 예시에 대해서 확인할 수 있었지만 배포 흐름 상 애플리케이션 배포 플랫폼 후크에서 에이전트와 구성 정보를 최신화하는게 적합할 수 있다. 

```sh .platform/hooks/predeploy/01_newrelic.sh
#!/bin/bash
METADATA_TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_ID=`curl -s -H "X-aws-ec2-metadata-token: $METADATA_TOKEN" http://169.254.169.254/latest/meta-data/instance-id`
ENVIRONMENT_NAME=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
NEW_RELIC_HOSTNAME="${ENVIRONMENT_NAME}_${INSTANCE_ID}"

sed -i 's/^license_key:.*/license_key: ${NEW_RELIC_LICENSE_KEY}/g' /var/app/current/newrelic.yml
sed -i 's/^app_name:.*/app_name: ${NEW_RELIC_APP_NAME}/g' /var/app/current/newrelic.yml
sed -i 's/^hostname:.*/hostname: $NEW_RELIC_HOSTNAME/g' /var/app/current/newrelic.yml
```

> 2022년 4월 29일 이후에 릴리스된 모든 Amazon Linux 2023 및 Amazon Linux 2 기반 플랫폼 버전의 경우 Elastic Beanstalk가 모든 플랫폼 후크 스크립트에 실행 권한을 자동으로 부여한다. 굳이 플랫폼 후크 스크립트 파일에 실행 권한을 설정하기 위해서 chmod +x 를 수행할 필요는 없다.

Elastic Beanstalk 플랫폼을 이용하는 경우에 뉴렐릭 자바 에이전트를 어떻게 구성하는가에 대한 궁금증으로 좀 더 자세하게 학습하였다. IMDSv2 와 같은 새로운 지식도 알게되는 좋은 기회였다고 생각된다. 본 학습으로 인해 현재 조직에서 구성한 빈스톡은 아쉬운 부분이 생각보다 많았다는 점을 발견하게 되었으며 조금씩 조치해가야하지 않을까 싶다.
