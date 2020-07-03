---
    date: 2020-07-03
    title: KDB - Prometheus Exporter
    tags:
      - KDB
      - Prometheus
      - Grafana
---

## 들어가며
2020년 5월에 [KxSystems/prometheus-kdb-exporter](https://github.com/KxSystems/prometheus-kdb-exporter) 프로젝트가 추가되어 프로메테우스로 KDB+ 에 대한 모니터링을 할 수 있게 되었습니다.

이번 글에서는 Prometheus Exporter를 KDB+에 적용하고 모니터링하는 것에 대하여 설명하겠습니다.

## 🛠 Prometheus Exporter for KDB+
프로젝트 예제에서는 KDB+를 구동하면서 Exporter를 실행하는 것을 설명합니다. 하지만, 저는 KDB+ 구동과 상관없이 Prometheus Exporter를 원할때 추가할 수 있도록 스크립트를 불러오도록 하겠습니다.

### Dynamic Load exporter.q
프로젝트에서 제공하는 `exporter.q`와 `extract.q`를 불러올 수 있도록 파일을 복사합니다.

저는 KDB+ 구동 시 실행되는 `q.q` 파일 하위에 `prometheus-exporter`라는 폴더를 만들었습니다.

![](/database/kdb/images/prometheus-exporter-dir.png)

q 에서는 `\` 또는 `system` 을 통해 시스템 명령어를 수행할 수 있습니다.

예를 들어, q에서 바라보는 현재 디렉토리가 `q/data`라고 한다면 다음과 같이 디렉토리를 이동하고 파일을 불러올 수 있게 됩니다.
```q kdb+/q
system "cd ../prometheus-exporter"
system "l exporter.q"
system "cd ../data"
```

### KDB+ Prometheus Metrics
exporter.q가 정상적으로 불러와졌다면 브라우저로 `/metrics` 경로로 접속하여 Prometheus Metrics를 확인할 수 있습니다.

![](/database/kdb/images/kdb-prometheus-metrics.png)

이제 프로메테우스가 이 주소를 통해 매트릭을 수집할 수 있도록 설정하면 됩니다.

```json prometheus.yaml
global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 15s
alerting:
  alertmanagers:
  - static_configs:
    - targets: []
    scheme: http
    timeout: 10s
    api_version: v1
scrape_configs:
- job_name: prometheus
  honor_timestamps: true
  scrape_interval: 1m
  scrape_timeout: 10s
  metrics_path: /metrics
  scheme: http
  static_configs:
  - targets:
    - localhost:9090

- job_name: kdb
  honor_timestamps: true
  scrape_interval: 15s
  scrape_timeout: 10s
  static_configs:
  - targets:
    - localhost:5000
```

## 🖥 Grafana Dashboard
다음의 링크를 통해 그라파나 대시보드를 구성할 수 있는 json 정보를 확인할 수 있습니다.

https://github.com/KxSystems/prometheus-kdb-exporter/blob/master/examples/DockerCompose/grafana-config/dashboards/kdb-dashboard.json

그라파나 대시보드 Import 기능을 통해 KDB+ 대시보드를 구성합니다.

![](/database/kdb/images/import-grafana-dashboard-for-kdb.png)

이제 그라파나가 프로메테우스로 수집된 KDB+ 정보를 시각화 할 수 있습니다.

![](/database/kdb/images/grafana-kdb-dashbaord.png)