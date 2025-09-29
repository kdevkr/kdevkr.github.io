---
title: 자바 클래스로더 이슈
date: 2025-07-01T23:00+09:00
tags:
- ClassLoader
- ForkJoinPool
- Executable Jar
---

실행 가능한 JAR(Executable JAR) 파일로 실행된 스프링 애플리케이션에서 [프리마커 템플릿으로 정의된](https://freemarker.apache.org/index.html) 이메일 템플릿을 리소스로 가져오지 못하는 오류가 발생했다. 처음에는 새롭게 Amazon ECS으로 구성된 배포 환경에서 사용될 빌드된 JAR 파일에 템플릿 파일이 포함되지 않았다고 생각했지만 젠킨스 빌드 결과를 보니 패키징된 JAR 파일에는 정상적으로 리소스 폴더의 파일들이 포함되어 있음을 확인할 수 있었다. 한가지 중요한 부분은 문제가 발생한 코드들은 ParallelStream 으로 인해 ForkJoinPool.commonPool 의 워커 스레드로 기록되어있다는 점이다. 그리고 비밀번호 찾기 요청에 의한 이메일 발송에 대한 템플릿은 정상적으로 가져와서 발송되고 있음도 확인하였다. 그렇다면, 과연 ForkJoinPool.commonPool 스레드 안에서는 무슨일이 발생하는 것일까 궁금하다.

#### ForkJoinPool.commonPool

```sh
2025-06-27 04:31:00 [ForkJoinPool.commonPool-worker-5] ... class path resource [...] cannot be opened because it does not exist
```

오류에 대한 원인에 대해서 찾던 중  [spring-boot#15737](https://github.com/spring-projects/spring-boot/issues/15737) 이슈에서 힌트를 얻을 수 있었다. JDK 9 에서부터 [JDK-8172726](https://bugs.openjdk.org/browse/JDK-8172726) 에 의해 ForkJoinPool.commonPool 에서는 상위 스레드가 아닌 시스템 클래스로더가 사용된다는 것이 중요한 정보이다. 그리고 ForkJoinPool 에서 `LaunchedClassLoader` 를 사용할 수 있게 설정하자는 [spring-boot#39843](https://github.com/spring-projects/spring-boot/issues/39843) 티켓도 있다.

#### ClassLoader in ClassPathResource

스프링 기반 애플리케이션은 빌드 단계에서 `리소스(resources) 폴더를 클래스패스에 포함`될 수 있도록 WAR 또는 JAR 파일로 패키징된다. 이렇게 포함된 리소스는 정적 리소스로 사용자에게 전달할 수도 있지만 애플리케이션 내부적으로 로드되어 활용될 수 있다. 클래스패스에 존재하는 리소스를 쉽게 사용할 수 있도록 지원하는게 스프링 프레임워크에서 제공하는 [ClassPathResource](https://github.com/spring-projects/spring-framework/blob/main/spring-core/src/main/java/org/springframework/core/io/ClassPathResource.java) 클래스다. ClassPathResource의 생성자에서 클래스로더가 지정되지 않으면 [ClassUtils.getDefaultClassLoader](https://github.com/spring-projects/spring-framework/blob/main/spring-core/src/main/java/org/springframework/util/ClassUtils.java#L220) 의 클래스로더를 사용하여 리소스를 참조하게 된다. 코드 구현을 살펴보면 현재 스레스에 설정된 컨텍스트 클래스로더를 먼저 찾고 마지막으로는 시스템 클래스로더를 통해 부트스트랩 클래스로더로 위임하여 리소스를 가져올 수 있음을 이해할 수 있다. [일반적인 클래스로더와 스레드 컨텍스트 클래스로더의 차이](https://www.baeldung.com/java-class-loader-thread-context-vs-normal)를 보면 ForkJoinPool.commonPool 내의 ContextClassLoader가 다를 수 있음을 알 수 있는데 앞서 JDK-8172726 를 통해 JDK 9 부터는 `ContextClassLoader가 시스템 클래스로더로 설정된다`는 것을 확인했었다.

```java
2025-06-29T04:03:25.603Z  INFO 1 --- [springboot] [   scheduling-1] kr.kdev.demo.Application                 : jar:nested:/app.jar/!BOOT-INF/classes/!/test.txt, true, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c
2025-06-29T04:03:25.602Z  INFO 1 --- [springboot] [onPool-worker-2] kr.kdev.demo.Application                 : jar:nested:/app.jar/!BOOT-INF/classes/!/test.txt, true, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c, jdk.internal.loader.ClassLoaders$AppClassLoader@502f3a78
2025-06-29T04:03:25.602Z  INFO 1 --- [springboot] [onPool-worker-1] kr.kdev.demo.Application                 : jar:nested:/app.jar/!BOOT-INF/classes/!/test.txt, true, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c, jdk.internal.loader.ClassLoaders$AppClassLoader@502f3a78
```

위와 같이 ParellelStream 내에서는 ForkjoinPool.commonPool 인 경우 `LaunchedClassLoader`가 아닌  `ClassLoaders$AppClassLoader` 가 출력되었음을 알 수 있었다. JDK 버전과 관계없이 해당 문제가 발생할 수 있다는 이야기로 ForkJoinPool.commonPool 의 스레드 내에서 ClassPathResource를 사용할 때에는 `올바른 클래스로더가 사용할 수 있도록 전달해야함`을 알 수 있다. 그런데, 아직 또 다른 문제가 남아있다. ClasspathResource를 직접 사용하는 코드라면 부모 스레드의 클래스로더를 명시적으로 전달하면 해결이 된다. 그러나, 이메일 발송을 위해 정의된 이메일 템플릿을 가져올 때에는 프리마커 템플릿 엔진의 템플릿 로더로 위임하게 된다. 더 나아가서는 Nested 형태로 공통적으로 정의된 부분이 포함된 이메일 템플릿으로 정의되어 미리 템플릿을 불러와서 캐시할 수도 없는 상황으로 확인된다.

일단, [FreeMarkerConfigurationFactory.setResourceLoader](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/ui/freemarker/FreeMarkerConfigurationFactory.html#setResourceLoader(org.springframework.core.io.ResourceLoader))을 이용해보아야할 것 같다.