---
title: 젠킨스 그리고 S3와 함께하는 배포 자동화
date: 2023-10-09T20:00+0900 
tags:
- Jenkins
- S3
---

> 회사 내 QA 엔지니어 퇴사로 인해 수동 배포를 수행해왔던 테스트 환경에 대해 자동화 배포로 변경하고자 학습한 내용이다. 솔루션 형태로 전달되어 고객이 직접 배포를 수행하는 프로젝트로 배포에 대한 과정도 변경사항에 포함될 수 있으므로 QA 엔지니어가 테스트 항목으로 수동 배포를 수행했다.

#### S3를 통한 배포 파일 다운로드 스크립트

애플리케이션에 대한 릴리즈 빌드는 젠킨스 도구로 수행하며 젠킨스 서버에서 조직 내 AWS 릴리즈 버킷에 서비스 환경 폴더에 배포 파일이 저장되도록 구성되어 있다. S3 업로드하는 것은 [S3 publisher](https://plugins.jenkins.io/s3/) 플러그인을 이용할 수 있다. 

```sh auto_deployment.sh
#!/bin/sh

FILE_KEY=`aws s3 ls --recursive s3://app-release/japan/module/ | grep module-jp-bundle | sort | tail -n 1 | awk '{print $4}'`
FILE_NAME=`echo $FILE_KEY | sed -e "s/japan\/module\///"`
aws s3 sync s3://app-release/$FILE_KEY /home/ec2-user/prepare/
sleep 1

echo "[`date --rfc-3339=seconds`] [INFO] current zip file : $FILE_NAME"
cp -p /home/ec2-user/prepare/$FILE_NAME /home/ec2-user/prepare/backup/$FILE_NAME
unzip -o /home/ec2-user/prepare/$FILE_NAME -d /home/ec2-user/prepare/ > /dev/null
```

> 젠킨스 서버에 의해 빌드 시 AWS Elastic Beanstalk 서비스에 의해 배포되는 번들과 같이 실행가능한 war 파일을 포함하여 압축 파일로 S3 버킷에 업로드 되어있다. 본 테스트 환경에서는 애플리케이션 실행 시 참조될 프로퍼티 파일은 별도로 관리하고 있다.

#### 자동 실행을 위한 크론탭 비•활성화 스크립트

수동 배포를 수행하는 프로세스에는 예기치 않은 상황에 의해 애플리케이션 종료 시 자동으로 실행되도록 스크립트화 되어 활성화되어있는 크론탭을 비활성화하고 배포 완료 시 크론탭에 의해 동작하도록 활성화하는 방안이 필요하다. 아래의 스크립트는 [스택오버플로우 답변](https://stackoverflow.com/a/14011095)을 참고했다.

```sh disable_cron.sh
#!/bin/sh

# crontab -l | sed '/^[^#].*check.sh/s/^/#/'
crontab -l | sed '/^[^#].*check.sh/s/^/#/' | crontab -
echo "[`date --rfc-3339=seconds`] [INFO] Disable cron of check.sh"
```

```sh enable_cron.sh
#!/bin/sh

#crontab -l | sed '/^#.*check.sh/s/^#//'
crontab -l | sed '/^#.*check.sh/s/^#//' | crontab -
echo "[`date --rfc-3339=seconds`] [INFO] Enable cron of check.sh"
```

#### 배포 자동화 스크립트

```sh auto_deployment.sh
cd /home/ec2-user/

OLD_FILENAME=$(ls /home/ec2-user/ | grep .war | grep -v .old)
FILENAME=$(ls /home/ec2-user/prepare/ | grep .war)
UPD_OLD=$(stat -c %Y $OLD_FILENAME)
UPD_NEW=$(stat -c %Y /home/ec2-user/prepare/$FILENAME)

echo "[`date --rfc-3339=seconds`] [INFO] old file : $OLD_FILENAME($UPD_OLD)"
echo "[`date --rfc-3339=seconds`] [INFO] new file : $FILENAME($UPD_NEW)"

if [ $UPD_NEW -gt $UPD_OLD ]; then
  echo "[`date --rfc-3339=seconds`] [INFO] Start deployment using the $FILENAME"

  # 자동 실행 스크립트 비활성화
  /bin/sh /home/ec2-user/disable_cron.sh
  
  # 기존 배포 파일 백업
  if [ -f /home/ec2-user/$OLD_FILENAME ]; then
    mv /home/ec2-user/$OLD_FILENAME /home/ec2-user/$OLD_FILENAME.old
  fi
  
  # 신규 배포 파일 복사
  cp /home/ec2-user/prepare/$FILENAME /home/ec2-user/
  
  # 애플리케이션 종료 및 실행
  sh /home/ec2-user/stop.sh
  sleep 10
  sh /home/ec2-user/start.sh

  # 자동 실행 스크립트 활성화
  /bin/sh /home/ec2-user/disable_cron.sh  
  echo "[`date --rfc-3339=seconds`] [INFO] Deployment completed"

  else
    echo "[`date --rfc-3339=seconds`] [WARN] There are no new deployment file"
fi
```

#### 젠킨스 서버에서 배포 자동화 스크립트 수행

한단계 더 나아가서는 EC2 서버에서 접속해서 배포 스크립트를 실행하는 것도 젠킨스 서버에서 수행할 수 있도록 구성할 수 있다. [Publish over SSH](https://plugins.jenkins.io/publish-over-ssh/) 플러그인을 통해 EC2 서버 접속을 위한 배스천 호스트에 SSH 연결을 수행하고 배스천 호스트에 존재하는 EC2 키 페어 파일을 통해 SSH 명령과 함께 배포 자동화 스크립트를 실행하는 명령어를 전달하면 된다.

```sh
ssh -i a.pem ec2-user@{ec2-ip} 'sh /home/ec2-user/auto_deployment.sh'
```

> 테스트 환경이라 할지라도 보안 상 관점으로 EC2 서버에 직접 접근하도록 포트를 오픈하는 것은 권장하지 않는다.
