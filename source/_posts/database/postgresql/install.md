---
  date: 2020-07-02
  title: PostgreSQL - Install
---

## 들어가며

```sh
$ sudo docker pull postgres:9.6.18-alpine
$ sudo docker run --name postgres -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:9.6.18-alpine

$ docker exec -it postgres /bin/bash

$ su postgres
$ psql

CREATE USER mambo WITH ENCRYPTED PASSWORD 'mambo';
CREATE DATABASE test_db;
GRANT ALL PRIVILEGES ON DATABASE test_db TO mambo;

$ psql test_db -U mambo
```
