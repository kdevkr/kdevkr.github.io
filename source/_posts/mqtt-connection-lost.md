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

위 스택트레이스는 Paho Java Client 라이브러리를 사용해서 Mosquitto MQTT 브로커에 연결하고 나서 어떠한 사유에 의해 연결이 해지되었을 때 발생하는 오류이다. 이전에 [스프링 부트 MQTT 클라이언트 메시지 채널 구성하기](/spring-boot-integration-mqtt/) 또는 [AWS IoT Device SDK Java로 MQTT 연결하기](/connecting-with-mqtt-using-aws-iot-device-sdk/)에서 MQTT 프로토콜에 대해서 공유한 것처럼 Paho Java Client 라이브러리르 사용해본적은 있었으나 위와 같은 오류를 경험하지는 못했었다.

## MQTT over Websocket
조직 내 동료 개발자가 Paho Java Client 라이브러리를 사용해서 Mosquitto 2.0.14에 연결하고나서 5분이 지나는 시점에 연결이 해지되는 사유가 있다는 것을 알려주었고 그에 대한 원인을 찾기 위해서 도움을 요구했다. JDK, Paho Java Client 라이브러리 버전 그리고 심지어는 Mosquitto 버전에 따라 증상을 확인해본 결과 아래와 같이 파악되었다.

|JDK|Paho Java Client|Mosquitto|EOF|
|---|---|---|---|
|Java 1.8.0_144|1.2.5|2.0.14|💥|
|Temurin 1.8.0_345|1.1.0 ~ 1.2.5|2.0.15|💥|
|Temurin 11.0.16|1.1.0 ~ 1.2.5|2.0.15|💥|
|Temurin 11.0.16|1.1.0 ~ 1.2.5|1.6.9||

일반적인 TCP 방식으로 연결 시에는 Mosquitto 버전과 상관없이 정상적으로 연결을 유지함을 보였으나 웹소켓 연결에 대해서는 Mosquitto 2.0.15 버전에서 일정 시간이 지난 연결이 해지됨을 확인했다.

### 클라이언트 아이디 충돌 가능성
보통 Paho Java Client 라이브러리를 사용해서 EOFException 문제를 경험하는 경우 대부분은 클라이언트 아이디의 충돌을 원인으로 하는데 Mosquitto 브로커에 연결된 클라이언트는 UUID를 발급하여 사용중이며 로컬 테스트 시에도 단일 클라이언트가 연결되고 있으므로 이로 인해 발생하는 문제는 아니다.

> Mosquitto 버전과 상관없이 TCP 연결은 정상적으로 유지되는 것으로 볼때에도 클라이언트 아이디 충돌은 아니다.

### 라이브러리 버그 가능성
Paho Java Client 리파지토리에서 관련된 증상에 대한 이슈를 찾아보았으나 일부 웹소켓 연결에 대한 문제에 대해서 이미 조치된 1.2.5 버전에서도 해당 증상이 발생하므로 라이브러리 버그 가능성도 높지는 않아보인다.

**이슈 목록**
- [Mqtt websocket attempts to reconnect throwing EOF exception #358](https://github.com/eclipse/paho.mqtt.java/issues/358)
- [Connection lost (32109) - java.io.EOFException #429](https://github.com/eclipse/paho.mqtt.java/issues/429)
- [Connection lost (32109) - java.io.EOFException #673](https://github.com/eclipse/paho.mqtt.java/issues/673)
- [Connection lost (32109) - EOFException after connect for Websocket connection #679](https://github.com/eclipse/paho.mqtt.java/issues/679)
- [Connection lost (32109) - java.io.EOFException #867](https://github.com/eclipse/paho.mqtt.java/issues/867)
- [Connection lost (32109) - EOFException after connect for Websocket connection #884](https://github.com/eclipse/paho.mqtt.java/issues/884)

### Mosquitto 2.0 변경사항
사실 Mosquitto 1.6.9 와 Mosquitto 2.0.15 사이에는 메이저 버전의 변경이 있으므로 많은 변경사항이 있을 수 있다. 웹 소켓 연결이 해지되는 증상에 대해서 알려진 이슈가 있는지 [Websocket connection lost with paho java client #2631](https://github.com/eclipse/mosquitto/issues/2631) 이슈를 등록해놓은 상태로 자세한 원인에 대해서는 아직까지 모르는 상황이다.

## 테스트 환경
혹시나 원인을 찾는데 도움이 될지 모르므로 이와 관련된 메시지 또는 로그에 대해서 기록해놓고자 한다.

### Mosquitto 설치
```shell
# Mosquitto 1.6.9
sudo apt search mosquitto
...
mosquitto/focal 1.6.9-1 amd64
  MQTT version 5.0/3.1.1/3.1 compatible message broker
...
sudo apt install mosquitto

# Mosquitto 2.0.15
sudo apt-add-repository ppa:mosquitto-dev/mosquitto-ppa
sudo apt-get update
sudo apt install mosquitto
```


### mosquitto.conf
```conf
port 1883
listener 2883
protocol websockets
allow_anonymous false
password_file /etc/mosquitto/passwd
set_tcp_nodelay true
socket_domain ipv4

log_type all
websockets_log_level 8
```

### mosquitto.log
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

### Paho Java Client log

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

동료 개발자에게는 AutomaticReconnect 옵션과 MqttCallbackExtended 인터페이스로 연결 해지로 인해 재연결을 시도하고 나서 토픽을 다시 구독하는 방향으로 임시 조치해야할 것 같다고 전달하였다. 자세한 사유를 알게되면 추가로 작성할 예정이다.