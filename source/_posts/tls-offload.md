---
title: TLS 오프로드
date: 2021-09-01
tags:
 - TLS
 - ELB
 - Nginx
---

안녕하세요 Mambo 입니다.

오늘은 로드밸런서를 활용한 TLS 오프로드에 대해서 정리해보고자 합니다. 지난 [SSL 인증서](../ssl-certificate)에서는 HTTPS를 웹 서비스에 적용하는 이유와 함께 SSL 인증서를 발급하고 TLS 핸드쉐이크를 어떤 방식으로 수행하는지를 확인했습니다. 이 글에서는 **아마존 웹 서비스의 ELB(Elastic Load Balancing)에서 지원하는 TLS 핸드쉐이크 및 TLS 오프로딩 기능**에 대해 알아보고 참고해야할 정보를 소개합니다.

## SSL 오프로드
**TLS(SSL) 오프로드**는 애플리케이션 서버에서 TLS 핸드쉐이크를 수행하지 않고 **트래픽이 전달되기 전 로드밸런서에서 SSL 인증서를 관리하고 TLS 핸드쉐이크를 수행**하는 것을 말합니다. 대부분의 웹 서비스는 애플리케이션 서버를 독립적으로 운용하지 않고 트래픽 규모에 따라 유연하게 확장하고 확장된 애플리케이션 서버에 트래픽을 균등하게 분산시키기 위하여 로드밸런서를 구성합니다. 아마존 웹 서비스의 ELB 로드밸런서 유형 중 NLB와 ALB는 SSL 인증서를 등록하고 클라이언트와 TLS 핸드쉐이크를 수행하여 트래픽이 EC2 인스턴스 또는 컨테이너로 전달하는 **TLS 오프로딩 기능을 지원**합니다.

### Mutual TLS
웹 서비스의 요구사항에 따라 애플리케이션 서버에서는 **클라이언트의 X.509 인증서를 토대로 사용자 인증을 수행하고 요청을 처리**할 수 있습니다. 이렇게 클라이언트와 애플리케이션 서버 모두 인증서를 전달하는 것을 **Mutual TLS**라고 합니다. 그리고 자바 기반의 애플리케이션 서버는 **javax.servlet.request.X509Certificate** 속성을 통해 **X.509 인증서**를 가져올 수 있습니다. 

그러나 웹 요청이 로드밸런서에 의해 트래픽이 전달되는 경우 클라이언트 인증서를 포함하여 전달하는 것이 보장되지 않습니다. 일반적으로 Nginx를 로드밸런서를 사용하는 경우에는 요청 시 포함된 클라이언트의 인증서 정보가 **X-SSL-CERT**와 같은 **비표준 헤더**로 전달될 수 있도록 설정합니다. 이렇게 요청 헤더로 인증서를 애플리케이션 서버까지 전달하는 것은 애플리케이션 서버에서 클라이언트의 실제 아이피를 알기 위하여 사용되는 표준 헤더 **X-Forwarded-For**와 비슷한 목적으로 사용된다고 볼 수 있습니다.

### AWS NLB
아마존 웹 서비스의 [NLB(Network Load Balancer)](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/network/introduction.html)는 **L4 레벨의 ELB 로드밸런서 유형**입니다. NLB는 L4 레벨에서 로드밸런싱을 수행하며 프로토콜과 포트를 기반으로 지정된 하나 이상의 대상 그룹으로 요청을 전달하기 때문에 대규모 트래픽을 빠르게 EC2 인스턴스로 전달되도록 지원합니다. 

[ELB의 로드밸런서 유형 비교](https://aws.amazon.com/ko/elasticloadbalancing/features/#Product_comparisons)에서 나와있듯이 NLB는 TLS 오프로드를 지원하기 때문에 **로드밸런서에 인증서를 등록하고 TLS 핸드쉐이크를 처리하도록 구성**할 수 있게 됩니다. 다음과 같이 NLB의 리스너 설정 시 **TLS 프로토콜**을 선택하고 **TLS 버전**과 암호화 스위트 목록에 대한 **보안 정책** 그리고 **SSL 인증서**를 등록할 수 있습니다.

![](/images/posts/tls-offload/tls-offload-01.png)

#### ECC 인증서 미지원
TLS 오프로드를 지원한다고 나와있지만 **모든 SSL 인증서를 지원하는 것은 아닙**니다. 회사에서 사용중인 인증서와 같은 타원 곡선형 키를 사용하는 ECC 인증서를 등록하게 되면 아마존 웹 서비스로부터 알림을 받게되고 **애플리케이션 서버로 트래픽이 전달되지 않는 상태**가 될 수 있습니다.

![](/images/posts/tls-offload/tls-offload-02.png)

NLB에 대한 리스너 설정 문서를 살펴보면 **2048 이상의 비트를 사용하는 RSA 키 또는 EC 키로된 인증서를 지원하지 않는다**라고 경고하고 있으며 문서를 살펴보기까지 이러한 정보를 확인할 수 있는 곳은 없었습니다.

![](/images/posts/tls-offload/tls-offload-03.png)

의외로 많이 사용하고 있는 **ECC 인증서에 대해서는 NLB에서 TLS 오프로드를 수행할 수 없기** 때문에 애플리케이션 서버에서 SSL 인증서를 관리하고 TLS 핸드쉐이크를 수행해야합니다. 애플리케이션 서버 배포 시 Elastic Beanstalk을 사용하는 경우 [Java SE 플랫폼](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/java-se-platform.html)을 통해 EC2 인스턴스에 **Nginx를 활용하여 역방향 프록시를 구성**할 수 있기 때문에 반드시 애플리케이션 서버에서 TLS 핸드쉐이크를 수행해야하는 것은 아닙니다.

> 회사에서 운영중인 웹 서비스는 Nginx를 사용하지 않고 NLB에서 애플리케이션 서버로 트래픽이 전달되도록 구성했었지만 애플리케이션 서버 규모가 커짐으로 인하여 내부적으로 동작하는 작업이 많아짐에 따라 TLS 핸드쉐이크 부하를 애플리케이션 서버에서 분리하기 위하여 Nginx에서 TLS 오프로드를 수행하도록 전환할 예정입니다.

### AWS ALB
ECC 인증서를 지원하지 않는 NLB와 다르게 ALB(Application Load Balancer)는 **4096 비트 키 길이의 RSA 인증서와 ECDSA로 서명된 EC 인증서를 지원**합니다. **회사에서 운영중인 웹 서비스를 NLB에서 ALB로 전환하지 않는 이유**는 완전한 마이크로서비스 아키텍처가 아니므로 **경로 기반**으로 별도의 애플리케이션 서버로 전달해야하는 **요구사항이 없기** 때문입니다. 이러한 이유로 인해 빠르게 로드밸런서에서 애플리케이션 서버로 트래픽이 전달되도록 NLB를 사용하고 있습니다.

IT 분야는 시간이 지나면서 기술이 점차 발전하고 있습니다. 아마존 웹 서비스가 제공하는 서비스 기능도 발전하고 있음을 확인할 수 있는데 2019년에 작성된 [고정 세션 관련 글](https://lemontia.tistory.com/898)에서는 NLB가 **고정 세션 기능을 지원하지 않는다**고 나와있지만 현재 ELB의 제품 비교표와 비교해보면 **백엔드 암호화, 고정 세션 뿐만 아니라 다양한 기능을 지원**하고 있습니다.

#### ELB TLSv1.3 미지원
아마존 웹 서비스의 ELB에서 TLS 오프로드 기능을 지원하지만 [보안 정책](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/create-https-listener.html#describe-ssl-policies)에 따라 TLS 핸드쉐이크를 수행하기 때문에 클라이언트는 TLS 1.3을 사용할 수 없습니다. **TLS 1.3을 지원하기 위한 작업은 아직 진행중**이므로 클라이언트에게 TLS 1.3을 지원하고자하는 경우에는 ELB에서 TLS 오프로드를 수행하도록 구성할 수 없고 NLB의 TCP 리스너를 설정하여 트래픽이 EC2 인스턴스로 전달되도록하고 **EC2 인스턴스에 실행되어있는 Nginx를 통해 TLS 1.3을 사용할 수 있게 구성**할 수 있습니다.

## Elastic Beanstalk TLS 오프로드
ELB에서는 TLS 1.3을 지원하지 않으며 NLB에서는 ECC 인증서를 사용할 수 없다는 것을 알았으므로 **Elastic Beanstalk**으로 스프링 애플리케이션 배포 시 Nginx에서 SSL 인증서를 관리하고 **클라이언트가 TLS 1.3 버전으로 TLS 핸드쉐이크를 수행할 수 있도록 할 수 있는가를 검증**해보고 마무리 하겠습니다.

### Elastic Beanstalk Java SE 플랫폼
스프링 애플리케이션을 배포하기 위해서는 Java SE 플랫폼 환경을 구성해야합니다. 이때, 샘플 애플리케이션으로 Beanstalk 환경을 시작하는 것이 좋습니다.

![웹 서버 환경 선택](/images/posts/tls-offload/tls-offload-04.png)

![샘플 애플리케이션으로 시작](/images/posts/tls-offload/tls-offload-05.png)

Beanstalk 환경 구성 시 로드밸런서를 설정하고 싶은 경우 **추가 옵션 구성**을 통해 사용자 정의 설정을 진행해야 합니다.

![JVM 옵션 환경변수](/images/posts/tls-offload/tls-offload-06.png)

> 배포하고 보니 오타가 있었네요 :)

![로드밸런싱 인스턴스](/images/posts/tls-offload/tls-offload-07.png)

![NLB 선택 및 리스너 구성](/images/posts/tls-offload/tls-offload-08.png)

그리고 EC2 인스턴스 접근을 위한 키를 설정하는 등 부가 설정을 하고 환경을 생성하면 다음과 같이 샘플 애플리케이션이 배포되는 환경이 준비됩니다.

![Java SE 플랫폼 환경 생성 완료](/images/posts/tls-offload/tls-offload-09.png)

> 처음 환경을 구성할 때 오류가 발생하는 경우 Beanstalk에서는 환경 삭제 버튼이 활성화되지 않아 당황할 수 있으나 CloudFormation 서비스로 이동하여 Beanstalk 환경을 구성중인 스택을 삭제할 수 있습니다.

### 스프링 애플리케이션 패키징 및 Java SE 플랫폼 확장
애플리케이션을 배포하기 위한 Java SE 플랫폼이 생성되었으니 스프링 애플리케이션을 패키징하여 **Beanstalk에 배포하기 위한 소스 번들** 파일을 만들어야 합니다. 소스 번들에는 패키징된 애플리케이션 Jar 파일과 함께 애플리케이션 실행를 위한 Procfile을 포함시켜야 합니다.

```groovy build.gradle
task procfile(dependsOn: bootJar) {
    doFirst {
        new File("build/libs", "Procfile").text = "web: java -Xmx1g -Dfile.encoding=UTF-8 -jar ${bootJar.archiveName}"
    }
}

task awsbuild(type: Zip, dependsOn: procfile) {
    from ('.beanstalk/.ebextensions') { into '.ebextensions' }
    from ('.beanstalk/.platform') { into '.platform' }
    from ('build/libs') {
        include('Procfile')
        include(bootJar.archiveName)
    }
    baseName = 'beanstalk'
}
```

> 자세한 내용은 [Procfile을 사용하여 애플리케이션 프로세스 구성](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/java-se-procfile.html)을 참고하세요. 

#### Java SE 플랫폼 확장 구성
Beanstalk는 **.ebextensions**와 **.platform**을 활용하여 EC2 인스턴스 환경을 확장할 수 있는 기능을 지원합니다. 우리는 HTTP로 실행되는 애플리케이션 서버와 함께 TLS 오프로드를 수행할 Nginx를 구성해야하므로 다음과 같이 **구성 및 플랫폼 확장 파일을 생성**합니다.

**Nginx에서 사용할 SSL 인증서 파일 생성**
```yaml beanstalk/.ebextensions/nginx-certificates.config
files:
    /etc/nginx/cert/server.crt:
        mode: "000400"
        owner: nginx
        group: nginx
        content: |
            -----BEGIN CERTIFICATE-----
            #### PROTECTED ####
            -----END CERTIFICATE-----
    /etc/nginx/cert/server.key:
        mode: "000400"
        owner: nginx
        group: nginx
        content: |
            -----BEGIN EC PARAMETERS-----
            #### PROTECTED ####
            -----END EC PARAMETERS-----
            -----BEGIN EC PRIVATE KEY-----
            #### PROTECTED ####
            -----END EC PRIVATE KEY-----
    /etc/nginx/cert/server-ca-bundle:
        mode: "000400"
        owner: nginx
        group: nginx
        content: |
            -----BEGIN CERTIFICATE-----
            #### PROTECTED ####
            -----END CERTIFICATE-----
            -----BEGIN CERTIFICATE-----
            #### PROTECTED ####
            -----END CERTIFICATE-----
            -----BEGIN CERTIFICATE-----
            #### PROTECTED ####
            -----END CERTIFICATE-----

commands:
    00-chain-ca-bundle:
        cwd: /etc/nginx/cert
        command: |
            cat server.crt server-ca-bundle > server-ca.pem
            chown nginx:nginx server-ca.pem
            chmod 400 server-ca.pem
    99-remove-bak:
        cwd: /etc/nginx/cert
        command: rm -f *.bak
```

> 회사 도메인에 대한 인증서이므로 인증서 내용은 마스킹 처리하였습니다.

**Nginx 설정 파일 확장**
```nginx beanstalk/.platform/nginx/conf.d/elasticbeanstalk/00_application.conf
location / {
    return 301 https://$host$request_uri;
}
```

기본으로 만들어지는 00_application.conf 파일은 80 포트에 대하여 5000 포트로 전달되도록 구성하므로 443 포트로 리다이렉트하도록 확장합니다.

```nginx beanstalk/.platform/nginx/nginx.conf
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
        server_name              springboot;
        ssl_certificate          /etc/nginx/cert/server-ca.pem;
        ssl_certificate_key      /etc/nginx/cert/server.key;
        ssl_protocols            TLSv1.2 TLSv1.3;
        ssl_ciphers              HIGH:!aNULL:!MD5;
        ssl_verify_client        optional_no_ca;

        location / {
            proxy_pass          http://127.0.0.1:5000;
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

> 자세한 내용은 [Elastic Beanstalk Linux 플랫폼 확장](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/platforms-linux-extend.html)을 참고하세요. [elastic-beanstalk-samples](https://github.com/awsdocs/elastic-beanstalk-samples)처럼 샘플 파일도 공유되어있습니다.

이제 샘플 애플리케이션 대신 우리가 준비한 애플리케이션 소스 번들을 업로드하면 Benstalk 엔진이 소스 번들을 추출하고 애플리케이션을 실행하게 됩니다. Route 53으로 Beanstalk 환경 주소를 DNS로 연결하고 접속해보면 다음과 같이 TLS 핸드쉐이크가 수행되었음을 확인할 수 있습니다.

![](/images/posts/tls-offload/tls-offload-10.png)

NLB는 트래픽을 EC2 인스턴스의 443 포트로 전달했을 뿐 TLS 오프로드는 Nginx에서 수행하는 것으로 구성했기 때문에 브라우저에서는 TLS 1.3 버전으로 TLS 핸드쉐이크를 수행했습니다. 이렇게 **아마존 웹 서비스에서 TLS 1.3을 지원하기 위해서는 NLB의 TCP 리스너와 Nginx의 TLS 오프로드를 활용하면 가능함을 검증**했습니다.

#### 트러블슈팅
Elastic Beanstalk로 애플리케이션 배포하는 과정에서 생각보다 오류가 많을 수 있습니다. 이 내용은 **Benstalk에서 애플리케이션 배포 시 발생하는 여러가지 문제를 해결하는데 도움이 되는 항목**을 정리한 것입니다. 따라해보는 분들에게 도움이 되셨으면 하는 바램으로 공유합니다.

|경로|용도||
---|---|---
|/etc/nginx/|Nginx 구성||
|/var/app/current|애플리케이션 소스 번들 추출 경로||
|/var/log/eb-engine.log|Beanstalk 로그||
|/var/log/nginx|Nginx 로그||
|/var/log/web.stdout.out|웹 애플리케이션 로그||

**Beanstalk 로그**는 Beanstalk 엔진이 플랫폼 확장 파일들을 실행하고 성공했는지 여부를 기록합니다. 이 로그를 통해 어느 단계에서 오류가 발생하여 애플리케이션 배포 및 전환이 실패하였는지 확인할 수 있는 중요한 로그입니다. 그리고 나머지 항목을 통해 설정한 구성 및 확장 파일이 제대로 추출되어 복사되었는지 Nginx가 ELB에 의해 전달된 트래픽을 애플리케이션까지 전달할 수 있는지를 확인할 수 있습니다.

Nginx에 대해서 자세히 아는 것은 아니므로 설정 파일이 잘못된 부분이 있을 수 있으니 양해 바라며 잘못된 점은 패드백 주시면 감사하겠습니다.

감사합니다.




