---
title: 젠킨스에 Amazon Corretto JDK 추가하기
date: 2023-01-01
---

최근에는 [깃허브 액션의 워크플로우 활용](https://www.youtube.com/watch?v=iLqGzEkusIw)하는 경우가 늘고 있는 것 같지만 대부분의 회사에서는 [CI/CD](https://www.youtube.com/watch?v=0Emq5FypiMM) 도구로 젠킨스를 많이 사용할 것이다. 그런데 대부분 어떤 개발자에 의해서 젠킨스가 이미 구성되어있기 때문에 신입 또는 주니어 개발자가 직접 경험하는 부분이 없을 수 있다. 리눅스 서버에 JDK를 설치하고 젠킨스를 실행하더라도 운영되는 환경에 따라 사용되는 JDK를 사용하여 애플리케이션을 빌드하도록 구성해야한다.

#### JDK Installations

Jenkins 관리 > Global Tool Configuration > JDK installations 에서 젠킨스 시스템에서 사용될 JDK 목록을 관리할 수 있도록 제공하고 있다. 이를 활용해서 각 프로젝트에서 사용될 JDK을 설치해서 운영 환경에서 사용될 JVM 버전과 동일한 JDK 벤더를 사용해서 애플리케이션을 빌드할 수 있다.

- https://github.com/adoptium/temurin17-binaries/releases
- https://corretto.aws/downloads/latest/amazon-corretto-11-x64-linux-jdk.tar.gz

일반적으로 범용적인 목적으로는 Temurin이라는 OpenJDK를 사용하고 회사에서는 운영 환경인 CSP와 동일한 Amazon Corretto JDK를 사용하고 있다. 기본적으로는 젠킨스가 설치된 서버 시스템에 [여러개의 JDK를 설치](https://www.youtube.com/watch?v=qx3XK82BZPk)해서 사용하는 것으로 설명한다. 다행히도 JDK Tool Plugin 에서는 다운로드 링크를 지정해서 추가할 수 있는 [Extract .zip/.tar.gz](https://stackoverflow.com/a/55244659)을 제공하고 있다. 

> Downloads a tool archive and installs it within Jenkins's working directory. 
> Example: https\://downloads.apache.org/ant/binaries/apache-ant-1.10.12-bin.zip and specify a subdir of apache-ant-1.10.12 .

위 설명에 따라서 다운로드 링크에 의해서 압축이 해제될 폴더를 지정해야한다.

![](/images/posts/add-jdk-installations-jenkins/01.png)

#### 프로젝트에서 Amazon Corretto JDK 사용하기
프로젝트 빌드 유형에 따라서 설치한 JDK를 지정하는 방법을 공유하고자 한다. 회사에서는 Freestyle Project로 간단하게 사용하고 있는데 인터넷에서는 파이프라인도 많이 활용하고 있는 것 같다.

![Freestyle Project](/images/posts/add-jdk-installations-jenkins/02.png)

```shell
Started by user mambo
Running as SYSTEM
[EnvInject] - Loading node environment variables.
Building in workspace /var/jenkins_home/workspace/Test
[Test] $ /bin/sh -xe /tmp/jenkins17925040181999271110.sh
+ which java
/var/jenkins_home/tools/hudson.model.JDK/Amazon_Corretto_11/amazon-corretto-11.0.17.8.1-linux-x64/bin/java
+ java --version
openjdk 11.0.17 2022-10-18 LTS
OpenJDK Runtime Environment Corretto-11.0.17.8.1 (build 11.0.17+8-LTS)
OpenJDK 64-Bit Server VM Corretto-11.0.17.8.1 (build 11.0.17+8-LTS, mixed mode)
Finished: SUCCESS
```

위와 같이 Execute Shell 커맨드를 사용해서 현재 빌드 환경에 대한 자바 버전을 확인해보니 정상적으로 JDK로 지정한 Amazon Corretto 11을 사용중인 것으로 출력되었다. 그리고 파이프라인 프로젝트에서는 어떻게 지정하는지 검색해보니 아래와 같이 문법을 작성한다고 한다.

```groovy
pipeline {
    agent any
    
    tools {
        jdk "Amazon Corretto 11"
    }
    
    environment {
        JAVA_HOME = "tool Amazon Corretto 11"
    }

    stages {
        stage('Java Version') {
            steps {
                sh 'java -version'
            }
        }
    }
}
```

> 프론트엔드 빌드에 사용될 Node 버전을 설치하기 위해서는 NodeJS 플러그인을 설치하면 동일하게 Global Tool Configuration 기능에 NodeJS installations 항목이 추가됩니다.
