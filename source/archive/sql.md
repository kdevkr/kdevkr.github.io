---
title: 데이터베이스와 SQL 역량
date: 2024-09-08T18:00+09:00
---

> MySQL 혹은 PostgreSQL과 같은 RDBMS를 활용 가능하신 분
> RDBMS 구조를 설계하고 확장성 있는 DB 구조를 고민해 보신 분
> RDBMS의 특성을 이해하고 쿼리를 구성할 수 있는 분
> RDBMS 및 다양한 NoSQL 데이터베이스에 대한 지식을 보유한 분

10년 이하의 주니어 혹은 미드레벨 개발자 채용 공고에서 자격 요건으로 확인할 수 있는 항목이다. 그동안 시계열데이터베이스를 주로 다루다보니 관계형 데이터베이스인 PostgreSQL에 대해서 간단한 PL/pgSQL을 작성하거나 슬로우 쿼리에 대해 실행 계획을 돌려보고 테이블의 인덱스가 올바르게 동작하는지 정도만 가능한 역량을 보유하고 있다고 생각이 된다.

데이터베이스와 SQL에 대한 역량이 부족하다고 느끼게 되는 이유는 PostgreSQL 이외의 데이터베이스에 대한 경험이 없는 것과 별개로 프로그래머스에서 제공하는 [SQL 문제](https://school.programmers.co.kr/learn/challenges?languages=mysql&order=acceptance_desc)를 풀어보니 난이도가 있는 문제에 대해 어떻게 SQL을 작성해야하는지 접근하는게 자연스럽지 않았기 때문이다. 현재 일하고 있는 조직에서 데이터베이스를 주로 다루는 동료에게 의존해왔던 것이 문제로 보인다.

#### 나에게 필요한 역량

- MySQL 과 PostgreSQL에 대한 데이터베이스 경험 키우기
- 데이터베이스에서 제공하는 다양한 SQL 함수 사용해보기
- 요구사항에 대한 테이블 및 인덱스 설계해보기
- 시스템에 대한 테이블과 SQL 분석해보기

[SQLP(SQL Professional)](https://www.dataq.or.kr/www/sub/a_03.do) 자격증 취득에 도전해보는 것을 고민해보았지만 객관적으로 지금은 과도한 것 같다.

#### SQL을 학습하기 위한 방법

- [LeetCode Database](https://leetcode.com/problemset/database/)
- [Hackerank SQL](https://www.hackerrank.com/domains/sql)
- [MySQL test_db](https://github.com/datacharmer/test_db)
- [UI Bakery - Postgresql Playground](https://uibakery.io/sql-playground)

#### PostgreSQL 과 MySQL 학습 환경 만들기

```yaml compose.yml
version: "3"
services:
  postgres:
    container_name: postgres
    image: postgres:16
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_volume:/var/lib/postgresql/data

  mysql:
    container_name: mysql
    image: mysql:8
    ports:
      - 3306:3306
    environment:
      MYSQL_ROOT_PASSWORD: mysql
      MYSQL_USER: mysql
      MYSQL_PASSWORD: mysql
      MYSQL_DATABASE: mambodb
    volumes:
      - mysql_volume:/var/lib/mysql

volumes:
  postgres_volume:
  mysql_volume:
```

- [PostgreSQL execution plan visualizer](https://explain.dalibo.com/)
- [Visual EXPLAIN for MySQL](https://mysqlexplain.com/)