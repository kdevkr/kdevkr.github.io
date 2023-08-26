---
title: Spring Cloud Sleuth
date: 2023-08-26T23:00+0900
tags:
- Sleuth
- Zipkin
---

> Spring Cloud Sleuth는 Spring Boot 3.x에 대해서 호환성을 지원하지 않습니다. 스프링 부트 3.1 기반의 프로젝트에서 Spring Cloud [2022.0.x aka Kilburn](https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2022.0-Release-Notes)를 추가하더라도 Spring Cloud Sleuth에 대한 의존성 버전을 관리해주지 않아 라이브러리를 가져올 수 없습니다.

본 글은 Spring Boot 3.1 프로젝트에서 Spring Cloud Sleuth를 사용하여 애플리케이션 로그에 분산 추적을 위한 정보를 추가하고 Zipkin 서비스에 전달하는 구성을 알아보고자 한다. 먼저, 스프링 부트 버전에 대한 Spring Cloud Sleuth 버전을 관리하지 않으므로 특정 버전을 명시해야한다. 그리고 기본적으로 애플리케이션 실행 시 호환성으로 인한 제한 설정이 되어있으므로 제한 설정 옵션을 비활성화하고 [Spring Cloud Sleuth 3.1 Migration Guide](https://github.com/micrometer-metrics/tracing/wiki/Spring-Cloud-Sleuth-3.1-Migration-Guide)를 참고하여 Spring Cloud Sleuth 에서 제공하던 것을 Micrometer Tracing 기반의 설정으로 변경해야한다.

#### Micrometer Tracing > Brave Tracer
```groovy build.gradle
dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-sleuth:3.1.9'
    implementation 'org.springframework.cloud:spring-cloud-sleuth-zipkin:3.1.9'
    implementation 'io.micrometer:micrometer-tracing-bridge-brave'
    implementation 'io.zipkin.reporter2:zipkin-reporter-brave'
}
```

Micrometer Tracing Samples에서 제공하는 [micrometer-samples-boot3-web](https://github.com/micrometer-metrics/micrometer-samples/blob/main/micrometer-samples-boot3-web)를 살펴보면 Brave + Zipkin 조합에 대한 코드가 있음을 확인할 수 있다. `spring-cloud-starter-sleuth` 와 `spring-cloud-sleuth-zipkin`를 통해 [Sleuth와 Zipkin에 대한 자동 구성](https://github.com/micrometer-metrics/tracing/wiki/Spring-Cloud-Sleuth-3.1-Migration-Guide#autoconfiguration)을 추가할 수 있는데 `micrometer-tracing-bridge-brave`와 `zipkin-reporter-brave`를 별도로 의존성에 추가하는 이유는 Spring Cloud Sleuth 에서 포함하지 않는 Micrometer Tracing을 적용하기 위함이다.

더 자세한 내용은 [Micrometer Tracing Dcos](https://micrometer.io/docs/tracing)를 참고하도록 하자.

#### Disable Compatibility Verifier
Spring Cloud Sleuth를 추가하면 Spring Boot 3.x에 대한 호환성을 지원하지 않는 부분에 대한 오류 리포트를 비활성화 해야한다.

```yml application.yml
spring.cloud:
  compatibility-verifier:
    enabled: false
```

#### Context Propagation
스프링 부트 3.0에서는 복수의 전파 유형을 지원하지 않고 기본값은 `w3c`라고 되어있지만 Spring Cloud Sleuth에서 제공하는 SleuthPropagationProperties에서는 `b3`를 기본값으로 지정되어있기 때문에 별도로 건드릴 옵션은 없을 것 같다. 

```yaml application.yml
spring.sleuth:
  propagation.type: w3c  # default: b3
  trace-id128: true
  supports-join: false
```

#### Logging Pattern
스프링 부트 3.0에서 Micrometer Tracing 구성을 위해서는 로그 패턴에 아래와 같이 설정해야한다. 위와 같이 Spring Cloud에 대한 Starter를 사용했기 때문에 스프링 부트의 자동 구성에 의해서 아래의 설정은 기본적으로 적용된다.

```yaml application.yml
logging.pattern.level: "%5p [${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
```

#### Zipkin Integration
spring-cloud-sleuth-zipkin 로 인하여 Zipkin 연동에 대한 자동 구성이 적용되고 아래와 같이 Zipkin에 대한 연결 주소 정보만 입력하면 된다. `spring.zipkin.sender.type` 이외에는 옵션에 대한 기본값과 같다.

```yml applicaiton.yml
spring.zipkin:
  base-url: http://localhost:9411
  sender.type: web

management.zipkin.tracing:
  endpoint: http://localhost:9411/api/v2/spans
```

#### Docker Compose Support
Spring Cloud Sleuth와 연관된 정보는 아니지만 스프링 부트 3.1 부터는 Docker Compose Support를 제공하기 때문에 애플리케이션 실행 시 쉽게 Docker Compose로 컨테이너를 구성할 수 있다.

```groovy build.gradle
dependencies {
    developmentOnly 'org.springframework.boot:spring-boot-docker-compose'
}
```

```yaml compose.yaml
version: '3'
services:
  zipkin:
    image: ghcr.io/openzipkin/zipkin-slim:${TAG:-latest}
    container_name: zipkin
    environment:
      - STORAGE_TYPE=mem
      - MYSQL_HOST=mysql
    ports:
      - "9411:9411"
```