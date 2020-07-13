---
  date: 2020-07-08
  title: PostgreSQL - Monitoring
  categories: [개발 이야기]
  tags:
    - Postgres
---

## 들어가며
저는 PostgreSQL를 주 관계형 데이터베이스로 사용하고 있습니다. 최근 프로메테우스와 그라파나를 연계하여 모니터링 대시보드를 구성하는 것을 연습해보고 있습니다. `PostgresSQL`를 위한 [Prometheus Exporter](https://github.com/wrouesnel/postgres_exporter)를 제공하고 있으므로 이를 활용해보도록 하겠습니다.

본 글은 프로메테우스와 그라파나가 설치되어있다는 가정하에 진행됩니다. 만약, 프로메테우스 또는 그라파나가 구성되어있지 않다면 다음 링크들을 참고하여 설치하시기 바랍니다.

- [Prometheus Installation Using Docker](https://prometheus.io/docs/prometheus/latest/installation/#using-docker)
- [Run Grafana Docker image](https://grafana.com/docs/grafana/latest/installation/docker/)

## PostgreSQL Server Exporter  
[wrouesnel/postgres_exporter](https://github.com/wrouesnel/postgres_exporter)는 포스트그레 서버 매트릭을 위한 Prometheus Exporter 입니다. 도커를 이용하면 쉽게 PostgreSQL Exporter를 실행할 수 있습니다.

### 도커 이미지 설치

```docker
docker run -d --name=postgres_exporter --net=host -e DATA_SOURCE_NAME="postgresql://postgres:password@localhost:5432/postgres?sslmode=disable" wrouesnel/postgres_exporter
```

이제 http://localhost:9187/metrics 에서 PostgreSQL 서버 매트릭을 확인할 수 있습니다.

![](/database/postgresql/images/prometheus-exporter-metrics.png)

### 프로메테우스 타겟 적용  

```yaml
scrape_configs:
  - job_name: postgres
    metrics_path: /metrics
    static_configs:
      - targets:
        - localhost:9187
```

![](/database/postgresql/images/prometheus-targets.png)

### 그라파나 대시보드 추가  

Grafana Labs에서 `wrouesnel/postgres_exporter`으로 수집된 매트릭을 기반으로 구성한 대시보드를 찾아 추가합니다.

저는 [PostgreSQL Database by Lucas Estienne](https://grafana.com/grafana/dashboards/9628) 대시보드를 추가하겠습니다.

![](/database/postgresql/images/grafana-dashboard.png)  
