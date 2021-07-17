---
title: Pushgateway를 활용하여 사설망 인스턴스 모니터링하기
date: 2021-07-17
tags:
 - Promethues
 - Pushgateway
---

안녕하세요 Mambo 입니다. 오늘은 Promethues의 Pushgateway를 왜 사용해야하는지에 대해서 알아보려고 합니다.

프로메테우스(Promethues)는 기본적으로 매트릭 지표를 제공하는 서버에게 주기적으로 요청하여 매트릭을 수집하도록 되어있습니다. 그래서 매트릭을 수집하기 위해서는 프로메테우스가 수집해야할 설정 파일에 매트릭 수집을 위한 주소를 입력해야합니다. 하지만 모든 인스턴스가 외부 인터넷망을 통해 접근할 수 있는 공인 IP를 할당하지는 않습니다. 또한, 클라우드를 통해 애플리케이션을 운영하는 경우에도 외부로 나가는 트래픽은 허용하지만 외부에서 내부로 들어오는 트래픽은 특정 IP 대역에서만 접근할 수 있도록 보안 규칙을 설정하기도 합니다.

사설망에 있는 인스턴스는 내부 아이피만 할당되어있고 외부 인터넷망과의 통신은 별도의 장비를 통해 수행합니다. 이 경우 인스턴스에는 공인 IP가 할당되어있지 않기 때문에 프로메테우스에 주소를 입력할 수 없는 상황이 됩니다. 그래서 Polling 방식이 아닌 프로메테우스에 매트릭을 Push 할 수 있도록 해야합니다. 매트릭을 푸시할 수 있도록 지원하는게 바로 `Pushgateway` 입니다.

## Pushgateway
프로메테우스에서 제공하는 [Pushgateway](https://github.com/prometheus/pushgateway)는 매트릭을 푸시할 수 있도록 지원하며 푸시된 매트릭을 프로메테우스에서 가져갈 수 있도록 중개자 역할을 수행합니다. 따라서, Pushgateway에 푸시된 매트릭을 프로메테우스에서 가져갈 수 있습니다.

### Pushgateway 설치
Pushgateway 서버는 [prom/pushgateway](https://hub.docker.com/r/prom/pushgateway) 이미지를 통해 컨테이너로 실행합니다. 
> 운영체제별 바이너리 파일을 받아 설치할 수도 있습니다.

```yaml pushgateway/docker-compose.yml
version: '3'
services:
    pushgateway:
        container_name: pushgateway
        image: prom/pushgateway:latest
        restart: always
        ports:
            - 9091:9091
```

위 도커 컴포즈 문서를 통해 Pushgateway를 실행하였다면 브라우저를 통해 127.0.0.1:9091으로 서버에 접근할 수 있습니다.

![Pushgateway](../images/posts/pushgateway-01.png)

아직 푸시한 매트릭이 없으므로 Pushgateway에는 빈 화면이 표시됩니다. 이제 매트릭을 Pushgateway에 푸시하는 방법을 알아볼까요?

### Pushgateway API
Pushgateway가 제공하는 API를 통해 `curl`와 같은 HTTP 도구로 쉽게 매트릭 정보를 보낼 수 있습니다. 다음의 명령어는 [가이드](https://github.com/prometheus/pushgateway/blob/master/README.md#command-line)에서 제공하는 가장 간단한 API 예시입니다.

```sh
echo "some_metric 3.14" | curl --data-binary @- http://pushgateway.example.org:9091/metrics/job/some_job
```

#### 윈도우
윈도우 환경에서는 [curl](https://curl.se/windows/)을 다운로드하여 설치하거나 Powershell의 Invoke-WebRequest 명령어로 HTTP 요청을 수행할 수 있습니다.

```cmd
powershell -Command "Invoke-WebRequest -Uri http://127.0.0.1:9091/metrics/job/some_job -Method POST -Body \"some_metric 3.14`n\""
```

### OS Exporters
OS 매트릭을 제공하는 Promethues Exporter와 연계하여 Pushgateway에 매트릭을 푸시해보도록 하겠습니다.

#### Node Exporter
[prometheus/node_exporter](https://github.com/prometheus/node_exporter)는 리눅스 커널을 사용하는 OS에 대한 매트릭을 제공합니다.

```yaml docker-compose.yml
version: '3'
services:
  node-exporter:
    image: quay.io/prometheus/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.rootfs=/host'
    network_mode: host
    pid: host
    restart: unless-stopped
    volumes:
      - '/:/host:ro,rslave'
```

Node Exporter에서 제공하는 매트릭을 Pushgateway API를 통해 보내기 위해서는 다음과 같이 명령어를 실행합니다.

```sh
curl -s http://localhost:9100/metrics | curl --data-binary @- http://pushgateway.example.org:9091/metrics/job/node-exporter/instance/1
```

#### Windows Exporter
[prometheus-community/windows_exporter](https://github.com/prometheus-community/windows_exporter)는 윈도우 머신에 대한 매트릭을 제공합니다.

node_exporter는 도커로 실행할 수 있었지만 windows_exporter는 파일을 다운로드 받아서 실행해야합니다.

```cmd Windows Terminal
.\windows_exporter-0.16.0-386.exe --collectors.enabled "cpu,net,cs"
```

windows_exporter를 통해 받은 윈도우 OS 매트릭을 Pushgateway에 푸시하도록 명령어를 실행합니다.

```cmd Windows Terminal
curl -s http://127.0.0.1:9182/metrics | curl --data-binary @- http://127.0.0.1:9091/metrics/job/windows-exporter/instance/1
```

Pushgateway가 정상적으로 매트릭을 받으면 다음과 같이 푸시된 매트릭이 표시됩니다.
![](../images/posts/pushgateway-03.png)

### Pushgateway with TTL
Pushgateway에 푸시된 매트릭은 시간이 지나도 매트릭 정보로 남아있습니다. 매트릭이 다시 푸시되지 않는다면 프로메테우스는 동일한 매트릭을 주기적으로 수집하게 됩니다. 일정 시간이 지난 매트릭이 사라지기를 원한다면 주기적으로 DELETE API를 호출하는 배치를 만들거나 [pushgateway-ttl](https://github.com/dinumathai/pushgateway)을 사용해야 합니다.

## Promethues Scrap Configs
이제 Pushgateway로 푸시된 매트릭을 프로메테우스에서 가져갈 수 있게 설정해야합니다. 

```yaml promethues.yml
scrape_configs:
  - job_name: 'pushgateway'
    honor_labels: true
    static_configs:
      - targets: ['host.docker.internal:9091']
```

일반적으로 Pushgateway는 공인 IP를 할당하겠지만 저는 테스트용으로 프로메테우스와 동일한 네트워크 환경에서 실행하였으므로 `host.docker.internal`로 접근하였습니다.

![](../images/posts/pushgateway-04.png)

위처럼 프로메테우스가 Pushgateway의 매트릭을 수집한 것을 확인하였으며 이렇게 수집된 매트릭을 windows_exporter 매트릭을 시각화한 [Windows Exporter Dashboardby girb90](https://grafana.com/grafana/dashboards/14694)를  그라파나에 추가해보았습니다.

![](../images/posts/pushgateway-05.png)

이렇게 Pushgateway를 활용하면 사설망에서 구동되는 인스턴스도 모니터링할 수 있음을 확인하였습니다.


