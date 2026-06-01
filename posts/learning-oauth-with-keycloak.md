---
title: 키클록으로 배우는 OAuth 엔드포인트
date: 2026-06-01T22:42+09:00
description: 키클록(Keycloak) 환경을 바탕으로 OpenID Connect 디스커버리 엔드포인트를 이해하고, Client Credentials, Direct, Device Authorization 등 다양한 OAuth 2.0 인증 흐름의 핵심 옵션 설정과 동작 원리를 알아봅니다.
tags:
    - OAuth
    - OIDC
    - Keycloak
---

# 키클록으로 배우는 OAuth 엔드포인트

최근 [OAuth 2.0 엔드포인트 제대로 이해하기](https://daleseo.com/oauth-endpoints/) 라는 글을 읽으면서, 그동안 OAuth 2.0 인증 흐름을 '대략적으로 동작하는구나' 로만 이해하고 사용하고 있었음에 깊이 공감하게 되었습니다. 이 글에서는 오픈소스 ID 관리 솔루션인 키클록(Keycloak)을 기준으로 OAuth 2.0 및 OpenID Connect(OIDC) 핵심 엔드포인트를 살펴보고, 키클록 클라이언트 설정의 **Capability config** 영역에 보이는 OIDC 및 각 인증 흐름 옵션들의 실제 기능과 동작 원리를 다루어 보려고 해요.

## 1. OIDC Discovery 엔드포인트의 이해

OpenID Connect(OIDC)를 지원하는 OAuth 인증 서버에서는 표준화된 경로에 대한 메타데이터 문서(Discovery Document)를 제공합니다. 키클록에서 클라이언트를 생성할 때 Client type으로 **OpenID Connect** 를 선택하면, 다음과 같은 규격의 엔드포인트를 호출하여 OIDC 구성을 손쉽게 조회할 수 있어요. 실제로 OIDC 인증에 성공하여 발급받은 토큰의 `scope` 항목을 열어보면 `openid` 가 포함되어 있을 거예요.

이 요청을 보내면 아래와 같이 인증 서버가 지원하는 핵심 엔드포인트 정보가 담긴 JSON 응답을 돌려받게 됩니다.

```bash [OIDC Discovery Request & Response]
curl -X GET https://<keycloak-domain>/realms/<realm-name>/.well-known/openid-configuration

# Response
{
    "issuer": "https://<keycloak-domain>/realms/<realm-name>",
    "authorization_endpoint": "https://<keycloak-domain>/realms/<realm-name>/protocol/openid-connect/auth",
    "token_endpoint": "https://<keycloak-domain>/realms/<realm-name>/protocol/openid-connect/token",
    "userinfo_endpoint": "https://<keycloak-domain>/realms/<realm-name>/protocol/openid-connect/userinfo",
    "jwks_uri": "https://<keycloak-domain>/realms/<realm-name>/protocol/openid-connect/certs",
    "token_introspection_endpoint": "https://<keycloak-domain>/realms/<realm-name>/protocol/openid-connect/token/introspect",
    "response_types_supported": ["code", "none", "id_token", "token"],
    "subject_types_supported": ["public", "pairwise"],
    "id_token_signing_alg_values_supported": ["RS256"]
}
```

이 디스커버리 메타데이터 정보는 애플리케이션에서 OAuth 관련 엔드포인트들을 하드코딩하지 않고 동적으로 파악하도록 도와줍니다. 특히 OIDC 인증 서버에서 발급받은 **JWT 토큰에는 issuer(iss) 클레임** 이 포함되어 있으므로, 리소스 서버나 검증 라이브러리는 이 `iss` 값 뒤에 표준 경로인 `/.well-known/openid-configuration` 을 붙여 메타데이터 디스커버리 엔드포인트에 요청하고 토큰 검증에 필요한 정보들을 확인할 수 있습니다. 이처럼 **OpenID Connect(OIDC)** 는 인가 프로토콜인 OAuth 2.0 위에 인증 레이어를 얹어 계정 신원 정보를 표준화된 방식으로 확장한 개념이에요. 이에 따라 OIDC 환경에서는 토큰 요청(`token_endpoint`)이나 권한 부여(`authorization_endpoint`) 같은 주요 엔드포인트 외에도, 토큰 서명 검증을 위한 공개 키 목록을 제공하는 **JWKS Endpoint** (`jwks_uri`)와 사용자 프로필 정보를 조회할 수 있는 **UserInfo Endpoint** (`userinfo_endpoint`) 등이 추가되는 거예요.

## 2. Client Authentication (Client Credentials Grant)

키클록에서 클라이언트의 **Client Authentication** 옵션을 활성화하면, 해당 클라이언트는 사용자 개입 없이 시스템 권한만으로 토큰을 직접 획득하는 **Client Credentials Grant** 를 사용할 수 있는 기밀 클라이언트(Confidential Client)가 됩니다. 이 옵션이 켜지는 순간 보안 자격 증명인 `client_secret`이 필수로 요구되며, 인증 서버는 이를 통해 클라이언트 신원 검증(Client Authentication)을 수행하게 돼요.

키클록에서 Client Credentials Grant를 사용하기 위해 활성화하는 핵심 옵션이 바로 **Service accounts roles** 예요. 클라이언트 설정에서 이 옵션을 활성화하면 클라이언트 전용 Service Account를 사용할 수 있게 되며, 제공되는 탭 메뉴를 통해 필요한 역할을 매핑하고 구성해 주어야 실제 권한이 담긴 Access Token을 발급받을 수 있습니다.

예를 들어, 백엔드 애플리케이션에서 키클록의 사용자나 렐름 정보를 제어하기 위해 **Keycloak Admin SDK** (또는 Admin REST API)를 사용하려면 이 **Service accounts roles** 가 활성화되어 있어야 하고, 적절한 역할이 부여되어 있어야 합니다.

클라이언트는 Token Endpoint에 접근하여 자신을 인증(Client Authentication)할 때 `client_id`와 `client_secret`을 활용합니다. 주로 `Authorization` 헤더에 Basic Auth 형태로 결합해 인코딩하여 보내는 표준 방식이나, 요청 본문(Request Body)의 폼 파라미터로 직접 실어 전달하는 방식을 사용해요.

```http [Client Credentials Request Example]
POST /realms/<realm-name>/protocol/openid-connect/token HTTP/1.1
Host: <keycloak-domain>
Authorization: Basic <Base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

이처럼 **Client Credentials Grant** 는 사용자의 개입이 필요 없는 시스템 간 통신 및 백엔드 간 통신(M2M)에서 주로 사용됩니다. 프론트엔드(SPA 브라우저 앱, 모바일 앱 등) 환경에서는 `client_secret` 을 안전하게 보호할 수 있는 방법이 없으므로 사용하는 것을 권장하지 않아요.

## 3. Direct Grant Flow (아이디/패스워드 인증)

키클록 로그인 화면으로 브라우저가 리다이렉션되는 **Standard flow** 방식과 달리, 애플리케이션이 사용자 자격 증명(아이디/패스워드)을 직접 입력받아 백엔드 통신으로 즉시 토큰을 교환하는 방식도 있습니다. 이를 키클록에서는 **Direct Grant Flow** (OAuth 2.0 표준의 Resource Owner Password Credentials Grant)라고 부르며, 요청 시 `grant_type` 을 `password` 로 지정해 호출해요.

이 방식을 사용하려면 해당 클라이언트 설정에서 **Direct Access grants** 옵션을 켜야 합니다. 이 옵션이 켜지면 클라이언트가 전달받은 사용자의 username과 password를 키클록 서버로 즉시 전달해 토큰을 발급받을 수 있습니다. 만약 기밀 클라이언트(Confidential Client) 형태여서 **Client Authentication** 옵션까지 켜져 있다면, 요청 파라미터에 `client_secret` 도 반드시 함께 실어 보내야 합니다.

토큰을 요청하는 HTTP 페이로드(application/x-www-form-urlencoded) 구성 예시는 다음과 같습니다.

```http
POST /realms/<realm-name>/protocol/openid-connect/token HTTP/1.1
Host: <keycloak-domain>
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=my-rest-client&client_secret=my-client-secret&username=user@example.com&password=user-password
```

다만 이 흐름은 애플리케이션이 사용자의 비밀번호를 직접 다루어야 하므로 보안상의 한계가 큽니다. 이 과정에서 발생하는 보안 위험성 때문에 **OAuth 2.1 표준 스펙에서는 완전히 제외될 예정** 이기도 해요. 더불어 **Direct Grant Flow** 는 브라우저 쿠키를 타지 않고 바로 토큰만 주고받기 때문에, 키클록 서버 내에 웹 기반의 **싱글 사인온(SSO) 세션을 수립하지 않는다** 는 점 역시 알아두어야 합니다.

## 4. Device Authorization Grant Flow (기기 권한 부여)

키클록의 클라이언트 설정 화면을 보다 보면 **Capability config > Authentication flow** 영역에 있는 **OAuth 2.0 Device Authorization Grant** 옵션이 어떤 용도인지 궁금해집니다. 이 옵션은 바로 스마트 TV나 터미널 CLI 도구처럼 리다이렉션 기반 인증을 적용하기 어려운 기기 환경을 지원하기 위해 설계된 **Device Authorization Grant Flow** ([RFC 8628](https://datatracker.ietf.org/doc/html/rfc8628)) 를 활성화하는 스위치예요.

해당 흐름의 구체적인 명세는 [Auth0 Device Authorization Flow 문서](https://auth0.com/docs/get-started/authentication-and-authorization-flow/device-authorization-flow) 에 잘 설명되어 있으며, 평소 GitHub CLI(`gh`)로 [로그인할 때 나타나는 흐름](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) 을 떠올리면 가장 쉽게 이해할 수 있습니다.

```bash [Github CLI 를 통한 Device Code Flow 예시]
❯ gh auth login
? Where do you use GitHub? GitHub.com
? What is your preferred protocol for Git operations on this host? HTTPS
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: F9B8-D293
Press Enter to open https://github.com/login/device in your browser...
```

![GitHub 기기 인증 화면](/images/posts/learning-oauth-with-keycloak/001.png)

이처럼 화면에 표시된 일회성 사용자 코드를 복사하여 지정된 검증 URL에 입력하면 기기 등록과 로그인이 완료됩니다. 이 Device Flow 흐름이 내부적으로 어떻게 동작하는지 키클록(Keycloak) 기준으로 예를 들어 살펴보면 다음과 같이 요약할 수 있어요.

### 기기 코드 요청

디바이스(CLI)가 키클록의 `Device Authorization Endpoint` 로 요청을 보내 사용자 코드(`user_code`)와 검증 URL을 받아 화면에 노출합니다. 이 디바이스 인증 엔드포인트 경로는 실제로 키클록의 OIDC Discovery 엔드포인트(`http://localhost:8080/realms/mambo/.well-known/openid-configuration`) 를 조회해 보면 다음과 같이 명시되어 있는 것을 확인할 수 있어요.

```json [openid-configuration response (Device Authorization)]
{
    "device_authorization_endpoint": "http://localhost:8080/realms/mambo/protocol/openid-connect/auth/device"
}
```

### 사용자 로그인 및 폴링

사용자가 브라우저로 검증 URL에 접속해 사용자 코드를 입력하고 로그인하는 동안, 디바이스는 `Token Endpoint`로 토큰 요청을 주기적으로 폴링하며 대기합니다. 사용자의 인증이 완료되는 순간 인증 서버로부터 `Access Token`을 발급받아 연동을 완료해요.

이번 글을 통해서 OIDC와 기본 인증 흐름 외에도 Client Credentials Grant, Direct Grant, 그리고 Device Authorization Grant 에 대해 알게 되었습니다. 매번 ==키클록 연동으로 인해 겪게 되는 수많은 시행착오==를 줄이는 데 이 글이 조금이나마 도움이 되었기를 기대해 보며, 나중에 기회가 된다면 여기서 다룬 다양한 인증 흐름들을 실제 서비스 제품에 직접 도입하고 구축해 볼 수 있는 기회가 저에게도 찾아왔으면 좋겠습니다.
