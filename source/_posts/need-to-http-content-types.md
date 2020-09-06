---
title: HTTP Content-Type을 이해합시다
date: 2018-12-13
---

## 들어가며
HTTP는 하이퍼텍스트 통신 프로토콜으로써 서버와 클라이언트가 서로 통신하기 위하여 요청과 응답을 받는 구조입니다. 이때 클라이언트가 서버에게 원하는 것을 요청할 때 보내는 데이터 유형에 따라서 어떻게 보내야하는지 알아봅니다.

## HTTP Content-Type
초보 개발자가 HTTP 요청 시 자주 실수하는 부분 중 하나가 HTTP Content-Type 이라고 생각합니다. 대부분의 경우 제대로 데이터를 보내고 있는데 서버에서 보낸 데이터를 확인할 수 없어요라고 합니다. 이 원인을 파악하기 위해서는 HTTP 요청시 데이터와 함께 보내는 Reuqest Header에 데이터의 유형을 가리키는 중요한 속성인 `Context-Type`을 확인해야합니다.

### Content-Type 헤더 유형
REST 클라이언트 앱인 `Postman`을 살펴보면 다음과 같이 지정할 수 있는 `Content-Type` 유형을 확인할 수 있습니다.

![](/images/postman-content-type.png)

Content-Type은 이외에도 많은 유형을 지정할 수 있습니다만, 우리가 주로 사용하는 유형에 대해 살펴보도록 하겠습니다.

- x-www-form-urlencoded
- multipart/form-data
- application/json


대부분의 초보 개발자들은 `x-www-form-urlencoded`와 `application/json`과 함께 데이터를 포함하여 보내는 것에 대해 이해하고 있지 않습니다. x-www-form-urlencoded는 데이터를 URL에 포함하여 보내는 방식이며 application/json은 요청 바디에 데이터를 포함하여 보내는 방식입니다.

#### x-www-form-urlencoded
다음은 모질라 웹 레퍼런스 문서에서 제공하는 `x-www-form-urlencoded`를 `Content-Type` 헤더로 명시하여 전송하는 페이로드 예시입니다.

```html
POST / HTTP/1.1
Host: foo.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 13

say=Hi&to=Mom
```

`say=Hi&to=Mom`가 위 요청에 대한 페이로드입니다. 이 페이로드는 키와 값을 `=`와 함께 표현하고 `&`의 묶음으로 표현하게 됩니다.

따라서, Axios로 x-www-form-urlencoded 데이터 유형은 다음과 같이 전송하게 됩니다.
```javascript
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

const data = {
    key1: 'foo',
    key2: 'bar'
}

axios({
    method: 'post',
    url: 'https://localhost:8080',
    data: data
}).then((res) => {
    // handle success
}).catch((err) => {
    // handle error
}).always(() => {
    // always
})
```

#### application/json
대부분의 API 요청시 활용되는 `application/json` 컨텐트 타입은 HTTP 요청과 함께 보내지는 데이터가 JSON 유형임을 알려주게 되므로 서버는 JSON 문자열로 변환하게 됩니다.

따라서, Axios로 application/json 데이터 유형은 다음과 같이 전송하게 되는데 method가 post인 경우 기본적으로 application/json을 Content-Type으로 지정하므로 명시하지 않아도 됩니다.
```javascript
const data = {
    key1: 'foo',
    key2: 'bar'
}

axios({
    method: 'post',
    url: 'https://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    },
    data: data
}).then((res) => {
    // handle success
}).catch((err) => {
    // handle error
}).always(() => {
    // always
})
```

## 스프링 MVC에서의 모델 바인딩
HTTP Content-Type을 이해할 필요가 있다는 것은 서버 개발자 입장에서도 동일합니다. 서버 애플리케이션에서 제공하는 API가 받아들일 수 있는 데이터 유형을 알고 작성해야합니다. 스프링 프레임워크 MVC에서 HTTP 요청 데이터를 어떻게 빈 클래스로 바인딩하는지를 찾아보는 신입 개발자가 얼마나 있을지 의문입니다.

친절하게도 스프링 공식 레퍼런스에서는 [Setting and Getting Basic and Nested Properties](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-beans-conventions)부분에서 프로퍼티를 가져오거나 설정할 때 `getPropertyValue`와 `getPropertyValues` 그리고 `setPropertyValue`와 `setPropertyValues` 메소드로 수행한다고 설명합니다.

이와 더불어 자바 빈 스펙에 따라서 `오브젝트 프로퍼티를 나타내는 규칙`에 대해서도 알려주고 있습니다.

**프로퍼티 예시**

-   name
    Indicates the property name that corresponds to the getName() or isName() and setName(..) methods.
-   account.name
    Indicates the nested property name of the property account that corresponds to (for example) the getAccount().setName() or getAccount().getName() methods.
-   account[2]
    Indicates the third element of the indexed property account. Indexed properties can be of type array, list, or other naturally ordered collection.
-   account[COMPANYNAME]
        Indicates the value of the map entry indexed by the COMPANYNAME key of the account Map property.

간단하게 살펴보면 account 클래스의 `name 프로퍼티`를 바인딩할 경우에는 `account.name`이라고 표현되어야하고 `account[2]`라고 표현되면 3번째 `인덱스 프로퍼티`로 나타내며 `account[COMPANYNAME]`이면 `COMPANYNAME`을 키로 가지는 `Map 프로퍼티`입니다.

### @ModelAttribute
스프링 MVC 컨트롤러를 작성할 때 요청 파라미터를 쉽게 빈 오브젝트로 바인딩하기 위하여 [`@ModelAttribute`](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-ann-modelattrib-method-args)를 주로 사용하게 됩니다.

그런데 다음과 같이 빈 오브젝트에 `맵 프로퍼티`가 존재할 경우 `@ModelAttribute`로 데이터 바인딩을 시도할 때 `주의`해야합니다. 이러한 경우 때문에 앞서 `x-www-form-urlencoded`의 데이터 구조를 살펴본 것입니다.

만약에 빈 오브젝트에 메타데이터로 맵 오브젝트를 담고 싶다고 가정할 때 서버로 맵 오브젝트를 보내어야하는 요구사항이 생기게 됩니다.

```java
public class Person {
    private String name;
    private Map<String, Object> metadata;
}
```

그런데 앞서 알아본 자바 빈 규칙에 따르면 맵 프로퍼티는 `metadata[address][location]`와 같이 표현되어야 합니다. 그런데 서버에서는 요청과 함께 보내진 페이로드가 `metadata[address][location]=value`가 되어버리면 address 부분이 배열의 인덱스인지 맵의 키인지 `구별할 수 없게` 됩니다.

결국 [관련 포스트](https://homoefficio.github.io/2017/04/25/Spring-%EA%B0%80-%ED%8F%AC%ED%95%A8%EB%90%9C-URL-%ED%8C%8C%EB%9D%BC%EB%AF%B8%ED%84%B0-%EB%B0%94%EC%9D%B8%EB%94%A9-%ED%95%98%EA%B8%B0/)처럼 다음과 같은 오류가 발생할 것이다.

```java
Property referenced in indexed property path 'metadata[address][location]' is neither an array nor a List nor a Map
```

그러면 요청된 페이로드가 [.형식으로 데이터를 변환](https://gist.github.com/codesnik/1433581)되어 `metadata.address.location=value`로 전송된다면 올바르게 바인딩 할 수 있을까요?

그렇지 않습니다. 규칙에 따라 맵 프로퍼티로 바인딩하기 위해서는 person.metadata[address]이어야만 하기 때문입니다.

### 복잡한 페이로드는 application/json을 사용
앞서 알아본 바와 같이 HTTP 요청시 보내야하는 데이터가 복잡하다고 판단되면 `x-www-form-urlencoded`가 아니라 `application/json`와 같은 형식으로 데이터 유형을 지정하여 서버가 처리할 수 있도록 해야합니다. 그리고 서버 개발자가 API를 개발할때에도 요청될 데이터가 복잡하다고 판단된 경우 `application/json`와 같은 형식으로 처리할 수 있게 해야합니다.

```json
{"metadata":{"address":{"location":"value"}}}
```

물론 `BeanWrapper` 또는 `DataBinder`를 구현하는 것도 하나의 방법으로 생각할 수 있습니다. 다만, 이러한 모델 바인딩을 위해서 코드를 작성하는 행위가 더 공수가 크다고 생각합니다. 그리고 `@Valid`와 `@Validated`과 같은 어노테이션으로 벨리데이션을 쉽게 적용할 수 없고 `Validator`도 추가로 직접 호출해서 오브젝트 프로퍼티를 `검증`해야 합니다.

## 참조

- [Content Type : x-www-form-urlencoded, form-data and json](https://medium.com/@mohamedraja_77/content-type-x-www-form-urlencoded-form-data-and-json-e17c15926c69)
- [Understanding HTML Form Encoding: URL Encoded and Multipart Forms](https://dev.to/sidthesloth92/understanding-html-form-encoding-url-encoded-and-multipart-forms-3lpa)
- [Validation, Data Binding, and Type Conversion](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation)
- [Content-Type vs Accept, HTTP Header](http://1ambda.github.io/content-type-vs-accept-http-header/)
- [Http Method는 POST, Content-Type이 application/x-www-form-urlencoded인 경우 body를 encoding하는게 맞을까?](https://gist.github.com/jays1204/703297eb0da1facdc454)
