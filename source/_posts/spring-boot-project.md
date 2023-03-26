---
title: 스프링 부트 프로젝트를 만들고나서
date: 2023-03-26
---

스프링 이니셜라이저를 통해서 스프링 부트 기반의 프로젝트 폴더를 구성하더라도 회사마다 혹은 개발자마다 너무나도 당연하게 하는 것들이 조금씩 있기 마련이다. 스프링 부트 프로젝트를 만들고나서 너무나도 당연하게 습과적으로 매번 하는 것들에 대해서 정리해보고자 한다. 

#### 1. Properties가 아닌 YAML 방식으로 변경하기
스프링 이니셜라이저를 통해서 만들어진 기본적인 프로젝트 폴더에는 application.properties 파일이 존재한다. 스프링 부트에서는 Java Properties, YAML 그리고 환경 변수를 통해서 애플리케이션 프로퍼티 속성 값을 적용하여 활용할 수 있게 지원한다. 하지만, ISO-8859-1 인코딩으로 강제되는 자바 프로퍼티 파일에는 한계가 있고 대부분의 애플리케이션에서 UTF-8을 사용하는 편이므로 YAML 방식으로 변경하는 것이 편리하다.

> It is recommended to stick with one format for your entire application. If you have configuration files with both .properties and .yml format in the same location, .properties takes precedence.

위와 같이 공식 문서에 나와있는 것처럼 프로퍼티와 야믈 파일을 동시에 사용하는 경우 자바 프로퍼티 파일을 우선하여 적용하므로 주의하자.

#### 2. 스프링 부트 기본 배너 옵션 끄기
두번째로 하는 일은 스프링 부트에서 제공하여 콘솔에 표시되는 기본 배너 로그를 비활성화하는 것이다. 대부분의 애플리케이션에서 스프링 배너를 통해서 버전을 확인할 필요성은 굉장히 적으며 중요시 해야하는 것은 빌드 정보일 뿐이기에 불필요하다.

```yaml application.yml
spring.main.banner-mode: off
```

#### 3. 그래들 롬복 패키지 구성을 롬복 플러그인으로 변경하기
그래들 기반으로 스프링 부트 프로젝트를 만드는 경우 그래들 롬복 플러그인이 아닌 직접 패키지를 디펜던시에 지정하는 방식으로 되어있다. [io.freefair.lombok](https://plugins.gradle.org/plugin/io.freefair.lombok)을 플러그인으로 등록하여 사용하는 것이 더 효율적이다.

```gradle build.gradle
plugins {
    id 'io.freefair.lombok' version '8.0.1'
}
```

#### 4. 기본 톰캣 컨테이너를 언더토우로 대체하기
스프링 부트 프로젝트에서 기본적으로 의존하는 임베디드 톰캣도 준수한 성능을 보여주지만 자바를 사용하여 NIO 기반으로 작성된 경량의 웹 서버 애플리케이션인 언더토우를 사용하고 있다. 웹 스타터 모듈에는 톰캣에 대한 의존성이 포함되어있으므로 아래와 같이 톰캣에 대한 모듈은 제외되도록 하자.

```gradle build.gradle
configurations.configureEach {
    exclude group: 'org.springframework.boot', module: 'spring-boot-starter-tomcat'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-undertow'
}
```

> 스프링 프레임워크 6.1 에서는 JDK 21과 Virtual Threads를 우선적으로 톰캣에서 지원할 예정인 것 같아 언더토우가 아닌 톰캣을 선택해야할 경우가 될 가능성도 보인다. 관련 프로젝트: [mp911de/spring-boot-virtual-threads-experiment](https://github.com/mp911de/spring-boot-virtual-threads-experiment)

#### 5. 인텔리제이 IDEA의 빌드 및 실행 옵션 변경하기
마지막으로 인텔리제이 IDEA를 통해서 스프링 부트 프로젝트를 빌드하고 실행하는 경우 컴파일러와 그래들에 대한 옵션을 변경하는 것이 더 효율적으로 프로젝트를 개발하고 실행하는 환경이 되므로 적용하는 편이다.

- Build, Execution, Deployment > Build Tools > Gradle > Build and run using Intellij IDEA
- Build, Execution, Deployment > Build Tools > Compiler > Build project automatically

기본 Gradle이 아닌 Intellij IDEA로 빌드 및 실행을 하도록 설정한다면 프로젝트 루트 폴더에 out 이라는 이름의 폴더에 현재 실행중인 애플리케이션에 대한 클래스 파일과 정적 리소스 파일들이 이동되어 어떠한 문제가 발생했을 때 곧바로 살펴볼 수 있다.

