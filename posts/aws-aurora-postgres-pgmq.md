---
title: AWS Aurora PostgreSQL에 PGMQ 확장 설치하기
description: AWS Aurora 및 RDS PostgreSQL 환경에서 pg_tle 방식을 사용하여 PGMQ(Postgres Message Queue)를 설치하고 활용하는 방법을 가이드합니다.
date: 2026-05-20T07:55+09:00
tags:
    - PostgreSQL
    - AWS Aurora
    - PGMQ
    - pg_tle
---

# AWS Aurora PostgreSQL에 PGMQ 확장 설치하기

["Extension versions for Amazon RDS for PostgreSQL"](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-extensions.html) 에 기재되어 있는 공식 지원 확장 목록만 RDS에 설치할 수 있을까요?

결론부터 말씀드리면 아닙니다. [GeekNews](https://news.hada.io/topic?id=14780) 에 AWS SQS의 가벼운 대체제로 사용할 수 있는 **PGMQ** (Postgres Message Queue) 가 소개되었을 때, 댓글 창에서는 파일 시스템 접근 권한이 없는 AWS RDS나 Aurora 환경에서 이 확장을 추가할 수 있을지에 대한 질문이 있었습니다. 당시 답변으로는 _"매니지드 서비스에서는 벤더가 지원하는 공식 확장 외에는 사용이 불가능하다"_ 라는 내용이 공유되기도 했습니다.

하지만 AWS는 이미 지난 2022년 12월, [Trusted Language Extensions for PostgreSQL (pg_tle)](https://aws.amazon.com/ko/blogs/korea/new-trusted-language-extensions-for-postgresql-on-amazon-aurora-and-amazon-rds/) 공식 출시를 통해 매니지드 환경에서도 사용자가 직접 커스텀 확장을 안전하게 개발하고 설치할 수 있는 길을 열어두었습니다.

따라서 **PGMQ** 와 같이 백그라운드 워커나 C 기반 바이너리 의존성 없이 순수 PostgreSQL (SQL/PLpgSQL) 기능만으로 동작하는 확장은, AWS 공식 지원 목록에 등록되어 있지 않더라도 매니지드 환경에서 설치할 수 있는 방법이 존재합니다. PGMQ 공식 문서에서는 SQL 스크립트를 데이터베이스에 직접 실행하는 [SQL Only 방식](https://pgmq.github.io/pgmq/latest/#sql-only) 을 별도로 안내하고 있지만, 이 글에서는 **pg_tle** 을 활용하여 표준 확장(`CREATE EXTENSION`)처럼 설치하고 관리하는 방법을 소개합니다.

## 1. pg_tle (Trusted Language Extensions) 설정

만약 Aurora/RDS 인스턴스가 PostgreSQL 14.5 이상 버전을 사용 중이고, 일반적인 확장 라이프사이클(`CREATE EXTENSION` 등)을 사용해 버전과 의존성을 체계적으로 관리하고 싶다면 AWS의 **pg_tle** 을 활성화하여 커스텀 확장을 직접 등록할 수 있습니다. 전체 절차는 [AWS의 RDS for PostgreSQL용 TLE 확장 생성 공식 가이드](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/PostgreSQL_trusted_language_extension-creating-TLE-extensions.html) 에서도 확인할 수 있습니다.

### 1.1. RDS에서 pg_tle 사용이 가능하도록 설정하기

RDS의 파라미터 그룹에서 `shared_preload_libraries` 에 **`pg_tle`** 을 추가하고 데이터베이스를 다시 시작해야 합니다.

AWS CLI 를 사용하고 있다면 다음의 명령어로 수행할 수 있습니다.

```bash
aws rds modify-db-parameter-group \
  --db-parameter-group-name <your-parameter-group-name> \
  --parameters "ParameterName=shared_preload_libraries,ParameterValue=pg_tle,ApplyMethod=pending-reboot"

aws rds reboot-db-instance \
  --db-instance-identifier <your-db-instance-identifier>
```

### 1.2. pg_tle 확장 설치

데이터베이스가 재부팅 되었다면 확장 설치가 가능한 관리자 계정으로 접속해서 **pg_tle** 확장을 설치합니다.

```sql
CREATE EXTENSION IF NOT EXISTS pg_tle;

-- pgtle.install_extension 사용을 위해 pgtle_admin 권한 부여
GRANT pgtle_admin TO postgres;
```

## 2. pg_tle로 pgmq 확장 등록

권한이 부여된 상태에서 `pgtle.install_extension` 함수를 통해 PGMQ의 SQL 구문을 TLE 확장 파일로 데이터베이스 내에 등록합니다.

`$_pgtle_$` 블록 안에는 [pgmq.sql](https://github.com/pgmq/pgmq/blob/main/pgmq-extension/sql/pgmq.sql) 의 전체 내용이 들어가야 합니다. IntelliJ IDEA Database tool이나 DataGrip 같은 SQL 클라이언트를 사용하고 있다면, raw 파일을 직접 내려받아 아래 SQL의 주석 위치에 붙여넣고 실행하면 됩니다.

```sql
SELECT pgtle.install_extension(
  'pgmq',
  '1.11.1',
  'Postgres Message Queue',
  $_pgtle_$
  -- https://raw.githubusercontent.com/pgmq/pgmq/v1.11.1/pgmq-extension/sql/pgmq.sql 내용 붙여넣기
  $_pgtle_$
);
```

> `psql` 사용이 가능하다면 [SQL Only](https://github.com/pgmq/pgmq#sql-only) 방식으로도 설치할 수 있습니다. 단, SQL Only 방식은 `CREATE EXTENSION` 을 통한 버전 관리가 되지 않는 단점이 있습니다.

이후 데이터베이스 내에서 표준 구문으로 확장을 활성화할 수 있게 됩니다.

```sql
CREATE EXTENSION IF NOT EXISTS "pgmq";
```

## 3. PGMQ 간단히 알아보기

설치가 완료되면 `pgmq` 스키마 내부의 다양한 함수를 통해 즉시 메시지 큐를 사용할 수 있습니다. PGMQ는 내부적으로 PostgreSQL의 **`FOR UPDATE SKIP LOCKED`** 기능 을 기반으로 동작하여 동시 처리에 강합니다.

### 3.1. 큐 생성 및 메시지 전송

Spring Boot 에서 `NamedParameterJdbcTemplate` 을 사용하면 named parameter(`:param`) 형태로 PGMQ 함수를 호출할 수 있습니다.

```java [PgmqService.java]
// SELECT pgmq.create('my_queue')
namedParameterJdbcTemplate.getJdbcTemplate().execute("SELECT pgmq.create('my_queue')");

// SELECT pgmq.send('my_queue', :message::jsonb)
MapSqlParameterSource params = new MapSqlParameterSource()
    .addValue("message", """
        {"event": "user_signup", "user_id": 42}
        """.strip());

Long msgId = namedParameterJdbcTemplate.queryForObject(
    "SELECT pgmq.send('my_queue', :message::jsonb)",
    params,
    Long.class
);
```

### 3.2. 메시지 읽기 및 완료 처리

`pgmq.read` 의 두 번째 인자는 Visibility Timeout(초), 세 번째는 최대 수신 건수입니다. 내부적으로 **`SELECT FOR UPDATE SKIP LOCKED`** 구문을 사용하여 메시지를 읽는 즉시 해당 행(row)을 잠그고 `vt`(visibility timeout) 컬럼을 `NOW() + N초` 로 갱신합니다.

분산 애플리케이션에서 여러 컨슈머가 동시에 `pgmq.read` 를 호출하더라도, 이미 잠긴 행이나 `vt` 시간이 아직 남아 있는 행은 `SKIP LOCKED` 에 의해 건너뛰므로 동일한 메시지가 두 컨슈머에게 동시에 전달되지 않습니다.

그래서 각 애플리케이션에서 메시지를 처리한 후에는 반드시 삭제하거나 아카이브해야 하며, 제한 시간 내에 처리하지 못하면 메시지는 자동으로 다시 노출됩니다.

`pgmq.read` 가 반환하는 행은 [PGMQ 공식 문서의 `message_record` 타입](https://pgmq.github.io/pgmq/latest/api/sql/types/#message_record)에 정의되어 있으며, `msg_id`, `read_ct`, `enqueued_at`, `last_read_at`, `vt`, `message`, `headers` 7개 컬럼으로 구성됩니다.

```java [PgmqConsumer.java]
record PgmqMessage(
    Long msgId,
    Integer readCt,
    OffsetDateTime enqueuedAt,
    OffsetDateTime lastReadAt,
    OffsetDateTime vt,
    String message,
    String headers
) {}

@Component
public class PgmqConsumer {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    private final RowMapper<PgmqMessage> rowMapper = (rs, rowNum) -> new PgmqMessage(
        rs.getLong("msg_id"),
        rs.getInt("read_ct"),
        rs.getObject("enqueued_at", OffsetDateTime.class),
        rs.getObject("last_read_at", OffsetDateTime.class),
        rs.getObject("vt", OffsetDateTime.class),
        rs.getString("message"),
        rs.getString("headers")
    );

    public PgmqConsumer(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Scheduled(fixedDelay = 1000)
    public void consume() {
        // SELECT * FROM pgmq.read('my_queue', :vt, :qty)
        MapSqlParameterSource readParams = new MapSqlParameterSource()
            .addValue("vt", 30)
            .addValue("qty", 1);

        List<PgmqMessage> messages = namedParameterJdbcTemplate.query(
            "SELECT * FROM pgmq.read('my_queue', :vt, :qty)",
            readParams,
            rowMapper
        );

        for (PgmqMessage msg : messages) {
            // ... 메시지 처리 로직 ...

            MapSqlParameterSource msgParams = new MapSqlParameterSource("msgId", msg.msgId());

            // 메시지 처리 완료 후 둘 중 하나를 선택합니다.
            //   - pgmq.delete  : 큐에서 완전히 제거
            //   - pgmq.archive : pgmq_archive_my_queue 테이블로 이동 (이력 보관·재처리 가능)
            namedParameterJdbcTemplate.queryForObject(
                "SELECT pgmq.archive('my_queue', :msgId)", msgParams, Boolean.class
            );
        }
    }
}
```

## 4. 운영 환경에서 PGMQ 다루기

기본 큐 동작 이외에도 RabbitMQ, SQS 와 같은 다른 솔루션이 동작하는 방식으로 처리할 수 있도록 파티션 관리, FIFO 큐, 토픽 기반 라우팅 등을 위한 함수들도 제공하고 있어요.

### 4.1. pg_partman 으로 메시지 큐 파티셔닝 유지 관리

운영이 길어질수록 `q_<큐이름>` 테이블은 누적된 메시지로 점점 무거워집니다. PGMQ는 [파티셔닝된 큐](https://pgmq.github.io/pgmq/latest/partitioned-queues/) 를 공식 지원하며, 내부적으로 **`pg_partman`** 확장을 활용해 파티션 생성과 만료 처리를 자동화합니다. `pg_partman` 은 AWS RDS/Aurora PostgreSQL 의 공식 지원 확장 목록에 포함되어 있어 매니지드 환경에서도 그대로 사용할 수 있습니다.

```sql
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- partition_interval: 파티션을 나누는 단위 (지속 시간이면 enqueued_at 기준, 정수면 msg_id 기준)
-- retention_interval: 만료 파티션 삭제 기준 (지속 시간이면 파티션 단위로 DROP, 정수면 해당 msg_id 이하 메시지 제거)
SELECT pgmq.create_partitioned('my_queue', '1 day', '7 days');
```

위 예시는 하루 단위로 파티션을 만들고 7일이 지난 파티션은 통째로 삭제하도록 설정합니다. 시간 기반 파티셔닝은 **만료 처리가 `DROP PARTITION`** 으로 끝나므로 `DELETE` 기반 정리보다 비용이 훨씬 저렴하고, 트랜잭션 ID 소비도 발생하지 않습니다.

파티션의 생성·삭제를 자동으로 돌리려면 파라미터 그룹에 `pg_partman_bgw` 를 추가합니다. PGMQ 본체는 `pg_tle` 위에서 동작하지만, `pg_partman` 의 백그라운드 워커는 별도 공유 라이브러리로 동작하므로 `shared_preload_libraries` 에 함께 등록해야 합니다.

```bash
aws rds modify-db-parameter-group \
  --db-parameter-group-name <your-parameter-group-name> \
  --parameters "ParameterName=shared_preload_libraries,ParameterValue=pg_tle\,pg_partman_bgw,ApplyMethod=pending-reboot"
```

### 4.2. FIFO 큐로 순서대로 처리하기

PGMQ 에 등록되는 이벤트를 발행한 순서대로 처리하려면 [FIFO 큐](https://pgmq.github.io/pgmq/latest/fifo-queues/) 기능을 사용할 수 있어요. PGMQ는 별도의 큐 타입을 만드는 대신 **메시지 헤더의 `x-pgmq-group` 값으로 그룹 키를 지정** 하는 방식으로 FIFO 메시지 큐를 구현할 수 있습니다. 메시지를 읽는 스타일은 다음 3개를 지원해요.

- `pgmq.read_grouped_rr`: Read messages while respecting FIFO ordering within groups.
- `pgmq.read_grouped`: Read messages with AWS SQS FIFO-style batch retrieval behavior.
- `pgmq.read_grouped_head`: Read exactly one message per FIFO group — the head (oldest, lowest msg_id) message in each group

### 4.3. RabbitMQ 처럼 토픽 기반 라우팅

PGMQ는 [토픽 라우팅](https://github.com/pgmq/pgmq/blob/main/docs/topics.md) 을 내장하고 있어, RabbitMQ의 *topic exchange* 와 동일한 방식으로 하나의 메시지를 여러 큐에 한 번에 분배할 수 있습니다. 토픽 기반 라우팅을 위해 다음 함수들을 제공합니다.

- `pgmq.bind_topic(pattern, queue)`: 라우팅 키 패턴을 큐에 바인딩합니다. `*` 는 정확히 한 세그먼트, `#` 는 0개 이상의 세그먼트와 매칭됩니다.
- `pgmq.send_topic(routing_key, message)`: 라우팅 키와 매칭되는 모든 큐에 메시지를 발행합니다.
- `pgmq.unbind_topic(pattern, queue)`: 등록된 패턴 바인딩을 해제합니다.
- `pgmq.list_topic_bindings()`: 현재 등록된 모든 (패턴 → 큐) 바인딩을 조회합니다.
- `pgmq.test_routing(routing_key)`: 특정 라우팅 키가 어떤 큐로 전달될지 사전에 확인합니다.

PGMQ 를 사용하면 메시지 큐 동작을 위해 Redis 나 RabbitMQ 같은 또 다른 기술을 별도로 도입하지 않아도 된다는 점은 분명한 장점이에요. 다만 확장을 설치하기 전에 파라미터 그룹 수정과 데이터베이스 재시작이 요구되므로 이미 운영 중인 데이터베이스에 도입하기에는 다소 불편한 것 같아요.

감사합니다.
