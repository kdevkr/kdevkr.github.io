---
title: Mapstruct (feat. Gradle)
date: 2023-07-02T15:00+0900
---

자바 진영에서 오브젝트 간 변환을 위해서 사용할 수 있는 오브젝트 매핑 라이브러리에는 ModelMapper와 MapStruct가 있다. 현재 시스템에서는 일반적으로 사용하는 ModelMapper로도 충분했기 때문에 MapStruct를 굳이 도입하여 사용하지는 않았다. 오브젝트 변환이 반복적으로 많이 이루어지는 케이스가 있을때 리플렉션으로 인한 단점을 보완하기 위해서 직접적으로 오브젝트 변환을 수행하도록 하는 코드를 작성하거나 빌드 과정에서 매퍼에 대한 인터페이스 구현체를 만드는 [Mapstruct](https://mapstruct.org/)가 요구되기 때문에 도입하게 된다. 현재 시스템에서 특정 데이터를 조회하는 과정에서 꽤나 많은 변환이 이루어질 수 있는 가능성이 발생했기 때문에 (예를 들어 약 2~300명의 개별 통계 데이터를 한번에 조회) 도입을 고려하게 되었다.

#### Mapstruct에 대해 알아보기

- [Object Mapping 어디까지 해봤니?](https://meetup.nhncloud.com/posts/213)
- [편리한 객체 간 매핑을 위한 MapStruct 적용기 (feat. SENS)](https://medium.com/naver-cloud-platform/%EA%B8%B0%EC%88%A0-%EC%BB%A8%ED%85%90%EC%B8%A0-%EB%AC%B8%EC%9E%90-%EC%95%8C%EB%A6%BC-%EB%B0%9C%EC%86%A1-%EC%84%9C%EB%B9%84%EC%8A%A4-sens%EC%9D%98-mapstruct-%EC%A0%81%EC%9A%A9%EA%B8%B0-8fd2bc2bc33b)
- [Performance of Java Mapping Frameworks](https://www.baeldung.com/java-performance-mapping-frameworks)

> ※ MapStruct에 대한 예제는 [github.com/mapstruct/mapsturct-examples](https://github.com/mapstruct/mapstruct-examples)에서 확인할 수 있다.

#### 개별 디펜던시 추가
Mapstruct를 적용하는 방법에 대한 글에서 살펴보면 디펜던시 순서를 중요하게 정의해야한다고 되어있지만 상관없어진지 오래되었다. 아무튼 Lombok 그래들 플러그인을 사용하고 있을 경우에도 `lombok-mapstruct-binding`를 아래와 같이 나열하면 된다.

```groovy build.gradle
plugins {
    id 'io.freefair.lombok' version '8.0.1'
}

ext {
    mapstructVersion = "1.5.5.Final"
    lombokVersion = "1.18.26"
    lombokMapstructBindingVersion = "0.2.0"
}

dependencies {
    implementation "org.mapstruct:mapstruct:${mapstructVersion}"
    annotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}", "org.projectlombok:lombok-mapstruct-binding:${lombokMapstructBindingVersion}"
}
```

#### Gradle 플러그인을 이용하는 방법 (Recommanded)
[io.freefair.lombok](https://plugins.gradle.org/plugin/io.freefair.lombok) 그래들 플러그인을 사용하고 있는 경우라면 위의 개별적으로 디펜던시를 나열하기보다는 [Gradle Mapstruct Plugin](https://github.com/AkaZver/mapstruct-plugin)을 사용하는 게 더 간단하기 때문에 롬복과 동일하게 그래들 플러그인 방식을 추천한다.

```groovy build.gradle
plugins {
    id 'io.freefair.lombok' version '8.0.1'
    id 'com.github.akazver.mapstruct' version '1.0.5'
}
```
> Plugin will add mapstruct with mapstruct-processor by default
> If you are using lombok it will add lombok-mapstruct-binding, if spring - mapstruct-spring-extensions

#### 깃에서 `src/main/generated` 디렉토리 무시하기 (Intellij IDEA)
기본적으로 그래들 빌드 과정에서 `build/generated/sources/annotationProcessor` 경로에 인터페이스 구현체가 만들어지고 `build/classes` 경로로 복사된다. 하지만, 인텔리제이에서 Gradle이 아닌 `Intellij IDEA`로 선택하여 구동되도록 변경하는 경우에는 `src/main/generated` 경로에 만들어지게 되므로 `.gitignore` 파일에 빌드 과정에서 MapStruct에 의해 만들어지는 인터페이스 구현체를 제외하는 것이 필요하다.

```gitignore .gitignore
src/main/generated/
```

