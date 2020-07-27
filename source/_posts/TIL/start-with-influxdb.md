---
    date: 2020-07-25
    title: 👨🏽‍💻 Today I Learn - InfluxDB 시작하기
    categories:
      - TIL
    tags:
      - InfluxDB
---

## 들어가며  
현재 회사에서 진행하고 있는 프로젝트의 시계열 데이터베이스는 고성능 시계열 데이터베이스인 [KDB+](https://kx.com/)를 사용하고 있습니다. KDB+는 성능면에서는 우월하지만 몇가지 단점을 보유하고 있습니다.

첫번째로 KDB+는 고성능을 추구하기 위하여 RDB(Realtime DB)와 HDB(Historical DB)를 구분하여 활용합니다. RDB는 메모리상에 데이터를 유지하게 되어 작업 수행 속도가 굉장히 빠릅니다. 다만, KDB+에서 사용할 수 있는 메모리 자원보다 더 많은 메모리를 사용하는 작업이 발생한 경우 KDB+는 중단되고 `메모리상에 있던 데이터는 유실`되게 됩니다.

> KDB+에서 수행되는 작업의 양을 고려하여 호스트의 메모리 용량과 코어 수를 결정해야합니다.

두번째는 라이센스 비용 문제입니다. KDB+는 32비트와 64비트 버전을 제공합니다. 다만, 32비트 KDB+는 메모리 자원을 최대 1코어로 4GB 정도 사용할 수 있습니다. 앞서 KDB+에서 수행되는 작업의 양이 많아지면 32비트의 KDB+로는 작업을 수행하지못하고 중단되는 문제가 발생합니다. 이를 해결하기 위하여 다수의 코어와 메모리를 사용할 수 있는 64비트 KDB+로 전환해야합니다. 64비트 KDB+를 사용하려면 라이센스를 발급받아야하며 상업적 목적으로 사용되는 경우 `라이센스에 대한 비용을 지불`해야합니다.

![](/TIL/images/aws-marketplace-kdb+-pricing.png)

직접 코어당 라이센스 비용을 지불하거나 위 그림처럼 클라우드 환경에서 사용한 만큼 라이센스 비용을 지불할 수 있습니다. AWS에서 KDB+를 사용할 경우 평균 코어당 라이센스 비용은 `시간당 $1 ~ 1.5` 정도입니다. 즉, `4코어`의 EC2 인스턴스 타입인 경우 소프트웨어 비용으로 1년 간 비용이 `약 2650만원` 정도됩니다.

![](/TIL/images/aws-marketplace-kdb+-pricing-exchange.png)

2650만원의 비용을 중소기업인 현재 회사가 감당하기엔 조금 버거운 금액이긴 합니다. 따라서, KDB+를 대체하여 사용할 수 있는 시계열 데이터베이스를 찾아야할 것 같습니다.

## Comparing Timeseries DB Engines
[DB-Engines Ranking of Time Series DBMS](https://db-engines.com/en/ranking/time+series+dbms)에 따르면 주로 사용되는 시계열 데이터베이스는 InfluxDB, KDB+, Prometheus, Graphite, RRDtool, TimescaleDB 입니다.

그러나 Prometheus, Graphite, RRDtool는 Numeric 데이터만 저장할 수 있습니다. 현재 프로젝트에서는 시간별 숫자 데이터 뿐만 아니라 문자 형식의 데이터를 저장해야 하는 요구사항이 있습니다. 따라서, 이들 데이터베이스는 제외하고 선택해야합니다.

- [InfluxDB](https://www.influxdata.com/) ⭐️
- [TimescaleDB](https://www.timescale.com/) ⭐️
- [Apache Druid](https://druid.apache.org/)  
- [Kairos DB](https://github.com/kairosdb/kairosdb)
- [Grid DB](https://griddb.net/en/)

우선은 InfluxDB와 TimescaleDB를 살펴보아야겠습니다. InfluxDB와 TimescaleDB는 클라우드 호스팅 뿐만 아니라 OSS 버전을 제공합니다. 물론, 엔터프라이즈 기능을 이용하려면 라이센스를 구매하여야하는 것은 동일합니다.

### InfluxDB
InfluxDB 오픈소스 버전은 [다운로드 페이지](https://portal.influxdata.com/downloads/)를 통해 굉장히 쉽게 설치하여 사용할 수 있습니다.

```zsh
docker pull influxdb:1.8.1
docker volume create influxdb_data
docker run -d --name influxdb -v influxdb_data:/var/lib/influxdb influxdb:1.8.1

docker exec -it influxdb influx
```

InfluxDB에서 지속적으로 유지해야할 데이터가 아니라면 `Retention Policy`를 활용하여 데이터를 유지하는 기간 또는 복제되는 레플리카 수를 결정하는 것이 좋을 듯 합니다.

InfluxDB의 [Continuous Query](https://docs.influxdata.com/influxdb/v1.8/query_language/continuous_queries/)를 사용하여 1분 단위 데이터를 5분, 15분, 30분, 1시간 기준의 데이터로 미리 계산해놓는 것도 활용해야할 것 같습니다.

## 참고
- [DB-Engines Ranking of Time Series DBMS](https://db-engines.com/en/ranking/time+series+dbms)
- [InfluxDB 1.8 Docs](https://docs.influxdata.com/influxdb/v1.8/)
