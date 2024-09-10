---
title: JPA - PostgreSQL JSONB
date: 2024-09-10T22:00+09:00
tags:
- JPA
- PostgreSQL
- JSONB
---

JPA로 **PostgreSQL의 JSONB 컬럼의 JSON 데이터**를 처리하고자 할때 [Hypersistance Utils](https://github.com/vladmihalcea/hypersistence-utils)를 적용하여 쉽게 해결할 수 있다.

#### @Type(JsonType.class)

공식 문서에 설명되어있는 대로 **JsonType** 과 **JsonBinaryType** 을 사용할 수 있다.

```java
@Type(JsonBinaryType.class)
@Column(nullable = false, columnDefinition = "jsonb")
private Map<String, Object> metadata = new HashMap<>();
```

만약, 컬럼에 대한 **columnDefinition**를 지정하지 않으면 아래와 같은 매핑 오류가 발생할 수 있다.

```sh
Caused by: org.hibernate.MappingException: Unable to determine SQL type name for column 'metadata' of table 'users' because there is no type mapping for org.hibernate.type.SqlTypes code: 1111 (OTHER)
```

#### @JdbcTypeCode(SqlTypes.JSON)

JsonType 과 JsonBinaryType 를 사용하는 것보다 [JdbcTypeCode](https://docs.jboss.org/hibernate/orm/6.5/javadocs/org/hibernate/annotations/JdbcTypeCode.html)의 타입을 JSON 으로 지정하는게 더 간단하다.

```java
@JdbcTypeCode(SqlTypes.JSON)
private Metadata metadata;

@Data
public class Metadata {
    private boolean active;
}
```

자매품으로 PostgreSQL 에서의 Enum 컬럼에 대한 @JdbcType([PostgreSQLEnumJdbcType](https://docs.jboss.org/hibernate/orm/6.5/javadocs/org/hibernate/dialect/PostgreSQLEnumJdbcType.html)::class)도 확인해봐야겠네?
