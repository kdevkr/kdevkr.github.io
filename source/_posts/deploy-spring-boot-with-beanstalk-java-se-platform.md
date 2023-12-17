---
title: Elastic Beanstalk Java SE 플랫폼으로 스프링 부트 배포하기
date: 2023-12-17T16:00+0900
tags:
- Spring Boot
- Elastic Beanstalk
---

> 오래 전 2017년에 작성한 [AWS Elastic Beanstalk Java SE 플랫폼 환경으로 애플리케이션 배포하기](/deploy-application-to-the-aws-elastic-beanstalk-java-se-platform-enviroment) 글이 지금에서는 참고할 만한 정보가 아니게 된 부분이 많아서 2023년 기준으로 올바른 정보들을 정리하여 작성한 글입니다. 

![](/images/posts/beanstalk-java-se-platform/aws-elastic-beanstalk-logo.jpg#compact)

아마존 웹 서비스의 Elastic Beanstalk 에서 제공하는 `Java SE 플랫폼`은 `실행 가능하도록 패키징되는 Jar와 War 파일`을 통해 스프링 부트 애플리케이션을 배포할 수 있도록 지원하는 환경이다. AWS 인프라 환경에서 Elastic Beanstalk 서비스는 개발자가 애플리케이션이 실행되는 환경을 빠르고 쉽게 구성하면서 애플리케이션을 배포하고난 후 성능 지표에 따라 오토스케일링 또는 프로비저닝할 수 있는 기능을 쉽게 적용할 수 있다. 본 글을 토대로 Elastic Beanstalk 경험이 부족한 초보 개발자 또는 회사에서 서비스를 담당하지 않았던 개발자들은 Elastic Beanstalk 환경으로 자바 웹 애플리케이션을 배포할 수 있는 환경을 구성하고 어떤 과정으로 애플리케이션을 배포할 수 있는지 이해할 수 있을 것이다.

#### Elastic Beanstalk UI Console

[EB CLI](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/eb-cli3.html)는 Elastic Beanstalk 콘솔 대신에 로컬에서 CLI 명령어를 사용하여 프로젝트에 대한 Beanstalk 환경 구성을 할 수 있게 지원한다. 하지만 Elastic Beanstalk에 대한 상세한 용어들을 이해하고 있어야하므로 처음에 익숙하지 않은 개발자들은 UI 콘솔에 의존하기를 바란다. UI 콘솔을 이용해도 처음에는 수 많은 오류들을 경험하고 환경을 종료한 뒤 다시 만들어야할 수 있다.

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/00.png)

> 위와 같이 몇 분 만에 웹 애플리케이션을 손쉽게 배포하기 어려울 수 있는데 그 주된 이유에는 선택하는 옵션에 따른 제한과 올바르지 않은 구성에 대해서 개발자에게 알려주지 않는다. 예를 들어, 프리티어 사용자의 경우 사전 설정으로 단일 인스턴스를 선택할 수 있다고는 되어있지만 인스턴스 서브넷이 위치하는 AZ에 따라 프리티어 대상인 t2.micro 선택이 불가능할 수 있다. 프리티어 개념에 대해서 잘 이해하고 있지 않은 개발자가 t3.micro를 선택해버리면 프리티어 환경이 아닌 사용자 정의 환경으로 안내 메시지 없이 전환된다.

#### 샘플 애플리케이션으로 시작하기

자바 웹 애플리케이션을 배포하기 위해서 `웹 서버 환경`과 `Java 플랫폼 유형`을 선택하고 프로젝트에 맞는 자바 버전과 함께 `Amazon Linux 2023` 그리고 `샘플 애플리케이션`으로 시작하는 것을 권장한다. Elastic Beanstalk 에 대해서 경험이 있어도 CloudFormation에 의존하는 Beanstalk 구성의 특성 상 처음부터 환경이 구성되지 않을 수도 있다. 

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/02.png)

> 참고로 __Amazon Linux 2은 2025년 지원 종료(EOL) 예정__ 이므로 환경 구성 확장 시 패키지 설치가 어렵다면 Amazon Linux 2를 선택해도 아직까지는 괜찮습니다. 또한, Elastic Beanstalk 환경 구성을 완료했어도 여러번 환경을 재 구성해보기를 바랍니다.

#### 애플리케이션 소스 번들

애플리케이션을 배포하는 경우 단일 Jar 파일 보다는 애플리케이션 소스 번들을 구성하여 업로드하는 것을 권장한다. 일반적으로 JVM Option 을 적용할 필요가 생기므로 Procfile에 기본적인 자바 애플리케이션 명령어를 정의해놓고 환경 속성을 통해 사용자 정의하는 구성을 추천한다.

```config Procfile
web: java -Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true -Xmx1g -jar app.jar
```

> 공식 문서에 포함되어있는 내용은 아니지만 자바 옵션은 ___JAVA_OPTIONS__ 또는 __JAVA_TOOL_OPTIONS__ 환경 속성으로 대체할 수 있습니다. 그러므로 굳이 자바 옵션을 조정하기 위해서 애플리케이션 소스 번들의 Procfile을 수정할 필요는 없답니다. [Elastic Beanstalk Configuration files(.ebextensions)](https://woowabros.github.io/woowabros/2017/08/07/ebextension.html)에서도 뉴렐릭 자바 에이전트를 실행하기 위해서 Procfile에 정의하지만 JAVA_TOOL_OPTIONS 환경 속성을 이용하는 것이 더 유연한 구성이 될 겁니다.

#### 서비스 액세스 구성 

Elastic Beanstalk 이 개발자 대신에 EC2 인스턴스를 만들고 오토스케일링이 가능한 인프라를 구성하기 위해서는 [서비스 역할](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/concepts-roles-service.html) 뿐만 아니라 E2 인스턴스 프로파일에 대한 IAM 이 필요하다. 예전에는 EC2 인스턴스 프로파일에 사용될 역할도 자동으로 만들어주었으나 AWS 보안 정책 변경으로 인해 `aws-elasticbeanstalk-ec2-role`을 만들어주지 않는다고 한다. (참고 - https://stackoverflow.com/a/76620598)

##### aws-elasticbeanstalk-service-role

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/05.png)

> 서비스 역할을 자동 생성하는 경우에도 위 이미지와 다르게 AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy 가 정책으로 포함되는 것 같네요. AWSElasticBeanstalkService 가 포함되어있다면 오래전에 이미 생성했음을 의미합니다.

##### aws-elasticbeanstalk-ec2-role

EC2 인스턴스 프로파일로 지정하는 IAM 역할에는 신뢰할 수 있는 엔터티로 ec2.amazonaws.com 서비스를 등록해야하며 구성하고자 하는 환경에 따라 아래의 세가지 정책을 권한으로 등록해야한다. 이에 대한 정보는 [Elastic Beanstalk 인스턴스 프로파일 관리](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/iam-instanceprofile.html)에 설명되어있다.

- AWSElasticBeanstalkWebTier
- AWSElasticBeanstalkWorkerTier
- AWSElasticBeanstalkMulticontainerDocker

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/06.png)

> 기본적으로는 aws-elasticbeanstalk-service-role 과 aws-elasticbeanstalk-ec2-role 이라는 이름의 역할을 찾아 선택해주는 것 같습니다. 만약 별도의 이름을 가진 IAM 역할을 만드는 경우에는 잘못 선택하지 않도록 주의해야합니다. 웹 UI 콘솔에서는 잘못된 IAM 역할을 선택하는 걸 검증해주지 않습니다.

#### 퍼블릭 서브넷

단일 인스턴스가 아닌 로드 밸런서를 통해 오토스케일링이 가능한 환경을 구성하고자 하는 경우라면 퍼블릭 서브넷을 지정하는 것에 주의해야할 필요가 있다. UI 콘솔도 모든 것에 친절하지는 않아서 가시성을 퍼블릭으로 선택하더라도 인터넷 게이트웨이가 연결되지 않은 프라이빗 서브넷도 선택 옵션으로 노출되므로 퍼블릭 서브넷이 아닌 것을 선택하지 않도록 주의해야한다.

- 단일 인스턴스이면서 인스턴스 서브넷이 프라이빗 서브넷으로 지정되는 경우 - 환경 생성 불가
- 고가용성 설정이면서 로드밸런서 서브넷이 프라이빗 서브넷으로 지정되는 경우 - 환경 생성 가능

> 올바른 가용 영역의 서브넷으로 구성했는지 VPC 구성을 검토하셔야합니다. 인스턴스 서브넷과 로드밸런서 서브넷 모두 잘못된 서브넷을 선택하는 것을 UI 웹 콘솔에서는 검증해주지 않습니다. 환경이 만들어지더라도 Elastic Beanstalk 에서도 올바른 전환이 어려울 수 있어 주의해야할 선택 항목입니다.

#### 인스턴스 루트 볼륨

인스턴스 트래픽 및 크기 조정 구성 메뉴에서 선택사항이긴 하나 루트 볼륨의 크기가 8GB 인 것에 주의할 필요가 있다. 일반적으로 8GB 이어도 충분하다고 생각되지만 예기치 않은 상황을 방지하기 위해서 범용 3(SSD) 및 30GB 이상의 크기를 가지는 것을 권장한다. 

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/07.png)

> 인스턴스 메타데이터 서비스(IMDS)는 IMDSv2를 사용하도록 IMDSv1 비활성화 선택 기본값을 그대로 유지하는 걸 권장합니다. 인스턴스 메타데이터 서비스는 플랫폼 확장 시 인스턴스 정보를 조회하는데 사용할 수 있습니다. 더 자세한 내용이 궁금하다면 [Beanstalk Linux 플랫폼 확장에 대해서](/beanstalk-platforms-linux-extend/) 글을 참조하세요.

#### EC2 인스턴스 확인

Elastic Beanstalk 환경의 이벤트에 환경 구성에 대한 성공 메시지를 확인했다면 도메인 주소를 클릭하여 샘플 애플리케이션에 의한 Congratulations 화면이 노출되는지 확인해야한다. 환경이 생성되었어도 구성 상 이상한 설정이 있다면 EC2 인스턴스에 접속하여 eb-engine(/var/log/eb-engine.log)를 살펴보아야 한다. 다음과 같이 /opt/elasticbeanstalk/bin/get-config 도구로 EC2 컨테이너에서 살펴보아야할 로그 파일 목록을 알 수 있다.

```sh /opt/elasticbeanstalk/bin/get-config
[root@ip-10-0-2-119 ~]# /opt/elasticbeanstalk/bin/get-config --output YAML container
common_log_list:
    - /var/log/eb-engine.log
    - /var/log/eb-hooks.log
default_log_list:
    - /var/log/nginx/access.log
    - /var/log/nginx/error.log
    - /var/log/web.stdout.log
environment_name: Ss-env
instance_port: "80"
log_group_name_prefix: /aws/elasticbeanstalk
proxy_server: nginx
static_files:
    - ""
xray_enabled: "false"
```

> 환경 생성이 완료되었을때도 eb-engine 로그를 살펴보고 어떻게 애플리케이션을 배포했는지 확인해보는게 좋습니다. Java SE 플랫폼 환경에서는 Nginx를 리버스 프록시로 구성하고 애플리케이션이 5000 포트로 실행된다는 가정으로 트래픽을 전달합니다. 참고로 샘플 애플리케이션은 EC2 인스턴스 내에서 빌드되어 실행되는 것으로 확인할 수 있습니다.

#### 애플리케이션 빌드 및 배포

샘플 애플리케이션 배포가 완료되었다면 우리가 개발한 자바 웹 애플리케이션을 빌드하고 배포해야한다. 아직까지는 플랫폼 확장이 필요하지 않다는 가정하에 애플리케이션을 패키징하고 애플리케이션 소스 번들을 압축 파일로 만드는 것을 알아보자. 애플리케이션 소스 번들에는 Procfile과 실행 가능하도록 패키징된 Jar 또는 War 파일을 포함하여야 한다.

- Procfile
- application.jar

애플리케이션 소스 번들은 압축 명령어로도 만들 수 있으나 Gradle 을 사용중이라면 Zip 태스크를 이용해서 Beanstalk 배포를 위한 빌드 태스크를 만들어서 실행할 수 있다. 다음은 gradle-8.5 기준으로 작성한 태스크 예시이다.

```groovy build.gradle
tasks.register('procfile') {
    bootJar.archiveFileName.set('application.jar')
    dependsOn 'bootJar'
    doFirst {
        new File("build/libs", "Procfile").text = "web: java -jar ${bootJar.archiveFileName.get()}"
    }
}

tasks.register('zipSourceBundle', Zip) {
    dependsOn 'clean'
    dependsOn 'procfile'
    from('build/libs') {
        include('application.jar')
        include('Procfile')
    }
    archiveBaseName = 'beanstalk'
}
```

```sh Terminal
./gradlew zipSourceBundle
```

> 다른 Elastic Beanstalk 관련 글과는 다르게 Procfile에 JVM 옵션을 정의하지 않았는데 Java SE 플랫폼의 JVM 특성 상 자바 환경 변수를 통해 별도로 주입이 가능하기 때문입니다. Elastic Beanstalk 문서에는 별도로 기재되어있지는 않지만 JVMTI 표준 스펙인 JAVA_TOOL_OPTIONS 또는 _JAVA_OPTIONS 환경 변수를 이용할 수 있습니다.

#### 애플리케이션 환경 속성

애플리케이션 소스 번들을 업로드하기 전에 샘플 애플리케이션을 배포중인 상태에서 환경 속성을 먼저 등록하는 것을 추천한다. 앞서 애플리케이션 소스 번들에는 프로파일 지정이나 JVM 옵션을 정의하지 않았기 때문에 올바르게 실행될 수 있도록 해야한다. 구성 → 업데이트, 모니터링 및 로깅 → 플랫폼 소프트웨어 → 환경 속성에 JAVA_TOOL_OPTIONS를 추가하자. 환경 속성을 추가하는 것은 EC2 인스턴스를 종료하지 않고 애플리케이션 배포 과정만 다시 수행하게 된다.

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/08.png)

```sh
[root@ip-10-0-2-119 ~]# jps -v
6226 Jps -Dapplication.home=/usr/lib/jvm/java-17-amazon-corretto.x86_64 -Xms8m -Djdk.module.main=jdk.jcmd
6148 sample-app-1.0-jar-with-dependencies.jar -Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true -Xms250m -Xmx250m
```

> 위 이미지 상에는 JAVA_TOOL_OPTIONS 와 _JAVA_OPTIONS를 활용할 수 있음을 보여주기 위해 별도로 나누어서 사용했습니다. 혼용해서 사용하는 경우 JAVA_TOOL_OPTIONS이 먼저 나열되고 그 다음에 _JAVA_OPTIONS 이 적용되므로 순서에 주의해야할 필요가 있습니다. 개인적으로는 JAVA_TOOL_OPTIONS 만 사용하는 것을 권장합니다.

#### 플랫폼 확장 - 리버스 프록시 구성

애플리케이션이 5000 포트를 사용하지 않는다면 PORT 환경 변수로 지정하거나 리버스 프록시 구성으로 제공하는 기본 Nginx 설정을 대체할 수 있다. [Beanstalk Linux 플랫폼 확장에 대해서](/beanstalk-platforms-linux-extend/) 처럼 아래의 두개의 파일을 애플리케이션 소스 번들에 포함시켜도 된다.

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

```groovy build.gradle
tasks.register('zipSourceBundle', Zip) {
    dependsOn 'clean'
    dependsOn 'procfile'
    from('build/libs') {
        include('application.jar')
        include('Procfile')
    }
    from('beanstalk') {
        include('.platform/nginx/conf.d/upstream.conf')
        include('.platform/nginx/conf.d/elasticbeanstalk/00_application.conf')
    }
    archiveBaseName = 'beanstalk'
}
```

기본으로 제공하는 nginx.conf 에 의존하되 미리 정의되어있는 00_application.conf 파일이 대체되도록 zipSourceBundle 태스크를 수정하였다. 애플리케이션 배포에 성공하였다면 도메인 주소 또는 EC2 인스턴스에 접속해보면 샘플 애플리케이션에서 우리가 패키징하여 전달한 애플리케이션 파일이 실행되고 있음을 확인할 수 있다.

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/09.png)

```sh
[root@ip-10-0-2-119 ~]# jps -v
6964 application.jar -Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true -Xms250m -Xmx250m
7109 Jps -Dapplication.home=/usr/lib/jvm/java-17-amazon-corretto.x86_64 -Xms8m -Djdk.module.main=jdk.jcmd
```

> 여러분의 애플리케이션 배포를 완료했다면 [Beanstalk Linux 플랫폼 확장에 대해서](/beanstalk-platforms-linux-extend/)를 참고해보세요. 애플리케이션에 더 적합한 환경을 구성할 수 있는 방법을 알 수 있습니다.

#### Elastic Beanstalk 시작하기 트러블 슈팅

##### 인스턴스 서브넷의 가용 영역에서 지원하지 않는 EC2 유형 문제

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/10.png)

Elastic Beanstalk 환경 구성 시 인스턴스 서브넷으로 선택한 가용 영역 목록에 따라서 지원하지 않는 EC2 유형은 선택할 수 없다. 다만, x86_64 아키텍처를 선택해두어도 arm 아키텍처에 해당하는 XXg 인스턴스 유형이 목록에 표시되어 선택할 수 있지만 환경 생성 시 오류가 발생하여 확인을 요구한다. 또한, 프리티어 사용자의 경우 단일 인스턴스(프리티어 사용 가능) 사전 설정을 선택하는 경우에도 인스턴스 서브넷이 ap-northeast-2a 만 선택되어있지 않는다면 프리티어 대상인 t2.micro 유형을 선택할 수 없다.

> 프리티어 사용자가 단일 인스턴스로 선택하고나서 인스턴스 서브넷을 잘못 지정하더라도 t3.micro 와 t3.small 을 기본적으로 선택하고 있습니다. 사용자 경험 상 ap-northest-2a 를 선택하더라도 t2.micro를 기본으로 부여해주지 않기 때문에 주의해야할 선택 항목에 해당합니다.

환경 생성 이후에는 프로세서 아키텍처를 변경할 수 없으므로 인스턴스 유형이 제한된다는 것을 알고 있어야 한다. 환경을 생성할 당시에는 선택된 아키텍처 이외에 지원하지 않는 EC2 인스턴스 유형도 선택할 수 있도록 목록에는 표시되고 있어 주의가 필요하다. 프로세서 아키텍처를 arm64 로 선택하는 경우에도 선택된 AZ에 ap-northeast-2d 가 포함되어있다면 지원하지 않는 유형에 t4g가 포함되어 있기 때문에 t4g.micro를 기본으로 선택해주지 않는다.

#### 인스턴스 서브넷과 로드밸런서 서브넷의 퍼블릭 여부 문제

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/11.png)

인스턴스 서브넷과 로드밸런서 서브넷 모두 퍼블릭으로 선택하는 것은 인터넷 요청을 처리하기 위함이므로 인터넷 게이트웨이에 연결되어있는 퍼블릭 서브넷을 지정해야한다. 웹 UI 콘솔 상 선택하는 서브넷이 인터넷 게이트웨이가 연결되었는지까지는 확인해주지 않으므로 올바르지 않은 구성으로 환경 생성을 시작할 수 있다. 만일, 단일 인스턴스로 퍼블릭 체크를 한 후 인스턴스 서브넷을 인터넷 게이트웨이가 연결되지 않은 프라이빗 서브넷으로 선택하는 경우 Elastic Beanstalk 이 환경 생성을 시도하다가 멈추는 상황을 만날 수 있다.

```
The EC2 instances failed to communicate with AWS Elastic Beanstalk, either because of configuration problems with the VPC or a failed EC2 instance. Check your VPC configuration and try launching the environment again.
```

> Elastic Beanstalk 이 환경 생성에 문제가 있는 경우 개발자가 직접 CloudFormation 에서 해당 스택을 찾아 삭제를 시도해야합니다. Elastic Beanstalk 서비스가 CloudFormation 에 의한 코드 기반 구성에 의존하기 때문이며 Elastic Beanstalk 이 환경을 업데이트하는 도중에는 웹 UI 콘솔 기능이 제한해두었기 때문입니다.

##### 상태 보고 기본 선택 시 관리형 업데이트 설정 불가

![](/images/posts/deploy-spring-boot-with-beanstalk-java-se-platform/12.png)

상태 보고 옵션을 `시스템 강화됨`에서 기본으로 선택하고나서 `관리형 업데이트`를 활성화를 유지하는 경우 UI 콘솔 상 설명을 제공하지 않아도 환경 생성 시도 시 오류가 발생한다. 관리형 업데이트를 설정하고자 하는 경우에는 반드시 상태 보고를 시스템 강화됨으로 설정해야한다.

```sh 상태 보고 시스템 기본 선택 시 관리형 업데이트 불가
Invalid option specification (Namespace: 'aws:elasticbeanstalk:managedactions', OptionName: 'ManagedActionsEnabled'): Managed platform updates require enhanced health reporting (option SystemType in namespace aws:elasticbeanstalk:healthreporting:system).
```

#### Elastic Beanstalk 환경 구성에 대하여

많은 개발자들이 Elastic Beanstalk 환경을 구성하는 것에 대한 글을 참고하며 따라하겠지만 리눅스 커널 튜닝이나 리버스 프록시 구성과 같은 플랫폼 확장에 대해서는 단순히 따라하기보다는 그것이 반드시 필요한지를 고민해볼 필요가 있다. 오래된 글이 많기 때문에 최신 리눅스 커널의 경우에는 리눅스 커널 파라미터 조정이 필요하지 않을 정도로 기본값이 설정되어있다. 애플리케이션 운영에 문제가 없는데도 불구하고 리눅스 시스템을 최적화한다고 시도해놓으면 왜 그 설정이 필요한지 이해하지 못하는 환경을 만들게 된다.

또한, 언제나 Elastic Beanstalk 에 의한 애플리케이션 운영 시 예기치 않은 상황이 발생할 수 있으므로 문제에 대한 원인을 찾아가기 쉽도록 어떤 정보들을 참고할 수 있는지를 미리 인지하는게 좋다. 가장 기본적으로는 Elastic Beanstalk 에서 제공하는 이벤트 정보로 구별할 수 있고 더 나아가서는 직접 EC2 인스턴스까지 접근할 수 있는 방안을 마련해두는 것이 필요하다. [Elastic Beanstalk 환경에서 Amazon EC2 인스턴스 로그 보기](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/using-features.logging.html?icmpid=docs_elasticbeanstalk_console)는 직접 EC2 인스턴스에 접근하지 않아도 일련의 로그들을 조회할 수 있는 좋은 방법이다.

모든 개발자가 어떤 기술을 사용한다고해서 동일한 경험을 할 수 있는게 아니므로 지속적인 학습은 중요한 듯 싶다.