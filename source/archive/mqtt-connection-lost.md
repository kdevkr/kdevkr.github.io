---
title: MQTT Connection Lost
date: 2022-09-09
tags:
- Mosquitto
- Paho Java Client
---

```java
Connection lost (32109) - java.io.EOFException
	at org.eclipse.paho.client.mqttv3.internal.CommsReceiver.run(CommsReceiver.java:197)
	at java.lang.Thread.run(Thread.java:750)
Caused by: java.io.EOFException
	at java.io.DataInputStream.readByte(DataInputStream.java:267)
	at org.eclipse.paho.client.mqttv3.internal.wire.MqttInputStream.readMqttWireMessage(MqttInputStream.java:92)
	at org.eclipse.paho.client.mqttv3.internal.CommsReceiver.run(CommsReceiver.java:137)
	... 1 more
```

위 스택트레이스는 Paho Java Client를 사용하여 Mosquitto 브로커에 연결하고 난 후 어떠한 사유에 의해 연결이 해지되었을 때 발생하는 오류입니다. 조직 내 동료 개발자가 Mosquitto에 연결하고 나서 5분이 지나는 시점에 연결이 해지되는 증상이 있다며 이 문제를 경험했는지 도움을 요청하였으나 이전에 [스프링 부트 MQTT 클라이언트 메시지 채널 구성하기](/spring-boot-integration-mqtt/) 또는 [AWS IoT Device SDK Java로 MQTT 연결하기](/connecting-with-mqtt-using-aws-iot-device-sdk/)에서처럼 Paho Java Client 라이브러리를 사용하면서 연결이 해지되는 것을 경험해보지는 못했었습니다.

## MQTT over Websocket
조직 내 동료 개발자의 도움 요청으로 인해 리눅스 서버에 설치된 Mosquitto 버전은 2.0.14 이며 Paho Java Client 라이브러리는 1.2.5를 사용하고 있는 것으로 알게 되었습니다. 그리고 Mosquitto 연결 시에는 Websocket 프로토콜을 사용하고 있었습니다. 

|JDK|Paho Java Client|Mosquitto|EOF|
|---|---|---|---|
|Java 1.8.0_144|1.2.5|2.0.14|💥|
|Temurin 1.8.0_345|1.1.0 ~ 1.2.5|2.0.14|💥|
|Temurin 11.0.16|1.1.0 ~ 1.2.5|2.0.14|💥|

JDK와 라이브러리 버전을 변경해가면서 테스트 해본 결과 일반적인 TCP 방식으로 연결 시에는 Mosquitto 버전과 상관없이 정상적으로 연결을 유지함을 보였으나 웹소켓 연결에 대해서는 리눅스 서버에 설치된 Mosquitto 2.0.14 브로커에 대해 일정 시간이 지나 연결이 해지됨을 확인할 수 있었습니다.

### Mosquitto Version
위 문제가 발생했던 리눅스 서버에 Mosquitto 브로커는 도커 이미지로 구동된 상태라고 하였습니다. 그래서 로컬 컴퓨터 환경에서도 도커 컨테이너를 실행하여 간단하게 여러개의 버전을 테스트할 수 있으므로 도커 이미지를 변경하면서 웹 소켓 연결이 일정 시간 이후에 해지되는 증상이 나타나는지 체크해보았습니다. 테스트 버전은 [Mosquitto Posts about Releases](https://mosquitto.org/blog/categories/releases/)에 따라 시도해보았으며 2.0.9와 2.0.11가 릴리즈될 때 1.6.x 마이너 버전도 패치되었기에 포함했습니다.

|JDK|Paho Java Client|Mosquitto|EOF|
|---|---|---|---|
|Temurin 11.0.16|1.2.5|2.0.15|💥|
|Temurin 11.0.16|1.2.5|2.0.14|💥|
|Temurin 11.0.16|1.2.5|2.0.13|💥|
|Temurin 11.0.16|1.2.5|2.0.12|💥|
|Temurin 11.0.16|1.2.5|2.0.11|💥|
|Temurin 11.0.16|1.2.5|2.0.10|OK|
|Temurin 11.0.16|1.2.5|2.0.9|OK|
|Temurin 11.0.16|1.2.5|1.6.15|💥|
|Temurin 11.0.16|1.2.5|1.6.14|OK|
|Temurin 11.0.16|1.2.5|1.6.9|OK|

> 우분투 LTS 버전에 따른 Mosquitto 패키지 지원 버전은 다음의 링크에서 확인할 수 있습니다.
> https://packages.ubuntu.com/search?keywords=mosquitto

Mosquitto 버전별 테스트 결과 2021-06-08 자로 릴리즈된 2.0.11과 1.6.15 에서부터 웹소켓 연결이 해지되는 증상을 보였습니다. 동료 개발자에게는 Paho Java Client의 AutomaticReconnect 옵션과 MqttCallbackExtended 인터페이스로 연결 해지로 인해 재연결을 시도하고 나서 토픽을 다시 구독하는 방향으로 임시 조치해야할 것 같다고 전달한 상태이며 Mosquitto 브로커 버전을 다운그레이드 해야하는지에 대해서는 조직 내에서 검토하고 결정해야할 것 같습니다.

## 테스트 환경
처음에는 우분투 VM 이미지로 테스트하였으나 다양한 버전을 테스트해보기 위해서 도커 컨테이너 환경을 구성했습니다. 

### Docker Compose
```yaml
version: "3.8"
services:
  mosquitto:
    # image: eclipse-mosquitto:1.6.15 # EOF
    # image: eclipse-mosquitto:1.6.14 # OK
    # image: eclipse-mosquitto:2.0.9 # OK
    # image: eclipse-mosquitto:2.0.10 # OK
    # image: eclipse-mosquitto:2.0.11 # EOF
    # image: eclipse-mosquitto:2.0.12 # EOF
    # image: eclipse-mosquitto:2.0.13 # EOF
    # image: eclipse-mosquitto:2.0.14 # EOF
    # image: eclipse-mosquitto:2.0.15 # EOF
    image: eclipse-mosquitto:2.0.10
    container_name: mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - ./mosquitto.log:/mosquitto/log/mosquitto.log
      - mosquitto-data:/mosquitto/data
      - ./passwd:/mosquitto/config/passwd

volumes:
  mosquitto-data:
```

### mosquitto.conf
```conf
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log

port 1883

listener 9001
protocol websockets
allow_anonymous false
password_file /mosquitto/config/passwd
set_tcp_nodelay true
socket_domain ipv4

log_type all
websockets_log_level 8
```

<details>
  <summary>테스트 로그</summary>
  
  #### mosquitto.log
```shell
1662725110: New client connected from 192.168.0.2:3326 as paho1668189895026200 (p2, c1, k60, u'mambo').
1662725110: No will message specified.
1662725110: Sending CONNACK to paho1668189895026200 (0, 0)
1662725110: Received SUBSCRIBE from paho1668189895026200
1662725110:     $SYS/broker/version (QoS 0)
1662725110: paho1668189895026200 0 $SYS/broker/version
1662725110: Sending SUBACK to paho1668189895026200
1662725110: Sending PUBLISH to paho1668189895026200 (d0, q0, r1, m0, '$SYS/broker/version', ... (24 bytes))
1662725110: Received SUBSCRIBE from paho1668189895026200
1662725110:     test/# (QoS 0)
1662725110: paho1668189895026200 0 test/#
1662725110: Sending SUBACK to paho1668189895026200
1662725170: Received PINGREQ from paho1668189895026200
1662725170: Sending PINGRESP to paho1668189895026200
1662725230: Received PINGREQ from paho1668189895026200
1662725230: Sending PINGRESP to paho1668189895026200
1662725290: Received PINGREQ from paho1668189895026200
1662725290: Sending PINGRESP to paho1668189895026200
1662725350: Received PINGREQ from paho1668189895026200
1662725350: Sending PINGRESP to paho1668189895026200
1662725410: Client paho1668189895026200 closed its connection.
```

```shell
1662727428: lws_validity_cb: [wsisrv|0|adopted]: scheduling validity check
1662727428: rops_handle_POLLOUT_ws: issuing ping on wsi [wsisrv|0|adopted]: ws mqtt h2: 0
1662727428: lws_issue_raw: ssl_capable_write (2) says 2
1662727428: lws_issue_raw: ssl_capable_write (6) says 6
1662727428: __lws_close_free_wsi: [wsisrv|0|adopted]: caller: close_and_handled
1662727428: __lws_close_free_wsi: [wsisrv|0|adopted]: end LRS_FLUSHING_BEFORE_CLOSE
1662727428: __lws_close_free_wsi: shutdown conn: [wsisrv|0|adopted] (sk 12, state 0x11e)
1662727428: __lws_close_free_wsi: real just_kill_connection: [wsisrv|0|adopted] (sockfd 12)
1662727428: __lws_close_free_wsi: [wsisrv|0|adopted]: cce=1
1662727428: Client paho1670208425870800 closed its connection.
```

#### Paho Java Client log

```shell
FINE: null: network read message
Sep 09, 2022 8:33:09 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver run
FINE: null: network read message
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver run
FINE: null: network read message
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver run
FINE: null: network read message
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver run
FINE: paho1622771147525800: Stopping due to IOException
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver run
FINE: paho1622771147525800: Stopping due to IOException
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientComms shutdownConnection
FINE: paho1622771147525800: state=DISCONNECTING
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientComms shutdownConnection
FINE: paho1622771147525800: state=DISCONNECTING
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback stop
FINE: paho1622771147525800: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback stop
FINE: paho1622771147525800: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback stop
FINE: paho1622771147525800: notify workAvailable and wait for run
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback stop
FINE: paho1622771147525800: notify workAvailable and wait for run
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback stop
FINE: paho1622771147525800: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback stop
FINE: paho1622771147525800: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback run
FINE: paho1622771147525800: notify spaceAvailable
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback run
FINE: paho1622771147525800: notify spaceAvailable
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver stop
FINE: paho1622771147525800: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver stop
FINE: paho1622771147525800: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver stop
FINE: paho1622771147525800: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver stop
FINE: paho1622771147525800: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopping
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.websocket.WebSocketReceiver stop
FINE: null: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsTokenStore quiesce
FINE: paho1622771147525800: resp=Client is currently disconnecting (32102)
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsTokenStore quiesce
FINE: paho1622771147525800: resp=Client is currently disconnecting (32102)
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientComms handleOldTokens
FINE: paho1622771147525800: >
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientComms handleOldTokens
FINE: paho1622771147525800: >
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState resolveOldTokens
FINE: paho1622771147525800: reason Connection lost (32109) - java.io.EOFException
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState resolveOldTokens
FINE: paho1622771147525800: reason Connection lost (32109) - java.io.EOFException
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsTokenStore getOutstandingTokens
FINE: paho1622771147525800: >
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsTokenStore getOutstandingTokens
FINE: paho1622771147525800: >
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState disconnected
FINE: paho1622771147525800: disconnected
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState disconnected
FINE: paho1622771147525800: disconnected
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState clearState
FINE: paho1622771147525800: >
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState clearState
FINE: paho1622771147525800: >
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsTokenStore clear
FINE: paho1622771147525800: > 0 tokens
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsTokenStore clear
FINE: paho1622771147525800: > 0 tokens
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender stop
FINE: paho1622771147525800: stopping sender
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender stop
FINE: paho1622771147525800: stopping sender
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState notifyQueueLock
FINE: paho1622771147525800: notifying queueLock holders
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState notifyQueueLock
FINE: paho1622771147525800: notifying queueLock holders
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender stop
FINE: paho1622771147525800: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender stop
FINE: paho1622771147525800: stopped
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState get
FINE: paho1622771147525800: new work or ping arrived 
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.TimerPingSender stop
FINE: paho1622771147525800: stop
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState get
FINE: paho1622771147525800: new work or ping arrived 
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState get
FINE: paho1622771147525800: no outstanding flows and not connected
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientState get
FINE: paho1622771147525800: no outstanding flows and not connected
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.TimerPingSender stop
FINE: paho1622771147525800: stop
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender run
FINE: paho1622771147525800: get message returned null, stopping}
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender run
FINE: paho1622771147525800: get message returned null, stopping}
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender run
FINE: paho1622771147525800: <
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsSender run
FINE: paho1622771147525800: <
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientComms shutdownConnection
FINE: paho1622771147525800: state=DISCONNECTED
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.ClientComms shutdownConnection
FINE: paho1622771147525800: state=DISCONNECTED
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback connectionLost
FINE: paho1622771147525800: call connectionLost
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsCallback connectionLost
FINE: paho1622771147525800: call connectionLost
Connection lost (32109) - java.io.EOFException
	at org.eclipse.paho.client.mqttv3.internal.CommsReceiver.run(CommsReceiver.java:197)
	at java.base/java.lang.Thread.run(Thread.java:829)
Caused by: java.io.EOFException
	at java.base/java.io.DataInputStream.readByte(DataInputStream.java:272)
	at org.eclipse.paho.client.mqttv3.internal.wire.MqttInputStream.readMqttWireMessage(MqttInputStream.java:92)
	at org.eclipse.paho.client.mqttv3.internal.CommsReceiver.run(CommsReceiver.java:137)
	... 1 more
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver run
FINE: paho1622771147525800: <
Sep 09, 2022 8:33:10 AM org.eclipse.paho.client.mqttv3.internal.CommsReceiver run
FINE: paho1622771147525800: <
```
</details>

## 이슈 링크

- [Websocket connection lost with paho java client #2631](https://github.com/eclipse/mosquitto/issues/2631)
- [Websocket connection lost with mosquitto 1.6.15 and 2.0.11+ #960](https://github.com/eclipse/paho.mqtt.java/issues/960)