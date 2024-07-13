---
title: 패스키 로그인
date: 2024-07-13T12:00+09:00
tags:
- Passkey
- WebAuthn
---

패스키 로그인은 사용자 계정에 대한 비밀번호를 요구하지 않고 사용자 계정에 지문이나 얼굴 인식 그리고 보안키 등을 사용해서 등록한 인증 정보를 토대로 사용자의 인증 기기를 통해 로그인을 수행하는 것을 말한다. 패스키 로그인 뿐만 아니라 [아마존 웹 서비스](https://aws.amazon.com/ko/about-aws/whats-new/2024/06/aws-identity-access-management-passkey-authentication-factor/?nc1=h_ls)와 [깃허브](https://docs.github.com/ko/authentication/authenticating-with-a-passkey/signing-in-with-a-passkey)처럼 2차 인증을 위해서도 사용할 수 있다. 패스키 구현에는 아래와 같은 정보들을 참고할 수 있는데 더 자세한 정보들을 원한다면 [WebAuthn Awesome](https://github.com/yackermann/awesome-webauthn)에서 찾아볼 수 있다.

- [WebAuthn.io 데모 사이트](https://webauthn.io/)
- [WebAuthn 가이드](https://webauthn.guide/)
- [패스키 지원 디바이스 정보](https://passkeys.dev/device-support/)
- [WebAuthn: Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [What is WebAuthn?](https://webauthn.wtf/)
- [What are passkeys?](https://passkeys.dev/docs/intro/what-are-passkeys/)
- [패스키 생성 및 로그인을 위한 FIDO 얼라이언스 UX 가이드라인](https://fidoalliance.org/ux-guidelines-for-passkey-creation-and-sign-ins/?lang=ko)
- [Web Authentication and Passkeys](https://webauthn.me/passkeys)

> 패스키는 지문 또는 얼굴 인식과 같은 생체 인증 뿐만 아니라 PIN 이나 보안 기기 등 다양한 방식으로 등록할 수 있어요.
> 따라서, 생체 인증이 아닌 passkey 또는 webauthn 이라는 용어로 스키마를 설계하는 것을 권장합니다.

#### 패스키 등록을 위한 서비스 제공자

패스키 [신뢰 당사자(RP)](https://webauthn.wtf/how-it-works/relying-party)는 인증 정보에 대한 신원을 관리하고 검증하는 서비스 제공자를 의미한다. 일반적으로 웹 서비스에서 RP는 도메인이며 클라이언트는 사용자에게 인증을 요구하기 전에 RP로부터 **챌린지**와 함께 여러가지 옵션을 요청한다. 요청받은 정보는 WebAuthn 에서 [PublicKeyCredentialCreationOptions](https://webauthn.guide/#registration)를 의미한다. 챌린지 뿐만 아니라 사용자 아이디와 같은 일부 항목들은 바이트 배열로 구성되므로 Base64URL로 인코딩되어야함에 주의해야한다.

> 클라이언트에서 패스키 등록과 인증 과정에서 먼저 의사 난수로 이루어진 챌린지를 요청하는 이유는 [Replay attack](https://developer.mozilla.org/en-US/docs/Glossary/Replay_attack)을 방지하기 위함입니다.

##### RP 초기화

Yubico의 WebAuthn 라이브러리를 사용하면 자바 애플리케이션에서 쉽게 RelyingPartyIdentity로 RP에 대한 식별자를 구성하고 RP(Relying Party)를 구성할 수 있다. 클라이언트의 WebAuthn 에서는 패스키 등록과 인증 과정에서 rpID를 요청하고 인증 정보에 포함시키므로 해당 공개키가 RP에 대해서 서명되었음을 통해 공개키가 올바른 출처에 있음을 검증하는데 사용된다.

```groovy
dependencies {
    implementation 'com.yubico:webauthn-server-core:2.5.2'
    implementation 'com.yubico:yubico-util:2.5.2'
    implementation 'com.yubico:webauthn-server-attestation:2.5.2'
}
```

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

클라이언트가 패스키 등록을 위해 챌린지를 요청할 때 필요한 공개키 생성 옵션을 만들어서 응답해보자. RP의 `startRagistartion` 함수에 `StartRegistrationOptions`를 매개변수로 전달함으로써 RP와 챌린지가 포함된 공개키 생성 옵션을 쉽게 만들 수 있다. 또한, 클라이언트로 전달하기 위해 `toCredentialsCreateJson`을 사용하여 사용자 핸들과 같은 바이트 배열로 이루어지는 항목에 대해 알아서 Base64URL을 적용해준다.

```java
private byte[] createUserHandle() throws NoSuchAlgorithmException {
    byte[] userHandle = new byte[32];
    SecureRandom.getInstanceStrong().nextBytes(userHandle);
    return userHandle;
}

@GetMapping("/registration/challenge")
public String startRegistration() throws JsonProcessingException {
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

> 사용자 핸들(user.id)은 사용자 계정에 대해 유일함을 보장하도록 서버에 저장해두어야 패스키 인증 과정에서 사용자 인증 기기로부터 전달된 인증 정보내에 포함되는 사용자 핸들로 서버에서는 어떤 사용자 계정에 로그인해야하는지 구분할 수 있습니다.

##### 공개키 크레덴셜 검증 및 등록 완료

클라이언트의 WebAuthn API를 통해 전달받은 공개키 크레덴셜을 RP의 `finishRegistration`를 통해 올바르게 서명된 것인지 검증하고 패스키 정보로 표현할 일부 항목을 추출해서 저장하면 된다.  클라이언트에서 전달하는 정보에는 사용자 기기에 대한 디바이스 이름이나 생성된 시간 그리고 마지막으로 패스키가 사용된 시간에 대한 항목은 없으니 데이터베이스 설계 시 고려하는걸 권장한다. 예를 들어, 깃허브에서는 패스키 등록 과정에서 패스키에 대해 식별할 수 있는 이름을 설정하는 과정을 사용자에게 안내해주고 있다.

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

> 패스키에 대한 공개키와 함께 크레덴셜 아이디와 사용자 핸들을 포함하여 서버에 저장하는 이유는 패스키 로그인 과정에서 인증된 정보에 대해 RP 에서는 등록된 패스키 정보와 공개키를 찾아서 올바르게 비밀키로 서명된 인증인가를 검증하기 위함입니다.

---

이제 패스키 등록을 완료했다고 가정하고 패스키 로그인 시 사용될 챌린지와 옵션을 발급하고 패스키 로그인 요청에 대한 검증을 해보도록 하자.

##### 패스키 인증 요청에 대한 옵션 발급

클라이언트의 패스키 인증을 위해 사용할 챌린지를 요청할 때의 옵션은 RP의 `startAssertion`으로 생성할 수 있다. 이때, 매개변수로 전달할 StartAssertionOptions을 구성할 때 클라이언트는 사용자가 입력한 아이디를 요청 시 제공한다면 특정 사용자 계정에 대한 공개키만 조회하여 포함시킬 수 있다. 공개키를 조회하고 포함시키는 건 RP 초기화 시 사용된 CredentialRepository 인터페이스를 통해 이루어지게 된다.

```java
@GetMapping("/authentication/challenge")
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

클라이언트는 RP가 전달한 옵션을 사용해 사용자에게 인증 기기를 통한 패스키를 선택하도록 인증 대화상자를 표시하고 선택된 패스키로 서명된 인증 정보를 서버에게 전달하여 RP에 대해 발급되었던 인증 정보인지를 검증하게 된다. 올바르게 서명된 인증 정보임을 확인했다면 해당 사용자 계정에 대해 시스템 방식(세션이나 토큰)에 따라 인증 처리를 해주면 된다.

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

패스키 로그인에 대한 서버 측 구현은 완료되었으니 이제 클라이언트에서의 구현을 알아보도록 하자.

패스키 등록과 로그인을 위해 클라이언트의 [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#webauthn_concepts_and_usage)를 이용할 수 있다. WebAuthn API를 직접적으로 사용할 수 있지만 [SimpleWebAuthn](https://simplewebauthn.dev/) 라이브러리를 사용하면 더 간단하게 구현할 수 있으므로 활용하는 걸 추천한다. SimpleWebAuthn은 FIDO 테스트를 거친 라이브러리이므로 안심하고 사용해도 될 것이다.

```sh
pnpm add @simplewebauthn/browser
```

##### 패스키 등록 시작하기

클라이언트에서 패스키 등록을 위해 챌린지를 서버로 부터 요청하고 난 후 `startRegistration` 함수를 통해 패스키 등록을 위한 인증 대화상자를 사용자에게 제공할 수 있다. 아래와 같이 간단하게 패스키 등록을 사용자에게 요청하고 전달된 정보를 서버에 전달하여 패스키 등록을 완료할 수 있다.

```js
import axios from 'axios';
import { startRegistration } from '@simplewebauthn/browser';

export const registerPasskey = async () => {
    const challenge  = await axios.get('/api/passkey/registration/challenge')
    const registrationResponse = await startRegistration(challenge.data.publicKey)
    const response = await axios.post('/api/passkey/registration/verify', registrationResponse)
}
```

하지만, [startRegistartion](https://simplewebauthn.dev/docs/packages/browser#startregistration)에 대한 예제 코드를 보면 `InvalidStateError`와 같이 인증 기기가 이미 등록된 패스키인 상황에 대한 예외 처리가 필요하다는 걸 인지할 수 있다. 사용자에 대한 패스키가 이미 인증 기기에 등록되어있는 경우 중복 등록에 대한 메시지를 사용자에게 제공해보길 바란다.

##### 패스키 인증 시작하기

클라이언트에서 패스키 인증을 시작하기 위해 챌린지를 서버로부터 요청하고난 후 `startAuthentication` 함수를 통해 사용자에게 인증 기기에 등록된 패스키를 선택할 수 있도록 인증 대화상자를 표시할 수 있다. 사용자가 패스키를 선택했다면 전달되는 정보를 서버에 전달하여 패스키 인증을 완료할 수 있다.

```js
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';

export const passkeyLogin = async () => {
    const challenge  = await axios.get('/api/passkey/authentication/challenge')
    const authenticationResponse = await startAuthentication(challenge.data.publicKey)
    const response = await axios.post('/api/passkey/authentication/verify', authenticationResponse)
}
```

> 패스키 인증에서도 사용자가 패스키 선택을 취소하거나 이미 패스키 동작을 수행하고 있는 상황에 대해 예외처리가 필요합니다.
> NotAllowedError: The operation either timed out or was not allowed.

##### 사용자 아이디 필드에 자동 완성 UI 표시

패스키 인증을 위해 startAuthentication를 호출할 때 `useBrowserAutofill` 매개변수를 설정하는 경우 mediation 옵션이 conditional로 지정되면서 사용자에게 바로 패스키 선택을 요구하는 대화상자를 표시하지 않고 브라우저마다 구현된 방식으로 `자동 완성(조건부 UI)`이 표시된다. 패스키 자동 완성을 위해 호출했다면 사용자 계정을 입력하는 필드의 `autocomplete` 속성에 `webauthn` 을 포함시키면 된다.

```js
// Login.vue
onMounted(async () => {
  await processAutofill()
})

// passkey.js
import {
    browserSupportsWebAuthnAutofill
    WebAuthnAbortService
} from '@simplewebauthn/browser';

export const processAutofill = async () => {
    if (await browserSupportsWebAuthnAutofill()) {
        const challenge = await axios.get('/api/passkey/authentication/challenge')
        const authenticationResponse = await startAuthentication(challenge.data.publicKey, true)
        const response = await axios.post('/api/passkey/authentication/verify', authenticationResponse)
    }
}

const cancelAutofill = async () => {
    WebAuthnAbortService.cancelCeremony();
}
```

> 조건부 UI을 통해 사용자에게 자동 완성을 제공하고 패스키 로그인이라는 별도의 버튼을 이용하게 하고자한다면 AbortController를 사용해서 자동 완성을 위해 대기하는 프로미스를 취소하도록 구현해야합니다. SimpleWebAuthn의 [WebAuthnAbortService](https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/browser/src/helpers/webAuthnAbortService.ts)를 활용할 수 있습니다.

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
