---
title: 스프링 부트 MQTT 클라이언트 메시지 채널 구성하기
date: 2020-09-04
---

제주 전기차 실증 시스템을 개발하면서 전기차 OBD 데이터를 수집하기 위하여 MQTT(Message Queuing Telemetry Transfer) 클라이언트를 구성하고 토픽에 대한 메시지 페이로드를 수신하는 것을 처음 구성하였습니다.

본 글에서는 스프링 MQTT를 통해 MQTT 클라이언트와 메시지 구독 또는 발행하는 채널을 구성하는 것을 설명합니다.

## 의존성
```groovy
implementation 'org.springframework.boot:spring-boot-starter-integration'
implementation 'org.springframework.integration:spring-integration-mqtt'
```

스프링 MQTT는 [Eclipse Paho MQTT Client](https://www.eclipse.org/paho/) 라이브러리를 사용합니다.

```groovy
org.springframework.integration:spring-integration-mqtt:5.3.2.RELEASE
  org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.4
```

## Inbound Channel Configuration
토픽 메시지 구독을 위한 인바운드 채널 구성은 `MqttPahoMessageDrivenChannelAdapter` 구현체를 통해 가능합니다.

### DefaultMqttPahoClientFactory
기본적으로 `DefaultMqttPahoClientFactory`를 통해 MQTT 클라이언트를 등록합니다. 그러므로 우리는 MQTT 연결 정보(MqttConnectOptions)을 설정한 DefaultMqttPahoClientFactory를 빈으로 등록합니다.
```java
@Configuration
public class MqttConfig {
    private static final String MQTT_USERNAME = "username";
    private static final String MQTT_PASSWORD = "password";

    private MqttConnectOptions connectOptions() {
        MqttConnectOptions options = new MqttConnectOptions();
        options.setCleanSession(true);
        options.setUserName(MQTT_USERNAME);
        options.setPassword(MQTT_PASSWORD.toCharArray());
        return options;
    }

    @Bean
    public DefaultMqttPahoClientFactory defaultMqttPahoClientFactory() {
        DefaultMqttPahoClientFactory clientFactory = new DefaultMqttPahoClientFactory();
        clientFactory.setConnectionOptions(connectOptions());
        return clientFactory;
    }
}
```

### MqttPahoMessageDrivenChannelAdapter
앞서 등록하였던 MQTT 클라이언트를 통해 메시지를 구독하기 위하여 `MqttPahoMessageDrivenChannelAdapter`를 통해 메시지 수신을 위한 채널을 구성합니다.

```java
@Configuration
public class MqttConfig {

    private static final String BROKER_URL = "tcp://localhost:1883";
    private static final String MQTT_CLIENT_ID = MqttAsyncClient.generateClientId();
    private static final String TOPIC_FILTER = "[PROTECT]";

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer inboundChannel() {
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(BROKER_URL, MQTT_CLIENT_ID, TOPIC_FILTER);
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler inboundMessageHandler() {
        return message -> {
            String topic = (String) message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);
            System.out.println("Topic:" + topic);
            System.out.println("Payload" + message.getPayload());
        };
    }
}
```
이제 MQTT 클라이언트에 의해 수신된 페이로드는 MQTT 클라이언트 ➤ Inbound Channel ➤ MessageChannel ➤ MessageHandler 순으로 이동되어 MessageHandler를 통해 수신된 페이로드를 확인할 수 있습니다.

## Outbound Channel Configuration
제주 전기차 실증 시스템에서는 MQTT 클라이언트를 통해 메시지를 발행하는 것은 구현하지 않았습니다. 다만, 메시지를 수신하는 채널을 등록하는 것처럼 메시지를 발행하기 위한 채널을 구성하면 됩니다.

### MqttPahoMessageHandler
MQTT 클라이언트는 이미 구성되었으므로 `MqttPahoMessageHandler`으로 메시지 발행을 위한 채널을 구성합니다.

```java
@Configuration
public class MqttConfig {
    
    private static final String MQTT_CLIENT_ID = MqttAsyncClient.generateClientId();

    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound(DefaultMqttPahoClientFactory clientFactory) {
        MqttPahoMessageHandler messageHandler =
                new MqttPahoMessageHandler(MQTT_CLIENT_ID, clientFactory);
        messageHandler.setAsync(true);
        messageHandler.setDefaultQos(1);
        return messageHandler;
    }
}
```

이제 @MessagingGateway 어노테이션을 선언한 메시지 게이트웨이 API를 통해 메시지를 발송합니다.

```java
@Configuration
public class MqttConfig {

    @MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
    public interface OutboundGateway {
        void sendToMqtt(String payload, @Header(MqttHeaders.TOPIC) String topic);
    }
    
}
```

## MQTT Events
만약, MQTT 클라이언트가 브로커 서버에 연결을 실패하거나 토픽 구독을 감지한 이벤트를 처리하고 싶다면 다음의 링크를 참고하시기 바랍니다.

https://docs.spring.io/spring-integration/reference/html/mqtt.html#mqtt-events



## 참고
- [Spring Integration - MQTT Support](https://docs.spring.io/spring-integration/reference/html/mqtt.html)