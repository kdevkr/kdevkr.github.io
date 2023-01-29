---
title: 리눅스 웹 콘솔
date: 2023-01-29
---

AWS에서는 웹 콘솔을 통해서 EC2에 연결할 수 있는 다양한 방법을 제공한다. 그러나, 개인적인 학습을 위해서 Oracle VM VirtualBox를 사용해서 우분투와 같은 리눅스에 대한 VM 머신을 실행하면 윈도우 터미널을 통해 SSH 접속을 수행해야한다. 알고보니 리눅스 서버에 웹 콘솔 기능을 제공하는 [Cockpit](https://cockpit-project.org/) 패키지가 있었음을 이제야 확인했다.

#### Cockpit 패키지 추가
```shell
# Ubuntu
sudo apt update -y
sudo apt install -y cockpit

# CentOS
sudo dnf update -y
sudo dnf install -y cockpit
```

#### Cockpit 서비스 실행
```shell
sudo systemctl start cockpit
sudo systemctl enable --now cockpit.socket
```

이제 https://사설IP:9090 으로 접속하면 리눅스 웹 콘솔이 표시된다.

![](https://file.okky.kr/images/1674996458378.png)

SSH 접속 명령어를 학습해야할 상황이 아니라면 웹 콘솔을 통해서 리눅스 명령어를 수행해볼 수 있게 되었다.