---
title: Testcontainers for Java
date: 2023-01-14
---

현재 회사는 빠른 업무 처리를 위해서 간단한 방식을 취해왔고 이로 인해 최근에는 제품 품질 강화를 고민하는 상황이 발생했다. 조직에서 당장 나에게 요구하는 것은 테스트 환경에 대한 방안에 대한 도입하는 것이다. 작은 조직으로써 간단한 방식을 취했기 때문에 제품 코드에 대한 단위 테스트를 작성한 부분이 생각보다 많지 않다. 조직 내의 개발자들은 테스트 코드 작성을 강제하지 않기 때문에 스스로 중요하다고 생각하지 않는다면 굳이 작성하지 않는 편이었고 개발자마다 다른 방식으로 테스트를 수행하도록 코드가 작성되어 있었다. 아무튼 테스트 코드가 작성되지 않았는데 테스트 환경을 준비하는 것에 의아한 부분이 있긴 하지만 요구하므로 시도해보기로 한다.

#### 기술 스택
현재 조직에서 만드는 제품에서 사용되는 기술 스택은 대부분의 회사들에서도 도입하는 일반적인 기술들이다.

- Spring Boot 2.3 (JDK 11)
- Postgresql 12.3
- Elasticsearch 7.3.2
- Redis 5.0.3
- KDB+ 4.0

시간이 많이 흘러서 지금은 버전이 많이 낮지만 생각보다 기술 스택은 나쁘지 않다고 생각된다. 사용하는 대부분의 기술 스택에 대해서는 [Testcontainers](https://www.testcontainers.org/)에서 테스트 컨테이너 모듈이나 예제를 제공하고 있다. 그러나, 상용 시계열 데이터베이스로 사용중인 KDB+에 대한 의존성으로 인해 테스트 환경을 준비하는게 생각보다 까다롭지만 KDB+에 대한 도커 컴포즈 환경을 만든다면 [도커 컴포즈 모듈](https://www.testcontainers.org/modules/docker_compose/)로 실행할 수 있다는 것이다.

#### 요구사항
[Docker v17.0.3+](https://www.testcontainers.org/supported_docker_environment/) 버전을 요구하며 [Jupiter/JUnit 5](https://www.testcontainers.org/test_framework_integration/junit_5/) 프레임워크를 지원하므로 테스트 코드에 대한 작성은 JUnit5로 작성되도록 가이드하면 될 것 같다.

#### 예제
기본적으로 [testcontainers-java/examples](https://github.com/testcontainers/testcontainers-java/tree/main/examples)를 제공하며 본 글을 작성하면서 확인해본 예제는 [kdevkr/spring-demo-testcontainers](https://github.com/kdevkr/spring-demo-testcontainers)에서 확인할 수 있다.

#### 트러블슈팅

##### 1. PostgreSQL 컨테이너가 중복으로 실행된 문제
JDBC 테스트를 위해 PostgreSQL 컨테이너를 적용해보는 과정에서 [max_connections 옵션 설정](https://github.com/kdevkr/spring-demo-testcontainers/pull/8#issuecomment-1374673165)이 되지 않는 현상이 있었는데 [Discussions를 통한 문의](https://github.com/testcontainers/testcontainers-java/discussions/6398)를 통해 Testcontainers의 개발자분에게 도움을 받았다. 내가 잘못한 부분은 [Database containers launched via JDBC URL scheme](https://www.testcontainers.org/modules/databases/jdbc/)으로 자동 생성되는 컨테이너 방식과 수동으로 생성하는 것을 혼용하고 있었던 것이다. JDBC URL 방식으로 테스트 컨테이너를 실행할 것이 아니라면 PostgreSQL 컨테이너를 생성하고 일반적인 JDBC URL을 사용하면 된다.

##### 2. 테스트 컨테이너 공유
여러개의 테스트 함수를 포함하는 클래스에서 테스트 컨테이너를 공유하고자 한다면 @Testcontainers와 @Container를 활용하면 된다.

##### 3. 테스트 컨테이너에 대한 로그백 설정
[Recommended logback configuration](https://www.testcontainers.org/supported_docker_environment/logging_config/)를 제공하므로 스프링 부트에서 기본적으로 제공하는 로그백에 대한 설정을 참고할 수 있다. 로그백에 대한 설정을 하지 않는다면 불필요하게 컨테이너 실행에 대한 로그가 출력될 것이다. 테스트 컨테이너에 대한 이슈가 발생할 경우에만 아래와 같은 패키지의 로그 레벨을 DEBUG로 설정하자.

```xml
<logger name="org.testcontainers" level="DEBUG"/>
```

##### 4. 테스트 컨테이너 환경에 대한 프로퍼티 적용
JUnit5 테스트 코드를 제대로 작성하지 않다보니 테스트 프로파일에 대한 파일을 만들고 환경 변수를 통해 프로파일을 지정하였으나 테스트 컨테이너를 실행하는 경우 컨테이너의 호스트와 포트가 원래 포트와 달라지는 부분으로 인하여 아래와 같은 유틸 클래스들을 사용해야했다.

- [@DynamicPropertySource](https://github.com/spring-projects/spring-framework/blob/main/spring-test/src/main/java/org/springframework/test/context/DynamicPropertySource.java)
- [DynamicPropertyRegistry](https://github.com/spring-projects/spring-framework/blob/main/spring-test/src/main/java/org/springframework/test/context/DynamicPropertyRegistry.java)

```java
@Container
static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:6.2-alpine"))

@DynamicPropertySource
static void registerRedisProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.redis.host", () -> redis.getHost());
    registry.add("spring.redis.port", () -> redis.getMappedPort(REDIS_PORT));
}
```

