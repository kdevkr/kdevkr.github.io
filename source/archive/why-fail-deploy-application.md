---
title: 갑자기 애플리케이션 배포에 실패한 이유
date: 2021-09-24
tags:
- Beanstalk
- Spring Boot
- Gradle
---

안녕하세요 Mambo 입니다.

오늘은 얼마전까지만 해도 잘 동작하던 배포 프로세스가 갑자기 실패하는 이유에 대해서 이야기 해보려고 합니다.

## 빌드 및 배포 환경
회사에서 운영중인 서비스는 Elastic Beanstalk 환경의 자바 SE 플랫폼으로 스프링 부트 애플리케이션을 배포하고 있습니다. 자바 SE 플랫폼에서는 **애플리케이션을 실행가능한 WAR 파일로 패키징하여 Procfile을 통해 실행**할 수 있도록 구성할 수 있습니다. 예를 들어, 다음과 같이 실행가능하도록 패키징된 애플리케이션 파일을 실행하도록 Procfile을 만들고 Beanstalk 환경을 확장하기 위한 설정 파일들을 하나의 애플리케이션 소스 번들로 만들 수 있습니다.

```groovy
task procfile(dependsOn: bootJar) {
    doFirst {
        project.file("build/libs/Procfile").text = "web: java -Xmx3g -Dfile.encoding=UTF-8 -jar ${bootJar.archiveFileName}"
    }
}
task awsbuild(type: Zip, dependsOn: procfile) {
    println('Build Version: ' + rootProject.version)

    from ('beanstalk/.ebextensions') { into '.ebextensions' }
    from ('beanstalk/.platform') {into '.platform' }
    from ('build/libs') {
        include 'Procfile'
        include "${bootJar.archiveFileName}"
    }
    archiveBaseName.set('beanstalk')
}
```

### 실패한 이유 1

그런데 오늘 갑자기 정상적으로 수행되던 배포 프로세스 과정에서 다음과 같이 오류가 발생하여 애플리케이션 배포가 실패하였습니다.

![](/images/posts/why-fail-deploy-application/reason-01.png)

위 오류가 발생하였을 때 태스크는 다음과 같이 작성되어있었습니다.

```groovy
task awsbuild(type: Zip, dependsOn: procfile) {
    from ('beanstalk/.ebextensions') { into '.ebextensions' }
    from ('beanstalk/.platform') {into '.platform' }
    from ('build/libs') {
        include('Procfile')
        include(bootJar.archiveName)
    }
    baseName = 'beanstalk'
}
```

그런데 최종적으로 만들어지는 애플리케이션 소스 번들을 확인해보니 **bootJar.archiveName**으로 포함시킨 애플리케이션 패키징 파일이 존재하지 않았습니다. 갑자기 왜 포함되지 않는 것 일까요? 이것저것 확인해보던 중 해결방법은 아주 간단하였는데요. 바로 다음과 같이 include 코드를 수정하는 것이었습니다.

```groovy
task awsbuild(type: Zip, dependsOn: procfile) {
    from ('beanstalk/.ebextensions') { into '.ebextensions' }
    from ('beanstalk/.platform') {into '.platform' }
    from ('build/libs') {
        include 'Procfile'
        include "${bootJar.archiveName}"
    }
    baseName = 'beanstalk'
}
```

아무리봐도 무슨 차이인지는 모르겠으나 간단히 해결되었습니다. 한가지 의심이 되는 부분은 Gradle Warpper 버전이 **gradle-7.1-all**로 변경되었다는 것 입니다. 

### 실패한 이유 2
간신히 패키징된 애플리케이션 파일을 애플리케이션 소스 번들에 포함하여 다시 배포 프로세스를 수행했지만 다시 다음과 같은 오류가 발생하면서 배포가 실패했습니다.

![](/images/posts/why-fail-deploy-application/reason-02.png)

애플리케이션 소스 번들은 비어있거나 524288000 바이트를 넘을 수 없다는 오류입니다. 실제로 Elastic Beanstalk 문서에는 다음과 같이 애플리케이션 소스 번들은 최대 512MB로 제한된다는 내용이 있습니다.

![](/images/posts/why-fail-deploy-application/reason-03.png)

만들어진 애플리케이션 소스 번들이 비어있을 이유가 없었기에 용량을 확인해보니 560MB를 넘고 있었습니다. 애플리케이션 소스 번들의 파일이 이렇게 클 이유가 없었는데 의아했습니다. 패키징된 애플리케이션 파일 자체 용량이 520MB를 넘고 있음을 확인하고 패키징된 애플리케이션 파일을 풀어서 내용을 살펴보니 다음과 같이 라이브러리가 포함된 폴더의 용량이 상당한 것을 확인했습니다.

```sh
total 964904
-rw-r--r--  1 user  staff    14M Sep 24 11:31 ec2-2.17.29.jar
-rw-r--r--  1 user  staff    11M Aug  9 12:29 elasticsearch-7.3.2.jar
-rw-r--r--  1 user  staff   7.8M Aug  9 12:30 poi-ooxml-lite-5.0.0.jar
-rw-r--r--  1 user  staff   7.2M Sep 24 11:31 sagemaker-2.17.29.jar
-rw-r--r--  1 user  staff   5.7M Aug  9 12:30 bcprov-jdk15on-1.68.jar
-rw-r--r--  1 user  staff   5.3M Sep 24 11:31 iot-2.17.29.jar
-rw-r--r--  1 user  staff   5.1M Aug  9 12:30 org.eclipse.persistence.core-2.7.4.jar
-rw-r--r--  1 user  staff   4.7M Sep 24 11:31 ssm-2.17.29.jar
-rw-r--r--  1 user  staff   4.3M Aug  9 12:30 groovy-2.4.8.jar
-rw-r--r--  1 user  staff   4.2M Sep 24 11:31 glue-2.17.29.jar
-rw-r--r--  1 user  staff   4.2M Sep 24 11:31 rds-2.17.29.jar
...
```

패키징에 포함된 라이브러리와 연관된 파일이 모두 **964904개**로 출력되었습니다. 어떤 의존성 때문에 이렇게 많은 라이브러리 파일들이 포함되었을까요? 의심되는 부분은 **sagemaker-2.17.29.jar와 같이 실제로는 사용하지 않는 라이브러리** 였습니다. **gradle dependencies** 명령어를 수행하면 의존성 목록을 확인할 수 있다는 팀장님의 말씀을 듣고 검토해보니 다음과 같이 아마존 SDK에 대한 의존성이었습니다.

```groovy
dependencies {
    implementation 'software.amazon.awssdk:aws-sdk-java:2.17.45'
    implementation 'com.amazonaws:aws-java-sdk:1.12.73'
}
```

com.amazonaws:aws-java-sdk 기존에 가지고 있던 **아마존 SDK v1에 대한 의존성**으로 확인되었고 software.amazon.awssdk:aws-sdk-java는 신규 기능 및 전환을 위해 새롭게 개발하고 테스트 중인 **아마존 SDK v2에 대한 의존성**입니다. 

```groovy
dependencyManagement {
    imports {
        mavenBom 'com.amazonaws:aws-java-sdk-bom:1.12.73'
    }
}

dependencies {
//    implementation 'com.amazonaws:aws-java-sdk:1.12.73'
    implementation 'com.amazonaws:aws-java-sdk-s3'
    implementation 'com.amazonaws:aws-java-sdk-sqs'
    implementation 'com.amazonaws:aws-java-sdk-cognitoidentity'
    implementation 'com.amazonaws:aws-java-sdk-lambda'
    implementation 'com.amazonaws:aws-java-sdk-autoscaling'
}
```

개인적으로 공부할 때는 아마존 SDK 전체를 의존성으로 추가하지 않았기에 아마존 SDK 전체를 추가하는 경우와 실제로 사용하는 라이브러리만 추가한 경우를 비교해보니 다음과 같이 요약되었습니다.

의존성|용량
---|---
아마존 SDK v1 전체|214MB
아마존 SDK v1 개별|15.8MB
아마존 SDK v2 전체|268MB
아마존 SDK v2 개별|25.1MB
아마존 SDK v1 + v2 전체|471MB
아마존 SDK v1 + v2 개별|32.4MB

위 상황처럼 아마존 SDK v1과 v2 모두를 의존성에 추가하는 경우 무려 **471MB**라는 어마어마한 용량을 가지게 되는 것을 확인할 수 있었습니다. 사용하지도 않는 라이브러리를 포함하여 쓸데없이 애플리케이션만 무거워졌던 것이죠. 

![](/images/posts/why-fail-deploy-application/reason-04.png)

패키징된 애플리케이션 파일 용량이 줄어들어 정상적으로 배포 프로세스가 수행되었습니다. 그리고 이러한 사항에 대해 개발팀에 아마존 SDK 추가 시 사용하려는 라이브러리를 추가하는 것이 좋다고 전달하였습니다. 이 글을 보시는 분들도 아마존 SDK 전체를 추가한 상태라면 실제로 사용하는 라이브러리를 개별적으로 추가하시기 바랍니다.

### 그래들 태스크 개선
Deprecated된 속성 또는 함수를 사용하는 것을 추가적으로 개선해 보았습니다.

```groovy
task procfile(dependsOn: bootJar) {
    doFirst {
        project.file("build/libs/Procfile").text = "web: java -Xmx3g -Dfile.encoding=UTF-8 -jar ${bootJar.archiveFileName}"
    }
}

task awsbuild(type: Zip, dependsOn: procfile) {
    from ('beanstalk/.ebextensions') { into '.ebextensions' }
    from ('beanstalk/.platform') {into '.platform' }
    from ('build/libs') {
        include 'Procfile'
        include "${bootJar.archiveFileName}"
    }
    archiveBaseName.set('beanstalk')
}
```

감사합니다.