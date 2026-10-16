---
title: 슬로우 쿼리를 요청한 범인 찾기
date: 2026-10-16T21:00+09:00
description: AWS Database Insights에서 Unknown으로 표시되는 애플리케이션 이름을 JDBC 및 드라이버 파라미터로 설정하여 슬로우 쿼리 발생 주체를 추적하는 방법입니다.
tags:
    - AWS RDS
    - PostgreSQL
    - Slow Query
---

# 슬로우 쿼리를 요청한 범인 찾기

![](/images/posts/aws-db-insights-application-name/001.png)

위 이미지는 회사 인프라를 관리해 주는 동료가 구글 스페이스 채널에 공유해 준 데이터베이스 부하 지표다. 특정 SQL 호출로 인해 데이터베이스 부하(DB Load)가 특정 시점부터 급증한 뒤 하루 종일 높은 상태를 유지하고 있는 패턴이 보인다는 내용이었다.

## 에이전트야 도와줘!

다행히도 AWS RDS를 사용 중이었기 때문에, CloudWatch Database Insights에서 대기(Wait) 이벤트에 대한 세션이 무엇인지는 바로 인지할 수 있었다.

그런데 데이터베이스 인사이트 콘솔을 다뤄본 적이 없었다. 빠르게 원인을 특정해 보기 위해 개발 환경임을 감안하고, AI 에이전트인 Codex에게 컴퓨터 사용(Computer Use)으로 직접 AWS 콘솔을 살펴봐 달라고 요청했다.

> [!NOTE] 운영 환경이었다면?
> 위험 부담이 커서 에이전트에게 맡기긴 어려웠을 거예요.

Codex는 콘솔 화면을 직접 확인하며 문제가 된 Wait 이벤트에 대한 사용자명(User)과 애플리케이션(Application)을 필터링해 추적하기 시작했다.

브라우저를 조작하며 화면을 살펴보는 과정을 함께 지켜보던 중, 사용자명은 나오지만 정작 `Application` 항목은 온통 `Unknown`으로만 잡히고 있다는 점을 같이 발견했다. 참고로 Database Insights에서 부하 지표를 애플리케이션 단위로 나누어 살펴보는 기능은 Amazon Aurora PostgreSQL에서 지원한다.

운영 환경은 해당 서비스 애플리케이션만 DB에 연결하지만, 개발 환경은 로컬 PC에서도 함께 실행한다. 게다가 모두 동일한 DB 사용자로 연결해 왔기 때문에, 공용 계정에서 문제가 생기면 어떤 PC가 원인인지 특정하기 어렵게 만드는 상황이 된 것이다.

## 범인은 바로! - AI 에이전트

Codex의 추적 결과, 해당 대기(Wait) 이벤트를 보유한 세션의 사용자명은 평소 연결해 쓰던 계정이 아닌 별도로 구분되는 계정으로 판별되었다. 확인해 보니 평소 데이터베이스를 다루던 개발자가 에이전트에게 분석을 맡기기 위해 읽기 전용(Read-only)으로 만들어 사용하던 계정이었다.

정황을 살펴보고 추정해 보니 다음과 같은 흐름이었을 것으로 보인다.

동료 개발자들의 요구사항이나 SQL 요청에 따라 테이블을 분석하려고 에이전트에게 작업을 맡겼고, 에이전트가 알려준 분석 결과를 정상적으로 확인해 문제없이 끝난 줄로만 알았다. 하지만 에이전트가 내부적으로 실행했던 스크립트가 종료되지 않고 백그라운드에서 계속 돌고 있다는 점은 미처 인지하지 못했던 것이다.

그 결과 프로세스가 DB 커넥션을 물고 대기(Wait) 상태로 방치되어 트랜잭션이 닫히지 않았고, 하루 종일 개발 DB에 부하를 주고 있었던 것이다.

> [!NOTE] 동일한 DB 사용자명이었다면?
> 만약 평소 쓰던 공용 계정과 동일한 DB 사용자명이었다면, 원인을 특정하지 못하고 한참 오리무중이었을 것 같아요.

## 애플리케이션명으로 구분하는 방안

이러한 상황을 보완할 수 있는 방안에 대해 물어보니, Codex는 PostgreSQL 연결 시 `ApplicationName` 파라미터를 넣으면 데이터베이스 인사이트 콘솔에서 확인할 수 있다는 점을 알려주었다. 스프링 자동 설정을 사용하더라도 애플리케이션 이름이 JDBC 파라미터로 자동 전달되지 않으며, 별도로 지정하지 않으면 기본값인 `PostgreSQL JDBC Driver`로 설정된다.

가장 큰 장점은 DB 사용자를 번거롭게 새로 생성하지 않고도, 개발 환경에서 실행되는 실제 애플리케이션 이름과 로컬 개발자 PC에서 연결될 때의 이름을 명확하게 구분할 수 있다는 것이다. 각 접속 세션에 `application_name`만 지정해 두면 개발 서버 트래픽인지, 특정 로컬 PC나 테스트 도구에서 발생한 요청인지 Database Insights와 DB 로그에서 바로 나뉘어 보인다. 애플리케이션 코드 수정 없이 설정만으로 손쉽게 적용할 수 있다.

### 애플리케이션 설정 방법

코드 변경 없이 [PostgreSQL JDBC 공식 문서](https://jdbc.postgresql.org/documentation/use/#connection-parameters)에 명시된 Connection Parameters에 따라 URL 파라미터나 Spring Boot(HikariCP) 설정으로 지정할 수 있다.

::: code-group

```text [JDBC URL]
jdbc:postgresql://<host>:5432/<db>?ApplicationName=my-service-dev
```

```yaml [application.yml]
spring:
    datasource:
        hikari:
            data-source-properties:
                ApplicationName: my-service-dev
```

:::

> [!TIP] 환경변수로 치환
> `application.yml`의 JDBC URL에 환경 변수를 주입하면 환경별로 `ApplicationName`을 손쉽게 치환할 수 있어요.

### 애플리케이션명 조회

JDBC 클라이언트에서 설정을 조회하려면 다음과 같이 쿼리를 호출하면 된다.

```sql
SELECT application_name
FROM pg_stat_activity
WHERE pid = pg_backend_pid();
```

수많은 활성 세션이 존재하는 `pg_stat_activity` 테이블에서 내 접속을 일일이 찾을 필요가 없다. `pg_backend_pid()` 함수가 현재 쿼리를 실행 중인 자기 자신의 서버 프로세스 ID(PID)를 반환하므로, 다른 세션과 섞이지 않고 자신이 지정한 `application_name`이 정확하게 설정되었는지 바로 검증할 수 있다.

```text
 application_name
------------------
 my-service-dev
(1 row)
```

## 참고 자료

- [PostgreSQL JDBC Driver - Connection Parameters](https://jdbc.postgresql.org/documentation/use/#connection-parameters)
- [PostgreSQL Documentation - pg_stat_activity](https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW)
- [AWS Documentation - Monitoring DB load with Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html)
