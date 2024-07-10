---
title: 패스키 로그인
date: 2024-07-10T21:00+09:00
tags:
- Passkey
- WebAuthn
---

패스키 로그인은 사용자 계정에 대한 비밀번호를 입력하지 않고 사용자 계정에 미리 등록한 기기를 통해 지문이나 얼굴 인식 그리고 보안키 등으로 비교적 쉽고 안전하게 인증을 수행하는 것을 말한다. 패스키 인증은 로그인 뿐만 아니라 [아마존 웹 서비스](https://aws.amazon.com/ko/about-aws/whats-new/2024/06/aws-identity-access-management-passkey-authentication-factor/?nc1=h_ls)와 [깃허브](https://docs.github.com/ko/authentication/authenticating-with-a-passkey/signing-in-with-a-passkey)처럼 MFA를 위해 도입되기도 한다. 패스키 구현에 대해서 찾아보면 참고할만한 예제는 많은데 그것만으로 이해하고 개발하기에는 쉽지 않은 것 같다. 예를 들어, 패스키 인증이 도입되어있는 사내 프로젝트를 보니 데이터베이스 설계가 생체 인증이라는 용어를 사용해서 패스키에 대한 의미가 잘못되어있음을 확인할 수 있었다.

> 패스키는 지문 또는 얼굴 인식과 같은 생체 인증 뿐만 아니라 PIN 이나 보안 기기 등 다양한 방식으로 인증을 수행하는 걸 지원해요. 
> 따라서, 생체 인증이 아닌 passkey 또는 webauthn 이라는 용어로 스키마를 설계하는 것을 추천합니다.

#### 패스키 로그인 구현에 참고할 수 있는 링크

패스키 로그인 구현에 앞서 아래의 정보들을 참고하면 패스키 로그인 구현에 대해서 어느정도 이해할 수 있다. 
더 자세한 정보들은 [WebAuthn Awesome](https://github.com/yackermann/awesome-webauthn)에서 찾아보자.

- [WebAuthn.io 데모 사이트](https://webauthn.io/)
- [WebAuthn 가이드](https://webauthn.guide/)
- [패스키 지원 디바이스 정보](https://www.passkeys.io/compatible-devices)
- [WebAuthn: Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [What is WebAuthn?](https://webauthn.wtf/)
- [What are passkeys?](https://passkeys.dev/docs/intro/what-are-passkeys/)
- [패스키 생성 및 로그인을 위한 FIDO 얼라이언스 UX 가이드라인](https://fidoalliance.org/ux-guidelines-for-passkey-creation-and-sign-ins/?lang=ko)
- [Web Authentication and Passkeys](https://webauthn.me/passkeys)
- [비밀번호 없는 로그인의 패스키 생성](https://web.dev/articles/passkey-registration?hl=ko)
- [양식 자동 완성을 통한 패스키 로그인](https://web.dev/articles/passkey-form-autofill?hl=ko)
- [패스키 중복 등록을 방지하는 방법](https://web.dev/articles/webauthn-exclude-credentials)
- [AAGUID로 패스키 제공업체 확인](https://web.dev/articles/webauthn-aaguid?hl=ko)

#### 패스키 로그인 서버 측 구현

자바 기반의 애플리케이션에서는 Yubico의 [java-webauthn-server](https://developers.yubico.com/java-webauthn-server/)를 이용할 수 있다. 패스키 로그인 시 클라이언트는 서버로부터 사이트 도메인에 대한 [Relying Party](https://webauthn.wtf/how-it-works/relying-party)와 함께 챌린지를 요청을 하고 제공받아야한다. 일반적으로 웹 사이트의 패스키 로그인에서 `rpID`는 도메인을 의미하며 `Challenge`는 [Replay attack](https://developer.mozilla.org/en-US/docs/Glossary/Replay_attack)을 방지하기 위해 의사 난수로 생성된 바이트 버퍼이다. 그 외에 여러가지 옵션들이 있는데 WebAuthn 가이드에서 [publicKeyCredentialCreationOptions](https://webauthn.guide/#registration)을 살펴보면 서버로부터 어떤 정보를 요구하는지와 각 필드 항목의 의미에 대해서 확인할 수 있다.

##### User Handle(user\.id)

공개키 크레덴셜에 포함되는 User Handle은 로그인 시 사용되는 계정 아이디를 그대로 사용하지 않고 사용자 계정에 대해 난수로 이루어진 바이트 배열을 발급하여 사용한다. User Handle은 [Registering Multiple Devices](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/Registering_Multiple_Devices.html)에 나와있는 것처럼 크레덴셜 아이디와 조합하여 어떤 사용자에게 저장된 공개키 크레덴셜인지를 구분할 수 있다. 만약, 사용자 계정에 대해 유일하게 발급해서 사용하고 싶다면 User Handle을 저장하는 스키마를 별도로 구성하면 된다.

```java
private byte[] createUserHandle() throws NoSuchAlgorithmException {
    byte[] userHandle = new byte[32];
    SecureRandom.getInstanceStrong().nextBytes(userHandle);
    return userHandle;
}
```

##### PublicKeyCredential.response.attestationObject.authData

패스키 등록 과정에서는 공개키 크레덴셜 내에 존재하는 Authenticator Data의 공개키 바이트 배열과 크레덴셜 ID를 사용자를 식별할 수 있는 키와 함께 데이터베이스에 저장하게 된다. 등록 이후 패스키 로그인 시 패스키로 등록된 기기에서의 인증 후에 전달받게 되는 크레덴셜 내 사용자 핸들(User Handle)과 크레덴셜 아이디(CredentialId)를 통해 서버에 저장된 공개키를 가져와서 서명되는 경우 인증을 수행한 것으로 처리하게 된다.

> 클라이언트의 [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)에서는 RP에 대해 사용자 기기에 대한 식별을 위해 발급된 크레덴셜에 있는 공개키를 서버로 전달하여 사용자 계정에 대해 인증 장치로 등록하도록 요구하여 서버에서는 공개키를 보유하고 비밀키는 사용자 기기에서 보유하기 때문에 보안 상 안전하다는 것을 보여줍니다.

결론적으로, 서버 측에서는 패스키 등록을 위한 정보를 제공한 후 클라이언트가 사용자로부터 인증받은 기기에 대한 공개키와 식별 정보를 데이터베이스에 저장하고 패스키 로그인 시 전달받은 정보가 서버에 저장된 공개키로 신뢰할 수 있는지를 검증하고나서 사용자 계정에 대한 인증 처리를 수행하는 것이다.

#### 패스키 로그인 클라이언트 측 구현

클라이언트 측 구현은 [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#webauthn_concepts_and_usage)를 이용하면 되는데 [SimpleWebAuthn](https://simplewebauthn.dev/) 라이브러리를 활용하면 더 간단하게 패스키 등록과 인증을 수행하는 로직을 구현할 수 있다. 특히나, [browserSupportsWebAuthn()](https://simplewebauthn.dev/docs/packages/browser#browsersupportswebauthn)와 같은 함수를 통해 패스키를 지원하는 브라우저 또는 자동 완성(autofill)을 제공할 수 있는지를 쉽게 판단할 수 있게 도와준다.

##### 자동 완성을 위한 mediation 옵션

[CredentailsContainer.get](https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get) 함수를 호출할 때 `mediation` 옵션을 `conditional`로 지정하는 경우 사용자에게 즉시 패스키를 선택하도록 요구하지 않고 자동 완성(조건부 UI)이 표시되도록 적용할 수 있다. 자동 완성에 의한 패스키 인증이 수행되기 전까지는 프로미스는 대기하고 있으며 자동 완성 폼에 표시되는 패스키 사용을 선택하고나서 인증 처리 과정은 동일하게 수행되도록 구현해야한다. [양식 자동 완성을 통한 패스키 로그인](https://web.dev/articles/passkey-form-autofill?hl=ko)에서처럼 로그인 화면을 제공하기 전에 패스키 요구를 조건부로 호출하여 대기하도록 하고나서 사용자 계정을 입력하는 필드에 `autocomplete=webauthn` 을 포함하면 된다.

```js
// Login.vue
onMounted(async () => {
  await processAutofill()
})

// passkey.js
export const processAutofill = async () => {
    if (await browserSupportsWebAuthnAutofill()) {
        // todo: 서버로부터 rp 와 challenge 받아오기
        const options = {
            challenge: '0NHRvLkOxc1Xja9inn1dEA6sSLc3ufvP_eNqu8IxRQU',
            rpId: 'localhost',
        }
        const authResp = await startAuthentication(options, true) // 자동 완성으로 패스키를 선택할때까지 대기
        const signInResp = await axios.post('/api/passkey/signin', authResp) // 서버로부터 패스키 검증 및 인증 정보 획득
        // todo: 인증 유무에 따른 처리
    }
}
```

#### 계정 설정 내 패스키 표시

패스키 등록 시 서버에 저장된 정보에는 사용자 친화적으로 표시할 수 있는 정보가 포함되어있지 않다. [패스키를 만드는 데 사용할 정보](https://developers.google.com/identity/passkeys/ux/communicating-passkeys?hl=ko#what_information_to_use_to_create_a_passkey)나 [계정 설정 내 패스키 카드 표시](https://developers.google.com/identity/passkeys/ux/user-interface-design?hl=ko)와 같은 정보들을 참고하며 패스키에 대해 아래와 같은 항목들을 설정할 수 있게 설계하는게 좋다.

- 패스키에 대해 표시할 이름 (Nickname)
- 패스키가 마지막으로 사용된 시간 (Last Access Time)
- 패스키 인증 기기 유형 (AAGUID)

패스키에 대해 표시할 이름을 설정하는 건 필수 사항은 아니지만 깃허브에서의 패스키 관리 시 이름을 설정할 수 있게 제공하는데 사용자 스스로 구분할 수 있게 지원해줄 수 있는 것 같다. 패스키 인증 기기 정보의 경우 AttestedCredentialData에 포함된 AAGUID를 통해 인증 기기를 제공하는 업체을 식별할 수 있다. AAGUID는 일반적으로 사람이 인지할 수 있는 문자열은 아니므로 AAGUID 저장소의 [aaguid.json](https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json) 인증 장치의 유형에 대해서 이름이나 아이콘을 표시할 수 있다.

> 패스키에 대한 UX 가이드라인을 살펴보면 패스키 관리에 대해 [패스키 아이콘](https://fonts.google.com/icons?icon.query=passkey)을 표시하는걸 권장한다고 하네요.

