---
    title: PostgreSQL
    description: The World's Most Advanced Open Source Relational Database
    comments: false
    toc:
      enable: false
---

![](/images/logo/postgres.png#compact)

## 👨‍💻 Learning PostgreSQL

- [Install with docker](install)
- [Table](table)
- [View](view)
- [PL/pgSQL Function](plpgsql)
- [Exception Handling](exception-handling)

## 🔥 Advanced Tips

#### Postgres with Docker
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


## 🔖 References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/index.html)  
- [Awesome Postgres](https://github.com/dhamaniasad/awesome-postgres)  
