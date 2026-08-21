---
title: AWS RDS 슬로우 쿼리 로그의 커서 이름 이슈
date: 2024-06-20T22:00+09:00
tags:
- AWS RDS
- PostgreSQL
- Cursor
---

# AWS RDS 슬로우 쿼리 로그의 커서 이름 이슈

![](/images/posts/aws-rds-slow-query-with-cursor-name/01.png)

위 스크린샷의 14시와 15시 사이에 RDS 의 DB 인스턴스의 CPU 부하가 90% 이상을 초과했다. 이러한 상황의 경우 어떤 호스트에서 수행한 쿼리가 문제가 되고 있는지 알기 위해서 AWS Aurora PostgreSQL의 클러스터 또는 인스턴스 파라미터를 변경하여 [쿼리 로깅을 활성화](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/AuroraUserGuide/USER_LogAccess.Concepts.PostgreSQL.html#USER_LogAccess.Concepts.PostgreSQL.Query_Logging)하고 [log_min_duration_statement](https://docs.aws.amazon.com/ko_kr/prescriptive-guidance/latest/tuning-postgresql-parameters/log-min-duration-statement.html)에 대한 값을 지정하면 해당 밀리초를 초과하여 수행한 쿼리에 대한 duration 로그를 기록하고 CloudWatch의 로그 인사이트에서 확인할 수 있다.

## FETCH ALL IN "rcursor" 🤔

![](/images/posts/aws-rds-slow-query-with-cursor-name/02.png)

RDS 콘솔의 성능 개선 도우미에서 데이터베이스 로드와 상위 SQL 정보를 확인할 수 있는데 위와 같이 FETCH ALL IN "rcursor" 가 대부분의 로드로 기록되어있는 걸 볼 수 있다. 실제 SQL를 확인할 수 있는 것들 이외에 `rcursor` 란 것은 도대체 무엇을 의미하는 것인지 알아야할 것 같다. PL/pgSQL 함수를 작성할 때 [Cursor](https://www.postgresql.org/docs/current/plpgsql-cursors.html)를 선언하고 조회한 결과를 반환할 수 있다. 일반적으로 이야기하는 프로시저 함수를 의미하며 애플리케이션에서 사용중인 대부분의 함수의 커서 이름을 동일하게 지정하여 선언했다는 것을 의미한다.

기본적으로 커서 이름을 지정하지 않으면 자동으로 `<unnamed cursor 1>`와 같은 랜덤한 커서가 만들어지고 JDBC 에서 SQL 함수를 호출한 결과에서 커서 이름을 굳이 동일하게 지정할 필요는 없다. 따라서, 애플리케이션은 함수 정의 시 어떤 이름의 커서를 사용하는지에 대해서는 상관하지 않으며 SQL 함수를 관리하는 개발자 혹은 DBA가 관리하기 위한 이름일 뿐이다. 그래서 쉽게 관리하여 사용하기 위해 통일했던 것으로 생각된다.

## RDS 모니터링을 위한 커서 이름을 사용하세요.

![](/images/posts/aws-rds-slow-query-with-cursor-name/03.png)

RDS 모니터링 및 슬로우 쿼리를 확인할 수 있도록 동일한 커서 이름이 아닌 SQL 함수별 별도의 커서 이름을 정의하여 구분하는게 필요하다. SQL 함수 작성 시 커서 이름은 함수 이름과 동일하게 하여 명확히 구분하기로 협의했고 위와 같이 오래 수행되는 슬로우 쿼리를 쉽게 확인할 수 있다. 기존에는 개발자가 슬로우 쿼리를 확인할 수 있도록 애플리케이션 서버에 로그가 출력되도록 했지만 이제는 개발자 뿐만 아니라 DB 혹은 인프라 엔지니어도 RDS 모니터링으로 슬로우 쿼리 구분이 가능하도록 변경하고 있다.

```sh
# 여러분은 어떤 쿼리가 2초나 소요됬는지 파악할 수 있나요?
LOG:  duration: 2217.321 ms  execute <unnamed>: FETCH ALL IN "rcursor"
```
