---
title: 패스키 로그인 데모
date: 2026-06-13T15:57+09:00
description: AI 에이전트의 도움을 받아 Spring Boot 4의 네이티브 WebAuthn으로 패스키 로그인 데모를 구현하는 과정을 다룹니다.
tags:
    - Passkey
    - WebAuthn
    - Spring Boot
    - Spring Security
---

# 패스키 로그인 데모

GitHub CLI 인증(`gh auth login`)을 수행하다가 깃허브가 패스키 로그인 화면을 제공하는 걸 보고, Spring Boot 4 학습 겸 패스키 데모를 만들어보기로 했어요. 이번 데모는 AI 에이전트에게 [스프링 시큐리티 패스키 공식 문서](https://docs.spring.io/spring-security/reference/servlet/authentication/passkeys.html)와 [Baeldung의 패스키 연동 가이드](https://www.baeldung.com/spring-security-integrate-passkeys)를 참고 자료로 주고 만들게 했습니다. 이 포스트에서 다루는 레포는 [passkey-demo](https://github.com/kdevkr/passkey-demo)이며, 패스키에 대한 이해는 이전에 작성한 [패스키 로그인](/posts/passkey-login) 글을 참고해 주세요.

## Spring Security 7의 네이티브 WebAuthn

과거에는 [java-webauthn-server](https://developers.yubico.com/java-webauthn-server/) 라이브러리로 패스키 로그인을 위한 백엔드 서버 로직을 구현했는데요. Spring Boot 4가 사용하는 Spring Security 7에서 패스키를 지원하려면 [webauthn4j](https://github.com/webauthn4j/webauthn4j) 의존성을 갖는 `spring-security-webauthn` 모듈이 필요한데, `spring-boot-starter-security` 스타터에 자동으로 포함되지 않기 때문에 명시적으로 추가해야 해요.

```kotlin [build.gradle.kts]
plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.security:spring-security-webauthn")
}
```

## webAuthn DSL과 기본 엔드포인트

Spring Security 7에서는 `HttpSecurity`의 `webAuthn` DSL만 선언하면 패스키 인증이 활성화되기 때문에 비교적 간단하게 구현할 수 있어요. `rpId`에는 우리의 로컬 도메인을, `allowedOrigins`에는 HTTPS를 포함한 Origin을 입력해 주세요.

```java [SecurityConfig.java]
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.webAuthn(webauthn -> webauthn
            .rpId("localhost")
            .rpName("Passkey Demo")
            .allowedOrigins("https://localhost:8080")
    );
    return http.build();
}
```

스프링 시큐리티 추상화에 의해 다음 엔드포인트가 등록되어 자동으로 활성화돼요.

| 엔드포인트                            | 용도                                  |
| ------------------------------------- | ------------------------------------- |
| `POST /webauthn/register/options`     | 패스키 등록 옵션 발급 (인증된 사용자) |
| `POST /webauthn/register`             | 패스키 등록 검증 (인증된 사용자)      |
| `POST /webauthn/authenticate/options` | 패스키 로그인 챌린지 발급             |
| `POST /login/webauthn`                | 패스키 로그인 검증 및 인증 처리       |

그러면 이제 프론트엔드 화면에서는 패스키 로그인 옵션을 받아 [@simplewebauthn/browser](https://simplewebauthn.dev/)의 `startAuthentication`을 호출하고, 사용자로부터 받은 인증 결과를 `/login/webauthn` 엔드포인트로 전달하면 되는 흐름이에요.

## 패스키 저장소를 JPA로 구현하기

기본적으로 인메모리 저장소를 사용하기 때문에 서버를 재시작하면 등록한 패스키가 사라져요. 그래서 데모에서는 SQLite를 사용해서 패스키 저장소를 구현했어요. 패스키 영속화를 위해서는 `PublicKeyCredentialUserEntityRepository`(사용자)와 `UserCredentialRepository`(자격증명) 두 인터페이스를 구현해 빈으로 등록하면 됩니다.

```java [JpaUserCredentialRepository.java]
@Repository
public class JpaUserCredentialRepository implements UserCredentialRepository {

    @Override
    public void save(@NonNull CredentialRecord record) {
        CredentialEntity entity = jpaRepo.findById(record.getCredentialId().getBytes())
                .orElse(new CredentialEntity());
        entity.setCredentialId(record.getCredentialId().getBytes());
        entity.setUserId(record.getUserEntityUserId().getBytes());
        entity.setPublicKeyCose(record.getPublicKey().getBytes());
        entity.setSignatureCount(record.getSignatureCount());
        // transports, backupEligible, attestationObject 등 필드 단위로 매핑
        jpaRepo.save(entity);
    }

    private CredentialRecord toCredentialRecord(CredentialEntity entity) {
        return ImmutableCredentialRecord.builder()
                .credentialId(new Bytes(entity.getCredentialId()))
                .userEntityUserId(new Bytes(entity.getUserId()))
                .publicKey(new ImmutablePublicKeyCose(entity.getPublicKeyCose()))
                .signatureCount(entity.getSignatureCount())
                // 나머지 필드 복원 생략
                .build();
    }
}
```

`CredentialRecord`에는 공개키(COSE), 서명 카운터, 전송 방식, Attestation 정보 등 여러 필드가 담겨 있는데요. 처음에는 Java 직렬화로 통째로 저장하려 했는데, 구현체인 `ImmutableCredentialRecord`가 `Serializable`을 구현하지 않아서 직렬화 시 오류가 발생하더라고요. 그래서 필드 단위로 컬럼에 저장하고, 조회 시 `ImmutableCredentialRecord.builder()`로 복원하는 빌더 패턴 기반의 명시적 매핑으로 구현했어요.

## 패스키 등록은 직접 구현해야 해요

기본 제공되는 `/webauthn/register/options` 는 ==이미 로그인된 사용자에게 패스키를 추가하는 흐름== 을 전제로 해요. 스프링 시큐리티의 익명 사용자(`AnonymousAuthenticationToken`)로는 입력한 아이디 주체를 식별할 수 없으므로, 패스키 데모처럼 인증되지 않은 사용자가 패스키를 등록하려면 별도의 컨트롤러를 작성해야 합니다. 데모에서는 기본 엔드포인트와 충돌하지 않도록 `/api/register/*` 경로로 컨트롤러를 두고, 사용자명을 받아 사용자 엔터티를 먼저 생성한 뒤 `WebAuthnRelyingPartyOperations`로 등록 옵션 발급과 자격증명 검증을 수행했어요.

```java [WebAuthnRegistrationController.java]
@PostMapping("/options")
public ResponseEntity<?> getRegistrationOptions(@RequestBody Map<String, String> request) {
    String username = request.get("username");
    // 신규 사용자라면 난수 ID로 사용자 엔터티 생성 후 저장
    Authentication authentication = new UsernamePasswordAuthenticationToken(
            username, null, AuthorityUtils.NO_AUTHORITIES);
    PublicKeyCredentialCreationOptions options = relyingPartyOperations
            .createPublicKeyCredentialCreationOptions(() -> authentication);
    optionsStore.put(username, options); // 검증 시 사용할 옵션 보관
    return ResponseEntity.ok(options);
}

@PostMapping
public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    PublicKeyCredentialCreationOptions options = optionsStore.get(request.getUsername());
    relyingPartyOperations.registerCredential(new ImmutableRelyingPartyRegistrationRequest(
            options, new RelyingPartyPublicKey(request.getCredential(), "My Passkey")));
    return ResponseEntity.ok("Registration successful");
}
```

> [!NOTE]
> 등록 옵션에 포함된 챌린지는 검증 단계에서 다시 필요해요. 데모에서는 어차피 런타임 흐름이라 메모리(`ConcurrentHashMap`)에 보관했으나, 실제 운용되는 서비스에서는 세션이나 레디스와 같은 별도의 저장소를 이용하는 걸 권장해요.

한 가지 주의할 점은 커스텀 컨트롤러가 응답하는 옵션은 MVC의 ObjectMapper로 직렬화되기 때문에, Spring Security가 제공하는 `WebauthnJacksonModule`을 빈으로 등록하지 않으면 프론트엔드 라이브러리에서 요구하는 형식과 다를 수 있다는 거예요. 이 모듈을 빈으로 등록해 WebAuthn 표준 JSON 형태로 응답되도록 하면, 데모에서처럼 클라이언트에서는 응답받은 옵션을 변환 없이 `startRegistration({ optionsJSON: options })`으로 그대로 전달할 수 있어요.

## 로컬에서도 HTTPS 구성하기

패스키 로그인은 보안 컨텍스트(Secure Context)에서만 동작하기 때문에 HTTPS가 필수예요. 브라우저는 `localhost`를 예외적으로 신뢰하지만, 데모를 스마트폰 같은 외부 기기에서 접속해 테스트하려면 HTTPS가 필요합니다. 프론트엔드에서는 [mkcert](https://github.com/FiloSottile/mkcert)로 로컬 인증서를 발급할 수 있는 [vite-plugin-mkcert](https://github.com/liuweiGL/vite-plugin-mkcert)를 Vite에 적용했어요.

```js [vite.config.js]
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
    plugins: [vue(), mkcert()],
    server: {
        port: 8080,
        proxy: {
            "/api": { target: "http://localhost:5000", changeOrigin: true },
            "/webauthn": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
            "/login": { target: "http://localhost:5000", changeOrigin: true },
        },
    },
});
```

백엔드 API는 Vite 프록시를 거치므로 브라우저 입장에서는 모든 요청의 출처가 `https://localhost:8080` 하나로 유지돼요. 이 값이 `allowedOrigins`와 일치하지 않으면 등록·인증 검증 단계에서 실패하니, 패스키가 동작하지 않을 때 가장 먼저 확인해 볼 부분입니다.

> [!TIP]
> 크롬 브라우저는 `chrome://password-manager/passkeys` 주소의 Google 비밀번호 관리자를 통해, 삼성 갤럭시는 [삼성 패스](http://samsungsvc.co.kr/solution/1692413)를 통해 패스키 관리를 지원해요. 그리고 서버에서 패스키를 삭제해도 Google 비밀번호 관리자나 삼성 패스에 등록된 패스키는 삭제되지 않고 쓰레기로 남아 있을 수 있으니, 테스트 중 등록한 패스키는 이곳에서 함께 정리해 주세요.

## Tailscale로 삼성 패스 패스키 로그인 테스트하기

mkcert로 발급한 인증서는 로컬 PC에서는 신뢰되지만, 갤럭시 스마트폰에서 접속하면 루트 CA가 설치되어 있지 않아 신뢰되지 않는 인증서로 막혀요. 기기마다 루트 CA를 일일이 설치하는 대신 [Tailscale](https://tailscale.com/)을 사용했어요. PC와 핸드폰에 Tailscale을 설치해 같은 테일넷(tailnet)에 두면 서로 접근할 수 있고, Tailscale이 기기의 `<기기>.<테일넷>.ts.net` 도메인에 대한 신뢰된 HTTPS 인증서를 발급해 주기 때문에 별도 CA 설치 없이도 양쪽 모두에서 유효한 보안 컨텍스트가 돼요.

```bash
# Tailscale MagicDNS 도메인에 대한 신뢰된 인증서 발급
tailscale cert my-pc.tailnet-name.ts.net
```

발급받은 `.crt`/`.key`를 `frontend/cert/`에 두면 Vite가 이 인증서로 HTTPS 서버를 띄우고, `host: true` 설정 덕분에 Tailscale IP로도 접근할 수 있어요.

```js [vite.config.js]
const certDir = path.resolve(__dirname, "cert");
const certFile = fs.readdirSync(certDir).find((f) => f.endsWith(".ts.net.crt"));
const keyFile = fs.readdirSync(certDir).find((f) => f.endsWith(".ts.net.key"));

export default defineConfig({
  server: {
    host: true, // Tailscale IP 포함 모든 인터페이스에서 수신
    https: {
      cert: fs.readFileSync(path.resolve(certDir, certFile)),
      key: fs.readFileSync(path.resolve(certDir, keyFile)),
    },
  },
});
```

마지막으로 백엔드 서버의 RP 도메인과 허용 출처를 PC의 MagicDNS 도메인으로 변경해야 해요. 데모는 이 값을 프로퍼티로 분리해 두어 코드 수정 없이 전환할 수 있습니다.

```properties [application.properties]
webauthn.rp-id=my-pc.tailnet-name.ts.net
webauthn.allowed-origins=https://my-pc.tailnet-name.ts.net:8080
```

이제 같은 테일넷에 연결된 갤럭시 폰에서 PC의 MagicDNS 도메인(`https://my-pc.tailnet-name.ts.net:8080`)으로 접속하면, 신뢰된 HTTPS 인증서 덕분에 보안 경고 없이 그대로 열려요. 그러면 패스키를 등록할 때 삼성 패스가 저장을 제안하고, 로그인할 때 삼성 패스로 인증하는 흐름을 실제 기기에서 확인할 수 있어요.

[이전 글](/posts/passkey-login)을 작성했을 때는 java-webauthn-server로 직접 Relying Party를 다루느라 구현 과정이 생각보다 복잡하다고 느꼈었는데요. 이제는 스프링 시큐리티의 네이티브 WebAuthn 지원 덕분에 패스키 도입이 한결 쉬워진 것 같아요. 아쉽게도 패스키를 도입했던 이전 제품은 통합 SSO를 위한 키클록(Keycloak) 도입으로 사라졌지만, 이렇게 데모로나마 다시 다뤄볼 수 있어 좋았어요.

## 패스키 체험 데모 사이트

이 포스트를 작성하면서 찾아보니 패스키를 체험할 수 있는 사이트가 꽤 많아졌더라고요. 직접 구현하기 전에 패스키의 동작 흐름을 살펴볼 때 좋아요. WebAuthn은 FIDO2 표준을 웹 브라우저에서 사용할 수 있도록 만든 표준 API인데, 이 표준 흐름을 그대로 보여주는 [webauthn.io](https://webauthn.io/)가 가장 기본이에요. 구글의 [Passkeys Demo](https://passkeys-demo.appspot.com/)는 패스키 등록부터 로그인까지의 사용자 경험을 단계별로 따라가 볼 수 있어요. 또한 [SKT 패스키 체험](https://www.passkey-sktelecom.com/experience)이나 [드림시큐리티 패스키](https://www.dreamsecurity.com/solution/certification/passkey)처럼 국내 기업의 패스키 도입 솔루션에서도 체험 주소를 제공하더라고요.
