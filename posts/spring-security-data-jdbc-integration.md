---
title: 스프링 시큐리티 데이터 JDBC
date: 2023-07-13T20:00+0900
tags:
- Spring Security
- Spring Data JDBC
---

> 전체 예제 코드는 [kdevkr/spring-boot-security](https://github.com/kdevkr/spring-boot-security/)에서 확인할 수 있다.

[Spring Data Integration](https://docs.spring.io/spring-security/reference/servlet/integrations/data.html)를 참고하면 스프링 시큐리티와 스프링 데이터 모듈을 통합할 수 있다.   
우선 아래와 같이 클래스패스에 `org.springframework.security:spring-security-data` 의존성을 추가하도록 하자.

```groovy build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jdbc'
    implementation 'org.springframework.boot:spring-boot-starter-jdbc'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.security:spring-security-data'
}
```
```java
@Bean
public SecurityEvaluationContextExtension securityEvaluationContextExtension() {
	return new SecurityEvaluationContextExtension();
}
```

구성 클래스에서 **SecurityEvaluationContextExtension**를 빈으로 등록하면 @PreAuthorize와 같은 메소드 기반 표현식과 비슷하게 **@Query** 내에서 스프링 시큐리티에 대한 SpEL을 사용할 수 있다. 하지만, 스프링 시큐리티 공식 문서와 [Spring Data에 대한 예제 코드](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/java-configuration/data)와 같이 시도해보면 아래와 같은 `오류`가 발생한다.

```java
org.springframework.dao.InvalidDataAccessApiUsageException: SQL [SELECT u.username FROM users u where u.username = ?__$synthetic$__1]: given 1 parameters but expected 0
```

위와 같은 오류가 발생하는 이유는 Spring Data JDBC는 내부적으로 **N**amedParameterJdbcTemplate**를 사용하기 때문에 `?`와 같은 JPQL 또는 Native 쿼리 방식과는 차이가 있으므로 `?`이 아닌 `:`로 표현해야한다.

```java
@Repository
public interface UserRepository extends CrudRepository<User, String> {
    @Query("SELECT u.username FROM users u where u.username = :#{ principal?.username }")
    String getUsername();
}
```

