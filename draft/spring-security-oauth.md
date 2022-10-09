---
title: Spring Security OAuth with JDBC
date: 2022-08-13
tags:
- Spring Security
- OAuth
- Authorization Server
---

> Spring Security OAuth reaches End-of-Life
> The [Spring Security OAuth](https://spring.io/projects/spring-security-oauth) and [Spring Security OAuth Boot 2 auto-configuration](https://github.com/spring-projects/spring-security-oauth2-boot) projects have reached end of life.

이제까지 스프링 시큐리티 기반의 환경에서 OAuth 시스템을 구현하기 위해서는 [Spring Security OAuth](https://mvnrepository.com/artifact/org.springframework.security.oauth)이라는 별도의 프로젝트 모듈을 사용해왔습니다. 그러나, 스프링 시큐리티 5에서 OAuth에 대한 일부 기능을 지원하고 [Spring Authorization Server](https://github.com/spring-projects/spring-authorization-server)와 함께 OAuth 시스템을 구현할 수 있도록 지원하게 되면서 관련 클래스에는 Deperecated 선언되면서 [OAuth 2.0 Migration](https://github.com/spring-projects/spring-security/wiki/OAuth-2.0-Migration-Guide)을 요구하고 있었고 2022년 6월 1일부로 Spring Security OAuth 프로젝트는 [End-of-Life](https://spring.io/blog/2022/06/01/spring-security-oauth-reaches-end-of-life) 되었습니다.

많은 스프링 시큐리티 기반의 OAuth 예제를 보면 위와 같이 Spring Security OAuth를 의존하게 되어있기 때문에 스프링 시큐리티 기반의 OAuth 시스템을 도입하기 위해서 예제를 찾아보는 분들에게는 오해의 소지가 많았습니다. 그래서 [OAuth 2.0 Features Matrix의 Authorization Server Support](https://github.com/spring-projects/spring-security/wiki/OAuth-2.0-Features-Matrix#authorization-server-support)에 따라 클라이언트 크레덴셜 기반의 Opaque 토큰을 발급하는 인증 서버를 만드는 예제를 만들면서 공부해보고자 합니다.

```groovy
dependencies {
    implementation 'org.springframework.security.oauth:spring-security-oauth2:2.5.2.RELEASE'
    implementation 'org.springframework.security.oauth.boot:spring-security-oauth2-autoconfigure:2.6.8'
    implementation 'org.springframework.boot:spring-boot-starter-jdbc'
    implementation 'org.springframework.session:spring-session-jdbc'
}
```

## Spring Authorization Server
[OAuth 2.0 Features Matrix의 Authorization Server Support](https://github.com/spring-projects/spring-security/wiki/OAuth-2.0-Features-Matrix#authorization-server-support)에 따르면 Spring Authorization Server는 Opaque Token에 대한 기능을 지원하지 않는다고 나와있습니다.

> 그러나, [Feature List](https://docs.spring.io/spring-authorization-server/docs/current/reference/html/overview.html#feature-list) 문서를 보면 Opaque 토큰을 지원하는 것으로 되어있음을 알려드립니다.

### Opaque Token
[OAuth2TokenGenerator](https://docs.spring.io/spring-authorization-server/docs/current/reference/html/core-model-components.html#oauth2-token-generator)를 참고하면 기본적으로 DelegatingOAuth2TokenGenerator가 빈으로 등록되기 때문에 Opaque Token을 생성하기 위해서는 TokenSettings에 OAuth2TokenFormat.REFERENCE를 지정하면 됩니다. 다음은 만료 기간이 없는 액세스 토큰을 발급하도록 TokenSettings를 등록하는 예시입니다.

```java
@Slf4j
@Configuration(proxyBeanMethods = false)
public class AuthorizationServerConfig {

    @Bean
    public TokenSettings tokenSettings() {
        return TokenSettings.builder()
                .accessTokenFormat(OAuth2TokenFormat.REFERENCE)
                .accessTokenTimeToLive(Duration.ZERO)
                .refreshTokenTimeToLive(Duration.ZERO)
                .reuseRefreshTokens(false)
                .build();
    }

}
```

### Database Schema for SQLite
Spring Authorization Server에서는 JdbcRegisteredClientRepository를 통해 JDBC 기반의 클라이언트 크레덴셜을 등록하고 액세스 토큰을 발급하는 것을 지원합니다. 저는 SQLite를 사용하려고 하며 데이터베이스 스키마는 Spring Authorization Server 모듈에 내장되어있으므로 SQLite에 추가하기 위해 아래와 같이 DatabasePopulator를 활용하여 애플리케이션이 실행될 때 스키마를 생성하도록 하겠습니다.

#### SQLite JDBC 프로퍼티 설정
```yaml
spring:
  datasource:
    embedded-database-connection: none
    driver-class-name: org.sqlite.JDBC
    url: jdbc:sqlite:src/main/resources/db/database.db
```

#### 스키마 생성
```java
@Configuration
public class OAuthDatabasePopulator {

    @Bean
    public DataSourceInitializer dataSourceInitializer(DataSource dataSource) {
        DataSourceInitializer dataSourceInitializer = new DataSourceInitializer();
        dataSourceInitializer.setDataSource(dataSource);
        dataSourceInitializer.setDatabasePopulator(databasePopulator());
        return dataSourceInitializer;
    }

    @Bean
    public DatabasePopulator databasePopulator() {
        final ResourceDatabasePopulator databasePopulator = new ResourceDatabasePopulator();
        databasePopulator.setContinueOnError(true);
        databasePopulator.addScript(new ClassPathResource("org/springframework/security/oauth2/server/authorization/oauth2-authorization-schema.sql"));
        databasePopulator.addScript(new ClassPathResource("org/springframework/security/oauth2/server/authorization/oauth2-authorization-consent-schema.sql"));
        databasePopulator.addScript(new ClassPathResource("org/springframework/security/oauth2/server/authorization/client/oauth2-registered-client-schema.sql"));
        return databasePopulator;
    }
}
```

### RegisteredClientRepository
클라이언트를 등록하기 위해 JdbcOperations를 사용하는 JdbcRegisteredClientRepository를 빈으로 등록합니다.

```java
@Bean
public RegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate, TokenSettings tokenSettings) {
    RegisteredClient registeredClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("client")
            .clientSecret("{noop}secret")
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .scope("name")
            .tokenSettings(tokenSettings)
            .build();

    JdbcRegisteredClientRepository registeredClientRepository = new JdbcRegisteredClientRepository(jdbcTemplate);
    registeredClientRepository.save(registeredClient);
    return registeredClientRepository;
}
```

> 간단한 예제이므로 애플리케이션 실행시 클라이언트 크레덴셜 기반의 클라이언트를 자동으로 등록합니다.

### 

더 자세한 코드는 [kdevkr/spring-demo-oauth](https://github.com/kdevkr/spring-demo-oauth)를 참고하세요.

## 참고

- [OAuth 2.0 Features Matrix](https://github.com/spring-projects/spring-security/wiki/OAuth-2.0-Features-Matrix)
- [OAuth 2.0 Migration Guide](https://github.com/spring-projects/spring-security/wiki/OAuth-2.0-Migration-Guide)
- [Spring Security OAuth reaches End-of-Life](https://spring.io/blog/2022/06/01/spring-security-oauth-reaches-end-of-life)
- [Spring Authorization Server Is Going 1.0](https://spring.io/blog/2022/07/28/spring-authorization-server-is-going-1-0)
- [[NHN FORWARD 2021] Spring Security 5 OAuth 총정리: 클라부터 서버까지](https://www.youtube.com/watch?v=-YbqW-pqt3w)
