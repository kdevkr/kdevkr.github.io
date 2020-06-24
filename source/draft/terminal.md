---
    title: 터미널
---

#### [터미널 명령어 연습하기](command.html)  

## 터미널 공부

### 리눅스 배포판 버전 확인
```sh
cat /etc/*-release | uniq
```

### OpenJDK 설치

```sh
# yum update -y
yum install java-1.8.0-openjdk
yum install java-11-openjdk

java -version
# print java version in console
openjdk version "1.8.0_242"
OpenJDK Runtime Environment (build 1.8.0_242-b08)
OpenJDK 64-Bit Server VM (build 25.242-b08, mixed mode)
```
