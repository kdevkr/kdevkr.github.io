---
title: 패스키 로그인
date: 2024-07-11T21:00+09:00
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

---

#### 패스키 로그인을 위한 서버 측 신뢰 당사자 구현

패스키 등록이나 인증을 수행하기 위해서 클라이언트의 Web Authentication API가 사용자 기기에 대해 공개키 크레덴셜을 발급하려고 할때 [신뢰 당사자(Relying Party)](https://webauthn.wtf/how-it-works/relying-party)와 챌린지(Challenge)가 포함된 것을 서버에 요청하게 된다. 일반적으로 패스키 로그인에서 신뢰 당사자는 웹 서비스를 제공하는 시스템의 도메인을 의미한다. 챌린지는 [Replay attack](https://developer.mozilla.org/en-US/docs/Glossary/Replay_attack)을 방지하기 위해 의사 난수로 생성된 바이트 버퍼에 해당된다. WebAuthn 가이드에서 [publicKeyCredentialCreationOptions](https://webauthn.guide/#registration)을 살펴보면 서버로부터 어떤 정보를 요구하는지와 각 필드 항목의 의미에 대해서 확인할 수 있다.

```groovy
dependencies {
    implementation 'com.yubico:webauthn-server-core:2.5.2'
    implementation 'com.yubico:yubico-util:2.5.2'
    implementation 'com.yubico:webauthn-server-attestation:2.5.2'
}
```

##### RP 초기화

RelyingPartyIdentity로 신뢰 당사자에 대한 식별자를 구성하고 RelyingParty를 생성해보자. rpID는 애플리케이션에 대한 특정 도메인에 대해 자격 증명을 바인딩하는데 사용된다. 클라이언트는 패스키 등록과 인증을 수행하기 전에 rpID를 요청하여 받아갈 것이다.

```java
private RelyingParty generateRelyingParty(PasskeyCredentialRepository passkeyCredentialRepository) {
    RelyingPartyIdentity rpID = RelyingPartyIdentity.builder()
            .id("kdev.ing")
            .name("Mambo App")
            .build();

    return RelyingParty.builder()
            .identity(rpID)
            .credentialRepository(passkeyCredentialRepository)
            .allowOriginSubdomain(true)
            .origins(Set.of("https://kdev.ing"))
            .build();
}
```

##### 등록 요청에 대한 공개키 생성 옵션 발급

클라이언트에서 패스키 등록을 시작하기 위해 필요한 공개키 생성 옵션인 PublicKeyCredentialCreationOptions을 만들어보자. 공개키 생성 옵션에서 사용된 user.id 는 패스키 등록 후 전달받은 공개키 인증 정보에 userHandle로 포함된다.

```java
@GetMapping("/registration/options")
public String registrationOptions() throws JsonProcessingException {
    UserIdentity userIdentity = UserIdentity.builder()
            .name("mambo")
            .displayName("Mambo")
            .id(new ByteArray(createUserHandle()))
            .build();

    return rp.startRegistration(
            StartRegistrationOptions.builder()
                    .user(userIdentity)
                    .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                            .residentKey(ResidentKeyRequirement.REQUIRED)
                            .userVerification(UserVerificationRequirement.PREFERRED)
                            .authenticatorAttachment(AuthenticatorAttachment.CROSS_PLATFORM)
                            .build())
                    .build())
            .toCredentialsCreateJson();
}
```

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

##### 공개키 크레덴셜 검증 및 등록 완료

클라이언트의 WebAuthn API를 통해 전달받은 공개키 인증 정보를 통해 패스키 정보로 활용될 항목들을 추출한 뒤 서버에 저장하고 패스키 목록을 표시해주면 된다. 공개키 인증 정보에는 사용자 기기에 대한 디바이스 이름이나 생성된 시간 그리고 마지막으로 패스키가 사용된 시간에 대한 항목은 없으니 데이터베이스 설계 시 추가하는 걸 권장한다. 예를 들어, 깃허브에서는 패스키 등록 과정에서 패스키에 대한 닉네임을 설정하는 단계를 제공해주고 있다.

```java
@PostMapping("/registration/verify")
public boolean finishRegistration(@RequestParam("request") String request,
                                  @RequestParam("credential") String credential) throws JsonProcessingException, RegistrationFailedException {
    PublicKeyCredentialCreationOptions publicKeyCredentialCreationOptions = objectMapper.readValue(request, PublicKeyCredentialCreationOptions.class);
    PublicKeyCredential publicKeyCredential = objectMapper.readValue(credential, PublicKeyCredential.class);

    RegistrationResult result = rp.finishRegistration(
            FinishRegistrationOptions.builder()
                    .request(publicKeyCredentialCreationOptions)
                    .response(publicKeyCredential)
                    .build());

    ByteArray aaguid = result.getAaguid();
    ByteArray credentialId = result.getKeyId().getId();
    ByteArray userHandle = publicKeyCredentialCreationOptions.getUser().getId();
    ByteArray publicKey = result.getPublicKeyCose();
    Instant creationAt = Instant.now();
    Instant lastAccessTime = null;
    String nickname = "";

    // todo: save credential for user
    return true;
}
```

> 위 예시에서는 클라이언트로부터 패스키 발급 시 사용된 생성 옵션을 그대로 받아오지만 실제로는 세션이나 별도의 저장소에서 받아오도록 구현하세요.

##### 패스키 인증 요청에 대한 옵션 발급

클라이언트의 패스키 인증을 위한 옵션 요청 시 사용자를 식별할 수 있는지 여부에 따라 등록된 공개키 크레덴셜 정보를 포함하여 응답하면 된다. 공개키 크레덴셜 정보는 RP 초기화 시 사용된 CredentialRepository 인터페이스를 구현한 클래스에서 정의한 함수 결과대로 제공될 것이다.

```java
@GetMapping("/authentication/options")
public String startAssertion(@RequestParam(required = false) String username) throws JsonProcessingException {
    StartAssertionOptions.StartAssertionOptionsBuilder builder = StartAssertionOptions.builder();
    if (username != null && !username.trim().isEmpty()) {c
        builder.username(username);
    }
    AssertionRequest assertionRequest = rp.startAssertion(builder.build());
    return assertionRequest.toCredentialsGetJson();
}
```

##### 패스키 로그인 요청 검증 및 완료

클라이언트가 전달하는 공개키 인증 정보를 토대로 요청에 대해 검증하고 세션 로그인 또는 인증 토큰을 발급하도록 구현하면 된다.

```java
@PostMapping("/authentication/verify")
public Object finishAssertion(@RequestParam("request") String request,
                              @RequestParam("response") String response) throws JsonProcessingException, AssertionFailedException {
    AssertionRequest assertionRequest = objectMapper.readValue(request, AssertionRequest.class);
    PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> pkc =
            objectMapper.readValue(response, new TypeReference<>() {
            });

    AssertionResult result = rp.finishAssertion(FinishAssertionOptions.builder()
            .request(assertionRequest)
            .response(pkc)
            .build());

    if (result.isSuccess()) {
        // todo: process authenticate
        String username = result.getUsername();
        ByteArray credentialId = result.getCredential().getCredentialId();
        ByteArray userHandle = result.getCredential().getUserHandle();
        return true;
    }

    return false;
}
```

---

#### 패스키 로그인을 위한 클라이언트 구현

패스키 로그인을 위해 클라이언트의 [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#webauthn_concepts_and_usage)를 이용해서 패스키 등록과 인증을 수행하도록 구현해보자. WebAuthn API를 직접적으로 사용하여 구현해도 무방하지만 프론트엔드 개발자가 아닌 관계로 [SimpleWebAuthn](https://simplewebauthn.dev/) 라이브러리를 사용하면 더 간단하게 패스키 등록과 인증을 수행하는 로직을 구현할 수 있기에 활용하도록 하겠다. [browserSupportsWebAuthn()](https://simplewebauthn.dev/docs/packages/browser#browsersupportswebauthn)와 같은 함수를 통해 패스키를 지원하는 브라우저 또는 자동 완성(Autofill)을 제공할 수 있는지를 쉽게 판단할 수 있게 도와주므로 유용하다.

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

> 조건부 UI을 통해 사용자에게 자동 완성을 제공하고 패스키 로그인이라는 별도의 버튼을 이용하게 하고자한다면 AbortController를 사용해서 자동 완성을 위해 대기하는 프로미스를 취소하도록 구현해야합니다.

#### 계정 설정 내 패스키 표시

패스키 등록 시 서버에 저장된 정보에는 사용자 친화적으로 표시할 수 있는 정보가 포함되어있지 않다. [패스키를 만드는 데 사용할 정보](https://developers.google.com/identity/passkeys/ux/communicating-passkeys?hl=ko#what_information_to_use_to_create_a_passkey)나 [계정 설정 내 패스키 카드 표시](https://developers.google.com/identity/passkeys/ux/user-interface-design?hl=ko)와 같은 정보들을 참고하며 패스키에 대해 아래와 같은 항목들을 설정할 수 있게 설계하는게 좋다.

- 패스키에 대해 표시할 이름 (Nickname)
- 패스키가 마지막으로 사용된 시간 (Last Access Time)
- 패스키 인증 기기 유형 (AAGUID)

패스키에 대해 표시할 이름을 설정하는 건 필수 사항은 아니지만 깃허브에서의 패스키 관리 시 이름을 설정할 수 있게 제공하는데 사용자 스스로 구분할 수 있게 지원해줄 수 있는 것 같다. 패스키 인증 기기 정보의 경우 AttestedCredentialData에 포함된 AAGUID를 통해 인증 기기를 제공하는 업체을 식별할 수 있다. AAGUID는 일반적으로 사람이 인지할 수 있는 문자열은 아니므로 AAGUID 저장소의 [aaguid.json](https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json) 인증 장치의 유형에 대해서 이름이나 아이콘을 표시할 수 있다.

> 패스키에 대한 UX 가이드라인을 살펴보면 패스키 관리에 대해 [패스키 아이콘](https://fonts.google.com/icons?icon.query=passkey)을 표시하는걸 권장한다고 하네요.

#### 패스키 삭제

사용자 계정에 등록한 패스키 목록에서 패스키를 삭제할 때 고려해보아야할 부분이 있다. 패스키에 대한 공개키 크레덴셜을 저장하고 있는 시스템에서는 사용자 기기에 등록된 패스키 정보를 삭제할 방법이 없다. 또한, 사용자가 패스키를 등록하고나서 디바이스에 등록된 패스키를 삭제하는 경우에는 시스템에는 불필요하게 패스키 목록이 남겨지는 문제가 있으므로 이를 고려해보아야한다. 

![](/images/posts/passkey-login/01.png)

예를 들어, 위와 같이 깃허브에서는 패스키 삭제 후에 기기에 남아있는 패스키 정보로 인해 로그인 시도 시 패스키 옵션이 표시될 수 있음을 안내하고 있다. AAGUID와 디바이스에 따라 패스키를 관리하고 삭제하는 방법이 다르므로 자세한 가이드는 제공하지 않는 것 같다. 그럼에도 가이드를 제공하고 싶다면 자주 사용될 수 있는 기기에 대해서는 제공해줄 수 있어보인다.

- Google Passsword Manager: 브라우저 URL에 chrome://settings/passkeys 입력
- iCloud Keychain: [Mac 및 iCloud 키체인에서 패스키 또는 암호 제거하기](https://support.apple.com/ko-kr/guide/mac-help/mchl77e2cb66/mac)
- Samsung Pass: Samsung Wallet → Samsung Pass → 로그인 정보 → 패스키 에서 삭제할 수 있다.
- Chrome Profile: [Chrome에서 패스키 관리하기](https://support.google.com/chrome/answer/13168025?hl=ko)
