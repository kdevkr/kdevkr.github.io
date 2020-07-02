---
  date: 2020-07-01 12:00
  title: InfluxDB - Install and Connect
  toc:
    enable: true
---

InfluxDB는 시간과 관련된 데이터를 저장하기 위한 오픈 소스 시계열 데이터베이스입니다. 잠만보와 함께 InfluxDB에 입문해보도록 하겠습니다.

## Install InfluxDB OSS
InfluxDB 오픈 소스 버전을 설치하기 위하여 [도커 이미지](https://hub.docker.com/_/influxdb)를 지원합니다.

만약, 운영체제에 직접 설치하려면 [다음 가이드](https://docs.influxdata.com/influxdb/v1.8/introduction/install/)를 따라 설치하세요.

```sh
$ sudo docker pull influxdb:1.8
$ sudo docker run -d --name influxdb -p 8086:8086 -v $PWD:/var/lib/influxdb influxdb
```

## Using influx - InfluxDB command line interface
InfluxDB CLI를 제공하기 때문에 쉽게 InfluxDB에 접속할 수 있습니다.

```sh
$ sudo docker exec -it influxdb /bin/bash
$ influx
Connected to http://localhost:8086 version 1.8.0
InfluxDB shell version: 1.8.0
>
```
