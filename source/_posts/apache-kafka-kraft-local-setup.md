---
title: Apache Kafka KRaft 로컬 설치
date: 2024-09-15T23:00+09:00
tags:
- Apache Kafka
- KRaft
- Confluent
---

Apache Kafka에 대한 학습을 위해 도커 컴포즈로 카프카에 대한 환경을 구성할 때 대부분 [wurstmeister/kafka-docker](https://github.com/wurstmeister/kafka-docker) 또는 [confluentinc/cp-kafka](https://hub.docker.com/r/confluentinc/cp-kafka/) 사용하여 ZooKeeper 기반의 카프카를 실행하는 방법에 대해 설명하는 것을 볼 수 있다. 본 글에서는 컨플루언트에서 제공하는 [confluentinc/confluent-local](https://hub.docker.com/r/confluentinc/confluent-local)를 사용해 KRaft 모드의 Apache Kafka에 대한 학습 환경을 만드는 것을 공유하고자 한다.

#### 도커 컴포즈 문서 작성

```yaml compose.yaml
version: '3'
services:
  kafka:
    image: confluentinc/confluent-local:7.5.6
    hostname: kafka
    container_name: kafka
    ports:
      - "9092:9092"
      - "8082:8082"
    environment:
      CLUSTER_ID: "EaJs_OcfTB6oWCOPTuY64Q"
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: "broker,controller"
      KAFKA_CONTROLLER_LISTENER_NAMES: "CONTROLLER"
      KAFKA_CONTROLLER_QUORUM_VOTERS: "1@kafka:29093"
      KAFKA_INTER_BROKER_LISTENER_NAME: "PLAINTEXT"
      KAFKA_LISTENERS: "PLAINTEXT://kafka:29092,CONTROLLER://kafka:29093,PLAINTEXT_HOST://0.0.0.0:9092"
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT"
      KAFKA_ADVERTISED_LISTENERS: "PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092"
      KAFKA_LOG_DIRS: "/tmp/kraft-combined-logs"
      KAFKA_REST_HOST_NAME: rest-proxy
      KAFKA_REST_BOOTSTRAP_SERVERS: "kafka:29092"
      KAFKA_REST_LISTENERS: "http://0.0.0.0:8082"

  kafka-ui: # Optional
    container_name: kafka-ui
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8080:8080"
    depends_on:
      - kafka
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
      KAFKA_CLUSTERS_0_AUDIT_TOPICAUDITENABLED: 'true'
      KAFKA_CLUSTERS_0_AUDIT_CONSOLEAUDITENABLED: 'true'
```

> confluent-local 이미지는 개발 환경을 위한 것이므로 프로덕션 환경에서는 [cp-all-in-one-kraft](https://github.com/confluentinc/cp-all-in-one/blob/7.7.0-post/cp-all-in-one-kraft/docker-compose.yml) 를 참고해서 cp-kafka 로 직접 구성해야합니다.

#### Kafka 클러스터 아이디

[kafka-storage](https://docs.confluent.io/platform/current/kafka-metadata/config-kraft.html#generate-and-format-ids)로 카프카에서 사용할 클러스터 아이디를 만들어야하며 kafka-storage 는 confluent-local 이미지에 포함되어 있어 아래와 같이 명령어를 실행하여 생성할 수 있다. [How to generate Kafka cluster ID](https://sleeplessbeastie.eu/2021/10/22/how-to-generate-kafka-cluster-id/) 에서는 kafka-storage 를 사용하지 않고도 Base64로 인코딩된 UUID를 만드는 방법에 대해서 알려주고 있으니 참고하면 좋겠다.

```sh Terminal
# docker run --rm confluentinc/confluent-local:7.5.6 /bin/sh -c "/bin/uuidgen --time | tr -d '-' | base64 | cut -b 1-22"
docker run --rm confluentinc/confluent-local:7.5.6 /bin/kafka-storage random-uuid
EaJs_OcfTB6oWCOPTuY64Q
```

#### 참고자료

- [KRaft: Apache Kafka Without ZooKeeper](https://developer.confluent.io/learn/kraft/)
- [Apache Kafka의 새로운 협의 프로토콜인 KRaft에 대해](https://devocean.sk.com/blog/techBoardDetail.do?ID=165711)
- [Amazon MSK, 새로운 Apache Kafka 클러스터를 위한 KRaft 모드 지원](https://aws.amazon.com/ko/about-aws/whats-new/2024/05/amazon-msk-kraft-mode-apache-kafka-clusters/)
- [How to generate Kafka cluster ID](https://sleeplessbeastie.eu/2021/10/22/how-to-generate-kafka-cluster-id/)
