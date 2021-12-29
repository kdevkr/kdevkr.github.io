---
title: 롬복 어노테이션 프로세서
date: 2021-12-29
tags:
- IntelliJ
- Lombok
- Annotation Processor
---

안녕하세요 Mambo 입니다.

오늘은 인텔리제이에서 롬복 라이브러리를 적용하는 방법을 알아가기 위한 내용을 공유하고자 합니다.

## Lombok
[롬복 라이브러리](https://projectlombok.org/)는 자바 프로젝트에서 필수적으로 사용될만큼 편리하고 유용한 기능을 제공합니다. 롬복 라이브러리는 [APT(Annotation Processing Tool)](https://docs.oracle.com/javase/7/docs/technotes/guides/apt/GettingStarted.html)를 통해 어노테이션 프로세서(Annotation Processor)로 컴파일 단계에서 수행하게 됩니다. 따라서, 롬복 라이브러리를 사용하기 위해서는 프로젝트에서 어노테이션 프로세서를 동작시키기 위한 설정을 해야합니다.

### 인텔리제이 어노테이션 프로세서
인텔리제이에서는 클래스패스에 있는 어노테이션 프로세서를 구성하기 위한 [어노테이션 프로세싱 기능](https://www.jetbrains.com/help/idea/annotation-processors-support.html)을 지원합니다. 이 어노테이션 프로세싱 기능이 활성화되면 클래스패스에 있는 어노테이션 프로세서를 자동으로 등록하게 됩니다.

#### 그래들 프로젝트
인텔리제이는 그래들 프로젝트에 있는 기본 그래들 래퍼를 사용하여 프로젝트를 빌드하고 실행하도록 설정되어있습니다. Build Tools > Gradle 메뉴에서 기본 그래들 래퍼가 아닌 인텔리제이 자체로 빌드하고 실행되도록 변경할 수 있습니다. 인텔리제이 자체적으로는 롬복 플러그인을 번들에 포함하고 있으므로 롬복 어노테이션 프로세서가 클래스패스에 위치하기 때문에 어노테이션 프로세싱 기능이 활성화되어있다면 롬복에 대한 어노테이션 프로세서가 자동으로 등록되게 됩니다.

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok'
}
```

> _인텔리제이는 친절하게도 롬복 라이브러리가 클래스패스에 있지만 어노테이션 프로세싱 기능이 비활성화되어있으면 이벤트 로그에 기능 활성화를 묻는 알림을 제공합니다._
> _또한, 인텔리제이를 사용하도록 선택한 환경에서는 별다른 설정없이도 클래스패스에 롬복 라이브러리가 있으면 어노테이션 프로세서가 동작함을 확인할 수 있습니다._

#### 그래들 어노테이션 프로세서 구성
프로젝트의 기본 설정은 프로젝트의 그래들 래퍼로 실행하는 환경이라고 하였습니다. 이 경우에는 롬복 라이브러리에 대한 어노테이션 프로세서를 그래들 구성 파일에 정의해야합니다.

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

그래들의 annotationProcessor를 통해 롬복 라이브러리의 어노테이션 프로세서가 어노테이션 프로세서가 위치하는 클래스패스에 등록됨에 따라 인텔리제이는 어노테이션 프로세싱 기능 활성화 여부를 확인하고 활성화에 대한 알림을 제공합니다. 

```groovy
configurations {
   compileOnly {
       extendsFrom annotationProcessor
   }
}
```

그래들 기반의 스프링 부트 프로젝트를 시작할 때 롬복을 추가하면 위 구문이 포함되는 것을 확인하실 수 있습니다. 이 구문의 역할이 무엇인지 궁금하지 않으신가요? 인텔리제이는 그래들 설정 팡리에 위 구문이 포함되는 경우 `Gradle Imported`라는 이름의 프로파일로써 롬복 라이브러리를 어노테이션 프로세서로 등록하기 위한 어노테이션 프로세싱 기능을 활성화하는 것을 자동으로 구성하게 됩니다.

> _인텔리제이는 기본 프로파일에 대해 어노테이션 프로세싱 기능이 활성화되어있지 않으면 이벤트 로그를 통해 롬복을 위한 어노테이션 프로세싱 기능 활성화를 안내하는 것 같습니다._

### 롬복 어노테이션 프로세서
다시 내용을 정리해보자면, 롬복 라이브러리를 적용하기 위해서는 롬복 라이브러리의 어노테이션 프로세서를 등록하기 위한 설정을 수행해야합니다.

- 인텔리제이 어노테이션 프로세싱 활성화(Enable annotation processing)
- 그래들 어노테이션 프로세서 구성

#### 그래들 어노테이션 프로세서 구성
인텔리제이를 사용하는 개발 환경에서는 인텔리제이 어노테이션 프로세싱 활성화 기능을 통해 클래스패스에 있는 어노테이션 프로세서를 자동으로 등록할 수 있습니다만, 젠킨스와 같은 빌드 환경에서 그래들로 어노테이션 프로세서를 등록하기 위해서는 이를 위한 구성을 해야합니다.

```groovy
configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}
dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testCompileOnly 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
}
```

그리고 위 구성은 간단하게 그래들 롬복 플러그인으로 대체할 수 있는데 플러그인을 사용하는 것은 공식 홈페이지에서도 추천하는 방식입니다.

```groovy
plugins {
   id "io.freefair.lombok" version "6.3.0"
}
```

감사합니다.


