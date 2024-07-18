---
title: 패스키 로그인 고도화
date: 2024-07-15T23:00+09:00
tags:
- Passkey
- WebAuthn
---

#### 패스키 생성 알고리즘

패스키 등록 시 PublicKeyCredentialCreationOptions의 pubKeyCredParams 를 통해 RP 서버에서 선호하는 공개키 알고리즘 목록을 제공할 수 있는데요. 이때 공개키 알고리즘 목록에는 ES256과 RS256은 반드시 포함하는게 좋습니다. 그 이유는 [대부분 ES256를 지원하고 일부는 RS256를 지원](https://github.com/w3c/webauthn/issues/1757#issuecomment-1169035781)한다고 하기 때문입니다.

#### 패스키 제공업체 표시

[Determine the passkey provider with AAGUID](https://web.dev/articles/webauthn-aaguid?hl=ko)에서 소개하는 [Passkey Provider AAGUIDs](https://github.com/passkeydeveloper/passkey-authenticator-aaguids)에는 일부 인증 기기에 대한 이름과 아이콘 정보를 포함하고 있습니다. [Passkeys Authenticator AAGUID Explorer](https://passkeydeveloper.github.io/passkey-authenticator-aaguids/explorer/)를 살펴보면 대부분의 사용자는 주로 아래의 인증 기기를 사용할 것 같습니다.

| Authenticator           | AAGUID                               |
| ----------------------- | ------------------------------------ |
| Google Password Manager | ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4 |
| Chrome on Mac           | adce0002-35bc-c60a-648b-0b25f1f05503 |
| iCloud Keychain         | fbfc3007-154e-4ecc-8c0b-6e020557d7bd |
| Samsung Pass            | 53414d53-554e-4700-0000-000000000000 |

##### AAGUID UUID 문자열

[java-webauthn-server](https://github.com/Yubico/java-webauthn-server) 라이브러리의 AAGUID 클래스를 통해 ByteArray로 구성된 aaguid를 RFC4122 표준의 UUID 형식의 문자열로 변환하여 저장할 수 있습니다. 패스키 등록 이후에 변하지 않는 항목이므로 패스키 등록 과정에서 Base64URL 보다는 UUID 형태로 저장해두는게 프론트엔드에서 사용하기에는 더 편할 것 같네요. 아래와 같이 AAGUID의 asGuidString 함수를 호출해서 가져올 수 있습니다.

```java
RegistrationResult result = relyingParty.finishRegistration(
        FinishRegistrationOptions.builder()
                .request(publicKeyCredentialCreationOptions)
                .response(publicKeyCredential)
                .build());


String aaguid = new AAGUID(result.getAaguid()).asGuidString();
```

#### 패스키 식별 가능한 이름 설정

![](/images/posts/passkey-login/02.png)

위 화면은 깃허브에서 패스키 등록 시 패스키에 대한 이름을 입력하도록 요구하는 단계입니다. 이와 같이 패스키 등록 시 사용자에게 등록하려는 인증 기기에 대한 이름을 입력하도록 요구하거나 사용자에게 기기에 대한 이름을 별도로 입력하지 않고 **Authenticator 1** 과 같이 현재 등록된 기기의 수를 토대로 기본값을 제공하고 사용자가 별도로 이름을 수정할 수 있도록 하는게 좋습니다.

#### 패스키 등록 수 제한

일반적으로 패스키로 등록할 수 있는 기기에 대한 제약은 필요하지 않습니다만 사용자가 너무 많은 패스키를 등록하는 것은 오히려 보안 상 좋지 않을 수 있습니다. 기본적으로 사용자에 대한 패스키는 10개 이내로 제한하고 정말로 사용자가 요구할 때 확장하는 것을 권장합니다. 예를 들어, 저와 같은 사용자는 삼성 갤럭시 스마트폰의 삼성 패스만 사용하여 패스키를 등록할 수 있습니다.

[Passkeys Cheat Sheet for Developers](https://www.corbado.com/assets/Passkeys-Developer-Cheatsheet.pdf)에서 사용자에게 더 나은 패스키를 제공하기 위한 방법에 대해서 찾아보세요.
