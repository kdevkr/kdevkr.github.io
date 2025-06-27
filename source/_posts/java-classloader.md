---
title: 자바 클래스로더 이슈
date: 2025-06-27T23:00+09:00
tags:
- JDK11
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
