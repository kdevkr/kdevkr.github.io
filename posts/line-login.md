---
title: 라인 로그인 연동
date: 2024-02-18T22:00+0900
---

> 본 글에 대한 코드는 [kdevkr/spring-boot-line-login](https://github.com/kdevkr/spring-boot-line-login) 에서 확인할 수 있습니다.

우리가 이용하는 수 많은 웹 서비스에서는 회원가입 한 계정 혹은 이메일로 로그인하기 뿐만 아니라 카카오, 네이버, 구글, 메타, 애플, 깃허브와 같은 소셜 프로바이더의 계정으로 인증하여 쉽게 로그인할 수 있는 연동 기능을 제공한다. 국내의 경우 대부분 카카오 로그인이나 네이버 로그인을 사용하는 편인데 라인 플러스에서 제공하는 라인 메신저는 국내 보다는 일본이나 태국과 같은 해외 국가에서 많이 사용되는 편이다. [라인 플러스](https://linepluscorp.com/)가 있지만 라인 개발자 사이트 및 개발 문서의 경우 영어와 일본어만 지원하고 있다. 만약, 회사에서 만드는 서비스가 일본이나 태국 그리고 말레시이아 국가의 고객들을 대상으로 한다면 라인 메신저를 통한 연동 기능 지원은 거의 필수적으로 도입될 가능성이 있다.

![LINE Login Diagram](https://lineapiusecase.com/img/LINE_login_en.webp)

#### LINE Developers Console

[라인 비즈니스 콘솔](https://manager.line.biz/)을 통해 비즈니스 계정을 생성할 수 있으며 라인 비즈니스 계정을 만든 후에 [개발자 콘솔](https://developers.line.biz/)에 별도로 접속하여 라인 로그인 이나 메시지 채널을 등록하고 설정할 수 있다. 라인 플랫폼에 연동할 서비스 프로바이더를 생성해야하며 라인 로그인과 메시징 API 채널은 별도로 구분되어 만들어진다. 각 채널은 별도로 운영될 수 있지만 라인 로그인 채널에 친구 옵션으로 메시지 채널 계정을 연결할 수 있게 지원한다.

> 라인 사용자가 로그인 채널에 연동하더라도 서비스 앱에서 사용자에게 메시지를 보내기 위해서는 사용자가 메시지 채널에 친구로 등록되어있어야만 합니다.

#### 라인 로그인 채널 추가하기

사용자가 라인 플랫폼을 통해 서비스에 연동할 수 있도록 웹 애플리케이션 방식의 라인 로그인 채널을 추가해야한다. 서비스 지역 옵션의 경우 일본 • 태국 • 대만 • 인도네이사 뿐이며 한국을 선택할 수 없는게 의아하긴 하지만 국내의 경우 가장 가까운 일본을 선택하면 될 것 같다.

![](/images/posts/line-login/01.png)

#### 라인 로그인 콜백 주소 설정

라인 로그인 채널을 추가했다면 LINE Login 설정 페이지로 이동하여 라인 로그인 과정에서 라인 플랫폼이 인증된 코드를 전달해줄 서비스 콜백 주소를 등록해두어야 한다. 반드시 백엔드 서버 주소가 콜백 주소일 필요는 없으며 프론트엔드에서 콜백을 받은 후 코드값을 백엔드에 REST API로 전달해도 무방하다. 콜백 주소는 개행으로 여러개를 등록하여 사용할 수 있도록 지원한다.

![](/images/posts/line-login/02.png)

```sh Callback URL
https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={LOGIN_CHANNEL_ID}&redirect_uri={CALLBACK_URL}
```

> 콜백 주소는 서비스에서 인증 코드로 액세스 토큰을 발급하는 경우에도 사용자 로그인 시 사용된 동일한 콜백 주소를 요구하므로 백엔드 서버에서도 채널 아이디와 채널 시크릿 뿐만 아니라 별도로 콜백 주소를 관리해야합니다.

#### OIDC 이메일 권한 요청

서비스 연동시 사용자가 사용하는 이메일 주소가 반드시 필요하다면 이메일 획득 권한을 위해서 로그인 채널 옵션의 OpenID Connect에 대한 이메일 주소 권한을 별도로 활성화 해야한다. 실제로는 이메일을 어떻게 사용하는지에 대한 스크린샷을 업로드 해야하겠지만 개발 단계에서는 임의의 이미지를 등록해도 허용된다. 사용자 로그인 시 전달하는 URL 파라미터 중 스코프에 아래와 같이 email을 추가하면 이메일에 대한 권한 옵션이 UI에 노출될 것이다.

![](/images/posts/line-login/03.png)
![](/images/posts/line-login/04.png)
![](/images/posts/line-login/05.png)

```sh profile+openid+email
https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={LOGIN_CHANNEL_ID}&scope=profile%20openid%20email
```

> 사용자 인증 화면에서 이메일 주소 권한을 필수로 요구하는 옵션은 지원하지 않습니다.

#### OAuth v2.1 액세스 토큰 발급

사용자 로그인 후 콜백되어 전달되는 URL에 포함된 code 파라미터를 사용하여 서버에서는 [액세스 토큰](https://developers.line.biz/en/reference/line-login/#issue-access-token)을 발급할 수 있다. OpenID Connect 에 따라 액세스 토큰과 함께 ID Token이 제공되는데 JWT 형식으로 구성된 문자열이므로 페이로드를 확인하거나 [Verify ID token](https://developers.line.biz/en/reference/line-login/#verify-id-token)을 통해 토큰 검증과 함께 분석된 결과를 응답으로 받아볼 수 있다.

```java
String idToken = response.getIdToken();
String payload = idToken.split("\\.")[1];
Map<String, Object> claims = objectMapper.readValue(new String(Base64.getUrlDecoder().decode(payload)), new TypeReference<>(){});
```

```json
{
  "iss": "https://access.line.me",
  "sub": "U1234567890abcdef1234567890abcdef",
  "aud": "1234567890",
  "exp": 1504169092,
  "iat": 1504263657,
  "nonce": "0987654asdf",
  "amr": ["pwd"],
  "name": "Taro Line",
  "picture": "https://sample_line.me/aBcdefg123456",
  "email": "taro.line@example.com"
}
```

> JWT 페이로드에 포함되는 항목 중 `sub` 는 라인 사용자에 대한 User ID를 의미합니다.

---

#### 메시지 채널과 연동하기 (친구 추가 옵션)

라인 로그인 기능을 도입하더라도 로그인 채널과 메시지 채널은 별도로 분리되어있어 메시지 채널을 별도로 생성한 후 로그인 채널에서 메시지 채널에 등록할 수 있는 기능을 활성화하고 [사용자에게 친구 추가를 요구](https://developers.line.biz/en/docs/line-login/link-a-bot/)해야한다. 친구 추가 옵션(Add friend option)에 메시지 채널을 선택한다면 로그인 연동 시 사용할 수 있는 bot_prompt 파라미터에 값에 따라 친구 추가 옵션 노출 방식을 제공할 수 있다.

```sh
https://client.example.org/cb?code={CODE}&state={STATE}&friendship_status_changed={FRIENDSHIP_STATUS_CHANGED}
```

친구 추가 옵션을 사용하는 경우에 사용자 로그인 후 콜백 시 전달되는 코드 파라미터 이외에 friendship_status_changed 파라미터가 추가적으로 전달되어 해당 사용자가 친구 추가를 수행했는지 여부를 확인할 수 있다. 만약, 로그인 화면에 메시지 채널을 친구로 추가할 수 있는 버튼이 노출되지 않는다면 아래와 같은 항목을 제대로 설정했는지 다시 한번 체크해보도록 하자.

- [Link a LINE Official Account with your channel](https://developers.line.biz/en/docs/line-login/link-a-bot/#link-a-line-official-account)
- [Redirect users to the LINE Login authorization URL with the bot_prompt query parameter](https://developers.line.biz/en/docs/line-login/link-a-bot/#redirect-users)

#### 사용자에게 메시지 보내기

사용자가 메시지 채널에 친구로 등록하였다면 로그인 연동을 수행한 사용자에게 메시지를 보낼 수 있다. 사용자 프로필 정보를 포함하고 있는 [JWT 형식의 IDToken](https://developers.line.biz/en/docs/line-login/verify-id-token/#page-title)의 항목 중 sub 가 라인에서 제공하는 API에서 내부적으로 사용할 수 있는 User ID이며 [Messaging API](https://developers.line.biz/en/reference/messaging-api/#send-push-message) 에서는 User ID를 사용하여 사용자에게 메시지를 보낼 수 있도록 제공한다.

```yml
line:
  bot:
    channel-token: WQ9SQjcWBJqD020+ri***
    channel-secret: 1ba24f197605a2***
```

> User ID는 U1234567890abcdef1234567890abcdef 와 같이 UXXX 로 시작하는 값 입니다.
> Line Java SDK 에서 채널 토큰은 메시지 채널의 아이디가 아닌 Messaging API의 액세스 토큰임을 주의해야합니다.


#### 라인 로그인 인증 화면 국제화

![](/images/posts/line-login/06.png)

`ui_locales` 파라미터에 로케일을 전달하여 사용자가 라인 플랫폼에 인증하기 위한 화면에 대해 국제화를 적용할 수 있다. 또한, 라인 로그인 채널 설정에서 Localization 설정을 통해 채널 이름과 설명 부분을 언어에 따라 표시되도록 설정할 수 있다. 단, 친구 옵션으로 표시되는 메시지 채널에 대한 이름은 별도로 지원하지 않는다.

```sh
https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={LOGIN_CHANNEL_ID}&redirect_uri={CALLBACK_URL}&ui_locales=ja_JP
```

![](/images/posts/line-login/07.png)  

![](/images/posts/line-login/08.png)  
