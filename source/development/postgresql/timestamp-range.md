---
    title: Timestamp Range
    description:
    date: 2020-06-21
    categories: [개발 이야기]
    tags: [Postgres]
---

## 타임스탬프 범위  
Postgres에서 타임스탬프의 범위는 tsrange(timestamp without time zone)와 tstzrange(timestamp with time zone)로 표현합니다.

### 생성자 함수
생성자 함수를 통해 타임스탬프 범위를 생성하고 범위에 대한 경계점을 지정할 수 있습니다.

```sql
SELECT tsrange(start_date, end_date);
SELECT tsrange(start_date, end_date, '[)');
```

### 제약조건과 타임스탬프 범위
필요에 따라서 테이블 제약조건에 타임스탬프 범위를 사용하고 싶을 수 있습니다.
기본적으로는 불가능하지만 `btree_gist` 확장 모듈을 추가하면 타임스탬프 범위에 대한 인덱스를 지정할 수 있습니다.

```sql
-- btree_gist가 없다면 다음과 같이 오류가 발생
[42704] ERROR: data type character varying has no default operator class for access method "gist"
Hint: You must specify an operator class for the index or define a default operator class for the data type.

-- SUPERUSER 권한이 있는 계정으로 btree_gist 추가
CREATE EXTENSION btree_gist;

-- 설치할 수 있는 확장 목록
SELECT * FROM pg_available_extensions;

-- 설치된 확장 목록
SELECT * FROM pg_extension;
```

#### EXCLUDE 제약 조건
범위에 대해서는 UNIQUE 보다는 EXCLUDE가 더 적절한 경우가 많습니다.
예를 들어, EXCLUDE 제약 조건을 사용하여 오버랩핑되지 않는 범위를 표현할 수 있습니다.

```sql
-- EXCLUDE [ USING index_method ] ( exclude_element WITH operator [, ... ] ) index_parameters [ WHERE ( predicate ) ]

CREATE TABLE overlap_times
(
    first_name INTEGER NOT NULL,
    last_name  VARCHAR NOT NULL,
    date_range TSRANGE NOT NULL,
    EXCLUDE USING gist (first_name WITH =, last_name WITH =, date_range WITH &&)
);
```

## Reference  
- [Postgres - Range Types](https://www.postgresql.org/docs/9.6/rangetypes.html)
- [Postgres - btree_gist](https://www.postgresql.org/docs/9.6/btree-gist.html)
- [Postgres constraint for unique datetime range](https://stackoverflow.com/questions/26735955/postgres-constraint-for-unique-datetime-range)
- [No overlapping timestamp with condition](https://dba.stackexchange.com/questions/206828/no-overlapping-timestamp-with-condition)
