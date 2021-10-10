---
title: 리눅스에서 프로세스 실행 유지하기
date: 2021-10-10
tags:
 - Linux
---

안녕하세요 Mambo 입니다.

서버에서 실행중인 애플리케이션은 언제든지 **예기치 않은 상황**으로 중단될 수 있습니다. 예를 들어, 일시적으로 전력이 차단되어 서버 장비가 다시 시작되거나 애플리케이션 프로세스가 서버 자원을 많이 사용해서 프로세스가 중단되는 상황이 발생할 수 있습니다. 

그래서 오늘 알아볼 내용은 리눅스에서 예기치 않은 상황으로 인하여 프로세스가 중단되었을 경우 자동으로 프로세스를 다시 실행시킴으로써 프로세스 실행 상태를 유지하기 위한 방법입니다.

## 프로세스 실행 유지
먼저, 스프링 부트 애플리케이션을 다음과 같이 실행할 수 있다고 가정 하겠습니다.

```sh
nohup java -jar -Xmx500m demo.war 1> app.log 2>&1 &
# [1] 227

ls -l
# total 21M
# -rw-r--r-- 1 ec2-user ec2-user 2.0K Oct  8 15:19 app.log
# -rw-r--r-- 1 ec2-user ec2-user    3 Oct  8 15:19 app.pid
# -rwxr-xr-x 1 ec2-user ec2-user  20M Oct  8 12:28 demo.war*

cat app.pid
# 227
```

위 예시에서 nohup 명령어를 사용하고 출력된 프로세스 아이디와 스프링 부트 애플리케이션에서 ApplicationPidWriter에 의해 생성된 프로세스 아이디 파일이 동일한 것을 확인할 수 있습니다.

### 프로세스 아이디 확인하기
앞서 스프링 부트 애플리케이션처럼 애플리케이션 자체적으로 현재 실행중인 프로세스 아이디를 저장할 수 있는 기능을 포함하고 있다면 좋겠지만 그렇지 않을 수 있습니다. 그래서 이미 실행중인 프로세스 아이디를 확인하고 가져올 수 있는 방법을 알아야 합니다.

```sh
# echo $!
nohup java -jar -Xmx500m demo.war 1> app.log 2>&1 & echo $! > app.pid

# JPS(JVM Process Status)
jps -v | grep war | awk '{print $1}'

# ps -ef
ps -ef | grep java | grep -v grep | awk '{print $2}'

# netstat -tnlp
netstat -tnlp | grep java | awk '{print $7}' | awk -F '/' '{print $1}'

# pgrep
pgrep java
```

첫번째 방식에 사용된 **echo $!** 는 마지막으로 백그라운드에서 실행된 명령어에 대한 PID값을 출력할 수 있는 명령어입니다.

### Crontab으로 프로세스 유지하기
일반적으로 사용되는 고전적인 방식은 앞서 다양한 방식으로 추출된 프로세스 아이디에 대한 프로세스 실행 상태를 체크하는 스크립트를 Crontab을 통해 주기적으로 실행하는 것입니다.

```sh
#!/bin/sh

PID_FILE="app.pid"

autorun () {
  # ... & echo $! > app.pid
}

if [ -f "$PID_FILE" ] && [ ! -z `cat "$PID_FILE"` ]; then
  PID=$(cat $PID_FILE)
  if ps -p $PID > /dev/null; then
    echo "$PID_FILE($PID) is running"
  else
    autorun
  fi
else
  autorun
fi
```

### SystemD
더 효율적인 방식은 Nginx와 같은 패키지를 APT 또는 YUM으로 설치할 때 SystemD 서비스에 자동으로 등록하는 것처럼  애플리케이션을 실행하는 명령어 또는 스크립트를 SystemD 서비스로 등록하는 것입니다. 

**/etc/systemd/system/demo.service**
```text
[Unit]
Description=Demo
After=syslog.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user
ExecStart=/usr/bin/java -jar -Xmx500m demo.war
ExecStop=kill -9 `cat app.pid`
SuccessExitStatus=143
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

위와 같이 스크립트를 정의했다면 다음과 같이 서버가 실행될 때 서비스가 시작되도록 활성화하거나 직접 서비스를 실행하고 종료할 수 있습니다.

```sh
sudo systemctl daemon-reload
sudo systemctl enable demo.service
sudo systemctl start demo.service
```

감사합니다.





