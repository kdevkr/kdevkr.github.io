---
title: 프로세스 시작 및 종료 스크립트
date: 2023-02-01
tags:
- Autorun
---

Ubuntu와 같은 리눅스 배포판은 APT 그리고 CentOS와 같은 리눅스 배포판은 YUM 이나 DNF를 사용하여 패키지를 설치할 수 있습니다. 패키지 매니저를 통해서 설치하는 경우 [System and Service Manager](https://systemd.io/)를 통해 서비스 등록으로 쉽게 프로세스를 실행하고 종료할 수 있게 지원합니다. 

```shell
sudo systemctl enable --now docker 
```

그러나, 가끔은 패키지 매니저에서 기본적으로 등록된 리파지토리(Repository)에서 다양한 버전을 지원하지 않음으로 인해 [엘라스틱서치 7.12.0 바이너리 다운로드](https://www.elastic.co/kr/downloads/past-releases/elasticsearch-7-12-0)를 통해 운영체제 아키텍처 단위로 빌드된 소스를 사용하기도 합니다. 이러한 경우 직접 Systemd에 서비스를 만들어서 등록하거나 프로세스 시작 또는 종료를 위한 스크립트를 만들어야합니다.

> 서비스 등록 이외에도 도커 컨테이너를 기반으로 간단하게 프로세스를 자동으로 재시작할 수 있게 구성할 수 있습니다.

현재 담당하고 있는 일본 고객 환경의 경우에는 아마존 웹 서비스의 도쿄(ap-northeast-1) 리전의 대규모 장애와 잦은 지진으로 인한 정전 사태등을 고려해서 시스템이 안정적인 상태로 자동으로 복구되도록 프로세스를 재시작하는 것이 필요합니다. 이와 같은 이유로 고객 환경에서 사용중인 알마리눅스(AlmaLinux)를 기준으로 엘라스틱서치 프로세스를 실행하고 종료하는 스크립트를 작성해보도록 하겠습니다.

#### 엘라스틱서치 실행 스크립트
```shell
#!/bin/bash
ES_USER="ec2-user"
ES_HOME="/home/$ES_USER/elasticsearch-7.3.2"
PID=`ps aux | grep $ES_HOME | pidof java`
ps aux | grep $ES_HOME | pidof java > /dev/null
RESULT=$?

if [ 0 = $RESULT ]; then
    echo "[`date --rfc-3339=seconds`] [WARN] Already running with pid($PID)."
else
    echo "[`date --rfc-3339=seconds`] [INFO] Starting elasticsearch..."
    ${ES_HOME}/bin/elasticsearch -d -p ${ES_HOME}/elasticsearch.pid
fi
```

프로세스를 실행할 때에는 예상되는 프로세스가 이미 실행중인지를 ps 명령어를 통해 프로세스 상태를 체크하여 프로세스 아이디가 존재하는지의 결과에 따라 프로세스를 실행해야하는지 판단할 수 있습니다. 위와 같이 실행 스크립트를 작성하는 경우 크론탭을 통해서 서버 또는 프로세스가 예상하지 못하는 이유로 종료되더라도 다시 실행될 수 있도록 적용할 수 있게 됩니다.

#### 엘라스틱서치 종료 스크립트
```shell
#!/bin/bash
ES_USER="ec2-user"
ES_HOME="/home/$ES_USER/elasticsearch-7.3.2"
PID=`ps aux | grep $ES_HOME | pidof java`
ps aux | grep $ES_HOME | pidof java > /dev/null
RESULT=$?

if [ 0 = $RESULT ]; then
    echo "[`date --rfc-3339=seconds`] [INFO] Stopping elasticsearch..."
    kill -15 $PID

    sleep 3

    ps aux | grep $ES_HOME | pidof java > /dev/null
    RESULT=$?

    if [ 0 = $RESULT ]; then
        echo "[`date --rfc-3339=seconds`] [ERROR] Cannot stop elasticsearch"
    else
        echo "[`date --rfc-3339=seconds`] [INFO] Stopped elasticsearch."
    fi
else
    echo "[`date --rfc-3339=seconds`] [WARN] Elasticsearch not running."
fi
```
프로세스를 종료는 단순하게 kill 명령어와 함께 프로세스에 대한 아이디를 지정하면 됩니다. 그러나, SIGTERM 시그널을 보내도 프로세스가 정상적으로 종료되지 않을 수 있으므로 kill 명령어를 수행하고나서 잠시 대기한 다음 프로세스 실행 상태를 다시 한번 체크하여 제대로 종료되었는지를 체크하였습니다. 위 스크립트를 더 보완한다면 일정 시간을 대기하는 것과 함께 N번 더 프로세스 종료를 수행하도록 반복문을 적용해볼 수 있습니다. 저는 프로세스 종료 스크립트를 실행하는 것은 사용자에 의한 명시적인 행위라고 생각하여 한번 만 수행하고 결과에 따라 확인할 수 있도록 메시지를 출력하였습니다. 

#### 스크립트 주의사항
엘라스틱서치는 자체적으로 실행중인 프로세스 아이디를 파일로 생성하는 파라미터 옵션을 제공하지만 일부 프로세스는 지원하지 않을 수 있습니다. 그래서 nohup 명령어를 수행하고나서 **echo $!** 를 호출하여 실행된 프로세스에 대한 아이디를 가져와서 파일로 기록하기도 합니다. 프로세스 아이디가 저장된 파일을 통해서 프로세스 여부를 판단하게 되면 프로세스가 중복으로 실행될 수 있는 취약점을 가지고 있습니다.

또한, 위 스크립트에서는 pidof 명령어로 커맨드 기반으로 프로세스 아이디를 가져왔지만 커맨드 이름만으로는 제대로 구분할 수 없어서 아래와 같이 grep 과 awk 명령어를 통해 프로세스 아이디를 추출해야할 수 있습니다. 단일 프로세스라면 pidof 명령어가 간단하지만 다수의 프로세스로 실행하는 시스템이라면 주의해야만 합니다.

```shell
# 특정 프로세스 찾기
ubuntu@ubuntu:~$ ps aux | grep '/home/ubuntu/q/l64/q -p 5000'
ubuntu     60379  0.0  0.2 298068  5584 ?        Sl   Jan30   0:04 /home/ubuntu/q/l64/q -p 5000
ubuntu     76497  0.0  0.0   6440   720 pts/0    S+   13:51   0:00 grep --color=auto /home/ubuntu/q/l64/q -p 5000

# Grep 명령어는 제외
ubuntu@ubuntu:~$ ps aux | grep '/home/ubuntu/q/l64/q -p 5000' | grep -v grep
ubuntu     60379  0.0  0.2 298068  5584 ?        Sl   Jan30   0:04 /home/ubuntu/q/l64/q -p 5000

# 2번째 프로세스 아이디 추출
ubuntu@ubuntu:~$ ps -ef | grep '/home/ubuntu/q/l64/q -p 5000' | grep -v grep | awk '{print $2}'
60379
```

크론탭을 사용해서 자동으로 재시작하도록 스크립트를 주기적으로 실행할때에도 리눅스 배포판의 기본 쉘의 차이로 인해 사용자의 환경변수가 제대로 등록되지 않을 수 있습니다. 예를 들어, 우분투의 경우에는 아래와 같이 크론탭을 사용할 때 bash를 지정하는게 좋습니다.

```shell
crontab -e
SHELL=/bin/bash
@reboot /home/ubuntu/start.sh >> /home/ubuntu/start.log
```

#### 참고
- https://stackoverflow.com/a/27302946
- https://askubuntu.com/a/157787
- https://unix.stackexchange.com/a/94459
