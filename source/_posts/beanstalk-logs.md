---
title: AWS Elastic Beanstalk 로그 알아보기
date: 2024-03-01T23:00+0900
tags:
- Beanstalk
- TailLogs
- Bundlelogs
---

![](/images/posts/beanstalk-logs/01.png)

AWS Elastic Beanstalk 환경 콘솔의 로그 메뉴에서 로그 요청을 통해 전체(번들) 또는 마지막 100줄(테일) 로그를 조회할 수 있다. 이러한 요청에 대한 로그는 아래의 파일들을 사용하여 가져오며 사용자 권한을 통해 S3 버킷에 저장한 후 다운로드할 수 있게 제공한다. 따라서, 인스턴스 프로파일에 S3에 대한 권한 정책이 포함되어있어야 한다.

- 테일 로그 - /opt/elasticbeanstalk/tasks/taillogs.d/
- 번들 로그 - /opt/elasticbeanstalk/tasks/bundlelogs.d/
- 회전된 로그 - /opt/elasticbeanstalk/tasks/publishlogs.d/

> S3에 저장되는 로그 위치는 elasticbeanstalk-{region}-{account-id}/resources/environments/logs 입니다.
> Elastic Beanstalk는 요청한 번들 또는 테일 로그에 대해서 15분이 경과된 이후에 파일을 S3에서 삭제합니다.

#### 테일 로그

테일(마지막 100줄) 로그는 EB 엔진 및 Nginx 그리고 애플리케이션 서버 로그의 마지막 100줄을 모아 단일 텍스트 파일을 생성하고 S3에 업로드한다. Amazon Linux 2 리눅스 플랫폼에서 포함되는 로그 항목은 아래와 같다.

- /var/log/web.stdout.log
- /var/log/eb-engine.log
- /var/log/eb-hooks.log
- /var/log/nginx/access.log
- /var/log/nginx/error.log

#### 번들 로그

번들(전체) 로그는 시스템 전체 메시지 뿐만 아니라 yum 및 cron 로그와 같은 다양한 로그를 포함하여 Zip 파일로 압축한 후 S3에 업로드한다. 다운로드한 번들 로그에는 아래와 같은 로그 항목이 포함되어있다.

- /var/log/healthd/
- /var/log/nginx/
- /var/log/rotate/
- /var/log/cfn-hup.log
- /var/log/cfn-init.log
- /var/log/cfn-init-cmd.log
- /var/log/cfn-wire.log
- /var/log/cloud-init.log
- /var/log/cloud-init-output.log
- /var/log/cron
- /var/log/eb-cfn-init.log
- /var/log/eb-cfn-init-call.log
- /var/log/eb-engine.log
- /var/log/eb-publish.log
- /var/log/eb-tools.log
- /var/log/messages
- /var/log/web.stdout.log
- /var/log/yum.log

> 번들 로그에는 시스템 전반적인 메시지를 포함하는 /var/log/messages 가 포함되어있어 더 자세하게 원인을 분석할 수 있습니다.

#### 로그 로테이션

AWS Elastic Beanstalk 의 리눅스 플랫폼에서는 logrotate 를 사용해서 로그를 주기적으로 회전하고 Amazon S3에 업로드한다. 환경 콘솔에서 요청하는 번들 또는 마지막 100줄 로그 요청에는 회전되는 로그는 포함되지 않는다. 로그 회전에 대한 구성 파일은 /etc/logrotate.elasticbeanstalk.hourly/ 에서 찾을 수 있으며 /etc/cron.hourly/ 에서 크론 작업으로 호출된다.

---

서버 엔지니어 또는 데브옵스 엔지니어에게 전달받은 로그들이 어떠한 정보를 포함하고 있는지를 알고 빠르고 자세하게 문제에 대한 원인을 분석하는데에 사용하는 것에 대한 역량은 백엔드 엔지니어에게 필요한 부분이다.
