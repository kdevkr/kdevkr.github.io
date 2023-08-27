---
title: Spring Boot 3.x Micrometer Tracing
date: 2023-08-27T09:00+0900
---

> Spring Cloud Sleuth will not work with Spring Boot 3.x onward. Please check [Spring Cloud Sleuth 3.1 Migration Guide](https://github.com/micrometer-metrics/tracing/wiki/Spring-Cloud-Sleuth-3.1-Migration-Guide).

Spring Cloud Sleuth 프로젝트는 더이상 Spring Boot 3.x 와의 호환성을 지원하지 않는다. 분산 추적 데이터 모델을 적용하기 위한 자동 구성이 Spring Cloud Sleuth 에서 Spring Boot로 이동되어있기 때문이다. Spring Boot 3.x 에서는 더이상 Spring Cloud Sleuth는 필요하지 않으며 `Micrometer Tracing`에 대한 설정을 수행하면 된다.

```groovy build.gradle
plugins {
    id 'org.springframework.boot' version '3.1.3'
    id 'io.spring.dependency-management' version '1.1.3'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'io.micrometer:micrometer-tracing-bridge-brave'
    implementation 'io.zipkin.reporter2:zipkin-reporter-brave'
    developmentOnly 'org.springframework.boot:spring-boot-docker-compose' // Optional
}
```

#### AutoConfigure Micrometer Tracing
스프링 부트 자동 구성에 포함되어 있는 BraveAutoConfiguration과 ZipkinAutoConfiguration가 자동으로 적용되므로 아래와 같이 TracingProperties 속성을 원하는대로 적용하면 된다. 본 글에서는 Zipkin과의 연동을 위해서 기본적으로 사용되는 B3 방식을 지정하였다.

```yaml application.yml
management.tracing:
  propagation.type: b3
  sampling.probability: 1.0
  
logging.pattern.level: "%5p [${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
```

#### Automatic Context Propagation for WebFlux
Spring Cloud Gateway와 같이 WebFlux 기반으로 동작하는 애플리케이션에서는 Project Reactor 3의 Context Propagation에 대한 자동 구성을 위해서 아래와 같이 Hooks.enableAutomaticContextPropagation을 메인 함수에서 호출해야한다. 더 자세한 내용은 [Context Propagation with Project Reactor 3 - Unified Bridging between Reactive and Imperative](https://spring.io/blog/2023/03/30/context-propagation-with-project-reactor-3-unified-bridging-between-reactive)를 참고하면 된다.

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import reactor.core.publisher.Hooks;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        Hooks.enableAutomaticContextPropagation();
    }
}
```