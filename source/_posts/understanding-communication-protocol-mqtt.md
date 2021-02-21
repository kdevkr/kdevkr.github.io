---
title: 통신 프로토콜 이해하기 시리즈 - MQTT
date: 2021-02-21
categories:
- Communication Protocol
tags:
- protocol
- mqtt
---

통신 프로토콜 이해하기 시리즈는 컴퓨터 또는 디바이스 간 통신에 사용되는 다양한 프로토콜을 이해하는 시간을 가집니다. 실무에서 다양한 프로젝트를 진행하다보면 통신에 사용되는 프로토콜이 다양하다는 것을 느낄 수 있습니다. 이번 통신 프로토콜 이해하기 시리즈에서 살펴볼 통신 프로토콜은 `MQTT`입니다.

![](../images/logo/mqtt.jpg#compact)

## MQTT
MQTT(Message Queuing Telemetry transport)는 1999년에 IBM이 M2M을 위해 만든 프로토콜로 현재는 사물 인터넷(IoT)를 위한 OASIS 표준 메시지 프로토콜입니다. MQTT는 저대역폭 네트워크 환경에서 원격 측정을 위해 설계되어 경량의 메시지를 `발행(Publish)` 및 `구독(Subscribe)`할 수 있습니다.

### MQTT 발행 - 구독 아키텍처
![MQTT Publish / Subscribe Architecture](https://mqtt.org/assets/img/mqtt-publish-subscribe.png)

위 그림은 MQTT 홈페이지에서 제공하는 발행/구독 아키텍처로 MQTT 프로토콜을 통해 상호 디바이스간 메시지를 주고 받는 구조를 확인할 수 있는 예시입니다. 온도 센서가 MQTT 브로커 서버로 온도 정보를 발행하면 각 MQTT 클라이언트는 MQTT 브로커 서버의 온도 토픽을 구독하여 온도 정보를 메시지로 수신할 수 있습니다.

> [AWS IoT](https://docs.aws.amazon.com/ko_kr/iot/latest/developerguide/mqtt.html)는 MQTT 프로토콜을 지원해요.

#### MQTT Broker
MQTT 프로토콜은 게시자(Publisher)와 구독자(Subscriber)가 직접 연결되는 것이 아닌 중계자(Broker)를 중앙에 두고 메시지를 송수신합니다. [MQTT 브로커 서버](https://github.com/mqtt/mqtt.org/wiki/servers)로는 다음과 같은 것들이 있으며 저는 주로 [Mosquitto](https://mosquitto.org/) 사용합니다.

- Mosquitto
- HiveMQ
- ActiveMQ
- RabbitMQ

> [페이스북(Facebook) 메신저](https://mosquitto.org/blog/2011/08/facebook-using-mqtt/)에서도 MQTT 브로커로 Mosquitto를 사용해요.

### QoS (Quality of Service)
사물 인터넷(IoT) 디바이스들은 무선 네트워크를 주로 사용합니다. 무선 네트워크는 유선 네트워크보다 상당히 불안정하므로 MQTT 프로토콜을 통해 메시지를 안정적으로 주고 받을 수 있게 `QoS`라고 하는 서비스 품질을 설정할 수 있습니다.

- **Level 0**  
QoS Level 0은 서비스 품질 보장없는 전송을 수행하여 메시지 전송이 실패했는지를 확인하지 않습니다.

- **Level 1**  
QoS Level 1은 최소한 1번은 메시지를 전송 되었다는 것을 보장하기 위해서 브로커가 게시자에게 메시지 전송 여부를 확인하는 과정을 수행합니다.

- **Level 2**  
QoS Level 2는 반드시 1번 전송될 수 있도록 핸드쉐이킹 방식으로 메시지 전송 여부를 확인합니다. 전송 여부를 확인하는 과정이 많으므로 오버헤드가 높습니다.

> AWS IoT는 [QoS Level 2](https://docs.aws.amazon.com/ko_kr/iot/latest/developerguide/mqtt.html#mqtt-qos)를 지원하지 않아요.

MQTT가 경량 메시지 프로토콜인 만큼 오버헤드가 많이 발생하는 QoS Level 2는 부득이한 경우가 아니라면 사용할 필요가 없어보입니다.

## MQTT 클라이언트
MQTT 클라이언트 라이브러리는 다양한 [언어](https://github.com/mqtt/mqtt.org/wiki/libraries)로 구현되어 있습니다. 

- 자바 : [Eclipse Paho Java Client](https://www.eclipse.org/paho/index.php?page=clients/java/index.php)
- Go 언어 : [Eclipse Paho MQTT Go client](https://github.com/eclipse/paho.mqtt.golang)

제가 작성한 [스프링 부트 MQTT 클라이언트 메시지 채널 구성하기](https://kdevkr.github.io/spring-boot-integration-mqtt/)는 스프링 부트 기반의 프로젝트에서 Eclipse Paho Java Client로 MQTT 메시지 구독을 위한 채널을 구성하는 예시를 제공합니다.

## 참고
- [MQTT](https://mqtt.org/)