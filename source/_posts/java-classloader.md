---
title: 자바 클래스로더 이슈
date: 2025-06-27T23:00+09:00
tags:
- ClassLoader
- ForkJoinPool
---

Amazon ECS 로 실행된 EC2 클러스터에 배포된 애플리케이션 환경에서 [프리마커 템플릿](https://freemarker.apache.org/index.html)으로 정의된 템플릿을 찾을 수 없다는 오류 로그가 남았다. 처음에는 빌드된 Jar 파일에 템플릿이 포함되지 않았다고 생각했지만 정상적으로 리소스 폴더에 존재했고 클래스패스에 포함되어 있었다. 두번째로 추측한 것은 메일 템플릿을 정의한 XML 파일을 불러와서 [Apache Commons의 Digester](https://commons.apache.org/proper/commons-digester/)로 변환하는 과정에서 오류가 발생했을 수 있다고 판단했다. 해당 코드에는 try 블록은 있지만 예외를 오류 로그로 기록하는 catch 블록이 없었기 때문이다.

#### ForkJoinPool.commonPool

```sh
2025-06-27 04:31:00 [ForkJoinPool.commonPool-worker-5] ... class path resource [...] cannot be opened because it does not exist
```

오류에 대한 원인에 대해서 찾던 중에 [spring-boot#15737](https://github.com/spring-projects/spring-boot/issues/15737) 이슈에서 힌트를 얻을 수 있었다. 스프링 부트 버전의 문제는 아니지만 JDK 문제일 수 있다는 의견이 있고 [JDK-8172726](https://bugs.openjdk.org/browse/JDK-8172726)로 ForkJoinPool의 CommonPool 에서 클래스로더에 대한 문제가 보고되어 해결된 기록이 있다. 하지만, 실행 환경은 JDK 11을 사용하므로 문제에 대한 원인이 명확하지 않는 건 동일하다. 한가지 의심할 수 있던 건 오류 로그가 발생한 스레드는 ForkJoinPool.commonPool 이었던 부분이다. ForkJoinPool 에서 `LaunchedClassLoader` 를 사용할 수 있게 설정하자는 [spring-boot#39843](https://github.com/spring-projects/spring-boot/issues/39843) 티켓도 있다.

#### Alpine Linux 와 Amazon Corretto

챗지피티에게 물어보니 정확하진 않지만 알파인 리눅스에서 Amazon Corretto와 같은 OpenJDK 를 이용하려고 할 때 glibc 로 인한 문제가 발생할 수 있다고 언급했다. 직접 만들어낸 이미지가 아닌 공식 [amazoncorretto:11.0.25-alpine](https://hub.docker.com/_/amazoncorretto)를 사용했기 때문에 일반적으로 문제가 없을 것이라 생각할 순 있지만 그렇다고 맹신할 순 없다. 알파인 리눅스에 대한 의심으로 `amazoncorretto:11.0.27-al2023` 이미지로 변경하니 템플릿을 찾을 수 없는 오류 로그는 발생하지 않았다.

결론적으로 알파인 리눅스 기반 이미지에서 ForkJoinPool 에 의한 클래스로더 문제가 발생할 수 있다는 정보는 찾을 수 없었다. 개인적으로 자바 클래스로더와 [Fork/Join 프레임워크](https://www.baeldung.com/java-fork-join)에 대한 기초가 부족한 점은 아쉬울 수 밖에 없는 상황이다. 그동안 ThreadPoolExecutor 와 Executors로 생성한 ExecutorService 를 사용하면서 깊은 이해가 요구되진 않았기 때문이다. 아무튼, Go 또는 Python 언어로 만들어진 서버와 다르게 스프링 프레임워크 기반 애플리케이션은 알파인 리눅스와 호환성 문제가 발생할 수 있으므로 멀리하는 것이 좋아보인다.

---

다시 생각해보니 알파인 리눅스를 멀리하는 건 조금 아쉽다고 느껴지므로 클래스패스 리소스에 대해서 알아보고 문제에 대한 상황을 다시한번 바라본 후 해결책을 모색해보고자 한다. 일단 스프링 기반 애플리케이션은 빌드 단계에서 `리소스(resources) 폴더를 클래스패스에 포함`될 수 있도록 WAR 또는 JAR 파일로 패키징된다. 이렇게 포함된 리소스는 정적 리소스로 사용자에게 전달할 수도 있지만 애플리케이션 내부적으로 로드되어 활용될 수 있다. 클래스패스에 존재하는 리소스를 쉽게 사용할 수 있도록 지원하는게 스프링 프레임워크에서 제공하는 [ClassPathResource](https://github.com/spring-projects/spring-framework/blob/main/spring-core/src/main/java/org/springframework/core/io/ClassPathResource.java) 클래스다. ApplicationContext 인터페이스에는 ResourcePatternResolver 가 포함되어 있어서 ResourceUtils.CLASSPATH_URL_PREFIX 로 정의된 `classpath:` 를 접두어로 사용하면 클래스패스에 존재하는 파일 리소스를 불러올 수 있게 되는 것이다.

#### ClassLoader in ClassPathResource

ClassPathResource의 생성자에서 클래스로더가 지정되지 않으면 [ClassUtils.getDefaultClassLoader](https://github.com/spring-projects/spring-framework/blob/main/spring-core/src/main/java/org/springframework/util/ClassUtils.java#L220) 의 클래스로더를 사용하여 리소스를 참조하게 된다. 코드 구현을 살펴보면 현재 스레스에 설정된 컨텍스트 클래스로더를 먼저 찾고 마지막으로는 시스템 클래스로더를 통해 부트스트랩 클래스로더로 위임하여 리소스를 가져올 수 있음을 이해할 수 있다. [일반적인 클래스로더와 스레드 컨텍스트 클래스로더의 차이](https://www.baeldung.com/java-class-loader-thread-context-vs-normal)를 보면 ForkJoinPool.commonPool 내의 ContextClassLoader가 다를 수 있음을 알 수 있는데 JDK 9 부터는 `ContextClassLoader가 시스템 클래스로더로 설정된다`고 한다.

```java
2025-06-29T04:03:25.603Z  INFO 1 --- [springboot] [   scheduling-1] kr.kdev.demo.Application                 : jar:nested:/app.jar/!BOOT-INF/classes/!/test.txt, true, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c
2025-06-29T04:03:25.602Z  INFO 1 --- [springboot] [onPool-worker-2] kr.kdev.demo.Application                 : jar:nested:/app.jar/!BOOT-INF/classes/!/test.txt, true, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c, jdk.internal.loader.ClassLoaders$AppClassLoader@502f3a78
2025-06-29T04:03:25.602Z  INFO 1 --- [springboot] [onPool-worker-1] kr.kdev.demo.Application                 : jar:nested:/app.jar/!BOOT-INF/classes/!/test.txt, true, org.springframework.boot.loader.launch.LaunchedClassLoader@36baf30c, jdk.internal.loader.ClassLoaders$AppClassLoader@502f3a78
```

다시 말하면, 알파인 리눅스에서는 실행 가능한 JAR 또는 WAR로 패키징된 파일을 시스템 클래스로더에서 바라볼 수 있는 경로에 포함되지 않는다는 이야기다. 실제로 테스트를 해보면 스트림을 호출하는 스레드 내에서는 `LaunchedClassLoader,` 스트림 내에서는 `ClassLoaders$AppClassLoader` 가 출력되었음을 알 수 있었다. JDK 버전과 상관없이 알파인 리눅스 이미지에서는 해당 문제가 발생할 수 있다는 이야기로 ForkJoinPool.commonPool 의 스레드 내에서 ClassPathResource를 사용할 때에는 `올바른 클래스로더가 사용할 수 있도록 전달해야함`을 알 수 있다. 아무래도 알파인 리눅스 이미지를 베이스로 사용하지 않는게 코드를 수정하지 않고 해결할 수 있는 간단한 방법이긴 하다.