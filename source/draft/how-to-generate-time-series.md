---
title: 날짜 및 시간의 시계열 데이터 만들기
date: 2021-06-30
tags:
 - Time Series
---

안녕하세요 Mambo 입니다. 오늘 알아볼 주제는 일정한 간격으로 반복된 날짜 및 시간의 시계열 데이터를 만들어보는 것입니다. 우리는 현재 시계열 데이터를 주로 다루는 빅데이터 시대에 살고 있습니다. 예를 들어, 환율, 주식 그리고 코인의 변동 데이터를 시계열 데이터라고 할 수 있습니다.

![기영이 패턴...?](../images/posts/how-to-generate-time-series-01.jpg)

## 일정한 간격의 날짜 및 시간
제가 일정한 간격의 날짜 및 시간을 만드려는 이유는 메모리 엔진을 사용하여 빠른 성능을 보여주는 [KDB+](https://kx.com/)와 같은 DB에서는 집계 시 데이터가 존재하는 시간에 대해서만 제공하기 때문입니다. 실제로 데이터가 존재하는 시간 포인트만 차트에 표시되는 것이 정확할 수 있지만 경우에 따라서는 데이터가 없는 포인트도 0으로 표시하고 싶어할 수 있습니다.

### PostgreSQL
가장 먼저, PostgreSQL의 [Set Returning Functions](https://www.postgresql.org/docs/11/functions-srf.html) 중 `generate_series(start, stop, step interval)`을 활용해서 일정한 간격의 날짜 및 시간을 만들수 있습니다.

```pgsql generate_series
SELECT generate_series('2021-01-01 00:00'::TIMESTAMP, '2021-12-31 23:59'::TIMESTAMP, '1H'::INTERVAL) AS series

-- 2021-01-01 00:00:00.000000
-- 2021-01-01 01:00:00.000000
-- 2021-01-01 02:00:00.000000
-- 2021-01-01 03:00:00.000000
-- 2021-01-01 04:00:00.000000
```

generate_series로 만들어지는 날짜 및 시간은 PostgreSQL의 타임존이 적용됨에 따라 약간의 문제를 가지게 됩니다. 다음의 예시를 볼까요?

```pgsql
SHOW TIMEZONE
-- UTC

SELECT generate_series('2021-01-01 00:00'::TIMESTAMP AT TIME ZONE 'Asia/Seoul', '2021-12-31 23:59'::TIMESTAMP AT TIME ZONE 'Asia/Seoul', '1H'::INTERVAL) AS series

-- 2020-12-31 15:00:00.000000
-- 2020-12-31 16:00:00.000000
-- 2020-12-31 17:00:00.000000
-- 2020-12-31 18:00:00.000000
-- 2020-12-31 19:00:00.000000
```

한국 시간 기준의 TIMESTAMP를 사용했지만 실제로는 한국 시간 기준의 날짜가 UTC 시간으로 변환되어 반환됩니다. 이는 PostgreSQL에서 적용된 타임존이 UTC 이기 때문입니다. 물론, 한국 전용 서비스라면 PostgreSQL의 타임존을 변경하면 됩니다만 다양한 시간대의 사용자가 사용하는 서비스라면 UTC 시간 기준으로 날짜를 다루게 됩니다.

그래서 이렇게 만들어지는 날짜 및 시간에 사용자에게 맞는 시간대를 적용하기 위한 함수를 만들도록 하겠습니다.

```pgsql datetime$generate
CREATE OR REPLACE FUNCTION "datetime$generate"(v_start_date TIMESTAMP, v_end_date TIMESTAMP, v_interval VARCHAR, v_time_zone VARCHAR)
    RETURNS REFCURSOR
    LANGUAGE plpgsql
AS
$$
DECLARE
    cursor REFCURSOR := 'cursor';
BEGIN
--     ERROR: invalid value for parameter "TimeZone": "v_time_zone"
--     SET SESSION TIME ZONE v_time_zone;
    OPEN cursor FOR
        WITH T AS (SELECT generate_series(v_start_date AT TIME ZONE 'UTC' AT TIME ZONE v_time_zone,
                                          v_end_date AT TIME ZONE 'UTC' AT TIME ZONE v_time_zone,
                                          v_interval::INTERVAL) AS series)
        SELECT series::DATE                                                                    AS date,
               series::TIME                                                                    AS time,
               extract(EPOCH FROM (series AT TIME ZONE v_time_zone AT TIME ZONE 'UTC')) * 1000 AS datetime -- UNIX Time
        FROM T;
    RETURN cursor;
END;
$$;

BEGIN;
SELECT datetime$generate(to_timestamp(1609426800000 / 1000)::TIMESTAMP, to_timestamp(1640962799999 / 1000)::TIMESTAMP, '5M', 'Asia/Seoul');
FETCH ALL IN "cursor";
END;

-- date,time,datetime
-- 2021-01-01,00:00:00,1609426800000
-- 2021-01-01,00:05:00,1609427100000
-- 2021-01-01,00:10:00,1609427400000
-- 2021-01-01,00:15:00,1609427700000
```

날짜와 시간을 타임존이 적용된 문자열과 함께 실제 UNIX 시간도 함께 반환하였습니다.

### KDB


### Java

### Moment Range
최근에는 클라이언트의 성능이 상당히 높아서 브라우저에서 자체적으로 만드는 것도 나쁘지는 않습니다. 