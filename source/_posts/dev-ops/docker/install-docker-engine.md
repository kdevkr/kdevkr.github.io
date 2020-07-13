---
  title: Docker - 도커 엔진 설치하기
---

## 들어가며
도커 컨테이너 환경을 경험해보기 위해서는 컨테이너 구동을 위한 도커 엔진을 설치해야합니다. MacOS 또는 윈도우 환경에서는 Docker Desktop을 설치하면 자동으로 도커 엔진이 설치됩니다. 다만, 우분투와 같은 리눅스 서버는 도커 데스크탑을 제공하지 않으므로 직접 바이너리 패키지를 받아 설치해야합니다.

## 도커 엔진 설치하기
우분투 리눅스에서 도커 엔진을 설치하기 위해서는 다음의 64비트 버전이 필요합니다.

- Ubuntu Focal 20.04
- Ubuntu Bionic 18.04
- Ubuntu Xenial 16.04

Docker Engine is supported on x86_64 (or amd64), armhf, and arm64 architectures.

### 리파지토리 설정
```sh
$ sudo apt-get update
$ sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

$ sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
```

### 도커 엔진 패키지 설치
```sh
$ sudo apt-get update
$ sudo apt-get install docker-ce docker-ce-cli containerd.io
```
