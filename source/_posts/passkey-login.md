---
title: 패스키 로그인
date: 2024-07-09T21:00+09:00
tags:
- Passkey
- Yubico
- WebAuthn
---

신규 프로젝트에 뜬금없이 도입되어있는 패스키 로그인에 대해서 알아보자. 패스키는 비밀번호 대신에 사용자가 보유하는 디바이스에 등록되어있는 지문 그리고 얼굴 인식 또는 보안키 등을 이용하여 로그인하려는 사이트에 대해 인증을 수행하는 방식이다. 패스키는 구글 뿐만 아니라 애플 그리고 개발자가 이용하는 [아마존 웹 서비스](https://aws.amazon.com/ko/about-aws/whats-new/2024/06/aws-identity-access-management-passkey-authentication-factor/?nc1=h_ls)와 [깃허브](https://docs.github.com/ko/authentication/authenticating-with-a-passkey/signing-in-with-a-passkey)까지 [다양한 서비스](https://www.passkeys.io/who-supports-passkeys)에서 MFA 또는 로그인으로 지원하고 있다.

- [애플 따라 엑스·링크드인도 '패스키' 도입](https://www.digitaltoday.co.kr/news/articleView.html?idxno=486373)
- [왓츠앱, iOS용 패스키 지원한다…"더 쉽고 안전할 것"](https://www.digitaltoday.co.kr/news/articleView.html?idxno=515236)

#### 패스키 로그인이 필요한 이유

많은 시스템에서 [패스워드 선택 및 이용 안내서](https://www.kisa.or.kr/2060305/form?postSeq=14&lang_type=KO)에 따라 사용자에게 안전한 비밀번호를 설정하도록 요구하고 있다. 비밀번호 규칙은 NIST의 기준이 완화되었음에도 [대소문자와 특수문자 조합을 아직도 적용](https://www.youtube.com/watch?v=eJ70IEw4pMU)하고 있어 사용자는 쉽게 비밀번호를 잊어버리고 필요할때마다 비밀번호를 다시 설정하여 계정을 복구하는 과정을 거치고 있는 편이다.그동안 비밀번호가 쉽게 노출되어 2차 인증까지 수행해야했지만 사용자의 보안 장치로 2차 인증없이 한번에 인증을 수행할 수 있으므로 사용자에게 [로그인에 걸리는 시간을 줄여주는 효과](https://www.youtube.com/watch?v=moeXZ0rjezQ)도 보여준다고 한다. 

> 패스키를 이용할 수 있는 [디바이스 목록](https://www.passkeys.io/compatible-devices)을 확인해보세요. 삼성 갤럭시에서도 [One UI 6](https://www.yna.co.kr/view/AKR20231219015400017) 부터 삼성 패스를 통해 패스키를 지원합니다.

#### 패스키 관련 라이브러리

자바 기반의 [WebAuthn](https://webauthn.io/) 서버 측 구현은 Yubico의 [java-webauthn-server](https://developers.yubico.com/java-webauthn-server/)를 사용하고 클라이언트 측 구현은 [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#webauthn_concepts_and_usage)에 해당하는 [SimpleWebAuthn](https://simplewebauthn.dev/) 라이브러리를 활용할 수 있다. 아래와 같이 build.gradle과 package.json 에 각각 추가해보자.

```sh
implementation 'com.yubico:webauthn-server-core:2.5.2'

pnpm add @simplewebauthn/browser
```

#### 패스키 로그인 구현하기

패스키 로그인 구현을 위해 이해해야할 정보들에 대해서 알아보도록 하자. 대략적으로 RP, Challenge, Authenticator, AAGUID 등이 있다.

##### Relying Party

RP(Relying Party)는 패스키를 통해 사용자의 신원을 확인하고 인증 절차를 수행하는 서비스 제공자를 의미하며 클라이언트에서는 패스키를 생성하기 전에 RP와 챌린지(Challenge)를 포함하여 여러가지 옵션을 서버로 부터 제공받아야 한다. 이때, 서버 응답은 [PublicKeyCredentialCreationOptions](https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptions)로 구성된다. 각 필드 옵션에 대한 자세한 설명은 [webauthn.guide](https://webauthn.guide/)에 나와있으니 참고하길 바란다.

```java
RelyingPartyIdentity rpIdentity = RelyingPartyIdentity.builder()
    .id("kdev.ing")
    .name("Passkey Application")
    .build();

RelyingParty rp = RelyingParty.builder()
    .identity(rpIdentity)
    .credentialRepository(new MyCredentialRepository())
    .build();
```

```json
{
  challenge: *****,
  rp: {
    id: "kdev.ing",
  },
  user: {
    id: *****,
    name: "mambo",
    displayName: "Mambo",
  },
  pubKeyCredParams: [{
    alg: -7, type: "public-key"
  },{
    alg: -257, type: "public-key"
  }],
  excludeCredentials: [{
    id: *****,
    type: 'public-key',
    transports: ['internal', 'hybrid'],
  }],
  authenticatorSelection: {
    authenticatorAttachment: "platform",
    requireResidentKey: true,
  }
}
```

- rp.id: 웹 사이트 출처에 대한 도메인
- pubKeyCredParams: RP 에서 지원하는 공개키 알고리즘 종류
- excludeCredentials: 동일한 기기 중복 등록 방지를 위한 이미 등록된 패스키 목록

##### Authenticator

등록된 패스키의 Authenticator는 인증 장치를 의미하며 AttestedCredentialData에 포함된 인증 장치를 제공하는 업체에 대한 식별자를 `AAGUID` 라고 한다. [aaguid.json](https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json) 으로 AAGUID에 대한 [인증 장치 제공업체 이름을 확인](https://web.dev/articles/webauthn-aaguid?hl=ko)할 수 있다. 사용자의 인증으로 생체 인증 정보가 포함된 [공개키 크레덴셜(PublicKeyCredential)](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential)을 서버에 저장하도록 요청해야한다.

##### 브라우저 패스키 지원 여부

@simplewebauthn/browser에 포함된 [browserSupportsWebAuthn](https://simplewebauthn.dev/docs/packages/browser#browsersupportswebauthn) 함수를 통해 현재 사용자의 브라우저가 패스키를 지원하는지 여부를 쉽게 확인할 수 있다.

```js
import {startRegistration, startAuthentication, browserSupportsWebAuthn} from '@simplewebauthn/browser';

const isSupportedPasskey = () => {
    if (typeof PublicKeyCredential === 'undefined') {
        return false;
    }

    return browserSupportsWebAuthn()
}

export default {
    isSupportedPasskey
}
```

일단 패스키 로그인 도입이 완료되었다면 [패스키 생성 및 로그인을 위한 FIDO 얼라이언스 UX 가이드라인](https://fidoalliance.org/ux-guidelines-for-passkey-creation-and-sign-ins/?lang=ko)에 따라 조금 더 사용자 친화적인 패스키 로그인을 도입해보도록 하자. 예를 들어, 깃허브에서 제공하는 패스키 관리의 경우 등록된 패스키에 대해 사용자가 기억할 수 있게 이름을 설정할 수 있도록 안내하고 있다.

- [패스키 사용자 인터페이스 디자인](https://developers.google.com/identity/passkeys/ux/user-interface-design?hl=ko)
- [사용자에게 패스키 전달](https://developers.google.com/identity/passkeys/ux/communicating-passkeys?hl=ko)

