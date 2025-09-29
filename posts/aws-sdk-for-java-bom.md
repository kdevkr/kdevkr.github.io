---
title: AWS SDK for Java BOM
date: 2023-10-22T15:00+0900
tags:
- Maven BOM
- aws-java-sdk
- aws-sdk-java
---

AWS 경험이 많지 않은 개발자 혹은 신규 프로젝트를 위한 구성 시 종종 신경쓰지 않아 발생하는 문제는 AWS 서비스와의 연동을 위한 자바 라이브러리를 사용하기 위해 AWS Java SDK 를 추가하는 것으로 인한 과도하된 애플리케이션 용량이다. 처음부터 공식 문서를 제대로 참고한다면 Java SDK 를 위한 Maven BOM 을 추가하는 방식으로 구성했을 것이다. 그렇지 않은 경우라면 아래와 같이 AWS Java SDK 전체를 추가했을 것이다.

#### 애플리케이션 빌드 용량 문제

```groovy build.gradle
dependencies {
    implementation 'software.amazon.awssdk:aws-sdk-java:2.21.4'
    implementation 'com.amazonaws:aws-java-sdk:1.12.570'
}
```

위의 경우는 연동하려는 서비스마다 참고한 코드가 다름으로 인해 V1과 V2 라이브러리를 혼재한 경우를 의미할지도 모른다. 만약, 정말로 프로젝트에서 추가하는 방식이 위와 같다면 여러분이 인텔리제이와 같은 IDE 도구로 프로젝트를 열었을때 수 많은 라이브러리들을 다운받기 위해서 열일하는 프로그램을 볼 수 있게 될 것이다.

사실 오랫동안 기다려서 한번 다운로드 받게되면 캐시하여 사용하게 되므로 딱히 문제점을 인지하지 못할지도 모른다. 메이븐이나 그래들로 다운받는 라이브러리들은 프로젝트 폴더에 위치하는게 아니기 때문이다. 내재된 문제에 대해서는 빌드 과정에서 인지하게 된다. 빌드된 애플리케이션 실행 파일을 살펴보면 무려 800 메가를 넘는 용량을 가진다.

![](/images/posts/aws-sdk-for-java-bom/01.png)  

#### 애플리케이션에 최적화된 빌드 용량

애플리케이션 빌드 시 정상적인 결과를 가질 수 있도록 Java SDK for Java 를 위한 Maven BOM 으로 버전을 관리하고 애플리케이션에서 사용하는 라이브러리만을 추가하도록 하자. 

```groovy build.gradle
dependencies {
    implementation platform('software.amazon.awssdk:bom:2.21.4')
    implementation platform('com.amazonaws:aws-java-sdk-bom:1.12.570')
    implementation 'software.amazon.awssdk:ec2'
    implementation 'com.amazonaws:aws-java-sdk-s3'
}
```

![](/images/posts/aws-sdk-for-java-bom/02.png)  

오래전에 발생하여 공유했던 트러블슈팅인데 시간이 지나면서 신규 프로젝트에서도 동일한 상황이 발생해서 정리하여 공유해본다.