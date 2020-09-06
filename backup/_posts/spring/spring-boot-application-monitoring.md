---
title: 스프링 부트 애플리케이션 모니터링
date: 2020-09-05
---

스프링 부트 애플리케이션을 모니터링 하기 위하여 스프링 부트 액추에이터의 프로메테우스 앤드포인트를 통해 프로메테우스 매트릭을 제공받을 수 있습니다. 

## Prometheus Scrape Endpoint  
프로메테우스 앤드포인트를 빈으로 등록하기 위하여 `micrometer-registry-prometheus` 의존성을 추가합니다.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

그러면 자동으로 다음의 PrometheusScrapeEndpoint가 등록되어 `/actuator/prometheus`로 프로메테우스 매트릭을 제공받을 수 있습니다.

```java
/**
 * {@link Endpoint @Endpoint} that outputs metrics in a format that can be scraped by the
 * Prometheus server.
 *
 * @author Jon Schneider
 * @since 2.0.0
 */
@WebEndpoint(id = "prometheus")
public class PrometheusScrapeEndpoint {
    private final CollectorRegistry collectorRegistry;

    public PrometheusScrapeEndpoint(CollectorRegistry collectorRegistry) {
    	this.collectorRegistry = collectorRegistry;
    }

    @ReadOperation(produces = TextFormat.CONTENT_TYPE_004)
    public String scrape() {
        try {
            Writer writer = new StringWriter();
            TextFormat.write004(writer, this.collectorRegistry.metricFamilySamples());
            return writer.toString();
        }
        catch (IOException ex) {
            // This actually never happens since StringWriter::write() doesn't throw any
            // IOException
            throw new RuntimeException("Writing metrics failed", ex);
        }
    }
}
```

`/actuator/prometheus` 매트릭을 프로메테우스에서 수집할 수 있도록 설정합니다.

```yaml prometheus.yml
scrape_configs:
  - job_name: 'spring'
    metrics_path: '/actuator/prometheus'
    static_configs:
    - targets: ['<host>:<ip>']
```




## Grafana Dashboard  

## 참고
- [Spring Boot Actuator: Production-ready Features](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html)