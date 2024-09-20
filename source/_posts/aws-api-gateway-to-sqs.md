---
title: API Gateway와 SQS로 콜백 결과 처리하기
date: 2024-09-20T20:00+09:00
tags:
- Amazon API Gateway
- Amazon SQS
toc:
  enable: false
---

Amazon API Gateway는 REST API를 쉽게 만들 수 있는 서비스로 애플리케이션 서버를 별도로 작성하지 않아도 Lambda 함수 또는 AWS 서비스와 통합할 수 있는 기능을 제공하고 있다. [Amazon API Gateway와 Amazon SQS 서비스를 사용]((https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/integrate-amazon-api-gateway-with-amazon-sqs-to-handle-asynchronous-rest-apis.html))해 외부 시스템으로부터 전달되는 콜백 결과를 수신하고 SQS 대기열에 메시지로 연동하는 구성을 만들 수 있다. 예를 들어, [Bizppurio API](https://biztech.gitbook.io/webapi/api/undefined/dispatch-result)를 통해 카카오 알림톡 메시지를 발송하는 경우 발송 결과를 사전에 등록한 URL로 비동기로 콜백해주는 방식을 제공해주고 있는데 이 발송 결과를 수신하여 비동기 대기열로 등록해두고 애플리케이션 서버에서 스케줄에 의해 처리할 수 있다. 애플리케이션 서버가 발송 결과를 그대로 받는 경우 애플리케이션 서버가 배포되는 과정에서는 일부 발송 결과가 유실될 수 있는 문제를 내재하게 된다.

#### Amazon API Gateway REST API

**REST API**는 HTTP API와 다르게 [요청에 대한 검증](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-method-request-validation.html) 또는 [리소스 정책에 의한 트래픽 제한](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-resource-policies.html) 등 여러가지 부분을 설정할 수 있도록 제공하고 있다. 또한, [요청 페이로드를 변환](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-data-transformations.html)할 수 있으므로 SQS 메시지를 등록하기 위해서는 REST API로 만들어야 한다. 아래와 같이 AWS 서비스 통합으로 `Simple Queue Service`를 선택하고 **경로 재정의**를 선택하여 SQS 대기열을 입력하면 된다. 실행 역할은 SQS 대기열에 메시지를 보낼 수 있도록 `SQS:SendMessage` 권한이 포함된 **IAM Role의 ARN**을 입력하면 된다.

![](/images/posts/aws-api-gateway-to-sqs/02.png)

#### Amazon SQS 대기열에 대한 액세스 정책

Amazon API Gateway에 대한 IAM Role에 **AmazonSQSFullAccess** 정책을 연결해도 되지만 아래와 같이 SQS 대기열의 액세스 정책에 IAM Role이 권한을 가지도록 설정할 수 있다. 실행 역할에 입력한 ARN이 SQS 대기열에 대한 권한을 보유하고 있지 않은 경우 **Access Denied** 응답을 받게 된다.

![](/images/posts/aws-api-gateway-to-sqs/05.png)

#### 메서드 요청 설정하기 (Optional)

REST API는 메서드 요청 설정을 통해 요청 헤더와 본문에 대한 검증을 수행할 수 있다. 요청 검사기에 **쿼리 문자열 파라미터 및 헤더 검증**을 선택하고 아래와 같이 Content-Type 헤더 유무와 요청 페이로드에 대한 모델 스키마를 만들어서 지정할 수 있다. [REST API에 대한 데이터 모델](https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/models-mappings-models.html)은 **JSON 스키마 드래프트 4**로 정의할 수 있다.

![](/images/posts/aws-api-gateway-to-sqs/01.png)

#### 통합 요청 설정하기

REST API의 통합 요청 설정에서는 콜백 결과로 포함되는 요청 페이로드를 SQS 메시지로 전달할 수 있도록 `Content-Type: application/x-www-form-urlencoded` 로 변경하고 매핑 템플릿에 **SendMessage와 MessageBody**를 구성하여 SQS 메시지로 전달되도록 설정해야한다.

![](/images/posts/aws-api-gateway-to-sqs/03.png)

#### 통합 응답 설정하기 (Optional)

통합 응답 설정이 반드시 필요하지는 않지만 **SQS 메시지 등록 시 전달되는 결과를 응답하지 않도록 설정**할 수 있다. 비즈뿌리오에서 알림톡 발송 결과를 콜백으로 전달해줄때 응답 페이로드를 확인하지 않을것이므로 아래와 같이 빈 응답으로 변경할 수 있다. 만약, 빈 응답으로 변경하고 싶다면 통합 응답을 설정하기 이전에 메서드 응답에 **200에 대한 상태 코드를 추가**해야한다.

![](/images/posts/aws-api-gateway-to-sqs/04.png)

---

# 트러블슈팅 🔥

Amazon API Gateway와 Amazon SQS 연동 구성 시 발생할 수 있는 오류에 대해서 알아보도록 하자. [REST API를 Amazon SQS와 통합하고 일반적인 오류를 해결하려면 어떻게 해야 하나요?](https://repost.aws/ko/knowledge-center/api-gateway-rest-api-sqs-errors)에 일부 오류에 대한 해결 방안이 정리되어있다.

#### UnknownOperationException

```sh
Thu Sep 19 09:44:10 UTC 2024 : Received response. Status: 404, Integration latency: 2 ms
Thu Sep 19 09:44:10 UTC 2024 : Endpoint response body before transformations: <UnknownOperationException/>
```

- Content-Type 을 application/x-www-form-urlencoded 로 입력하지 않은 경우
- 매핑 템플릿에 Action=SendMessage를 포함하지 않은 경우

#### AccessDenied

```sh
{"Error":{"Code":"AccessDenied","Message":"Access to the resource https://sqs.ap-northeast-2.amazonaws.com/xxxxxxxx/kakao-at-result is denied.","Type":"Sender"},"RequestId":"aba6b507-a4c5-512c-a55f-ea625778d5ff"}
```

- 실행 역할의 IAM Role이 SQS 대기열에 대한 권한이 없는 경우
- 요청 본문에 특수 문자가 포함되어있는데 `$util.urlEncode` 를 사용하지 않은 경우

#### Nginx 에서 API Gateway 로 트래픽 미러 시 오류

```sh
no resolver defined to resolve xxxxxx.execute-api.ap-northeast-2.amazonaws.com
xxxxxx.execute-api.ap-northeast-2.amazonaws.com could not be resolved (110: Operation timed out) while sending to client
```

Amazon API Gateway 에서 사용자 정의 도메인을 구성하기 이전에 기존에 콜백 결과를 수신하던 것을 API Gateway의 스테이지 URL을 통해 발송 결과를 전달되도록 테스트하기 위해서 **Nginx의 트래픽 미러링을 구성하고자 했을때 도메인을 찾을 수 없는 오류**를 경험했다. 이에 대해서 찾아보니 내부 DNS 가 아닌 클라우드플레어 또는 구글 DNS로 지정하면 해결 가능하다.

```sh
location = /mirror_api_gw {
  internal;
  resolver 1.1.1.1 8.8.8.8 valid=10s;
  proxy_pass https://xxxxxx.execute-api.ap-northeast-2.amazonaws.com/dev$request_uri;
}
```
