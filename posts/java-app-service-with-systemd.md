---
title: Systemd 서비스로 자바 애플리케이션 실행하기
date: 2023-10-12T23:00+0900
tags:
- Systemd
- Java
---

[Run a Java Application as a Service on Linux](https://www.baeldung.com/linux/run-java-application-as-service) 를 참고해보니 `Systemd` 서비스를 사용해서 자바 애플리케이션을 실행하고 관리하는 서비스를 등록할 수 있다는 것을 알게되었다. 그동안 자바 애플리케이션을 배포하기 위한 `쉘 스크립트`를 작성하여 실행하고 종료하고 배포해오곤 했다. 반면에 Nginx의 경우 패키지로 설치하여 자동으로 서비스가 만들어져서 쉽게 실행할 수 있었다. 신규 프로젝트로 인해 데모용 애플리케이션을 새롭게 배포해야하는 요구사항이 생겼기에 이번에는 Systemd 서비스로 등록하여 관리해보자.

#### Systemd 서비스 등록하기

`/etc/systemd/system/` 폴더 하위에 `vi` 명령어를 사용해서 아래와 같이 서비스 파일을 만들어야 한다. `애플리케이션 또는 서비스 이름`을 파일명으로 작성하는 것을 추천한다. 

```sh /etc/systemd/system/app.service
[Unit]
Description=Java application service
After=syslog.target network.target

[Service]
Type=simple
SuccessExitStatus=143
Restart=on-failure
RestartSec=10s

User=ubuntu
Group=ubuntu

WorkingDirectory=/home/ubuntu/
Environment=JAVA_HOME=/home/ubuntu/.sdkman/candidates/java/current
ExecStart=/bin/java -jar /home/ubuntu/app.jar
ExecStop=/bin/kill -15 $MAINPID

[Install]
WantedBy=multi-user.target
```

> 리눅스 서버에 여러개의 자바 버전을 혼용하는 경우 애플리케이션 실행 시 필요한 JDK 버전을 사용할 수 있도록 환경 변수를 지정하도록 하자. 예기치 않은 상황으로 애플리케이션이 종료되는 경우 다시 실행될 수 있도록 Restart 옵션을 적용하는 것을 고려하자.

#### Systemd 서비스 실행하기

`service` 명령어를 통해 자바 애플리케이션 서비스를 실행하고 종료할 수 있으나 `systemctl` 명령어를 통해 서비스를 반영하고 리눅스 서버가 다시 실행되어 systemd 서비스가 실행되면 자동으로 시작될 수 있도록 `enable` 명령어를 수행하는 것이 좋다.

```sh Termianl
sudo systemctl daemon-reload

# Systemd 서비스 시작 시 자동 실행 등록
ubuntu@ubuntu:~$ sudo systemctl enable app.service
Created symlink /etc/systemd/system/multi-user.target.wants/app.service → /etc/systemd/system/app.service.

sudo systemctl status app.service # sudo service app status

ubuntu@ubuntu:~$ sudo service app status
● app.service - Java application service
     Loaded: loaded (/etc/systemd/system/app.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2023-10-12 14:01:24 UTC; 22min ago
   Main PID: 25835 (java)
      Tasks: 23 (limit: 2256)
     Memory: 150.6M
     CGroup: /system.slice/app.service
             └─25835 /bin/java -jar /home/ubuntu/app.jar
```

> 가끔씩 패키지로 설치한 서비스들이 예기치 않은 상황으로 리눅스 서버가 재실행되었을때 자동으로 실행되지 않는 상황이 종종 발생한다.
> 애플리케이션이 정상적으로 동작하는 것에 그치지 않고 다양한 문제에 대해 고민해야할 필요성이 있는 것 같다.

#### 애플리케이션 로그 조회하기

일반적으로 애플리케이션이 생성한 로그 파일을 `tail` 명령어를 사용하여 살펴보았으나 애플리케이션 서비스로 등록하였기에 별도의 파일로 저장하는 옵션을 두지 않았다면 `journalctl` 명령어를 사용해서 로그를 조회해야한다.

```sh Terminal
sudo journalctl -u app.service -f
```

> 운영중인 애플리케이션이나 서비스의 경우 잘 동작하는 쉘 스크립트를 굳이 서비스 방식으로 바꾸지는 말자.
