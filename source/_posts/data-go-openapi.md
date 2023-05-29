---
title: 공공데이터포털 오픈 API는 웹 개발자를 괴롭혀(feat. XML)
date: 2023-05-29
---

공공데이터포털의 오픈 API는 많은 웹 서비스나 시스템에서 활용할 수 있는 데이터를 제공하고 있어서 웹 개발자들에게 필수적으로 연동을 요구하는 인터페이스이다. 많은 기업에서 오픈 API를 활용해야하기 때문에 수 많은 웹 개발자가 오픈 API에 대한 연동 오류 때문에 힘들어했다. 지금은 인증키 문제를 해결하고자 URL 인코딩된 키와 원본을 구별해서 제공하기 때문에 OpenAPI 활용 자체는 어려움이 없다고 생각이 된다. 만약, 스프링 프레임워크를 사용하고 있는 개발자라면 인코딩되지 않은 인증키(Decoding)을 복사하여 사용하면 된다. 

![](/images/posts/data-go-openapi/01.png)

하지만, 공공데이터포털의 오픈 API가 웹 개발자들을 괴롭히는 문제는 생각보다 많은데 함께 알아보도록 하자.

#### 간헐적 SERVICE_KEY_IS_NOT_REGISTERED_ERROR 오류
![](/images/posts/data-go-openapi/02.png)

공공데이터 포털의 자주하는 질문 중 서비스 오류에 대한 내용으로 SERVICE_KEY_IS_NOT_REGISTERED_ERROR 오류에 대한 원인을 간단하게 소개하고 있다. 잘못된 인증키를 넣어서 호출하였거나 인증 기관 서버로 동기화되지 않아서 발생한다고 되어있다. 하지만, 위에서 확인할 수 있듯이 내가 사용하는 인증키 자체는 오래전에 발급한 것으로 (보안 상 문제가 되는 건 넘어가도록 하자...) 동기화되지 않았을 가능성은 지극히 적다. 해당 인증키를 사용하여 정상적으로 OpenAPI를 호출할 수 있었음에도 불구하고 몇 초 만에 인증키가 올바르지 않다는 SERVICE_KEY_IS_NOT_REGISTERED_ERROR 오류가 간헐적으로 발생하기도 한다.

#### 통일되지 않은 오픈 API 참고 문서
오픈 API에 대한 참고 문서의 형식을 강제하지 않는 결과로 많은 기업에서 사용하지 않는 확장자인 .hwp로 작성되어 공유되는 경우가 많다. 그로 인해 웹 개발자들은 한글 문서를 사용하지 않음에도 불구하고 한글 문서를 열 수 있는 뷰어를 설치해야만 한다. 공공데이터포털의 오픈 API 중에는 Swagger UI 기반의 OpenAPI 명세서를 제공하기도 한다.

![](/images/posts/data-go-openapi/03.png)

#### 해외 아이피 요청 제한
공공데이터포털에서 제공하는 모든 오픈 API에 해당하는 문제는 아니지만 오픈 API 중 보안 상 국내 아이피 대역이 아닌 해외 아이피에서 호출하는 것이 웹 방화벽으로 막혀져있는 경우도 있다. 대표적으로 [한국전력거래소에서 제공하는 오픈 API](https://www.data.go.kr/data/15056640/openapi.do)로 참고 문서에 나와있지 않은 내용이지만 공공데이터포털의 게이트웨이 방식이 아닌 KPX에서 관리하는 서버로 요청되기 때문에 AWS와 같은 클라우드 환경에서 호출할 수 없고 `국내 서비스로 우회`하거나 사용중인 아이피 대역을 전달하여 `방화벽 해제 신청`을 해야한다. 

#### 게이트웨이 방식 오픈 API
![](/images/posts/data-go-openapi/04.png)

공공데이터포털의 게이트방식 오픈 API는 엔드포인트가 `apis.data.go.kr`와 같이 구성되며 위에서 확인할 수 있듯이 게이트웨이에서 문제가 발생하면 오픈 API가 JSON 타입의 응답 결과를 지원하더라도 XML로만 출력된다는 제약사항이 있다. 이러한 제약사항을 고려하지 않고 응답결과를 JSON으로 오해하고 코드를 작성한다면 아래와 같이 오류가 발생할 수 있다. 심지어 HTTP 응답 코드는 200인데 응답 내용에 오류 여부로 내려온다.

```java
Unexpected exception thrown: net.minidev.json.parser.ParseException: Unexpected token <OpenAPI_ServiceResponse>
	<cmmMsgHeader>
		<errMsg>SERVICE ERROR</errMsg>
		<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
		<returnReasonCode>30</returnReasonCode>
	</cmmMsgHeader>
</OpenAPI_ServiceResponse> at position 229.
```

따라서, 공공데이터포털에 대한 연동을 하는 경우 웹 개발자는 아래에 대해 고려 또는 대응을 해야한다.

1. 게이트웨이 방식 API 확인
2. API 호출 제한 제약 확인
3. JSON 과 XML 처리 모두 고려
4. 간헐적 인증키 오류 케이스 대응 (API 점검 포함)



