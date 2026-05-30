---
title: Keycloak 으로 구현하는 백오피스 계정 전환
date: 2026-05-30T06:40+09:00
description: 오류 분석 및 고객 대응을 위해 백오피스 관리자가 사용자 계정으로 전환하는 User Impersonation에 대해서 공유한다.
tags:
    - Keycloak
    - Token Exchange
    - Impersonation
---

# Keycloak 으로 구현하는 백오피스 계정 전환

웹 서비스를 운영하다 보면 오류 재현이나 권한 확인을 위해 백오피스에서 특정 사용자 계정으로 임시 전환해야 할 때가 있는데, AWS IAM의 ==역할 전환(AssumeRole)== 처럼 다른 사용자의 권한으로 임시 전환하는 이 기능을 **User Impersonation** 이라고 하나봐요.

## Token Exchange 프리뷰 기능 활성화하기

**Keycloak 26.2** 버전부터는 OAuth 2.0 Token Exchange(RFC 8693) 표준 스펙을 공식 지원하지만, 실무에서 사용 중인 버전은 **26.1.2** 예요. 이 버전에는 정식 규격인 **Standard Token Exchange** 기능이 포함되어 있지 않아 **Legacy Token Exchange** 프리뷰 기능을 활성화해야 해요.

> [!TIP]
> **Standard Token Exchange** 는 Keycloak 26.2부터 정식 도입된 표준 방식이에요. 반면 [Legacy Token Exchange](https://www.keycloak.org/securing-apps/token-exchange#_legacy-token-exchange) 는 그 이전부터 존재하던 Keycloak 고유 방식으로, API 파라미터와 동작 방식에 차이가 있어요. 26.2 이상이라면 **Standard Token Exchange** 사용을 권장해요.

`KC_FEATURES` 환경 변수로 필요한 프리뷰 기능을 활성화한 후 서버를 재시작하면, Keycloak 관리자 콘솔의 **Server info** 에서 활성화된 `Feature` 목록을 확인할 수 있어요.

```yaml
# docker-compose.yml 예시
environment:
    - KC_FEATURES=token-exchange,admin-fine-grained-authz:v1
```

![](/images/posts/keycloak-user-impersonation/001.png)

> 위 이미지에 `TOKEN_EXCHANGE` 와 `ADMIN_FINE_GRAINED_AUTHZ` 프리뷰 기능이 활성화된 것 보이죠?

## Impersonate 권한 구성하기

Keycloak에서 지원하는 계정 전환 방식은 크게 두 가지로 구분돼요.

- **Direct Naked Impersonation**: `subject_token` 없이 클라이언트 신원(Client Credentials)만으로 대상 사용자의 토큰을 직접 획득해요. Users 리소스의 `impersonate` 권한만 설정하면 동작해요.
- **Subject Token Exchange**: 백오피스 로그인 사용자의 토큰을 전달하여 대상 사용자의 토큰으로 교환하는 표준 방식이에요. 대상 클라이언트의 `token-exchange` 권한 설정으로 동작하며, `exchange` 오류 발생 시 정책에 전환 요청 클라이언트가 지정되어 있는지 확인해 보세요.

생각보다 설정 과정이 조금 복잡한 것 같은데 잘 정리해볼게요.

### 1. 계정 전환 전용 클라이언트 구성

일반 사용자와 역할을 분리하여 **계정 전환 전용 클라이언트** 를 별도로 구성하는 것을 권장해요. 전용 클라이언트를 분리하면 계정 전환 토큰의 유효기간을 서비스용과 다르게 설정할 수 있어 보안상 유용해요.

### 2. Capability config 설정

계정 전환 전용 클라이언트는 사용자 아이디·비밀번호가 필요하지 않으므로 **Standard flow** 나 **Direct access grants** 는 활성화하지 않아도 돼요. 클라이언트 크레덴셜(Client Credentials) 인증만 사용하므로 **Client authentication** 만 활성화하면 되고, 이 옵션을 켜면 **Permissions** 탭과 **Credentials** 탭이 상단에 나타나요. 발급된 `client_secret` 은 **Credentials** 탭에서 확인할 수 있어요.

![Keycloak Client Capabilities Configuration](/images/posts/keycloak-user-impersonation/002.png)

### 3. 대상 클라이언트 Fine-Grained Authorization 설정

**대상 클라이언트** (예: `target-client-id`)의 **Permissions** 탭으로 이동해 Permissions를 활성화(On)해요.

![Keycloak Client Permissions Enable](/images/posts/keycloak-user-impersonation/003.png)

하단에 나타나는 권한 목록 중 **token-exchange** 권한을 클릭한 뒤, **Policies** 에 전환 요청을 허용할 클라이언트 정책을 만들어 연결해요. 정책 이름은 **token-exchange-impersonated** 로 하고, 계정 전환 전용 클라이언트인 **user-impersonation** 을 지정했어요.

![Keycloak Token Exchange Policy Configuration](/images/posts/keycloak-user-impersonation/004.png)

> 생성한 정책은 **realm-management** 클라이언트의 **Authorization** > **Policies** 탭에서 확인할 수 있어요.

### 4. Users의 impersonate 권한 설정 (Direct Naked Impersonation의 경우)

Subject Token Exchange 구성이 도저히 안 될 때 대안으로만 시도해 보세요.

**Direct Naked Impersonation** 은 클라이언트 간 `token-exchange` 설정 없이도 동작해요. **Users** 메뉴의 **Permissions** 탭을 활성화(On)한 뒤, **impersonate** 권한에 앞서 생성한 `token-exchange-impersonated` 정책을 연결해 보세요.

![Keycloak Users Permissions Configuration](/images/posts/keycloak-user-impersonation/005.png)

> **Direct Naked Impersonation** 은 클라이언트 크레덴셜만으로 동작하므로, token exchange 요청 시 `subject_token` 은 전달하지 않아도 돼요.

## Token Exchange API 호출하기

설정이 완료되면 Token Exchange API 를 호출해 계정 전환 토큰을 발급받을 수 있어요.

::: code-group

```http [Subject Token Exchange]
POST /realms/{realm}/protocol/openid-connect/token HTTP/1.1
Host: keycloak.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&client_id=user-impersonation
&client_secret=user-impersonation-secret
&subject_token={admin_access_token}
&requested_subject={target_user_id}
&audience={target_client_id}
```

```http [Direct Naked Impersonation]
POST /realms/{realm}/protocol/openid-connect/token HTTP/1.1
Host: keycloak.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&client_id=user-impersonation
&client_secret=user-impersonation-secret
&requested_subject={target_user_id}
&audience={target_client_id}
```

:::

#### 주요 요청 파라미터 설명

- **grant_type**: Token Exchange 고정값(`urn:ietf:params:oauth:grant-type:token-exchange`)이에요.
- **client_id & client_secret**: Client Authentication이 활성화된 계정 전환 클라이언트 정보예요.
- **subject_token**: 계정 전환 요청자(예: 백오피스 관리자)의 Access Token이에요. Keycloak은 이 토큰으로 요청자의 전환 권한을 검증해요.
- **requested_subject**: 전환 대상 사용자의 ID(또는 Username)예요.
- **audience**: 전환 토큰을 발급받을 대상 서비스의 Client ID(예: `target-client-id`)예요.

동일 Realm 내의 [내부 간 계정 전환](https://www.keycloak.org/securing-apps/token-exchange#_internal-token-to-internal-token-exchange) 시에는 일부 파라미터를 생략할 수 있어요. 요청이 성공하면 일반 로그인처럼 대상 사용자의 토큰이 담긴 응답을 반환해요.

```json
{
    "access_token": ".....",
    "refresh_token": ".....",
    "expires_in": "...."
}
```

획득한 토큰을 프론트엔드에 전달하면 백오피스 관리자가 해당 사용자의 권한과 환경에서 문제를 직접 파악하고 대응할 수 있어요. 백엔드에서는 보안 및 감사를 위해 계정 전환 요청자와 대상 계정에 대한 감사(Audit) 로그를 남겨두는 것을 권장해요.

## Redis와 Admin SDK를 활용한 계정 전환 동적 제어

Keycloak 기본 기능만으로는 계정 전환 대상자(고객)를 동적으로 제어할 수 없어요. **Redis** 로 고객의 동의 상태를 일시적으로 관리하고, 요청이 유효할 때만 **Keycloak Admin SDK** 로 관리자에게 임시 역할을 부여·회수하는 하이브리드 방식을 구축하면 안전하게 제어할 수 있어요.

DB 스키마 변경 없이 Redis TTL로 일회성 동의 상태를 관리하고, Keycloak의 역할 기반 인가 정책(Role-based Policy)으로 토큰 발급 보안 통제를 위임할 수 있는 장점이 있어요.

### 1. 역할(Role) 기반 인가 정책 설정

임시 역할을 가진 관리자만 계정 전환을 시도할 수 있도록 Keycloak에 정책을 구성해요.

#### 1) Realm Role 생성

**Realm roles** 메뉴에서 `impersonate-allowed` 역할을 생성해요.

#### 2) Role-based Policy 생성

**realm-management** 클라이언트의 **Authorization** > **Policies** 탭에서 **Create policy** > **Role** 을 선택해요. 정책 이름(예: `impersonate-allowed-policy`)을 입력하고 `impersonate-allowed` 역할을 매핑하여 정책을 생성해요.

> **Tip**: **Assign role** 다이얼로그에서 기본 필터가 클라이언트 역할로 설정되어 있을 수 있어요. 필터를 **Filter by realm roles** 로 바꾸면 `impersonate-allowed` 역할을 찾을 수 있어요.

#### 3) 대상 권한에 Policy 연결

사용하는 방식에 맞게 대상 권한 메뉴로 진입해요.

- **Subject Token Exchange**: **Clients** > 대상 클라이언트(예: `target-client-id`) > **Permissions** > **token-exchange** 권한
- **Direct Naked Impersonation**: **Users** > **Permissions** > **impersonate** 권한

**Policies** 에 `impersonate-allowed-policy` 정책을 `token-exchange-impersonated` 정책과 **함께 연결(Apply)** 해요. 결정 전략이 Unanimous이므로 두 조건을 모두 만족하는 관리자만 통과해요.

### 2. 동적 제어 흐름 예시

1. **고객 동의 관리**: 고객이 기술지원을 허용하면 백엔드는 Redis에 동의 상태 키를 저장해요.
2. **임시 역할 부여**: 관리자가 계정 전환을 시도할 때 Redis 키가 유효하면 임시 역할을 부여해요.
3. **토큰 교환**: Keycloak Token Exchange API를 호출해 계정 전환 토큰을 발급받아요.
4. **역할 회수**: 기술 지원이 끝나거나 키가 만료되면 임시 역할을 회수해요. (단, 진행 중인 다른 요청이 있다면 유지해요.)

이렇게 구현하면 인가 검증은 Keycloak에 맡기면서도(권한 불일치 시 403 Forbidden), 고객 동의에 따른 동적 권한 제어를 안전하고 깔끔하게 처리할 수 있어요.

### 3. Java / Kotlin (Gradle) 의존성 설정

Spring Boot 등 Java/Kotlin 환경에서 Keycloak Admin Client를 사용하려면 `build.gradle` 또는 `build.gradle.kts`에 의존성을 추가해야 해요. 라이브러리 버전은 Keycloak 서버 버전과 일치시키는 것을 권장해요.

::: code-group

```groovy [build.gradle]
dependencies {
    implementation 'org.keycloak:keycloak-admin-client:26.1.2'
}
```

```kotlin [build.gradle.kts]
dependencies {
    implementation("org.keycloak:keycloak-admin-client:26.1.2")
}
```

:::

### 3. 백오피스 관리자 임시 역할 부여/회수 예시

Keycloak Admin SDK로 백오피스 관리자에게 임시 역할을 안전하게 부여하고 회수하는 예시 코드예요.

```java [KeycloakAdminService.java]
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleMappingResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import jakarta.ws.rs.NotFoundException;
import java.util.Collections;
import java.util.List;

public class KeycloakAdminService {

    private final Keycloak keycloak = KeycloakBuilder.builder()
            .serverUrl("https://keycloak.example.com")
            .realm("mambo")
            .grantType("client_credentials")
            .clientId("admin-cli-client")
            .clientSecret("admin-cli-client-secret")
            .build();

    private final String realmName = "mambo";
    private final String roleName = "impersonate-allowed";

    /**
     * 백오피스 관리자에게 계정 전환 임시 역할을 부여합니다.
     */
    public void grantImpersonateRole(String adminUsername) {
        RealmResource realm = keycloak.realm(realmName);
        UsersResource usersResource = realm.users();

        RoleRepresentation role = getRole(realm);
        String userId = getUserIdByUsername(usersResource, adminUsername);

        RoleMappingResource userRoles = usersResource.get(userId).roles().realmLevel();
        userRoles.add(Collections.singletonList(role));
    }

    /**
     * 백오피스 관리자의 계정 전환 임시 역할을 회수합니다.
     */
    public void revokeImpersonateRole(String adminUsername) {
        RealmResource realm = keycloak.realm(realmName);
        UsersResource usersResource = realm.users();

        RoleRepresentation role = getRole(realm);
        String userId = getUserIdByUsername(usersResource, adminUsername);

        RoleMappingResource userRoles = usersResource.get(userId).roles().realmLevel();
        userRoles.remove(Collections.singletonList(role));
    }

    private RoleRepresentation getRole(RealmResource realm) {
        try {
            return realm.roles().get(roleName).toRepresentation();
        } catch (NotFoundException e) {
            throw new IllegalArgumentException("역할이 존재하지 않습니다: " + roleName, e);
        }
    }

    private String getUserIdByUsername(UsersResource usersResource, String username) {
        List<UserRepresentation> users = usersResource.searchByUsername(username, true);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + username);
        }
        return users.getFirst().getId();
    }
}
```

기술지원 요청 수락 기능과 백오피스 화면의 리다이렉트 처리 등 전체적인 연동 코드와 상세 구현은 이 글에서 다루지 않을게요. 감사합니다.
