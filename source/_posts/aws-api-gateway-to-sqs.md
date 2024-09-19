---
title: API Gateway와 SQS로 콜백 결과 처리하기
date: 2024-09-20T00:00+09:00
tags:
- Amazon API Gateway
- Amazon SQS
---

[Bizppurio API](https://biztech.gitbook.io/webapi/api/undefined/dispatch-result)를 통해 알림톡 메시지를 발송하는 경우 발송 결과를 사전에 등록한 URL로 비동기로 콜백해준다. [Integrate Amazon API Gateway with Amazon SQS to handle asynchronous REST APIs](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/integrate-amazon-api-gateway-with-amazon-sqs-to-handle-asynchronous-rest-apis.html)를 참고하면 알림톡 결과를 전달받기 위한 REST API를 만들어서 요청 페이로드를 SQS 대기열 메시지로 전달하여 처리할 수 있는 시스템을 만들 수 있다.

#### Amazon API Gateway REST API

먼저 Amazon API Gateway에서 [REST API](https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/rest-api-develop.html)를 생성하고 콜백 URL에 대한 리소스를 추가하자. 리소스 추가 시 하위 경로를 추가해서 구성할 수 있다. 원하는 리소스 경로를 만들었다면 요청을 처리할 메서드를 만들면 된다. 아래의 이미지에서 경로 재정의에 SQS 대기열과 실행 역할에 IAM Role을 올바르게 지정하는 것이 중요하다.

![](/images/posts/aws-api-gateway-to-sqs/02.png)

#### Amazon SQS 대기열의 액세스 정책으로 API Gateway IAM Role을 추가

API Gateway에 대한 IAM Role에 AmazonSQSFullAccess 정책이 없다면 아래와 같이 SQS 대기열에 대한 액세스 정책에 IAM Role을 추가해도 된다. API Gateway에 대한 테스트 시 AccessDenied 응답을 받는다면 SQS 대기열 권한이 올바르게 되어있는지 확인하자.

![](/images/posts/aws-api-gateway-to-sqs/05.png)

#### 메서드 요청 설정하기 (Optional)

메서드 요청 설정에서는 요청 헤더 또는 본문에 대한 검증을 수행하도록 선택할 수 있다. 예를 들어, 요청 검사기에 **쿼리 문자열 파라미터 및 헤더 검증**을 선택하고 아래와 같이 Content-Type 헤더와 요청 페이로드에 대한 모델 스키마를 만들어서 지정할 수 있다.

![](/images/posts/aws-api-gateway-to-sqs/01.png)

#### 통합 요청 설정하기

통합 요청 설정에서 요청 본문으로 포함되어있는 데이터를 SQS 메시지로 전달하기 위해서는 Content-Type을 application/x-www-form-urlencoded로 변경하고 매핑 템플릿의 내용을 아래와 같이 Action 과 MessageBody를 쿼리-스트링 형태로 입력해야한다.

![](/images/posts/aws-api-gateway-to-sqs/03.png)

#### 통합 요청 설정 시 오류 🔥

[REST API를 Amazon SQS와 통합하고 일반적인 오류를 해결하려면 어떻게 해야 하나요?](https://repost.aws/ko/knowledge-center/api-gateway-rest-api-sqs-errors)에 통합 요청 설정 시 오류에 대한 해결 방안이 정리되어있다.

##### UnknownOperationException

```sh
Thu Sep 19 09:44:10 UTC 2024 : Received response. Status: 404, Integration latency: 2 ms
Thu Sep 19 09:44:10 UTC 2024 : Endpoint response body before transformations: <UnknownOperationException/>
```

- Content-Type 을 application/x-www-form-urlencoded 로 입력하지 않은 경우
- 매핑 템플릿에 Action=SendMessage를 포함하지 않은 경우

##### AccessDenied

```sh
{"Error":{"Code":"AccessDenied","Message":"Access to the resource https://sqs.ap-northeast-2.amazonaws.com/xxxxxxxx/kakao-at-result is denied.","Type":"Sender"},"RequestId":"aba6b507-a4c5-512c-a55f-ea625778d5ff"}
```

- 실행 역할의 IAM Role이 SQS 대기열에 대한 권한이 없는 경우
- 요청 본문에 특수 문자가 포함되어있는데 `$util.urlEncode` 를 사용하지 않은 경우

#### 통합 응답 설정하기 (Optional)

통합 응답 설정에서 SQS 메시지 등록에 대한 응답을 하지 않도록 설정할 수 있다. 비즈뿌리오에서 알림톡 발송 결과를 콜백으로 전달해줄때 응답 페이로드를 확인하지 않으므로 아래와 같이 빈 응답으로 변경할 수 있다. 참고로, 200 상태 코드에 대한 매핑을 수정하기 위해서는 메서드 응답에 200 상태 코드를 추가해야한다.

![](/images/posts/aws-api-gateway-to-sqs/04.png)

---

#### Nginx 에서 API Gateway 로 트래픽 복제 시 오류 🔥

```sh
no resolver defined to resolve xxxxxx.execute-api.ap-northeast-2.amazonaws.com
xxxxxx.execute-api.ap-northeast-2.amazonaws.com could not be resolved (110: Operation timed out) while sending to client
```

API Gateway의 커스텀 도메인으로 이관하기 이전에 기존에 푸시 결과를 전달받고 있던 사내 서버의 Nginx 에서 API Gateway 엔드포인트로 트래픽을 복제하려는 경우 위와 같이 API Gateway에 대한 도메인을 찾을 수 없는 문제가 있었다. 이 경우 내부 DNS 가 아닌 클라우드플레어 또는 구글 DNS로 지정하면 해결 가능하더라.

```sh
location = /mirror_api_gw {
  internal;
  resolver 1.1.1.1 8.8.8.8 valid=10s;
  proxy_pass https://xxxxxx.execute-api.ap-northeast-2.amazonaws.com/dev$request_uri;
}
```
