---
title: AWS IoT Device
date: 2025-03-03T17:00+09:00
tags:
- IoT Core
- IoT Device SDK
---

IoT 디바이스 연결에 대해 직접적으로 담당했던 경험은 없지만 IoT Core 컨트롤 플레인 작업에 이어서 IoT 디바이스에 대한 [AWS IoT Device SDK for Java v2](https://github.com/aws/aws-iot-device-sdk-java-v2)에 대해서 알아보도록 하겠습니다. 대부분의 실무에서 IoT 디바이스에 대한 SDK는 C 또는 파이썬으로 작성된 것을 활용하겠지만 이에 대한 경험은 없으며 C 와 파이썬을 다루는 개발자는 아니므로 자바 SDK로 확인해보도록 하겠습니다.

#### IoT 디바이스 데이터 엔드포인트

IoT 디바이스에서 `X.509 클라이언트 인증서`와 함께 MQTT 프로토콜을 사용하여 AWS IoT 메시지 브로커에 연결할 때는 `Data-ATS` 엔드포인트를 사용하게 됩니다. 이 엔드포인트 주소는  AWS IoT Core의 `DescribeEndpoint` 명령으로 확인할 수 있었지만 수시로 변경되는 정보가 아니므로 웹 콘솔에서 확인해도 무방하므로 IoT 연계 시스템을 통해 호스트 주소, 개인키 파일, X.509 클라이언트 인증서 그리고 루트 CA 인증서 파일을 다운로드 받게 됩니다.

#### 메시지 브로커 연결 권한

일반적으로 클라이언트 아이디는 [사물 이름 그대로 사용](https://docs.aws.amazon.com/iot/latest/developerguide/thing-policy-variables.html)하도록 보안 정책을 적용합니다. 따라서, MQTT 프로토콜을 사용할 때 X.509 클라이언트 인증서에 등록된 [연결 정책](https://docs.aws.amazon.com/iot/latest/developerguide/connect-policy.html)으로 정의된 클라이언트 아이디를 사용해야 합니다. 클라이언트 아이디를 사물 이름과 동일하게 사용하는 이유는 MQTT 메시지 브로커에 동일한 클라이언트 아이디로 연결할 수 없으므로 이전 연결이 해제되기 때문입니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "arn:aws:iot:ap-northeast-2:[account-id]:client/${iot:Connection.Thing.ThingName}"
    }
  ]
}
```

#### 디바이스 연결 상태

![](/images/posts/aws-iot-core/04.png)

플릿 인덱싱의 사물 연결을 활성화하면 IoT Core 에서 IoT 디바이스 연결 상태를 모니터링하게 됩니다. 플릿 인덱싱으로 `사물 연결 상태를 확인`하기 위해서는 MQTT 클라이언트 아이디를 사물 이름과 동일하게 설정해야 합니다. 앞서, 메시지 브로커 연결 권한에서 클라이언트 아이디를 사물 이름 그대로 사용해야하는 이유가 되기도 합니다. 연결 상태에 대한 상세 이유는 웹 콘솔의 `사물 연결성 API 테스트` 또는 `사물 활동 이력`에서 확인할 수 있습니다.

#### IoT Device Java SDK v2 기반 연결 코드

[AWS IoT Device SDK](https://docs.aws.amazon.com/iot/latest/developerguide/iot-sdks.html)로 IoT 디바이스에서 AWS 메시지 브로커로 연결을 수행할 수 있고 Java SDK v2 기반의 샘플 코드 중에서 [Direct MQTT with X509-based Mutual TLS Method](https://github.com/aws/aws-iot-device-sdk-java-v2/blob/main/samples/Mqtt5/PubSub/README.md#direct-mqtt-with-x509-based-mutual-tls-method) 를 참고하여 작성해보았습니다. 샘플 예제 문서와 다르게 AwsIotMqtt5ClientBuilder 에는 [newMtlsBuilder라는 함수가 없으므로](https://github.com/aws/aws-iot-device-sdk-java-v2/pull/614) newDirectMqttBuilderWithMtlsFromMemory 함수를 사용하면 되며 PEM 형식의 문자열을 읽기 위해서 `Files.readAllBytes` 대신에 JDK 11에서 추가된 `Files.readString` 을 대신 활용했습니다.

```java IotDevice.java
Mqtt5Client client = null;
try (IotClient iotClient = IotClient.builder()
        .credentialsProvider(DefaultCredentialsProvider.create())
        .region(Region.AP_NORTHEAST_2)
        .build()) {

    DescribeEndpointResponse endpoint = iotClient.describeEndpoint(builder ->
            builder.endpointType("iot:Data-ATS").build());

    String dataAtsEndpoint = endpoint.endpointAddress();
    String certificatePem = getPem("certificate.pem");
    String privateKey = getPem("privateKey.pem");
    String caRoot = getPem("AmazonRootCA1.pem");
    ConnectPacket.ConnectPacketBuilder connectProperties = new ConnectPacket.ConnectPacketBuilder()
            .withClientId("PC");

    client = AwsIotMqtt5ClientBuilder
            .newDirectMqttBuilderWithMtlsFromMemory(dataAtsEndpoint, certificatePem, privateKey)
            .withCertificateAuthority(caRoot)
            .withConnectProperties(connectProperties)
            .build();
    client.start();

    Thread.sleep(Duration.ofMinutes(5));
} finally {
    if (client != null) {
        client.close();
    }
}
```

```java
public static String getPem(String filename) {
    try {
        return Files.readString(Path.of(ClassLoader.getSystemResource(filename).toURI()), StandardCharsets.UTF_8);
    } catch (Exception e) {
        return "";
    }
}
```

#### 연결 실패에 대한 오류 원인에 대해서 알아보기

IoT 디바이스의 MQTT 클라이언트 연결에 대한 코드를 작성해보는 경우 연결 실패에 대한 오류 원인에 대해서 알아보도록 하겠습니다. 모든 예외 케이스를 다룰 수 없지만 제가 경험했던 케이스들은 다음과 같습니다. 이러한 오류 원인을 미리 알아두면 쉽게 원인을 찾아갈 수 있는데 도움이 되기도 합니다.

##### LifecycleEvent: no lifecycle events found!

```sh
software.amazon.awssdk.crt.CrtRuntimeException: LifecycleEvent: no lifecycle events found! - error code: 38 (aws_last_error: AWS_ERROR_INVALID_STATE(38), An invalid state was encountered.) AWS_ERROR_INVALID_STATE(38)
```

Mqtt5Client를 생성할 때는 `Mqtt5ClientOptions.LifecycleEvents` 인터페이스를 구현하여 생애 주기에 대한 동작을 빌더에 등록해야 합니다. 그렇지 않으면 위와 같이 라이프 사이클을 찾을 수 없다는 오류가 발생하며 연결할 수 없습니다.

##### CONNACK:Client is not authenticated/authorized to send the message

```sh
CONNACK:Client is not authenticated/authorized to send the message:30d84af7-ddab-fd2e-7931-2592832a22d5
```

위 오류 메시지는 onConnectionFailure 콜백 함수로 전달되는 결과에 포함되는 사유입니다. 이 메시지는 클라이언트로 인증할 수 없다는 것으로 클라이언트 아이디(사물 이름)에 연결된 인증서에 올바른 정책이 연결되지 않았을 때 발생할 수 있으므로 `iot:Connect` 작업에 대한 정책이 연결된 상태가 아닌지 잘못된 클라이언트에 대한 권한을 가지는지 확인해보면 됩니다. 메시지 연결 권한에서 확인했던 `사물 이름을 클라이언트 아이디로 연결할 수 있는 권한을 가지도록`한 X.509 클라이언트 인증서 정책은 다음과 같습니다.

![](/images/posts/aws-iot-core/05.png)

##### ErrorCode: 5134

onConnectionFailure 콜백 결과가 ConnAckPacket 이 비어있고 에러 코드가 `5134` 로 전달된다면 사물에 연결된 인증서가 `비활성화` 상태일 수 있습니다. 이미 연결된 클라이언트에 대한 인증서를 비활성화하거나 인증서 정책을 변경하더라도 이미 연결된 클라이언트가 연결 해제되진 않으므로 알아두면 좋을 것 같습니다.