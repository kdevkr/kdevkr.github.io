---
  date: 2021-06-28 09:00
  title: PL/pgSQL Function
  categories: [개발 이야기]
  tags:
    - Postgres
---

> https://www.postgresql.org/docs/current/plpgsql-overview.html

{% note warning %}
#### 알려드립니다.
본 글을 아직 작성이 완료되지 않았습니다.
{% endnote %}

## Overview
`CREATE OR REPLACE FUNCTION`은 함수 정의를 위한 문법입니다.
PostgreSQL은 사용자 정의 함수를 용이하게 만들 수 있도록 `plpgsql` 언어 모듈을 제공합니다.

다음과 같이 FUNCTION을 정의할 때 PL/pgSQL을 언어로 지정할 수 있습니다.
```pgsql
CREATE OR REPLACE FUNCTION function_name(parameter TYPE)
RETURNS TYPE AS
$$
DECLARE
  $variable TYPE;
BEGIN
  RETURN $variable;
END;
$$ LANGUAGE plpgsql; -- 언어 지정
```

## Fetch CURSOR
`FETCH [direction] [FROM | IN] [cursor_name]`를 통해 커서로 접근해 데이터를 확인할 수 있습니다.

```pgsql
CREATE OR REPLACE FUNCTION account$retrieve(v_account_id CHARACTER VARYING)
RETURNS REFCURSOR AS
$$
DECLARE
  rtn_cursor REFCURSOR := 'rtn_cursor'
BEGIN
  OPEN rtn_cursor FOR
    SELECT *
    FROM account
    WHERE account_id = v_account_id;

  RETURN rtn_cursor;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------
BEGIN;
SELECT account$retrieve('1');
-- FETCH [direction] [FROM | IN] [cursor_name]
FETCH ALL "rtn_cursor";
END;
--------------------------------------------------
```  
