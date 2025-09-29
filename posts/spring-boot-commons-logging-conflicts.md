---
title: Spring Boot commons-logging Conflicts
date: 2023-12-28T23:00+0900
tags:
- Spring
- Logging
---

```java
Standard Commons Logging discovery in action with spring-jcl: please remove commons-logging.jar from classpath in order to avoid potential conflicts
```

신규 프로젝트에서 스프링 부트 3 기반으로 프로젝트를 생성하고 개발하니 위와 같은 로그가 출력되는 것을 인지하였다. 스프링 부트는 내부적으로 commons-logging 을 사용하고 있으나 [spring-jcl](https://docs.spring.io/spring-framework/reference/core/spring-jcl.html) 모듈을 통해 Slf4j 로 동작할 수 있도록 되어있고 기본적으로 Logback 을 사용하고 있는 걸로 알고 있었기에 의아했다. 위 로그는 스프링 프레임워크 6.0 부터 클래스 패스에 commons-logging 라이브러리가 포함되어 있을경우 출력되는데 [LogFactoryService.java](https://github.com/spring-projects/spring-framework/blob/b1b6b544a2b374d3f84ffff73bdca119251de42c/spring-jcl/src/main/java/org/apache/commons/logging/LogFactoryService.java#L39-L42) 에서 System.out.println을 사용하고 있다.

#### commons-logging 가 포함되는 라이브러리

commons-logging 모듈이 포함되는 라이브러리는 생각보다 많은데 대략적으로 아래와 같다. AWS 클라우드 서비스에 의존하는 경우 많이 사용하는 AWS Java SDK 에도 commons-logging 을 포함하고 있어 쉽게 출력될 수 있을 것 같다.

```groovy
dependencies {
    implementation 'commons-beanutils:commons-beanutils:1.9.4'
    implementation 'org.apache.httpcomponents:httpclient:4.5.14'
    implementation 'org.apache.commons:commons-dbcp2:2.11.0'

    implementation platform('com.amazonaws:aws-java-sdk-bom:1.12.529')
    implementation 'com.amazonaws:aws-java-sdk-ec2'
}
```

#### 해결방안

해당 로그는 클래스패스에 commons-logging 이 포함될 때 출력되므로 commons-logging 모듈이 포함되지 않도록 제외하면 된다.

```groovy
configurations.all {
    exclude group: 'commons-logging', module: 'commons-logging'
}
```
