---
title: Amazon SNS - FCM 모바일 푸시
date: 2024-07-07T18:00+09:00
tags:
- FCM
- SNS Mobile Push
---

PWA 앱에서 푸시 알림을 위해 FCM(Firebse Cloud Messaging)을 도입했다면 Amazon SNS의 모바일 푸시 알림으로 통합할 수 있다. Firebase Admin SDK 로도 쉽게 푸시 알림을 위한 메시지를 전송할 수 있지만 Amazon SNS에 등록된 플랫폼 애플리케이션을 통해 사용자 디바이스를 애플리케이션 앤드포인트로 관리하고 우리는 Amazon SNS에 등록된 플랫폼 엔드포인트를 통해 디바이스로 푸시 알림을 전달해보도록 하자.

#### 플랫폼 애플리케이션 생성 시 FCM 자격 증명 등록

![](/images/posts/amazon-sns-fcm-mobile-push/01.png)

FCM 푸시 알림 플랫픔을 사용하는 애플리케이션 생성 시 FCM 콘솔의 서비스 계정에서 발급받은 Firebase 서비스 계정의 비공개 키 정보를 등록해야 한다. Firebase Admin SDK 에서 사용중이었던 서비스 계정의 JSON 파일을 그대로 설정했다.

#### 애플리케이션 앤드포인트 생성 시 FCM 디바이스 토큰 등록

플랫폼 애플리케이션에서 메시지를 전달할 엔드포인트는 하나의 식별할 수 있는 디바이스라고 생각하면 된다. 디바이스 토큰은 [FCM 클라이언트 SDK로부터 디바이스 내에서 발급받은 토큰](https://firebase.google.com/docs/cloud-messaging/js/client?hl=ko#access_the_registration_token)을 입력하면 된다. 애플리케이션 엔드포인트 생성 후 메시지 게시를 통해 샘플 메시지를 전달해볼 수 있다.

```json
{
  "GCM": "{ \"data\": { \"title\": \"Hi!\", \"body\": \"Mambo?!\" } }"
}
```

> Amazon SNS의 모바일 푸시 알림에서 FCM을 위한 메시지는 GCM 이라는 키로 사용합니다.

![](/images/posts/amazon-sns-fcm-mobile-push/02.png)

#### Amazon SNS SDK for Java V2로 메시지 게시

웹 콘솔을 통해 FCM 메시지가 디바이스로 푸시 알림이 되었음을 확인했다면 Amazon SDK for Java v2를 사용해서 프로그래밍 방식으로 메시지를 전송해보도록 하자. 먼저, 아래와 같이 모바일 푸시 API를 사용하기 위한 Amazon SDK for Java v2 의존성을 추가하도록 하자.

```groovy
dependencies {
    implementation platform('software.amazon.awssdk:bom:2.26.16')
    implementation 'software.amazon.awssdk:sns'
}
```

의존성을 추가했다면 [모바일 푸시 API](https://docs.aws.amazon.com/ko_kr/sns/latest/dg/mobile-push-api.html) 중 CreatePlatformEndpoint와 Publish를 사용해서 메시지를 게시하는 샘플 코드를 만들어볼 수 있다. 

```java
@Test
void send() {
    try (SnsClient snsClient = SnsClient.builder()
            .credentialsProvider(ProfileCredentialsProvider.create())
            .region(Region.AP_NORTHEAST_2)
            .build()) {

        Assertions.assertDoesNotThrow(() -> {
            String platformApplicationArn = "";
            String fcmDeviceToken = "";
            String endpointArn = snsClient.createPlatformEndpoint(CreatePlatformEndpointRequest.builder()
                    .platformApplicationArn(platformApplicationArn)
                    .token(fcmDeviceToken)
                    .build()).endpointArn();

            Gson gson = new GsonBuilder().create();
            String fcmMessage = gson.toJson(Map.of("data", Map.of("title", "Hi!", "body", "Mambo?!")));
            String messageId = snsClient.publish(PublishRequest.builder()
                    .messageStructure("json")
                    .message(gson.toJson(Map.of("GCM", fcmMessage)))
                    .targetArn(endpointArn)
                    .build()).messageId();

            log.info("messageId: {}", messageId);
            Assertions.assertNotNull(messageId);


        });
    }
}
```

> 위 예제코드에서 메시지의 GCM 이 이스케이프된 JSON 문자열로 구성되어야함을 주의해야합니다.

![PWA 앱에서의 푸시 알림 예시](/images/posts/amazon-sns-fcm-mobile-push/03.png)
