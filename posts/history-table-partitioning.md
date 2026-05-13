---
title: 대용량 이력 테이블(History Table) 파티셔닝 전략
description: PostgreSQL에서 pg_partman과 pg_cron을 활용하여 대용량 이력 테이블을 효율적으로 파티셔닝하고 관리하는 전략을 소개합니다.
date: 2026-05-13T07:27:59+09:00
tags:
    - PostgreSQL
    - Partitioning
    - pg_partman
---

# 대용량 이력 테이블(History Table) 파티셔닝 전략

시스템이 오랫동안 동작하다 보면 알람과 같은 히스토리성 이력 테이블들은 데이터 규모가 걷잡을 수 없이 커지게 됩니다. 아무리 데이터베이스가 인덱스를 통해 빠른 단건 조회 성능을 보여준다 하더라도, 넓은 기간을 조회하거나 오래된 데이터를 삭제하는 유지보수 과정에서는 결국 치명적인 풀 스캐닝(Full Scan)이 발생할 수밖에 없습니다.

또한 실제로 거의 조회하지 않는 방대한 데이터를 유지하는 비용은 생각보다 큽니다. 나중에 불필요한 데이터를 대량으로 삭제하려 하면 작업 시간이 오래 걸릴 뿐만 아니라 데이터베이스 전체에 상당한 부하를 주게 됩니다.

이러한 경우 테이블을 파티션 단위로 나누어서 관리하면, 유지 관리 관점에서 불필요한 데이터를 파티션 단위로 쉽게 삭제할 수 있어 매우 효율적입니다. 파티션을 나누는 이점은 시계열 데이터베이스(TSDB)에서 채택하는 방식과 동일하다고 볼 수 있습니다.

## 1. pg_partman 확장 설치

PostgreSQL 10 버전부터는 복잡한 상속이나 트리거 없이 테이블 생성 시 `PARTITION BY` 절을 사용하는 **선언적 파티셔닝(Declarative Partitioning)**을 기본으로 지원하여 파티션 구축이 매우 간편해졌습니다.

`pg_partman`은 이러한 PostgreSQL의 선언적 파티션 기능을 기반으로, 예약된 시간에 파티션을 자동으로 생성하고 오래된 파티션을 정리하는 유지 관리 작업을 자동화해 주는 강력한 확장입니다. 먼저 `pg_partman`을 사용하기 위해 스키마를 생성하고 확장을 설치해야 합니다. 관리의 편의성을 위해 전용 스키마를 사용하는 것을 권장합니다.

```sql
CREATE SCHEMA partman;
CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA partman;
```

## 2. 파티션 구성 (create_parent)

테이블을 생성한 후 `pg_partman`의 `create_parent` 함수를 사용하여 파티셔닝 정책을 설정합니다. 예를 들어, `public.alarms` 테이블을 `occured_at` 컬럼 기준으로 **월 단위(1 month)** 파티셔닝하고 싶다면 다음과 같이 설정합니다.

```sql
SELECT partman.create_parent(
  p_parent_table => 'public.alarms',
  p_control => 'occured_at',
  p_type => 'native',
  p_interval => '1 month',
  p_premake => 12
);
```

- `p_parent_table`: 파티셔닝 대상이 되는 상위 테이블 이름
- `p_control`: 파티션의 기준이 되는 시간 또는 정수형 열
- `p_interval`: 파티션 간격 (예: `1 day`, `1 month`)
- `p_premake`: 향후 데이터를 위해 미리 생성해 둘 파티션의 개수

## 3. 히스토리 보존 기간 설정하기

주의할 점은 `pg_partman`이 백그라운드에서 자동으로 데이터를 삭제하거나 새 파티션을 생성하지 않는다는 것입니다. 따라서 `pg_cron` 스케줄러를 이용해 `partman.run_maintenance_proc` 함수가 주기적으로 호출되도록 설정해야 합니다.

```sql
-- pg_cron 확장을 통한 스케줄링 예시
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매일 유지 관리 프로시저 실행
SELECT cron.schedule('@daily', $$CALL partman.run_maintenance_proc()$$);
```

### 3.1. 유지 관리 스케줄링 기준

`partman.run_maintenance_proc()`를 **인자 없이 호출하면** `part_config`에 등록된 모든 파티션 테이블을 한 번에 순회하며 유지 관리를 수행합니다.

따라서, 여러 파티션 테이블이 혼재되어 있을 경우 **가장 짧은 파티션 주기(최소 파티션 단위)에 맞춰 스케줄을 단 한 번만 주기적으로 실행하도록 등록**하는 것을 권장합니다. (예: 일별 파티션과 월별 파티션이 함께 있다면 일 단위인 `@daily`로 구성)

만약 특정 테이블만 별도의 스케줄로 관리해야 한다면, 다음과 같이 테이블명을 인자로 전달하여 특정 대상만 유지 관리를 수행할 수 있습니다.

```sql
CALL partman.run_maintenance_proc(p_parent_table := 'public.alarms');
```

### 3.2. 유지 관리 기본 정책 바꾸기

`pg_partman`을 사용해서 테이블에 파티션을 설정하면 기본적인 유지 관리 정책에 의해 데이터를 자동으로 삭제하지 않습니다. 운영 목적에 맞게 테이블별로 상세 정책을 변경하고자 한다면 [다음의 AWS 문서](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/PostgreSQL_Partitions.html#PostgreSQL_Partitions.run_maintenance_proc)를 참고하세요.

```sql
UPDATE partman.part_config
SET infinite_time_partitions = true,
    retention = '3 months',
    retention_keep_table = true
WHERE parent_table = 'public.alarms';
```

- `retention`: 보존 기간 (예: `'3 months'`)
- `retention_keep_table`: 만료 파티션 삭제(`false`) 또는 분리(`true`) 여부
- `infinite_time_partitions`: 파티션 무제한 생성 여부

이제 설정된 스케줄에 따라 `public.alarms` 테이블이 자동으로 유지 관리됩니다.

## 4. 테이블 파티셔닝 시 주의사항

대용량 데이터 관리에 테이블 파티셔닝이 효율적이지만 다음과 같은 기술적인 주의사항이 있다고 하네요. 이는 PostgreSQL 데이터베이스 특성에 따른 제약입니다.

- **제약 조건과 파티션 키**: `PRIMARY KEY`나 `UNIQUE` 제약 조건에는 반드시 파티션 키(예: `created_at`)가 포함되어야 합니다.
- **UPSERT 사용 시 주의**: `INSERT ... ON CONFLICT` 구문을 사용할 때, 중복 여부를 판단하는 인덱스에 파티션 키가 포함되어 있어야 정상적으로 작동합니다.

## 참고 자료

- [Amazon RDS: pg_partman 확장자를 사용하여 PostgreSQL 파티션 관리하기](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/PostgreSQL_Partitions.html)
- [pg_partman 공식 문서 (GitHub)](https://github.com/pgpartman/pg_partman/blob/development/doc/pg_partman.md)
