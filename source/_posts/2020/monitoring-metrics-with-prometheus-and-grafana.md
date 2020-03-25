---
    title: 프로메테우스와 그라파나를 활용한 메트릭 모니터링
    date: 2020-03-25
    categories: [개발 이야기]
    tags:
     - Prometheus
     - Grafana
---

오픈 소스 모니터링 시스템인 프로메테우스(Prometheus)와 오픈 소스 분석 시스템인 그라파나(Grafana)를 활용하면 메트릭에 대한 모니터링 대시보드를 구성할 수 있습니다.

## 프로메테우스

![](https://prometheus.io/assets/architecture.png)

[프로메테우스(Prometheus)](https://prometheus.io/)는 메트릭을 수집(Scraping)하여 시계열(Timeseries) 데이터베이스에 저장하는 모니터링 솔루션입니다. 

위 아키텍처 그림에서 Exporter는 프로메테우스가 수집할 수 있는 메트릭을 제공하는 에이전트입니다. 프로메테우스 조직에서 제공하는 공식 Exporter 뿐만 아니라 PostgreSQL 또는 [Micrometer](https://micrometer.io/docs/registry/prometheus)와 같은 [서드 파티 Exporter](https://prometheus.io/docs/instrumenting/exporters/)가 있습니다. 주로 사용되는 대부분의 시스템에 대한 Exporter가 있으니 찾아서 프로메테우스에 Exporter로 적용하면 됩니다.

### 설치 및 구성

```sh
docker run --name=prometheus -d -p 9090:9090 -v $pwd/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

도커 이미지의 기본 구성 파일은 다음과 같습니다.
```yml
# my global config
global:
  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
    - targets: ['localhost:9090']
```

## 그라파나
[그라파나(Grafana)](https://grafana.com/grafana/)는 여러가지 데이터베이스에 저장된 메트릭을 시각화하여 보여주는 대시보드 솔루션입니다.

[라이브 데모](https://play.grafana.org/d/000000012/grafana-play-home?orgId=1)

그라파나는 대표적인 Graphite, InfluxDB, Prometheus, Elasticsearch, AWS CloudWatch 이외에도 30개가 넘는 [데이터 소스](https://grafana.com/grafana/plugins?direction=asc&orderBy=weight&type=datasource)를 지원합니다.

### 설치 및 구성
본 글에서는 간단하게 [도커 이미지](https://grafana.com/grafana/download?platform=docker)를 통해 그라파나 컨테이너를 실행합니다.

```sh
docker run -d --name=grafana -p 3000:3000 grafana/grafana
```

설치가 완료되었으면 http://localhost:3000 으로 접속하여 관리자 계정으로 로그인 후 초기 비밀번호를 변경합니다.

> 관리자 계정명과 초기 비밀번호는 `admin`입니다.

## 프로메테우스와 그라파나
프로메테우스에 저장된 메트릭을 그라파나를 활용하여 시각화할 수 있습니다.

### 프로메테우스 데이터 소스 추가
그라파나 시스템에 접속하여 프로메테우스를 데이터 소스로 추가합니다.

![](/images/2020/grafana-datasource-prometheus-configuration.PNG#full)

그라파나가 기본으로 제공하는 프로메테우스 대시보드를 선택하여 시각화된 프로메테우스 메트릭을 확인합니다.

![](/images/2020/grafana-datasource-prometheus-dashboard.PNG#full)

### Spring Boot Actuator 메트릭 모니터링
스프링 부트 액추에이터를 사용중인 경우 프로메테우스의 [Micromiter Exporter](https://micrometer.io/docs/registry/prometheus)를 쉽게 적용할 수 있습니다.

#### Micrometer Registry Prometheus
프로메테우스가 메트릭을 수집할 수 있도록 HTTP 엔드포인트를 구성합니다.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

두 의존성을 가지는 프로젝트를 생성한 뒤 기본 매니지먼트 서버를 비활성화하고 별도의 HTTP 엔드포인트를 구현합니다.

```yml
management:
  server:
    port: -1
```

`micrometer-registry-prometheus`가 의존성으로 존재하면 자동으로 `PrometheusScrapeEndpoint` 빈이 컨텍스트에 등록됩니다.

```java
@RestController
@RequestMapping
public class PrometheusMetricsEndpoint {
    private PrometheusScrapeEndpoint prometheusScrapeEndpoint;

    public PrometheusMetricsEndpoint(PrometheusScrapeEndpoint prometheusScrapeEndpoint) {
        this.prometheusScrapeEndpoint = prometheusScrapeEndpoint;
    }

    @RequestMapping(value = "/metrics", method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> metrics() {
        return ResponseEntity.ok(prometheusScrapeEndpoint.scrape());
    }
}
```

http://localhost:8080/metrics 로 접속하면 다음과 같이 프로메테우스가 수집할 수 있는 메트릭이 출력됩니다.

![](/images/2020/spring-boot-actuator-prometheus-metrics.PNG#full)  

#### Prometheus Scrap Configuration
프로메테우스가 엑추에이터가 제공하는 메트릭을 수집하도록 설정합니다.

```yml
scrape_configs:
- job_name: jvm
  honor_timestamps: true
  scrape_interval: 15s
  scrape_timeout: 10s
  metrics_path: /metrics
  scheme: http
  static_configs:
  - targets:
    - ${your-host-ip}:8080
```

프로메테우스를 재실행하면 수집 목록에 추가된 것을 확인할 수 있습니다.

![](/images/2020/prometheus-scraping-targets.PNG#full)

#### JVM Actuator Dashboard
그라파나 대시보드 중 [JVM (Micrometer)](https://grafana.com/grafana/dashboards/4701) 또는 [JVM (Actuator)](https://grafana.com/grafana/dashboards/9568)를 대시보드로 추가합니다.

![](/images/2020/grafana-dashboard-import.PNG#full)

추가된 대시보드에 따라 메트릭을 시각화하여 모니터링 할 수 있습니다.

![](/images/2020/grafana-dashboard-stats.PNG#full)

## 참고
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/grafana/)


