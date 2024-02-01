---
title: Immutable Configuration Properties
date: 2024-02-01T23:00+0900
tags:
- Spring Boot
- Configuration Properties
- Constructor Binding
---

스프링 부트 2.2 부터 @ConstructorBinding을 사용하여 생성자를 가지지 않는 클래스를 작성할 수 있으며 스프링 부트 3.0 부터는 @ConstructorBinding 선언 대상이 생성자로 축소되어 아래와 같이 스프링 부트 3 에서는 생성자가 하나인 경우에는 굳이 지정하지 않는다.

```java Spring Boot 2.7
@Getter
@RequiredArgsConstructor
@ConstructorBinding
@ConfigurationProperties(prefix = "feature")
public class FeatureProperties {
    private final boolean enabled;
}

@ConfigurationPropertiesScan
@EnableConfigurationProperties
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

```java Spring Boot 3.2
@Getter
@RequiredArgsConstructor
@ConfigurationProperties(prefix = "feature")
public class FeatureProperties {
    private final boolean enabled;
}

@ConfigurationPropertiesScan
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

##### Parameter Name Discovery from Spring Boot 3.1

> Ensure that your compiler is configured to use the '-parameters' flag.

스프링 부트 3.2 에서 생성자 바인딩을 통해 Immutable Configuration Properties를 만드려는 경우 위와 같은 오류가 발생할 수 있다. 위 오류 메시지는 [MissingParametersFailureAnalyzer](https://github.com/spring-projects/spring-boot/issues/38603) 에 의해 출력되는 것으로 스프링 부트 3.2 에서 의존하는 스프링 프레임워크 버전에서 바이트코드를 분석하여 파라미터 이름을 추론해오던 [LocalVariableTableParameterNameDiscoverer 클래스가 제거](https://github.com/spring-projects/spring-framework/issues/29559)되어 파라미터 이름으로 추론하는 대상에 해당하는 생성자 바인딩을 위해 [StandardReflectionParameterNameDiscoverer](https://github.com/spring-projects/spring-framework/blob/main/spring-core/src/main/java/org/springframework/core/StandardReflectionParameterNameDiscoverer.java) 가 사용될 수 있도록 컴파일러에 대해 `-parameters` 옵션을 지정해야한다.

```groovy build.gradle
// NOTE: https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x#parameter-name-retention
tasks.withType(JavaCompile).configureEach {
    options.compilerArgs.add("-parameters")
}
```

만약, 인텔리제이를 사용하고 있으며 그래들이 아닌 **Build and run using** 옵션으로 Intellij IDEA를 지정하는 편이라면 자바 컴파일러 옵션에 `-parameters` 옵션을 별도로 설정해야한다. 자바 컴파일러 옵션에 `-paramters` 플래그를 설정했음에도 파라미터 이름 추론을 위한 오류가 출력된다면 인텔리제이가 생성한 `out` 폴더를 삭제하고 다시 빌드를 수행해보도록 하자.

![](/images/posts/spring-boot-immutable-configuration-properties/01.png)

> Spring Boot 3.2 에서 Immutable Configuration Properties 를 사용하기 위해 생각지도 못한 삽질을 했습니다.

#### 참고 링크

- [Immutable @ConfigurationProperties Binding](https://www.baeldung.com/configuration-properties-in-spring-boot#immutable-configurationproperties-binding)
- [@ConstructingBinding No Longer Needed at the Type Level](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0.0-M2-Release-Notes#constructingbinding-no-longer-needed-at-the-type-level)
- [LocalVariableTableParameterNameDiscoverer has been removed in 6.1](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x#parameter-name-retention)
- [Remove LocalVariableTableParameterNameDiscoverer](https://github.com/spring-projects/spring-framework/issues/29559)
- [Failures due to code not being compiled with '-parameters' are hard to identify](https://github.com/spring-projects/spring-boot/issues/38603)