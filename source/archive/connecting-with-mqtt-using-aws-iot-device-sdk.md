---
title: AWS IoT Device SDK Java로 MQTT 연결하기
date: 2021-08-07
tags:
- AWS
- MQTT
---

안녕하세요 Mambo 입니다. 오늘은 AWS IoT Core의 MQTT 클라이언트로 MQTT 브로커에 연결하여 메시지를 게시하고 수신해보는 방법에 대해서 알아봅니다.

## AWS IoT Core
![](https://docs.aws.amazon.com/iot/latest/developerguide/images/what-is-aws-iot.png)

AWS IoT Core는 클라우드 환경에 디바이스를 연결하고 연결된 디바이스간 통신을 제공하는 관리형 클라우드 플랫폼입니다. 그리고 AWS IoT Core를 사용하는 디바이스들이 다음의 표준 통신 프로토콜을 사용하여 서로 상호작용을 할 수 있도록 지원합니다.

- [MQTT (Message Queuing and Telemetry Transport)](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html)
- [MQTT over WSS (Websockets Secure)](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html)
- [HTTPS (Hypertext Transfer Protocol - Secure)](https://docs.aws.amazon.com/iot/latest/developerguide/http.html)
- [LoRaWAN (Long Range Wide Area Network)](https://docs.aws.amazon.com/iot/latest/developerguide/connect-iot-lorawan.html)

이 글에서는 두번째 방식인 **MQTT over WebSocket** 방식으로 AWS IoT Core 서비스에 연결하는 것을 알아봅니다.

### MQTT 3.1.1
AWS IoT Core의 MQTT 메시지 브로커는 [MQTT v3.1.1 specification](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html)을 기반으로 구현되어있습니다. 그러나 몇가지 부분에 대해서 약간 다르다고 하는데 주요 사항은 다음과 같습니다.

- QoS(Quality of Service)는 0 또는 1 지원
- 클라이언트 ID 유일성
- 보관된 메시지 미지원

> 더 자세한 내용은 [AWS IoT differences from MQTT version 3.1.1 specification](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html#mqtt-differences)을 참고하세요.

### AWS IoT Device SDK for Java
AWS IoT 서비스에 연결하기위해서는 AWS CLI, AWS IoT API, AWS IoT Device SDK를 사용해야합니다. 여러 언어로 구현된 AWS IoT Device SDK 중에서 안타깝게 Go로 작성된 SDK는 없으므로 **AWS IoT Device SDK for Java** 를 사용합니다.

AWS IoT Device SDK는 버전 1과 버전 2가 있습니다. 회사에서는 버전 1을 사용하고 있지만 이 글에서는 **AWS IoT Device SDK for Java v2** 를 사용하여 AWS IoT 서비스에 연결해보도록 하겠습니다.

|Version 1|Version 2|
|---|---|
|[AWS SDK for Java](https://github.com/aws/aws-sdk-java)|[AWS SDK for Java 2.0](https://github.com/aws/aws-sdk-java-v2)|
|[AWS IoT Device SDK for Java](https://github.com/aws/aws-iot-device-sdk-java)|[AWS IoT Device SDK for Java v2](https://github.com/aws/aws-iot-device-sdk-java-v2)|

> 기존 SDK를 기준으로 사용하기 쉽도록 새로 작성한 SDK이기 때문에 더 편리합니다.

```groovy build.gradle
dependencies {
    implementation platform('software.amazon.awssdk:bom:2.17.13')
    implementation 'software.amazon.awssdk:cognitoidentity'
    implementation 'software.amazon.awssdk:lambda'
    implementation 'software.amazon.awssdk.iotdevicesdk:aws-iot-device-sdk:1.4.3'
}
```

> 회사에서는 모든 모듈을 포함하는 SDK를 사용하는데 필요한 SDK 모듈만 추가해서 사용하는게 좋아보입니다.  
> [SDK 모듈 목록](https://search.maven.org/search?q=g:software.amazon.awssdk)을 보면 이 글을 쓰는 기준으로 무려 **352개**가 포함됩니다.


## MQTT with AWS IoT Core
AWS Iot Core의 MQTT 클라이언트는 연결 방식에 따라 다음의 두가지 방식으로 나누어집니다.

|방식|설명|
|---|---|
|MQTT|X.509 인증서 기반 인증|
|MQTT over WebSocket|[서명 버전 4 (SIGv4)](https://docs.aws.amazon.com/ko_kr/general/latest/gr/signature-version-4.html) 자격 증명을 사용하여 인증|

회사에서는 서버 애플리케이션의 경우 텔레노어 커넥션(Telenor Connexion) 서비스에서 제공하는 자격 증명을 통해 **MQTT over WebSocket** 으로 연결하고 있으며 데이터를 수집하는 디바이스에서는 자격 증명을 외부로 공개할 수 없으므로 **X.509 인증서** 를 기반으로 연결합니다. 

### Amazon Cognito IdP
본 학습에서는 AWS IoT 서비스(MQTT 메시지 브로커)에 연결하기 위하여 **Amazon Cognito의 자격 증명 공급자(IdP)** 를 통해 AWS 서비스에 대해 인증합니다. 저는 텔레노어 커넥션에서 지원하는 플랫폼 서비스를 통해 **사용자 풀 아이디(User Pool ID)** 와 **자격 증명 풀 아이디(Identity Pool ID)** 를 제공받기 때문에 이 부분에 대해서는 다루지 않습니다.

> 추후에 Amazon Cognito를 직접 다루게된다면 사용자 풀과 자격 증명 풀 아이디를 발급하는 부분에 대해서 추가하겠습니다.

Amazon Cognito를 활용하여 **AWS 서비스에 인증하는 순서**는 다음과 같습니다.

1. 발급받은 자격 증명 풀 아이디로 Cogntio 자격 증명 풀에 인증하여 임시 자격 증명 발급
2. 등록된 사용자 풀 아이디로 Cognito 사용자 풀에 인증하여 JWT 토큰 발급
3. Cogntio 자격 증명 공급자에 인증된 사용자의 JWT 토큰을 로그인 맵에 설정
4. 인증된 사용자의 자격 증명 발급
5. Cognito 임시 자격 증명을 사용하여 AWS IoT 서비스에 연결

#### Identity Pool Credentials
먼저, CognitoIdentityClient로 자격 증명 풀 아이디와 리전에 대한 자격 증명 풀 크레덴셜을 발급합니다.

```java
private AwsSessionCredentials baseCredentials(String identityPoolId, Region region) {
    try (CognitoIdentityClient cognitoIdentityClient = CognitoIdentityClient.builder()
            .credentialsProvider(AnonymousCredentialsProvider.create())
            .region(region)
            .build()) {

        GetIdRequest getIdRequest = GetIdRequest.builder()
                .identityPoolId(identityPoolId)
                .build();

        String identityId = cognitoIdentityClient.getId(getIdRequest).identityId();
        GetCredentialsForIdentityRequest getCredentialsForIdentityRequest = GetCredentialsForIdentityRequest.builder()
                .identityId(identityId)
                .build();

        Credentials credentials = cognitoIdentityClient.getCredentialsForIdentity(getCredentialsForIdentityRequest).credentials();
        return AwsSessionCredentials.create(credentials.accessKeyId(), credentials.secretKey(), credentials.sessionToken());
    }
}
```

#### User Pool JWT Token 
발급된 크레덴셜으로 사용자 풀에 등록되어있는 사용자의 JWT 토큰을 조회하기 위하여 Lambda 함수를 호출합니다.

```java
@SuppressWarnings({"unchecked"})
private String jwt(AwsSessionCredentials awsSessionCredentials, Region region) {
    // https://docs.aws.amazon.com/code-samples/latest/catalog/javav2-lambda-src-main-java-com-example-lambda-LambdaInvoke.java.html
    try (LambdaClient lambdaClient = LambdaClient.builder()
            .credentialsProvider(StaticCredentialsProvider.create(awsSessionCredentials))
            .region(region)
            .build()) {

        InvokeRequest invokeRequest = InvokeRequest.builder()
                .functionName(authLambda)
                .payload(SdkBytes.fromString(gson.toJson(authLambdaPayload), StandardCharsets.UTF_8))
                .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        Map<String, Object> responsePayload = gson.fromJson(new String(invokeResponse.payload().asByteArray(), StandardCharsets.UTF_8),
                new TypeToken<HashMap<String, Object>>() {
                }.getType());

        return (String) ((Map<String, Object>) responsePayload.get("credentials")).get("token");
    }
}
```

#### Identity Provider with Logins
인증된 사용자의 JWT 토큰을 Cognito 자격 증명 공급자의 **Logins** 맵에 부여하여 크레덴셜을 발급합니다.

```java
private static final String COGNITO_IDENTITY_PROVIDER_URL = "cognito-idp.%s.amazonaws.com/%s";

private Credentials loginsCredentials(String identityPoolId, Region region, String userPoolId, String accessToken) {
    Map<String, String> logins = new HashMap<>();
    logins.put(String.format(COGNITO_IDENTITY_PROVIDER_URL, region.id(), userPoolId), accessToken);

    try (CognitoIdentityClient cognitoIdentityClient = CognitoIdentityClient.builder()
            .credentialsProvider(AnonymousCredentialsProvider.create())
            .region(region)
            .build()) {

        GetIdRequest getIdRequest = GetIdRequest.builder()
                .identityPoolId(identityPoolId)
                .logins(logins)
                .build();

        String identityId = cognitoIdentityClient.getId(getIdRequest).identityId();
        GetCredentialsForIdentityRequest getCredentialsForIdentityRequest = GetCredentialsForIdentityRequest.builder()
                .identityId(identityId)
                .logins(logins)
                .build();

        return cognitoIdentityClient.getCredentialsForIdentity(getCredentialsForIdentityRequest).credentials();
    }
}
```

> [Integrating a User Pool with an Identity Pool](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-integrating-user-pools-with-identity-pools.html#amazon-cognito-integrating-user-pools-with-identity-pools-using)

### Connenction using MqttClient
Amazon Cognito를 사용하여 AWS 서비스에 인증할 수 있는 크레덴셜을 발급했습니다. 이제 이 크레덴셜을 사용하여 MQTT 클라이언트로 AWS IoT의 MQTT 메시지 브로커에 연결할 수 있습니다. AWS IoT Device SDK에서는 AWSIotMqttClient로 연결할 수 있지만 **AWS IoT Device SDK v2**에서는 MqttClientConnection로 연결할 수 있습니다.

> SDK V2들은 C로 작성된 [AWS Common Runtime](https://docs.aws.amazon.com/sdkref/latest/guide/common-runtime.html) 기반하에 동작하게 됩니다.

MqttClientConnection는 자바 8의 CompletableFuture을 통해 비동기로 수행되어 다음과 같이 사용할 수 있습니다.

먼저, AwsIotMqttConnectionBuilder를 사용하여 크레덴셜을 기반으로 MqttClientConnection를 생성합니다.

```java
static MqttClientConnection build(String clientEndpoint, String clientId,
                                        String accessKeyId, String secretKey, String sessionToken, String region) throws UnsupportedEncodingException {
    try (EventLoopGroup eventLoopGroup = new EventLoopGroup(1);
            HostResolver resolver = new HostResolver(eventLoopGroup);
            ClientBootstrap clientBootstrap = new ClientBootstrap(eventLoopGroup, resolver);
            AwsIotMqttConnectionBuilder builder = AwsIotMqttConnectionBuilder.newDefaultBuilder()) {

        StaticCredentialsProvider credentialsProvider =
                new StaticCredentialsProvider.StaticCredentialsProviderBuilder()
                        .withAccessKeyId(accessKeyId.getBytes(StandardCharsets.UTF_8))
                        .withSecretAccessKey(secretKey.getBytes(StandardCharsets.UTF_8))
                        .withSessionToken(sessionToken.getBytes(StandardCharsets.UTF_8))
                        .build();

        return builder
                .withEndpoint(clientEndpoint)
                .withClientId(clientId)
                .withBootstrap(clientBootstrap)
                .withSocketOptions(new SocketOptions())
                .withWebsockets(true)
                .withWebsocketCredentialsProvider(credentialsProvider)
                .withWebsocketSigningRegion(region)
                .withConnectionEventCallbacks(clientConnectionEvents())
                .build();
    }
}
```

만들어진 MqttClientConnection는 자바 8의 CompletableFuture로 동작하므로 다음과 같이 비동기로 수행할 수 있습니다.

```java
@SuppressWarnings({"squid:S3740", "rawtypes", "unchecked"})
private void subscribe(Credentials credentials) {
    try {
        MqttClientConnection connection = build(clientEndpoint, clientId,
                credentials.accessKeyId(), credentials.secretKey(), credentials.sessionToken(), region.id());
        CompletableFuture<Boolean> connectFuture = connection.connect();
        connectFuture.get();

        ListenableFutureTask futureTask = new ListenableFutureTask(() ->
                connection.subscribe("thing-update/#", QualityOfService.AT_MOST_ONCE, handler -> {
                    String payload = new String(handler.getPayload(), StandardCharsets.UTF_8);
                    log.info("topic:{}, qos: {}", handler.getTopic(), handler.getQos());
                    log.trace("===> {}", payload);
                }));

        futureTask.run();
    } catch (UnsupportedEncodingException | ExecutionException e) {
        log.error(e.getMessage());
    } catch (InterruptedException e) {
        log.error(e.getMessage());
        Thread.currentThread().interrupt();
    }
}
```

> ListenableFutureTask는 스프링에서 지원하는 클래스입니다.

#### AWS IoT Client Endpoint
AWS IoT 엔드포인트는 [시만텍 CA 인증서를 신뢰하지 않음](distrust-symantec-ca-in-jdk) 문제가 발생하지 않도록 **ATS CA 인증서** 에서 서명한 인증서를 제공하는 ATS 엔드포인트로 설정합니다.

```properties application.properties
aws-iot.client.endpoint={ACCOUNT_SPECIFIC_PREFIX}-ats.iot.{REGION_ID}.amazonaws.com
aws-iot.client.id=
```

클라이언트 엔드포인트에 접근할 수 있는 인증된 사용자의 크레덴셜의 정보라면 메시지 페이로드가 구독된 것을 확인할 수 있습니다.

![](/images/posts/aws-iot-mqtt-subscribe.png)

이상으로 AWS IoT Device SDK Java로 MQTT 연결하기를 마칩니다. 감사합니다.














