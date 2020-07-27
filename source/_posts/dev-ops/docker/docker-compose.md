---
title: Docker - 도커 컴포즈 사용하기
date: 2020-07-16
categories:
  - Docker
tags:
  - Docker Compose
---

## 들어가며
거의 대부분의 애플리케이션은 단일 컨테이너로 동작하지 않은 경우가 많습니다. 예를 들어, 스프링 애플리케이션은 요구되는 기능에 따라 관계형 데이터베이스, NoSQL, 타임시리즈 데이터베이스 등 여러가지 역할의 컨테이너가 필요합니다. 따라서, 스프링 애플리케이션을 도커 환경에서 배포하기 위해서는 각 컨테이너를 실행해야하는 상황입니다.

각 도커 컨테이너를 독립적으로 실행한다면 어떤 단점이 있을까요? 가장 대부분의 문제점은 데이터베이스에 있습니다. 애플리케이션은 사용하려는 데이터베이스에 의존적이므로 데이터베이스가 정상적으로 실행되어있지 않은 경우 애플리케이션 실행 시 오류가 발생합니다.

`도커 컴포즈`는 이러한 단점을 해소하기 위하여 컨테이너 실행 옵션을 관리하면서 각 컨테이너간의 순서와 의존성을 관리할 수 있도록 지원합니다.

## 도커 컴포즈
도커 컴포즈는 멀티 컨테이너 도커 애플리케이션을 실행하고 정의하기 위한 도구입니다. `docker-compose.yaml`이라는 YAML 형식 파일에 애플리케이션에 대한 컨테이너들의 구성 정보를 정의합니다.

> 단, 도커 엔진에 따라 지원되는 도커 컴포즈 버전이 다르니 다음의 [Compose and Docker compatibility matrix](https://docs.docker.com/compose/compose-file/)를 참고하시기 바랍니다.

### 설치하기
[도커 컴포즈 설치 문서](https://docs.docker.com/compose/install/)를 참고하여 여러분의 운영체제 환경에 맞는 도커 컴포즈를 설치하시기 바랍니다.

저는 Ubuntu 20.04 LTS에서 진행하므로 리눅스 시스템에서 도커 컴포즈를 설치하기 위하여 다음의 명령을 수행합니다.

```zsh
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

$ sudo chmod +x /usr/local/bin/docker-compose
$ docker-compose version
docker-compose version 1.26.2, build eefe0d31
docker-py version: 4.2.2
CPython version: 3.7.7
OpenSSL version: OpenSSL 1.1.0l  10 Sep 2019
```

### 도커 컴포즈 구성 따라하기
도커 그룹의 [awesome-compose](https://github.com/docker/awesome-compose) 리파지토리에서는 도커 컴포즈로 애플리케이션을 구성하는 여러가지 예제를 제공합니다.

- [Spring / PostgreSQL](https://github.com/docker/awesome-compose/tree/master/spring-postgres)  
- [Prometheus / Grafana](https://github.com/docker/awesome-compose/tree/master/prometheus-grafana)  

저는 간단하게 구성해볼 수 있는 프로메테우스와 그라파나를 도커 컴포즈로 구성하는 예제를 따라해보려고 합니다.

#### docker-compose.yaml  
먼저, 도커 컴포즈를 정의하는 것은 문서에 대한 버전을 지정하는 것부터 시작합니다.

> 저의 도커 엔진 버전은 19.03.12 이므로 문서 3.8 형식으로 작성할 수 있습니다.

```yaml docker-compose.yaml
version: "3.8"
```

도커 컴포즈로 실행하려는 컨테이너는 `services` 항목으로 명시합니다. 프로메테우스와 그라파나 컨테이는 도커 이미지로부터 구성합니다.


```yaml docker-compose.yaml
version: "3.8"
services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    ports:
      - 9090:9090
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
  grafana:
    image: grafana/grafana
    container_name: grafana
    ports:
      - 3000:3000
```

도커 컴포즈로 생성되는 컨테이너들이 공유하는 볼륨은 `volumes` 항목으로 명시합니다. 예제에서는 프로메테우스에 대한 데이터만 볼륨으로 지정하였지만 프로메테우스와 그라파나 볼륨을 각각 지정합니다.

```yaml docker-compose.yaml
version: "3.8"
services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    ports:
      - 9090:9090
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
  grafana:
    image: grafana/grafana
    container_name: grafana
    ports:
      - 3000:3000
    volumes:
      - ./grafana/datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml
      - grafana_data:/var/lib/grafana
volumes:
  prometheus_data:
  grafana_data:
```

### Deploy using Docker Compose
이제 도커 컴포즈 CLI 명령어로 프로메테우스와 그라파나 컨테이너를 실행할 수 있습니다.

```zsh
$ docker-compose up -d            
Creating network "prometheus-grafana_default" with the default driver
Creating volume "prometheus-grafana_prometheus_data" with default driver
Creating volume "prometheus-grafana_grafana_data" with default driver
Creating grafana    ... done
Creating prometheus ... done

$ docker ps
CONTAINER ID        IMAGE                 COMMAND                  CREATED             STATUS              PORTS                    NAMES
371b8a626a74        prom/prometheus       "/bin/prometheus --c…"   33 seconds ago      Up 29 seconds       0.0.0.0:9090->9090/tcp   prometheus
e0c6901f19d9        grafana/grafana       "/run.sh"                33 seconds ago      Up 29 seconds       0.0.0.0:3000->3000/tcp   grafana
```

프로메테우스와 그라파나가 실행되었으므로 그라파나 웹으로 접속하여 프로메테우스 정보를 표시할 수 있는지 확인합니다.

> 프로메테우스 매트릭에 대한 그라파나 대시보드는 [Prometheus 2.0 Overview](https://grafana.com/grafana/dashboards/3662)를 적용하였습니다.

![](/dev-ops/images/prometheus-grafana-dashboard.png)

#### Stop and Remove containers
도커 컴포즈로 실행되었던 컨테이너들을 함께 제거하려면 `down` 명령을 사용합니다. 이때 컨테이너에서 사용한 볼륨까지 제거하려면 `-v` 옵션을 추가합니다.

```zsh
# remove containers with volumes
$ docker-compose down -v

$ docker-compose down             
Stopping prometheus ... done
Stopping grafana    ... done
Removing prometheus ... done
Removing grafana    ... done
Removing network prometheus-grafana_default
```

도커 컴포즈로 함께 실행되었던 프로메테우스와 그라파나 컨테이너들이 제거되었습니다.

#### .env
`.env`은 도커 컴포즈가 활용할 수 있는 환경변수 파일입니다. 컨테이너 정의 시 사용되는 옵션을 환경변수를 만들어놓고 [.env](https://docs.docker.com/compose/env-file/) 파일로 관리할 수 있습니다.

앞서 정의한 docker-compose.yaml에서 IMAGE, CONTAINER NAME, PORT 부분을 환경변수로 변경하겠습니다.
```yaml docker-compose.yaml
version: "3.8"
services:
  prometheus:
    image: ${PROMETHEUS_TAG_VERSION}
    container_name: ${PROMETHEUS_CONTAINER_NAME}
    ports:
      - ${PROMETHEUS_PORT}:9090
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
  grafana:
    image: ${GRAFANA_TAG_VERSION}
    container_name: ${GRAFANA_CONTAINER_NAME}
    ports:
      - ${GRAFANA_PORT}:3000
    volumes:
      - ./grafana/datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml
      - grafana_data:/var/lib/grafana
volumes:
  prometheus_data:
  grafana_data:
```



```dotenv .env
# PROMETHEUS
PROMETHEUS_TAG_VERSION=prom/prometheus
PROMETHEUS_CONTAINER_NAME=prometheus
PROMETHEUS_PORT=9090

# GRAFANA
GRAFANA_TAG_VERSION=grafana/grafana
GRAFANA_CONTAINER_NAME=grafana
GRAFANA_PORT=3000
```

이와 같이 docker-compose.yaml를 정의할 때 환경변수를 활용하면 좀 더 효율적으로 관리할 수 있습니다.

## 참고
- [Docker Compose](https://docs.docker.com/compose/)
- [Awesome Compose](https://github.com/docker/awesome-compose)
