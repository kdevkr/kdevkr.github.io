---
  date: 2020-07-02
  title: PostgreSQL - Install
---

## 들어가며
PostgreSQL에 입문하기 위한 가장 첫단계는 PostgreSQL을 설치하는 것입니다.

[공식 홈페이지](https://www.postgresql.org/download/)에서 여러가지 운영체제 환경에 대한 바이너리 패키지를 제공합니다.

## 설치
실제 애플리케이션 프로덕션 환경이 아니라면 직접 `바이너리 패키지`를 다운받아 설치하는 것보다는 `도커 컨테이너`로 구동하는 것이 좋습니다.

### 도커 이미지 다운로드
도커 `pull` 명령어를 통해 PostgreSQL 이미지를 다운로드하고 컨테이너를 실행합니다.

```zsh
$ sudo docker pull postgres:9.6.18-alpine
$ sudo docker run --name postgres -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:9.6.18-alpine
```

PostgreSQL 도커 컨테이너가 실행되었다면 다음과 같이 쉘로 접속합니다.

```zsh
$ docker exec -it postgres /bin/bash
```

`root` 사용자에서 `postgres` 사용자로 전환하여 데이터베이스에 접근합니다.

```bash
$ cat /etc/passwd | grep postgre
postgres:...:/var/lib/postgresql:/bin/sh

$ su postgres
$ psql
```

### CREATE DATABASE AND USER
데이터베이스를 생성하고 데이터베이스에 접근할 수 있는 사용자를 만들어봅니다.

```pgsql
CREATE DATABASE test_db;
CREATE USER mambo WITH ENCRYPTED PASSWORD 'mambo';
GRANT ALL PRIVILEGES ON DATABASE test_db TO mambo;
```

### PostgreSQL Interactive Terminal
이제 psql을 이용하여 `mambo` 사용자로 `test_db` 데이터베이스에 접속할 수 있습니다.

```bash
$ psql test_db -U mambo
```

## 참고
- [PostgreSQL - CREATE USER](https://www.postgresql.org/docs/current/sql-createuser.html)
- [PostgreSQL - CREATE DATABASE](https://www.postgresql.org/docs/current/sql-createdatabase.html)
- [PostgreSQL - GRANT](https://www.postgresql.org/docs/current/sql-grant.html)
- [PostgreSQL - psql](https://www.postgresql.org/docs/current/app-psql.html)
