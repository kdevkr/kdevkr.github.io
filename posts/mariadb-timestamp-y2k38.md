---
title: MariaDB Timestamp Y2K38
date: 2023-09-24T14:00+0900
tags:
- MariaDB
- Y2K38
---

#### What's Y2K38 ???

> Timestamps in MariaDB have a maximum value of 2147483647, equivalent to 2038-01-19 05:14:07. This is due to the underlying 32-bit limitation. Using the function on a date beyond this will result in NULL being returned. Use DATETIME as a storage type if you require dates beyond this.

2038년 문제는 시간을 32비트 정수형으로 표현하는 시스템에서 발생하는 문제이다. MariaDB(MySQL)은 시간을 표현하는 경우  문자열로 저장되는 DATETIME과 UTC로 저장되는 TIMESTAMP를 사용할 수 있는데 TIMESTAMP 형식은 4바이트로 저장된다. 따라서, DATETIME을 사용하는 것을 권고하는 편이며 DATETIME은 문자열로 저장되므로 DATETIME을 저장하는 시점에 UTC로 저장될 수 있도록 타임존을 UTC로 설정하는 게 좋다.

> MariaDB 타임존을 UTC가 아닌 Aisa/Seoul로 설정하는 경우에는 SQL 조회 시 CONVERT_TZ 함수를 매번 사용해야할 필요가 있다.

#### Example

```sql
SHOW VARIABLES LIKE '%time_zone%';
-- timezone: Asia/Seoul

CREATE OR REPLACE TABLE test
(
    id         BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY COMMENT 'ID',
    name       VARCHAR(50)           NULL COMMENT 'Name',
    created_at DATETIME              NOT NULL DEFAULT now()
);
INSERT INTO test (name) VALUES ('mambo');
SELECT convert_tz(created_at, '+09:00', '+00:00') AS created_at FROM test;
-- created_at,created_at_utc
-- 2023-09-24 16:36:30,2023-09-24 07:36:30
```
