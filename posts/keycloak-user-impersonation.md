---
title: Keycloak을 활용한 User Impersonation 구현하기
date: 2026-05-30T06:40+09:00
description: 오류 분석 및 고객 대응을 위해 백오피스 등에서 특정 사용자로 전환하여 권한을 대행하는 User Impersonation의 개념과, Keycloak 26.1.2에서 Token Exchange 프리뷰 기능을 활성화하여 구현하는 방법을 소개합니다.
tags:
  - Keycloak
  - OAuth2
  - Token Exchange
  - Impersonation
---

# Keycloak을 활용한 User Impersonation 구현하기

웹 서비스 운영 중 발생하는 오류를 해결하기 위해 가끔 백오피스에서 특정 사용자의 신원을 임시로 대행하여 로그인해보는 기능이 필요해요. AWS IAM의 역할 전환(AssumeRole)과 비슷하게 임시로 다른 사용자의 권한으로 전환하는 이 기능을 **User Impersonation** (사용자 대행 또는 가장)이라고 불러요.

Keycloak 26.2 버전부터는 OAuth 2.0 Token Exchange(RFC 8693) 표준 스펙을 공식 지원하지만, 실무에서 사용 중인 Keycloak 버전은 **26.1.2**예요. 다행히 Feature 활성화를 통해 프리뷰 기능인 [Legacy Token Exchange](https://www.keycloak.org/securing-apps/token-exchange#_legacy-token-exchange)를 구성하여 테스트해 볼 수 있었어요.


## Token Exchange 프리뷰 기능 활성화하기

Keycloak 26.1.2 환경에는 정식 규격인 Standard Token Exchange 기능이 포함되어 있지 않아요. 대신 프리뷰 단계인 Legacy Token Exchange 기능이 내장되어 있기 때문에, 이를 사용하기 위해서는 Feature를 별도로 활성화하고 서버를 다시 실행해야 해요.

`docker-compose` 환경 등을 사용하는 경우 `KC_FEATURES` 환경 변수를 통해 필요한 프리뷰 기능을 활성화한 후 서버를 재시작해주어야 해요. Keycloak 관리자 콘솔의 **Server info** 화면에 접속하여 현재 활성화된 Feature 목록을 볼 수 있어요.

```yaml
# docker-compose.yml 예시
environment:
  - KC_FEATURES=token-exchange,admin-fine-grained-authz:v1
```

![](/images/posts/keycloak-user-impersonation/001.png)

## Impersonate 권한 구성하기

Token Exchange를 작동시키려면 대행 요청을 보낼 클라이언트가 특정 대상 사용자의 토큰으로 교환할 수 있는 권한 정책을 갖추고 있어야 해요.

1. **별도의 클라이언트 구성**: Token Exchange API를 안전하게 호출하기 위해서는 **Client Authentication** (클라이언트 인증) 권한이 필요해요. 일반 사용자가 인증하는 Public 클라이언트와는 역할을 확실히 분리하여, 백오피스 또는 백엔드 API 서버를 위한 별도의 전용 클라이언트를 구축하여 관리하는 것이 좋아요.
2. **Capability config 설정**: 전용 클라이언트 상세 화면의 **Settings** 탭 내 Capability config 설정에서 **Client authentication**과 **Service accounts roles**를 활성화(On / 체크)해 주어야 해요. 이 두 옵션을 활성화하면 클라이언트 상세 화면 상단에 **Permissions** 탭과 **Service accounts roles** 탭이 추가로 활성화되어 나타나요. 또한 Client authentication을 활성화하면 토큰 요청 및 검증 시 클라이언트 신원 확인을 위한 `client_secret`이 필수적으로 요구되며, 발급된 `client_secret`은 해당 클라이언트의 **Credentials** 탭에서 확인할 수 있어요.
3. **Fine-Grained Authorization 설정**: Keycloak 관리자 콘솔에서 기존 클라이언트의 **Permissions** 탭으로 이동하여 Permissions를 활성화(On)해요. 그러면 하단에 세부 권한 목록이 나타나는데, 이 중 **token-exchange** 권한을 클릭하여 진입한 뒤 **Policies** 설정 항목에 Token Exchange 요청을 허용할 클라이언트 정책(예: `token-exchange-impersonation` 정책 등)을 매핑해주면 돼요. 처음에는 잘 되지 않아 `realm-management` 클라이언트에 `Users` 리소스와 `impersonate` 스코프를 정의하고 `self-exchange` 정책이나 `impersonate-users` 퍼미션을 복잡하게 생성하는 시행착오를 겪을 수 있지만, 실제로는 기존 클라이언트의 Permission 설정만으로 간단히 해결할 수 있어요.

![](/images/posts/keycloak-user-impersonation/002.png)

![](/images/posts/keycloak-user-impersonation/003.png)

![](/images/posts/keycloak-user-impersonation/004.png)

## Token Exchange API 호출하기

Feature가 활성화되면 관리자 클라이언트는 사용자 신원 대행을 위해 Keycloak의 토큰 엔드포인트(`/realms/{realm}/protocol/openid-connect/token`)에 Token Exchange 스펙에 맞춘 요청을 전송할 수 있어요. 자세한 권한 제어 정책 및 호출 사양은 Keycloak 공식 가이드의 [Legacy Token Exchange](https://www.keycloak.org/securing-apps/token-exchange#_legacy-token-exchange) 문서를 참고할 수 있어요.

특히, 특정 사용자를 대행하여 토큰을 획득하는 구체적인 Impersonation 방법 및 파라미터 전달 방법은 공식 가이드의 [Impersonation](https://www.keycloak.org/securing-apps/token-exchange#_impersonation) 섹션을 통해 확인하실 수 있어요.

### Impersonation API 호출 예시

요청 시 다음과 같은 파라미터를 페이로드에 담아 전송해요. 대행 요청을 보내는 백오피스 사용자의 토큰인 `subject_token`을 함께 제공해야 해요.

```http
POST /realms/{realm}/protocol/openid-connect/token HTTP/1.1
Host: keycloak.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&client_id=backoffice-client
&client_secret=backoffice-client-secret
&subject_token={admin_access_token}
&requested_subject={target_user_id}
&audience={client_id}
```

### 주요 요청 파라미터 설명

- **grant_type**: Token Exchange를 위한 고정값을 사용해요.
- **client_id & client_secret**: Client Authentication이 활성화된 백오피스 클라이언트의 정보예요.
- **subject_token**: 대행을 요청하는 백오피스 사용자의 유효한 Access Token을 전달해요. Keycloak은 이 토큰을 검증하여 요청자에게 대행 권한이 있는지를 확인해요.
- **requested_subject**: 전환하려는 대상 사용자의 로그인 아이디를 지정해요.
- **audience**: 필수사항은 아니지만, 기존 로그인 시 사용했던 Client ID를 지정하는 것을 권장해요.

Keycloak은 느슨하게 구현했기에 동일 Realm 내의 [내부 간 대행](https://www.keycloak.org/securing-apps/token-exchange#_internal-token-to-internal-token-exchange) 시에는 일부 파라미터를 생략할 수 있어요.

요청이 성공하면 Keycloak은 다음과 같이 해당 사용자의 정보가 담긴 토큰 응답을 반환해요.

```json
{
  "access_token" : ".....",
  "refresh_token" : ".....",
  "expires_in" : "...."
}
```

설정이 잘 되었다면 로그인처럼 `access_token`과 `refresh_token`이 발급돼요. 이제 백오피스에서 획득한 토큰 정보를 활용하여 해당 사용자로 로그인한 것처럼 프론트엔드에서 리다이렉트만 해주면 돼요. 이렇게 하면 백오피스 관리자는 특정 사용자로 전환할 수 있어요. 다만 모든 사용자로 전환할 수 있는 구조가 되기 때문에 일부 사용자가 전환을 허용했을 때만 가능하도록 설정을 보완하는 게 좋겠어요.
