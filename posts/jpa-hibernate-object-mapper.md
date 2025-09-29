---
title: JPA - Hibernate ObjectMapper
date: 2024-09-10T23:00+09:00
tags:
- JPA
- Hibernate
- Jackson
- ObjectMapper
---

현재 조직에서 **JPA 라는 ORM 기술을 활용하고 있지 않지만** 오랜만에 JPA라는 기술을 통해 데이터베이스와 통신해보고 경험하게 된 문제와 해결방법에 대해 공유해보려고 합니다. MySQL 또는 PostgreSQL 에서는 JSON 데이터를 저장하고 처리할 수 있는 함수를 제공하고 있습니다. PostgreSQL에서 JSONB 컬럼의 데이터를 가져오는 과정에서 **모델 클래스에 맞지 않은 필드가 포함될 때 발생할 수 있는 UnrecognizedPropertyException 예외**를 경험했는데요.

#### DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES

먼저, 스프링 부트 프로젝트에서 자동 구성을 통해 기본적으로 제공하는 ObjectMapper에 대해서 알 수 없는 필드가 포함된 경우 오류로 처리하지 않도록 아래와 같이 다양한 방법으로 설정할 수 있다는 것은 대부분 인지하고 있는 정보라고 생각됩니다.

- @JsonIgnoreProperties(ignoreUnknown = true)
- DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES
- spring.jackson.deserialization.fail-on-unknown-properties

```yaml application.yml
spring.jackson.deserialization.FAIL_ON_UNKNOWN_PROPERTIES: false
```

> 현재 조직의 프로젝트에서는 [Jackson2ObjectMapperBuilder](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html)를 빈으로 직접 등록하여 커스텀 옵션이 적용된 사용하고 있어요!

#### JPA 에서는 FAIL_ON_UNKNOWN_PROPERTIES 설정이 적용되지 않음

```sh
Caused by: java.lang.IllegalArgumentException: The given string value: {"active": true, "mfa_type": "email"} cannot be transformed to Json object
	... 79 common frames omitted
Caused by: com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException: Unrecognized field "mfa_type" (class kr.kdev.demo.UserEntity$Metadata), not marked as ignorable (one known property: "active"])
 at [Source: REDACTED (`StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION` disabled); line: 1, column: 31] (through reference chain: kr.kdev.demo.UserEntity$Metadata["mfa_type"])
```

위 오류 메시지는 JPA 에서 **JSONB 컬럼에 올바르지 않은 필드가 포함된 JSON**을 모델 클래스로 변환하는 과정에서 발생한 것 입니다. 앞서, 스프링 부트에서 기본으로 제공하는 ObjectMapper에 FAIL_ON_UNKNOWN_PROPERTIES 를 설정했는데 왜 적용이 안되는걸까요? 그 이유는 JSON 데이터를 처리하기 위해서 적용한 [Hypersistence Utils](https://github.com/vladmihalcea/hypersistence-utils)에서 사용하는 [JacksonJsonFormatMapper](https://github.com/spring-projects/spring-boot/issues/33870) 에서 스프링 **빈 팩토리에서 관리하는 ObjectMapper 인스턴스가 아니기 때문**입니다.

#### PostgreSQL JSONB 컬럼 매핑 시 ObjectMapper 변경하는 방법

JPA 에서 JSON 데이터 처리 시 사용하는 ObjectMapper를 스프링 부트에서 빈으로 관리하는 인스턴스로 변경하려면 아래와 같은 방법들을 활용할 수 있습니다.

- [ObjectMapperWrapper](https://github.com/vladmihalcea/hypersistence-utils/issues/304)
- hibernate.types.jackson.object.mapper + [ObjectMapperSupplier](https://vladmihalcea.com/hibernate-types-customize-jackson-objectmapper/)
- [HibernatePropertiesCustomizer](https://github.com/spring-projects/spring-boot/issues/33870#issuecomment-1386822021)

```java
@Bean
public HibernatePropertiesCustomizer jsonFormatMapperCustomizer(ObjectMapper objectMapper) {
    return (properties) -> properties.put(AvailableSettings.JSON_FORMAT_MAPPER,
        new JacksonJsonFormatMapper(objectMapper));
}
```

> 저는 스프링 부트 이슈 티켓에서 알려주는 HibernatePropertiesCustomizer로 ObjectMapper를 적용했습니다.
