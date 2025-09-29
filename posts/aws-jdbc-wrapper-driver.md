---
title: AWS JDBC Wrapper Driver
date: 2025-02-22T00:00+09:00
tags:
- JDBC
- PostgreSQL
---

#### AWS Advanced JDBC Wrapper Driver

AWS 에서는 Amazon Aurora를 위한 여러가지 기능을 포함한 [Advanced JDBC Wrapper Driver](https://aws.amazon.com/ko/blogs/database/introducing-the-advanced-jdbc-wrapper-driver-for-amazon-aurora/)을 제공하고 있습니다. 그동안 조직에서는 Aurora PostgreSQL에 연결하기 위해서 [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/)를 사용하면서  <u>사용자 및 비밀번호 기반의 인증</u> 을 사용해왔습니다. 그런데, 뜬금없이 AWS 인프라 재구성과 더불어 IAM 역할 전환을 포함한 [IAM 기반 데이터베이스 인증](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/AuroraUserGuide/UsingWithRDS.IAMDBAuth.html)을 도입하게 되었습니다. [AWS JDBC Wrapper](https://github.com/aws/aws-advanced-jdbc-wrapper)는 IAM 기반 인증을 위한 플러그인 뿐만 아니라 페일오버, 읽기/쓰기 분할 등 [다양한 플러그인을 지원](https://github.com/aws/aws-advanced-jdbc-wrapper/tree/main/docs/using-the-jdbc-driver/using-plugins)합니다. 

#### PostgreSQL 2차원 배열에 대한 이슈

```java
java.lang.IllegalStateException: Expected BEGIN_ARRAY but was BEGIN_OBJECT at line 1 column 2 path $
```

기존에 사용하던 스프링 데이터소스의 드라이버를 PostgreSQL JDBC Driver 에서 software.amazon.jdbc.Driver 로 변경함에 따라 애플리케이션에서 사용중이던 일부 SQL 호출에서 위와 같은 오류가 발생했습니다. 현재 조직에서는 JPA 또는 MyBatis와 같은 SQL 매핑 기술을 사용하지 않고 일반 스프링 JDBC의 SQL 함수 호출과 함께 RowMapper에 대한 구현체를 별도로 만들어서 활용하고 있습니다. 기존에는 PostgreSQL JDBC Driver를 사용했으므로 RowMapper 내 코드에는 PGobject 또는 PgArray와 같은 클래스를 직접적으로 의존하도록 되어있었습니다. AWS JDBC Wrapper는 기존 드라이버에 대해 기능을 보완하기 위해 래핑한 드라이버로 PgResultSet은 ResultSetWrapper로 PgArray는 ArrayWrapper로 변경되어버립니다. 그리고 각 Wrapper 클래스 안에는 원본 ResultSet과 Array를 포함하고 있게 됩니다.

기존에 별도로 구현된 RowMapper 에서는 배열 또는 컬렉션 타입의 필드를 대응하기 위하여 PgArray에 대한 인스턴스인지를 확인하기 위해 instanceOf 연산자를 사용하도록 작성되어있었습니다. AWS JDBC Wrapper 드라이버를 사용한 순간 ArrayWrapper 클래스로 변경되므로 PgArray에 대한 로직은 수행되지 않고 무시되어 최종적으로는 **GSON을 사용하여 제네릭 타입에 대한 변환을 시도했던 것** 입니다.

```java
Array array = jdbcTemplate.queryForObject("SELECT ARRAY [[1,2,3],[4,5,6]]::BIGINT[][]", Array.class);
Long[][] arrays = (Long[][]) array.getArray();
```

따라서, PostgreSQL JDBC Driver와 software.amazon.jdbc.Driver를 모두 대응할 수 있도록 기존 RowMapper의 코드를 Array와 같은 JDBC 인터페이스에 의존하도록 최대한 변경하고 일부 예외 케이스들을 찾아서 대응할 수 있도록 다시 구현해야합니다. 

#### No results were returned by the query

ResultSet 에서 가져온 ArrayWrapper의 getArray 함수를 호출하면 위와 같은 반환값이 없다는 메시지가 포함된 PSQLException이 발생하게 되는 케이스가 있었습니다. 디버그 결과 상 "[]"가 포함된 경우로 빈 배열이 아닌 예외가 발생해버립니다. ArrayWrapper에는 비어있는지에 대한 유무를 제공하는 함수는 없으나 이와 같은 문제가 발생하는 경우 비어있는 값이 명확하므로 try-catch 구문으로 예외를 처리하거나 ResultSet.getString 으로 빈 배열로 표현되는 문자열인지를 검사하는 방식으로 대응할 수 있습니다.

[aws-jdbc-wrapper-test](https://github.com/kdevkr/aws-jdbc-wrapper-test) 에서 여러가지 SQL 호출과 AWS JDBC Wrapper에 대해 테스트해보고 있습니다.