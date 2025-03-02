---
title: AWS IoT Core
date: 2025-03-01T20:00+09:00
tags:
- IoT
- SDK
- v2
---

[AWS IoT Core](https://aws.amazon.com/ko/iot-core/)는 스마트 홈 또는 공장, 에너지 시스템에서 발생하는 다양한 시계열 데이터를 수집할 수 있는 방법을 지원하는 IoT 디바이스 관리형 서비스입니다. 기존 디바이스 연동을 위한 AWS IoT Core 관련 기능은 `AWS SDK for Java v1` 버전으로 작성되어 있기 때문에 [v1 버전 지원 종료](https://aws.amazon.com/ko/blogs/developer/announcing-end-of-support-for-aws-sdk-for-java-v1-x-on-december-31-2025/) 예정으로 인해 [AWS SDK for Java 2.x](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/get-started.html) 로 조금씩 마이그레이션 해야합니다. 따라서, AWS IoT Core에 대해 알아보면서 `AWS SDK for Java 2.x` 기반의 코드를 작성해보려고 합니다. 본 글에서는 IoT 디바이스 입장에서 AWS IoT 엔드포인트로의 연결을 수행하는 것이 아닌 시스템에서 IoT 디바이스를 위한 인증서를 발급하기 위한 일련의 과정을 알아봅니다.

#### 테스트를 위한 IAM 사용자 생성

먼저, AWS IoT Core에 대한 테스트를 위해 [AWSIoTFullAccess](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSIoTFullAccess.html) 권한 정책을 가지는 사용자를 만들고 AWS CLI 또는 로컬 코드에서 사용하기 위해 액세스 키를 발급합니다. 인텔리제이의 `AWS Toolkit 플러그인의 Open AWS Local Terminal` 을 사용하면 선택한 AWS 프로파일(AWS_PROFILE)이 환경변수로 적용된 터미널을 열 수 있습니다.

![](/images/posts/aws-iot-core/01.png)

#### AWS IoT Core 엔드포인트

AWS IoT Core의 엔드포인트는 컨트롤 플레인과 데이터 영역을 위한 엔드포인트로 구분되어 사용되는데 AWS 클라우드로 데이터를 전송해야하는 IoT 디바이스는 `iot:Data-ATS` 엔드포인트에 X.509 클라이언트 인증서로 인증을 수행하고 연결하게 됩니다. iot:Data-ATS 에서 ATS는 [Amazon Trust Services](https://www.amazontrust.com/repository/)를 의미합니다.

```powershell Terminal
PS> aws iot describe-endpoint --endpoint-type iot:Data-ATS
{
    "endpointAddress": "[account-specific-prefix]-ats.iot.ap-northeast-2.amazonaws.com"
}
```

#### X.509 클라이언트 인증서에 대한 CA 인증서

AWS 에서 발급해주는 X.509 클라이언트 인증서는 Amazon Trust Services로 [교차 검증되는 루트 CA 인증서](https://docs.aws.amazon.com/iot/latest/developerguide/server-authentication.html#server-authentication-certs)로 서명되어 발급됩니다. 대부분 루트 CA 인증서가 필요없지만 CA 인증서가 필요한 IoT 디바이스 환경이 있을 수 있으므로 이에 대한 [서버 인증 가이드](https://docs.aws.amazon.com/iot/latest/developerguide/server-authentication.html#server-authentication-guidelines)는 알아둘 필요가 있습니다. 웹 콘솔의 도메인 구성에서 데이터 ATS 엔드포인트에서 사용중인 [보안 정책도 확인](https://docs.aws.amazon.com/iot/latest/developerguide/transport-security.html#tls-policy-table)해보면 좋습니다.

#### Data-ATS 엔드포인트에 연결하기 위한 X.509 인증서 발급

`CreateKeysAndCertificate` 명령으로 2048 비트 길이의 RSA 키 페어와 X.509 클라이언트 인증서를 생성할 수 있습니다. 이때, `setAsActive` 파라미터로 `비활성화 상태인 인증서`를 만들 수 있으므로 사물에 인증서를 연결하고나서 실제로 IoT 디바이스에서 인증을 수행하기 전에 시스템 화면을 통해 인증서 상태를 활성화할 수 있도록 제공하는게 보안 상 더 좋을 순 있겠네요.

```
aws iot create-keys-and-certificate --no-set-as-active --certificate-pem-outfile cert.pem --public-key-outfile pub.key --private-key-outfile priv.key
{
   "certificateArn": "The ARN of the certificate",
   "certificateId": "The ID of the certificate",
   "certificatePem": "The certificate data, in PEM format.",
   "keyPair": { 
      "PrivateKey": "The private key",
      "PublicKey": "The public key"
   }
}
```

#### IoT 레지스트리 사물 유형 • 사물 생성

디바이스에 대한 사물 유형을 생성하고 사물 유형과 함께 사물을 등록합니다. 사물 유형이 설정된 사물은 [속성을 3개 이상 지정](https://aws.amazon.com/ko/blogs/iot/how-to-improve-device-discoverability-by-unlocking-50-aws-iot-thing-type-attributes/)할 수 있으므로 `사물과 사물 유형을 함께 생성`하는 것이 좋습니다. [CreateThingType](https://docs.aws.amazon.com/iot/latest/apireference/API_CreateThingType.html) 명령으로 사물 유형을 생성할 수 있고 [CreateThing](https://docs.aws.amazon.com/iot/latest/apireference/API_CreateThing.html) 명령을 호출할 때 사물 유형을 함께 지정할 수 있습니다.

```powershell Terminal
PS> aws iot create-thing-type --thing-type-name Computer
{
    "thingTypeName": "Computer",
    "thingTypeArn": "arn:aws:iot:ap-northeast-2:[account-id]:thingtype/Computer",
    "thingTypeId": "5c6a1c6c-93e6-4d57-82d3-047f1c267ea6"
}

PS> aws iot create-thing --thing-name PC --thing-type-name Computer
{
    "thingName": "PC",
    "thingArn": "arn:aws:iot:ap-northeast-2:[account-id]:thing/PC",
    "thingId": "2439524c-278c-486d-b74b-1af1acc8fd63"
}
```

> 생성된 사물 이름은 변경할 수 없으므로 사물을 생성할 때에는 디바이스에 대해 UUID와 같은 별도의 식별자를 발급하고 생성하는 것이 좋습니다. 

#### 사물에 X.509 클라이언트 인증서 주체 등록

X.509 인증서를 사물에 연결할 때에는 보안 상 사물과 인증서 간 관계를 유일하게 유지하여 독점하도록 구성하는게 좋다고 하나 스마트 홈이나 공장처럼 하나의 시스템을 구성하는 디바이스가 여러개인 경우 사이트에 대한 인증서를 서로 다른 디바이스의 사물이 공유할 수도 있습니다. 따라서, 인증서 관리 기준에 대한 부분은 시스템 목적에 따라 선택하면 됩니다. [AttachThingPrincipal](https://docs.aws.amazon.com/iot/latest/apireference/API_AttachThingPrincipal.html) 명령을 호출할 때 `thingPrincipalType`을 EXCLUSIVE_THING로 지정하면 인증서는 사물에 유일한 인증서로 활용되는 것으로 지정되어 이 인증서를 다른 사물을 위한 보안 주체로 등록할 수 없습니다.

```powershell Terminal
PS> aws iot create-keys-and-certificate 
{
    "certificateArn": "arn:aws:iot:ap-northeast-2:[account-id]:cert/8f8538927603f4dfe5fb374fc383211a966cc6f74a1ba70121ef185f9cdf67f3",
    "certificateId": "8f8538927603f4dfe5fb374fc383211a966cc6f74a1ba70121ef185f9cdf67f3",
    ...
}

PS> aws iot attach-thing-principal --thing-name PC --principal arn:aws:iot:ap-northeast-2:[account-id]:cert/8f8538927603f4dfe5fb374fc383211a966cc6f74a1ba70121ef185f9cdf67f3
```

> 사물에 대한 보안 주체는 Amazon Cognito ID 또는 X.509 인증서가 되며 위 경우 인증서 ARN을 보안 주체로 입력해야 합니다.

#### 사물에 등록된 인증서 해제 및 회수

보안적인 이슈 또는 주기적인 관리 일정에 의하여 사물에 연결된 인증서를 교체를 위해 기존 인증서를 회수하려면 [DetachThingPrincipal](https://docs.aws.amazon.com/iot/latest/apireference/API_DetachThingPrincipal.html) 명령을 수행하여 사물에 연결된 인증서를 먼저 해제합니다. 그리고나서 [UpdateCertificate](https://docs.aws.amazon.com/ko_kr/iot/latest/developerguide/revoke-ca-cert.html#revoke-device-cert-cli) 명령으로 인증서의 상태를 `취소(REVOKED)`로 변경하면 됩니다.

```powershell Terminal
PS> aws iot update-certificate --certificate-id 8f8538927603f4dfe5fb374fc383211a966cc6f74a1ba70121ef185f9cdf67f3 --new-status REVOKED
```

#### AWS IoT SDK v2 기반 예제 코드

AWS IoT 디바이스를 위한 일련의 과정을 [AWS IoT examples using AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli_iot_code_examples.html)를 참고하여 정리해보았습니다. 이번에는 [AWS IoT SDK for Java 2.x를 사용한 예제](https://docs.aws.amazon.com/ko_kr/sdk-for-java/latest/developer-guide/java_iot_code_examples.html)를 참고해서 AWS IoT SDK for Java 2.x 기반의 코드를 작성해보도록 하겠습니다. 예제 코드는 [kdevkr/aws-iot-core-demo](https://github.com/kdevkr/aws-iot-core-demo)에서 확인할 수 있습니다.

![](/images/posts/aws-iot-core/02.png)

먼저, 예제 코드에서 IotClient 인스턴스를 생성할 때 `ProfileCredentialsProvider` 를 사용하여 [iot-core 프로파일을 직접 설정](https://docs.aws.amazon.com/ko_kr/sdk-for-java/latest/developer-guide/credentials-profiles.html)할 수 있지만 프로덕션 기준에서는 크레덴셜 프로바이더 체인 방식으로 다양한 방법으로 크레덴셜을 조회해서 사용할 수 있도록 하는 것이 좋습니다.  인텔리제이의 Run Configuration 에서 환경 변수에 AWS_PROFILE을 설정하면 `iot-core` 프로파일을 쉽게 적용할 수 있습니다.  [AWS Toolkit for IntelliJ IDEA](https://aws.amazon.com/ko/intellij/) 플러그인으로 `AWS Connection` 설정으로 애플리케이션 환경에 맞는 [IAM 프로파일로 실행](https://docs.aws.amazon.com/ko_kr/toolkit-for-jetbrains/latest/userguide/setup-credentials.html)하고 있는데 윈도우에서는 선택한 프로파일이 반영되지 않는 문제가 확인되어 `AWS_PROFILE` 환경 변수를 사용했습니다.

#### IoT 디바이스 인증서 보안 정책

IoT 디바이스에 IAM 권한 정책처럼 별도로 제공하는 [AWS IoT Core Policy](https://docs.aws.amazon.com/iot/latest/developerguide/iot-policies.html)을 설정하여 MQTT 연결부터 메시지 송수신 등에 대한 보안 정책을 수립할 수 있습니다. 예를 들어, 사물에 연결된 X.509 인증서를 사용하는 IoT 디바이스가 [올바른 클라이언트 아이디로 연결을 할 수 있게 제한](https://docs.aws.amazon.com/iot/latest/developerguide/basic-policy-variables.html#basic-policy-variables-example)하거나 허용된 아이피 대역에서 접근할 수 있도록 제한할 수 있습니다.

- aws:SourceIp - 메시지 브로커에 연결되는 클라이언트 아이피에 대한 정책 변수
- iot:ClientId - MQTT 클라이언트 아이디에 대한 정책 변수
- iot:CertificateId - X.509 인증서에 대한 정책 변수
- [IoT Core 작업 리소스의 Amazon Resource Names (ARNs)](https://docs.aws.amazon.com/iot/latest/developerguide/iot-action-resources.html)

#### IoT 디바이스 연결 상태

![](/images/posts/aws-iot-core/03.png)

AWS IoT 플릿 인덱싱(Fleet Indexing)에서 `사물 연결에 대한 인덱싱을 활성화`하면 IoT 디바이스의 개별 연결 상태를 [GetThingConnectivityData](https://docs.aws.amazon.com/iot/latest/apireference/API_GetThingConnectivityData.html) 명령으로 확인할 수 있습니다. 다음은 사물을 만들고 나서 연결을 시도한 적이 없는 경우의 상태를 보여주는데 만약, 디바이스 플릿 인덱싱을 활성화하지 않은 상태라면 [AWS_Things 인덱스](https://docs.aws.amazon.com/iot/latest/developerguide/managing-fleet-index.html?icmpid=docs_iot_hp_settings)를 찾을 수 없는 오류가 발생합니다. 또한, AWS CLI 에 `get-thing-connectivity-data` 하위 명령이 없는 경우 2.23 이상의 버전으로 업데이트 하세요.

```sh
PS> aws iot get-thing-connectivity-data --thing-name PC
{
    "thingName": "PC",
    "connected": false,
    "timestamp": "1970-01-01T09:00:00+09:00",
    "disconnectReason": "UNKNOWN"
}
```

다음에는 IoT 디바이스 입장에서 [AWS IoT Device SDK for Java v2](https://github.com/aws/aws-iot-device-sdk-java-v2)를 알아보도록 하겠습니다.