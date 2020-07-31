---
date: 2020-07-30
title: Spring Boot CLI
description: 맘보와 함께하는 스프링 부트 애플리케이션
---

## 👨‍💻 들어가며
맘보와 함께하는 스프링 부트 애플리케이션에서 가장 먼저 다루어볼 것은 `Spring Boot CLI` 또는 `Spring Initializr`를 통해 스프링 프로젝트를 시작하는 것입니다.

## 사전작업
스프링 부트 CLI를 이용하기 위하여 필요한 몇가지 작업을 진행합니다.

### Install JDK using Jabba
직접 OpenJDK를 다운받는 것 보다는 [`Jabba`](https://github.com/shyiko/jabba)을 이용함으로써 JDK를 쉽게 설치할 수 있습니다.

> JDK를 설치하고 JAVA_HOME 환경변수를 설정하는 것을 모르고 있다면 직접 바이너리를 다운받아 시도해보시기 바랍니다.

```zsh Zsh
$ curl -sL https://github.com/shyiko/jabba/raw/master/install.sh | bash && . ~/.jabba/jabba.sh

$ jabba install adopt@1.11.0-7
Downloading adopt@1.11.0-7 (https://github.com/AdoptOpenJDK/openjdk11-binaries/releases/download/jdk-11.0.7%2B10/OpenJDK11U-jdk_x64_linux_hotspot_11.0.7_10.tar.gz)

$ jabba use adopt@1.11.0-7
$ jabba current
adopt@1.11.0-7

$ java --version
openjdk 11.0.7 2020-04-14
OpenJDK Runtime Environment AdoptOpenJDK (build 11.0.7+10)
OpenJDK 64-Bit Server VM AdoptOpenJDK (build 11.0.7+10, mixed mode)
```

### Install Homebrew
Spring Boot CLI를 설치하기 위해서는 [SDKMAN](https://sdkman.io/) 또는 [`Homebrew`](https://docs.brew.sh/Homebrew-on-Linux)와 같은 패키지 관리자가 필요합니다.


## Spring Boot CLI
`Homebrew`를 이용하여 Spring Boot CLI를 설치합니다.

```zsh Zsh
$ brew tap pivotal/tap
$ brew install springboot

$ spring --version
Spring CLI v2.3.2.RELEASE
```

만약, 다음과 같이 문구가 표시된다면 JAVA_HOME 환경변수 설정을 확인하시기 바랍니다.
```zsh
$ spring --version
JAVA_HOME not set and cannot find javac to deduce location, please set JAVA_HOME.
```

### Start with CLI
스프링 부트 CLI의 `init` 명령은 스프링 부트 프로젝트를 구성하는 것을 수행합니다.

```zsh Zsh
$ spring init --list

$ spring init --build=gradle --java-version=11 --dependencies=web --packaging=jar app
Using service at https://start.spring.io
Content saved to 'app'
```

## Spring Initializr
[Spring Initializr](https://start.spring.io/)는 스프링 부트 CLI의 init 명령으로 스프링 부트 프로젝트를 구성하는 것을 GUI로 제공하는 웹사이트입니다. Spring Initializr는 선택한 프로젝트 옵션에 따라서 프로젝트 구성을 미리 확인하거나 의존성을 쉽게 검색하여 선택하거나 제거할 수 있습니다.

```
.gitignore
build.gradle
gradle
gradlew
bradlew.bat
settings.gradle
src
├── main
│   ├── java
│   │   └── kr
│   │       └── kdev
│   │           └── DemoApplication.java
│   └── resources
│       ├── application.properties
│       ├── static
│       └── templates
└── test
    └── java
        └── kr
            └── kdev
                └── DemoApplicationTests.java
```

또한, 다음과 같이 공유 URL을 통해 기본 템플릿을 구성하여 사용할 수도 있습니다.

https://start.spring.io/#!type=gradle-project&language=java&packaging=jar&jvmVersion=11&groupId=kr.kdev&artifactId=demo&name=demo&packageName=kr.kdev

우리는 이번 시간을 통해 어떻게 스프링 부트 프로젝트를 시작하는 지를 다루어보았습니다. 다음에는 `IntelliJ CE` IDE를 사용하여 만들어진 프로젝트를 실행해보도록 하겠습니다.

## 🔖 참고
- [Spring Boot Docs - Spring Boot CLI](https://docs.spring.io/spring-boot/docs/2.3.2.RELEASE/reference/html/spring-boot-cli.html)
- [Spring Initializr](https://start.spring.io/)
