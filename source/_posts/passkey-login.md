---
title: 패스키 로그인
date: 2024-07-14T12:00+09:00
tags:
- Passkey
- WebAuthn
---

패스키 로그인은 사용자 계정에 대한 비밀번호를 입력하지 않고 사용자 계정에 대해 지문이나 얼굴 인식 그리고 보안키 등을 사용해서 미리 인증 정보를 등록해놓고 사용자의 인증 기기를 사용해서 로그인을 수행하도록 제공하는 걸 말합니다. 패스키는 로그인 뿐만 아니라 [아마존 웹 서비스](https://aws.amazon.com/ko/about-aws/whats-new/2024/06/aws-identity-access-management-passkey-authentication-factor/?nc1=h_ls)와 [깃허브](https://docs.github.com/ko/authentication/authenticating-with-a-passkey/signing-in-with-a-passkey)처럼 2차 인증을 위해서도 도입될 수 있습니다. 이 글을 작성해보는 이유는 패스키 로그인에 대한 흐름은 생각보다 간단한데 패스키에 대한 표준에서 사용되는 용어와 구현 과정에서의 여러가지 이슈들이 많아보이기 때문입니다. 이제 패스키 로그인에 대해서 정리해보도록 하죠.

#### 패스키 로그인에서 등록과 인증의 흐름

패스키 로그인 시 등록과 인증 과정은 생각보다 간단합니다. 사용자는 본인이 사용할 수 있는 인증 기기에 발급한 패스키 정보를 RP 도메인에 대한 패스키를 등록하고 로그인 화면에서 시스템에서 제공하는 패스키 로그인을 사용해 인증 기기에 존재하는 패스키를 선택하여 사용자 계정에 대한 인증을 요청하고 승인받아 로그인을 완료합니다. 패스키를 등록하고 인증하는 과정에서 서버에서 제공받은 챌린지와 공개키에 대한 서명 정보를 제공함으로써 패스키를 사용하여 로그인을 지원하는 서버에서는 사용자에 대한 신원을 안전하게 증명(Attestation) 또는 검증(Assertion)할 수 있습니다. 

> 패스키 관련 표준에서 등록(Registration)과 인증(Authentication)에 대한 과정은 단순한 인증 과정이 아니라 하나의 중요한 의식이라는 관점으로 **세레모니(Ceremony)** 라고 표현합니다. 따라서, 패스키에 대한 여러가지 정보를 참고할 때 세레모니라는 단어가 나오면 과정이라고 이해하시면 됩니다.

#### 패스키 등록을 위한 서비스 제공자

패스키를 통해 신원을 관리하고 검증하는 주체인 서비스 제공자는 신뢰당사자(Relyting Party)라고 합니다. RP는 도메인을 의미하며 패스키 등록과 인증을 요청할때마다 챌린지(Challenge)를 받아가도록 요구합니다. RP에서 응답하는 챌린지는 난수로 이루어진 바이트 배열로 알수없는 식별자로 CSRF 토큰과 비슷한 용도로 사용됩니다. 또한, RP에 대한 아이디는 도메인으로 구성되기 때문에 클라이언트로부터 전달되는 패스키에 대한 공개키 인증 정보가 올바른 출처에 있음을 쉽게 확인할 수 있게 됩니다. 그러면 자바 애플리케이션 서버에서 RP를 구성해보도록 할까요?

```groovy build.gradle
dependencies {
    implementation 'com.yubico:webauthn-server-core:2.5.2'
    implementation 'com.yubico:webauthn-server-attestation:2.5.2'
    implementation 'com.yubico:yubico-util:2.5.2'
}
```

먼저, 자바 애플리케이션에서 WebAuthn에 대한 Relyting Party를 구성하기 위해서 [java-webauthn-server](https://developers.yubico.com/java-webauthn-server/) 라이브러리를 의존성에 추가해야합니다. 그리고 아래와 같이 RelyingPartyIdentity로 RP 도메인에 대한 신원을 정의하고 RelyingParty를 초기화하면 됩니다. CredentialRepository 는 패스키 등록과 인증 과정에서 이미 등록된 패스키 정보를 제공하기 위한 용도로 사용됩니다.

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

##### 🔥 SecurityError: The RP ID "mambo" is invalid for this domain

```sh
SecurityError: The RP ID "mambo" is invalid for this domain
    at identifyAuthenticationError (@simplewebauthn_browser.js?v=db6ca826:278:14)
    at startAuthentication (@simplewebauthn_browser.js?v=db6ca826:325:11)
    Caused by: DOMException: The relying party ID is not a registrable domain suffix of, nor equal to the current domain.
```

RP 서버에 대한 아이디는 WebAuthn 표준에 따라 반드시 도메인으로 구성되어야합니다. 그렇지 않은 경우 위와 같이 클라이언트 오류가 발생할 수 있습니다.

##### RelyingParty.generateChallenge

RelyingParty의 startRegistartion 를 통해 패스키 등록에 대한 챌린지와 공개키 생성 옵션을 클라이언트에게 제공할 수 있는데 이때 포함되는 챌린지는 RelyingParty에 32바이트로 구성된 난수로 이루어진 바이트 배열로 구현되어있습니다.

```java RelyingParty.java
private static final SecureRandom random = new SecureRandom();

private static ByteArray generateChallenge() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return new ByteArray(bytes);
}
```

#### 패스키 등록을 위한 생성 옵션 발급

RelyingParty의 startRegistration 매개변수에 StartRegistrationOptions를 전달함으로써 패스키 등록 시 사용될 챌린지와 생성 옵션인 PublicKeyCredentialCreationOptions를 만들 수 있습니다. PublicKeyCredentialCreationOptions의 toCredentialsCreateJson 함수는 RP 서버에서 클라이언트로 응답할 때 바이트 배열로 이루어져야하는 항목에 대해 Base64URL을 적용한 JSON으로 구성되도록 구현되어있으므로 쉽게 응답할 수 있습니다.

```java
private byte[] createUserHandle() throws NoSuchAlgorithmException {
    byte[] userHandle = new byte[32];
    SecureRandom.getInstanceStrong().nextBytes(userHandle);
    return userHandle;
}

@GetMapping("/registration/challenge")
public String startRegistration(HttpSession httpSession) throws JsonProcessingException {
    UserIdentity userIdentity = UserIdentity.builder()
            .name("mambo")
            .displayName("Mambo")
            .id(new ByteArray(createUserHandle()))
            .build();

    PublicKeyCredentialCreationOptions publicKeyCredentialCreationOptions = rp.startRegistration(
                StartRegistrationOptions.builder()
                        .user(userIdentity)
                        .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                                .residentKey(ResidentKeyRequirement.REQUIRED)
                                .authenticatorAttachment(AuthenticatorAttachment.CROSS_PLATFORM)
                                .build())
                        .build());

    httpSession.setAttribute("publicKeyCredentialCreationOptions", publicKeyCredentialCreationOptions.toJson());
    return publicKeyCredentialCreationOptions.toCredentialsCreateJson();
}
```

> UserIdentity의 id는 공개키 인증 정보에 포함되는 User Handle과 동일합니다. 패스키 표준에서는 사용자 계정에 대한 식별자를 그대로 이용하지 않고 별도로 난수로 이루어진 식별자를 사용하도록 요구하고 있습니다. 사용자 계정에 대해 유일한 식별자로 생성하는 로직을 구현하도록 하세요.

##### @simplewebauthn/browser.startRegistration

클라이언트에서는 아래와 같이 패스키 등록을 위해 챌린지를 요청하고 받은 결과를 startRegistartion의 매개변수에 전달함으로써 사용자에게 패스키 등록에 대한 대화상자를 표시해주고 전달받은 결과를 서버에 전달함으로써 패스키 등록을 완료하는 로직을 구현할 수 있습니다. 아래의 코드는 이미 등록된 패스키에 대한 오류에 대한 예외 처리가 없으므로 여러가지 예외 상황을 확인하고 알맞게 처리하도록 구현해야합니다.

```js
export const registerPasskey = async () => {
    const challenge  = await axios.get('/api/passkey/registration/challenge')
    const registrationResponse = await startRegistration(challenge.data.publicKey)
    const response = await axios.post('/api/passkey/registration/verify', registrationResponse)
}
```

#### 패스키 검증 및 등록

Relying Party의 finishRegistartion 함수를 통해 클라이언트에서 전달한 패스키 정보가 올바르게 서명되어있는지를 검증하고 전달받은 정보에서 일부 항목을 패스키에 대한 데이터베이스에 저장하면 됩니다.

```java
@PostMapping("/registration/verify")
public boolean finishRegistration(HttpSession httpSession,
                                  @RequestBody String credential) throws RegistrationFailedException, IOException {
    String credentialsCreateJson = (String) httpSession.getAttribute("publicKeyCredentialCreationOptions");
    httpSession.removeAttribute("publicKeyCredentialCreationOptions");

    PublicKeyCredentialCreationOptions publicKeyCredentialCreationOptions =
            PublicKeyCredentialCreationOptions.fromJson(credentialsCreateJson);
    PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> publicKeyCredential =
            PublicKeyCredential.parseRegistrationResponseJson(credential);

    RegistrationResult result = relyingParty.finishRegistration(
            FinishRegistrationOptions.builder()
                    .request(publicKeyCredentialCreationOptions)
                    .response(publicKeyCredential)
                    .build());

    ByteArray aaguid = result.getAaguid();
    ByteArray credentialId = result.getKeyId().getId();
    ByteArray userHandle = publicKeyCredentialCreationOptions.getUser().getId();
    ByteArray publicKey = result.getPublicKeyCose();
    String[] transports = publicKeyCredential.getResponse().getTransports().stream().map(AuthenticatorTransport::getId).toArray(String[]::new);
    long signatureCounter = publicKeyCredential.getResponse().getAttestation().getAuthenticatorData().getSignatureCounter();

    Authenticator authenticator = new Authenticator()
            .setCredentialId(credentialId.getBase64Url())
            .setUserHandle(userHandle.getBase64Url())
            .setAaguid(aaguid.getBase64Url())
            .setPublicKey(publicKey.getBase64Url())
            .setSignatureCount(signatureCounter)
            .setTransports(transports)
            .setNickname("")
            .setLastAccessTime(null)
            .setCreatedAt(OffsetDateTime.now());

    return authenticatorRepository.save(authenticator);
}
```

##### 계정 설정 내 패스키 표시

패스키 등록 시 서버에 저장된 정보에는 사용자 친화적으로 표시할 수 있는 정보가 포함되어있지 않습니다. [패스키를 만드는 데 사용할 정보](https://developers.google.com/identity/passkeys/ux/communicating-passkeys?hl=ko#what_information_to_use_to_create_a_passkey)나 [계정 설정 내 패스키 카드 표시](https://developers.google.com/identity/passkeys/ux/user-interface-design?hl=ko)와 같은 정보들을 참고하여 패스키에 대해 아래와 같은 항목이 포함되도록 설계하는 것이 좋습니다.

- 패스키에 대해 표시할 이름 (Nickname)
- 패스키가 마지막으로 사용된 시간 (Last Access Time)
- 패스키 인증 기기 유형 (AAGUID)

패스키에 대해 표시할 이름을 설정하는 건 필수 사항은 아니지만 깃허브에서의 패스키 관리 시 이름을 설정할 수 있게 제공하는데 사용자 스스로 구분할 수 있게 지원해줄 수 있는 것 같습니다. 패스키 인증 기기 정보의 경우 AttestedCredentialData에 포함된 AAGUID를 통해 인증 기기를 제공하는 업체을 식별할 수 있는데 AAGUID는 일반적으로 사람이 인지할 수 있는 문자열은 아니므로 AAGUID 저장소의 [aaguid.json](https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json) 인증 장치의 유형에 대해서 이름이나 아이콘을 표시할 수 있기도 합니다.

##### 등록된 패스키 삭제

![](/images/posts/passkey-login/01.png)

위 화면은 깃허브에서 사용자 계정에 등록했던 패스키를 삭제하려고 했을때 제공되는 메시지입니다. 패스키 관리 시 등록한 패스키를 삭제하면 되겠지만 고려해야할 부분이 있습니다. 서버에 등록된 패스키를 삭제한다고해서 사용자가 사용했던 인증 기기의 패스키 등록 정보는 삭제되지 않는다는 것입니다. 또한, 사용자가 인증 기기의 패스키를 삭제해버리는 경우 사용자 계정에 등록된 패스키는 무용지물이 되며 불필요하게 패스키 등록 정보로 남아있게 되어버립니다.

패스키 등록을 지원하는 인증 기기별로 자세한 패스키 삭제 가이드를 제공할 순 없으므로 사용자 계정에서 패스키를 삭제하더라도 패스키 로그인 시에는 패스키 옵션으로 표시될 수 있음을 알려주고 있는 것 같습니다. 다음은 자주 사용될만한 인증 기기에서의 패스키 삭제 방법이므로 참고해보세요.

- Google Passsword Manager: 브라우저 URL에 [chrome://settings/passkeys](chrome://settings/passkeys) 입력
- iCloud Keychain: [Mac 및 iCloud 키체인에서 패스키 또는 암호 제거하기](https://support.apple.com/ko-kr/guide/mac-help/mchl77e2cb66/mac)
- Chrome Profile: [Chrome에서 패스키 관리하기](https://support.google.com/chrome/answer/13168025?hl=ko)
- Samsung Pass: Samsung Wallet → Samsung Pass → 로그인 정보 → 패스키

#### 패스키 인증 요청에 대한 옵션 발급

Relying Party의 startAssertion 함수를 통해 사용자 계쩡에 등록된 패스키에 대해 로그인할 수 있도록 챌린지를 발급할 수 있습니다. 이때, 매개변수로 전달할 StartAssertionOptions을 구성할 때 클라이언트는 사용자가 입력한 아이디를 요청 시 제공한다면 특정 사용자 계정에 대한 공개키만 조회하여 포함시킬 수 있습니다.

```java
@GetMapping("/authentication/challenge")
public String startAssertion(HttpSession httpSession,
                             @RequestParam(required = false) String username) throws JsonProcessingException {
    StartAssertionOptions.StartAssertionOptionsBuilder builder = StartAssertionOptions.builder()
                .timeout(Duration.ofMinutes(3).toMillis());
    if (username != null && !username.trim().isEmpty()) {
        builder.username(username);
    }
    AssertionRequest assertionRequest = relyingParty.startAssertion(builder.build());
    httpSession.setAttribute("assertionRequest", assertionRequest.toJson());
    return assertionRequest.toCredentialsGetJson();
}
```

##### 패스키 검증 및 인증

Relying Party의 finishAssertion 함수를 통해 클라이언트에서 전달한 패스키 인증 정보를 신뢰할 수 있는지 확인할 수 있습니다. 인증 정보에 포함된 credentailId와 userHandle을 토대로 사용자 계정에 대해 로그인을 처리하면 됩니다.

```js
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';

export const passkeyLogin = async () => {
    const challenge  = await axios.get('/api/passkey/authentication/challenge')
    const authenticationResponse = await startAuthentication(challenge.data.publicKey)
    const response = await axios.post('/api/passkey/authentication/verify', authenticationResponse)
}
```

```java
@PostMapping("/authentication/verify")
public Object finishAssertion(HttpSession httpSession,
                              @RequestBody String credential) throws IOException, AssertionFailedException {
    String assertionRequestJson = (String) httpSession.getAttribute("assertionRequest");
    AssertionRequest assertionRequest = AssertionRequest.fromJson(assertionRequestJson);
    PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> publicKeyCredential
            = PublicKeyCredential.parseAssertionResponseJson(credential);

    AssertionResult result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
            .request(assertionRequest)
            .response(publicKeyCredential)
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

##### 사용자 아이디 필드에 자동 완성 UI 표시

패스키 인증을 위해 startAuthentication를 호출할 때 useBrowserAutofill 매개변수를 설정하는 경우 mediation 옵션이 conditional로 지정되면서 사용자에게 바로 패스키 선택을 요구하는 대화상자를 표시하지 않고 브라우저마다 구현된 방식으로 자동 완성(조건부 UI)이 표시됩니다. 패스키 자동 완성을 위해 호출했다면 사용자 계정을 입력하는 필드의 autocomplete 속성에 webauthn 을 포함시키면 됩니다.

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

> 조건부 UI로 사용자에게 자동 완성을 제공할 때 주의해야할 부분이 있는데요. WebAuthn은 반드시 하나만 동작해야하기 때문에 자동 완성에 의한 프로미스가 대기중인 상태에서 패스키 로그인 버튼을 제공하는 경우 대기중인 프로미스를 취소해야합니다.

---

본 글을 작성하기 위해서 아래와 같은 정보들을 참고했습니다.

- [WebAuthn.io 데모 사이트](https://webauthn.io/)
- [WebAuthn 가이드](https://webauthn.guide/)
- [Passkeys Device Support](https://passkeys.dev/device-support/)
- [WebAuthn: Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [What is WebAuthn?](https://webauthn.wtf/)
- [What are passkeys?](https://passkeys.dev/docs/intro/what-are-passkeys/)
- [Web Authentication and Passkeys](https://webauthn.me/passkeys)
- [Passkeys Cheet Sheet](https://www.corbado.com/assets/Passkeys-Developer-Cheatsheet.pdf)