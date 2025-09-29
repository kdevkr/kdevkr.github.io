---
title: Spring JDBC
date: 2022-09-05
tags:
- JDBC
- RowMapper
---

Spring Security OAuth2 학습을 위한 샘플 프로젝트를 만들면서 사용하게될 각 모듈에서 필요한 데이터베이스 스키마를 적용하기 위해서 Spring JDBC를 사용한 부분에 대해서 정리해보고자 합니다. 일반적으로 데이터 액세스에 대해서는 Mybatis 또는 JPA 이라는 기술을 도입하는 경우가 많을텐데 스프링 JDBC 만으로도 충분히 데이터베이스 액세스가 가능하며 Spring Session 이나 Spring Security 에서도 JDBC 기반으로 관련 기능을 제공하고 있습니다.

## Data Access with JDBC
Spring JDBC는 다양한 방식으로 데이터베이스에 대한 액세스 방법을 제공하며 스프링 세션이나 스프링 시큐리티와 함께 JDBC 기반으로 관련된 기능을 구현하기 위해서는 반드시 Spring JDBC가 포함되어야 합니다. 아마도 대부분의 애플리케이션에서는 관계형 데이터베이스에 대한 접근이 필수적이므로 다음과 같은 JDBC 모듈을 반드시 포함하고 있을 것 입니다.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-jdbc'
```

### JdbcTemplate
스프링 부트에서는 JdbcTemplateAutoConfiguration를 통해서 JdbcTemplate와 NamedParameterJdbcTemplate를 자동으로 빈으로 구성하는 것을 확인할 수 있는데요. JdbcTemplate 뿐만 아니라 NamedParameterJdbcTemplate를 함께 구성하는 이유는 Spring Data JDBC와 같은 모듈에서 내부적으로 사용하도록 되어있기 때문이라고 생각됩니다.

### JdbcUserDetailsManager
스프링 시큐리티에서 JdbcUserDetailsManager는 JDBC 기반의 사용자 인증 구현을 위해서 JdbcDaoSupport를 확장하며 내부적으로 JdbcTemplate과 RowMapper를 사용하는 것으로 작성되어 있습니다. 

### JdbcIndexedSessionRepository
스프링 세션에서의 JdbcHttpSessionConfiguration는 JdbcTemplate를 통해서 JdbcIndexedSessionRepository를 빈으로 등록하게 됩니다. JdbcIndexedSessionRepository는 내부적으로 JdbcOperations를 사용하여 SQL를 수행하는데 세션에 대한 애트리뷰트를 저장할때 [JDBC Batch Operations](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#jdbc-advanced-jdbc)를 활용하는 것으로 보입니다.

> JdbcTemplate는 JdbcOperatrions 구현체입니다.

## Stored Function with JDBC
현재 조직에서는 일반적으로 사용되는 Mybatis 또는 JPA를 도입하지 않고 스토어드 함수(프로시저와 비슷한)를 작성해놓고 스프링 JDBC를 통해서 호출하는 방식으로 구현하고 있습니다. 레거시 시스템을 경험하지 않았거나 Mybatis 또는 JPA라는 기술만을 접한 개발자들은 궁금할 수 있는 부분이기도 할 것 같습니다. 우선 아래와 같은 함수가 PostgreSQL 데이터베이스에 정의되어있다고 가정하겠습니다.

```sql
CREATE OR REPLACE FUNCTION users$find_by_username(v_username VARCHAR) RETURNS REFCURSOR AS
$$
DECLARE
    rtn_cursor REFCURSOR := 'rtn_cursor';
BEGIN
    OPEN rtn_cursor FOR
        SELECT username, password, enabled from users where username = v_username;
    RETURN rtn_cursor;
END;
$$ LANGUAGE plpgsql;

BEGIN;
select users$find_by_username('user');
FETCH ALL IN "rtn_cursor";
END;
```

### StoredProcedure
스프링 JDBC의 GenericStoredProcedure는 RDBMS에서 지원하는 스토어드 프로시저를 호출할 수 있도록 구현된 클래스입니다. 아래와 같이 스토어드 함수명을 지정하여 파라미터와 함께 전달하면 프로시저 호출 결과를 가져올 수 있습니다.

```java
@DisplayName("Call stored function using GenericStoredProcedure")
@Test
void testCallFunctionWithStoredProcedure() {
    String functionName = "users$find_by_username";
    jdbcTemplate.setResultsMapCaseInsensitive(true);
    GenericStoredProcedure storedProcedure = new GenericStoredProcedure();
    storedProcedure.setJdbcTemplate(jdbcTemplate);
    storedProcedure.setFunction(true);
    storedProcedure.setSql(functionName);

    storedProcedure.declareParameter(new SqlOutParameter("rtn_cursor", Types.REF_CURSOR, new ColumnMapRowMapper()));
    storedProcedure.declareParameter(new SqlParameter("v_username", Types.VARCHAR));

    Map<String, Object> inParams = new HashMap<>();
    inParams.put("v_username", "user");

    Map<String, Object> results = storedProcedure.execute(inParams);
    if (results.containsKey("rtn_cursor")) {
        Assertions.assertDoesNotThrow(() -> {
            List<Object> cursors = (List<Object>) results.get("rtn_cursor");
            for (Object cursor : cursors) {
                log.info("{}", cursor);
            }
        });
    }
}
```

### SimpleJdbcXXXX
SimpleJdbcInsert와 SimpleJdbcCall은 JdbcTemplate를 사용하여 몇가지 상황에 대해 효율적으로 처리할 수 있는 방법을 제공합니다. 예를 들어, 한번에 많은 생성 작업이 필요한 경우에 SimpleJdbcInsert를 사용할 수 있고 스토어드 프로시저(Stored Procedure) 또는 스토어드 함수(Stored Function)를 호출하고자 하는 경우에도 SimpleJdbcCall을 사용할 수 있습니다.

```java
@DisplayName("Call stored function using SimpleJdbcCall")
@Test
void testCallFunctionWithSimpleJdbcCall() {
    String functionName = "users$find_by_username";

    MapSqlParameterSource sqlParameterSource = new MapSqlParameterSource();
    sqlParameterSource.addValue("v_username", "user");

    Map<String, Object> result = new SimpleJdbcCall(jdbcTemplate)
            .withFunctionName(functionName)
            .withoutProcedureColumnMetaDataAccess()
            .declareParameters(new SqlParameter("v_username", Types.VARCHAR))
            .returningResultSet("rtn_cursor", new ColumnMapRowMapper())
            .execute(sqlParameterSource);
    log.info("{}", result.get("rtn_cursor"));
}
```

> GenericStoredProcedure와 비교해서 조금은 코드가 간결함을 확인할 수 있습니다.

### JdbcTemplate
스프링 JDBC에서 제공하는 클래스가 아니더라도 스토어드 프로시저를 호출할 수 있습니다. JdbcTemplate에서 커넥션을 가져온 후 prepareCall을 사용해서 직접 호출한 결과를 RowMapper로 변환할 수 있습니다. 

```java
@DisplayName("Call stored function using connection")
@Test
void testCallFunctionWithConnection() {
    String functionName = "users$find_by_username";

    Assertions.assertDoesNotThrow(() -> {
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement statement = connection.prepareCall(String.format("{call %s(?)}", functionName))) {
            statement.setString(1, "user");
            ResultSet resultSet = statement.executeQuery();
            while (resultSet.next()) {
                PgResultSet pgResultSet = (PgResultSet) resultSet.getObject(1);
                RowMapperResultSetExtractor<Map<String, Object>> extractor = new RowMapperResultSetExtractor<>(new ColumnMapRowMapper());
                log.info("{}", extractor.extractData(pgResultSet));
            }
        }
    });
}
```

> DataClassRowMapper 또는 BeanPropertyRowMapper를 사용해서 더 범용적인 코드를 작성할 수도 있습니다.

[저장 프로시저를 사용하는 것에 대한 장점](https://qr.ae/pvkBiH)도 존재하기 때문에 애플리케이션에서 저장 프로시저를 호출할 수 있는 방법을 알고 있는 것도 중요합니다. Spring JDBC에 대해서 다루기 때문에 소개하지는 않았지만 JPA 기술 스펙에서도 NamedStoredProcedureQuery와 같이 프로시저를 호출할 수 있도록 지원하고 있습니다.

## 참고

- [Spring Docs - Data Access with JDBC](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#jdbc)
- [Batch Processing in JDBC](https://www.baeldung.com/jdbc-batch-processing)
