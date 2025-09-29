---
title: 그래들 멀티 모듈 프로젝트
date: 2021-12-10
tags:
 - Gradle
---

안녕하세요 Mambo 입니다.

오늘은 그래들 멀티 모듈 프로젝트의 디펜던시 공유에 대하여 이야기 해보려고 합니다. 

## 그래들 멀티 모듈
서비스의 규모가 어느정도 커지게되면 모놀리식 아키텍처로써 서비스에 대한 모든 기능이 하나의 애플리케이션에 구현하는 것을 마이크로서비스 아키텍처를 참고하여 일부 기능을 수행하는 별도의 애플리케이션로 독립시키기도 합니다. 현재 다니고 있는 회사에서는 모놀리식 아키텍처로 개발하고 있는 애플리케이션을 여러 고객들의 환경에 맞는 배포 또는 별도의 커스텀 기능을 지원하기 위하여 **그래들 멀티 모듈 프로젝트**로 전환하였습니다.

### Java 라이브러리 플러그인
공용 모듈에서 사용하는 디펜던시를 상위 모듈에서도 사용하기 위해서는 자바 플러그인 대신 자바 라이브러리 플러그인을 적용하고 `api`를 사용하여 지정된 디펜던시를 외부 모듈의 컴파일 클래스패스에 노출시켜야합니다. Gradle 7 부터는 `compile`을 지원하지 않으며 `implementation`은 지정한 디펜던시를 외부 모듈에 노출시키지 않습니다.

> The compile and runtime configurations have been removed with Gradle 7.0. Please refer to the upgrade guide how to migrate to implementation and api configurations`.

```groovy
// module-common/build.gradle
plugins {
    id 'java-library'
    id 'io.spring.dependency-management'
}

dependencies {
    api 'com.google.code.gson:gson'
}
```

common 모듈의 gson 라이브러리는 api를 통해 상위 모듈의 클래스패스에 노출되어 상위 모듈에서도 사용이 가능해집니다. 기본적으로 implementation을 사용하는 경우 외부 모듈 클래스패스에 노출시키지 않는 이유는 빠른 컴파일과 클래스패스 사이즈를 줄이기 위함이며 api 보다는 implementation을 선호해야한다고 합니다.

### Common Module
[gradle-multi-module](https://github.com/kdevkr/gradle-multi-module) 처럼 그래들 멀티 모듈 프로젝트에 공용으로 적용되는 코드를 가지는 Common 모듈이 있을때 다음과 같이 공통으로 적용되어야하는 설정을 수행할 수 있습니다.

```java
@Configuration(proxyBeanMethods = false)
public class JsonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer objectMapperBuilderCustomizer() {
        return builder -> builder
                .featuresToEnable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .featuresToDisable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS)
                .modules(List.of(new Jdk8Module(), new JavaTimeModule()));
    }

}
```

위 코드에서는 Date 또는 Timestamp와 같은 클래스에 대하여 Long 값으로 변환하는 기능을 활성화하기 위하여 SerializationFeature.WRITE_DATES_AS_TIMESTAMPS를 적용하였습니다. 

#### Common Dependencies

```groovy
plugins {
    id 'java-library'
}

dependencies {
    api 'org.springframework.boot:spring-boot-starter-security'
    api 'com.google.code.gson:gson'
    api 'com.fasterxml.jackson.core:jackson-databind'
    api 'org.hibernate.validator:hibernate-validator'
    api 'org.apache.commons:commons-lang3'
    api 'org.apache.commons:commons-collections4:4.4'
    api 'com.google.guava:guava:31.0.1-jre'
}
```

위 설정처럼 implementation 대신에 api를 사용하면 동일한 버전의 디펜던시를 다른 외부 모듈에서도 사용할 수 있도록 클래스패스에 노출할 수 있습니다. 이를 통해 각 모듈에서 사용되는 디펜던시 버전이 달라서 발생할 수 있는 문제를 방지할 수 있게 됩니다.

## 참고

- [Managing Dependencies of JVM Projects](https://docs.gradle.org/current/userguide/dependency_management_for_java_projects.html)  
- [The Java Library Plugin](https://docs.gradle.org/current/userguide/java_library_plugin.html#sec:java_library_configurations_graph)  