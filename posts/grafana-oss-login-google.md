---
title: "Grafana 기본 로그인 폼 숨기기"
date: 2026-05-17T17:08+09:00
description: 기본 로그인 폼을 숨기고 구글 로그인 버튼만 표시하는 방법을 알아보고 우회하는 경로도 소개합니다
tags:
    - grafana
    - docker-compose
    - oauth
    - google
---

# Grafana 기본 로그인 폼 숨기기

조직에서 구성해 놓은 **Grafana** 에 접속하려고 보니, 문득 아이디와 비밀번호를 사용해야 하는지 아니면 연동된 **구글 로그인** 을 사용해야 하는지 기억이 나지 않아 순간적으로 헷갈렸던 경험이 있습니다. 사내에서는 이미 구글 워크스페이스(Google Workspace) 계정으로 구글 로그인이 가능하도록 설정해 두고 사용 중이었습니다.

어차피 구글 로그인을 필수로 사용해야만 하는 환경이라면, 로그인 화면에서 아이디와 비밀번호 입력 폼을 아예 숨겨버리는 것이 사용자 입장에서 혼선을 줄이는 가장 좋은 방법이 아닐까 싶었습니다. 궁금해서 그것이 가능한지 찾아보았습니다.

로컬에 **도커 컴포즈(Docker Compose)** 를 구성해서 환경 변수 설정에 따라 로그인 화면이 어떻게 구성되는지 비교해보고, 기본 로그인 폼이 숨겨졌을 때 비상 시 우회하여 아이디와 비밀번호를 입력해 로그인하는 방법까지 함께 살펴보겠습니다. 그리고 나아가 이러한 구성이 정말로 필요한가에 대해서도 다시 한번 고민해 보겠습니다.

## 1. 로그인 화면 설정

**그라파나 OSS(Grafana OSS)** 에서는 환경 변수를 사용해서 아이디 패스워드 기반 인증(로그인 폼)을 숨기고 구글 로그인 버튼만 노출되도록 설정할 수 있습니다. 이 구성을 위해 다음의 3가지 환경 변수가 사용됩니다.

- **`GF_AUTH_GOOGLE_ENABLED`** : 구글 로그인(Google OAuth) 연동을 활성화합니다.
- **`GF_AUTH_DISABLE_LOGIN_FORM`** : 기본 ID/Password 입력란을 로그인 화면에서 숨길지 여부를 설정합니다. `true` 로 설정하면 표준 로그인 폼이 완전히 사라집니다.
- **`GF_AUTH_OAUTH_AUTO_LOGIN`** : 로그인 페이지 접속 시 사용자가 버튼을 누르지 않아도 OAuth 로그인 화면으로 바로 자동 리다이렉트 시킬지 여부를 결정합니다.

## 2. Docker Compose 실습 환경 구성

다음은 로그인 폼이 활성화된 일반 인스턴스(포트 3000)와 로그인 폼이 비활성화되고 구글 OAuth가 설정된 인스턴스(포트 3001)를 동시에 띄울 수 있는 `docker-compose.yml` 예제입니다.

```yaml [docker-compose.yml]
version: "3.8"

services:
    # 1. 일반 그라파나 인스턴스 (로그인 폼 활성화 - 포트 3000)
    grafana-standard:
        image: grafana/grafana:latest
        container_name: grafana-standard
        ports:
            - "3000:3000"
        environment:
            - GF_SECURITY_ADMIN_USER=admin
            - GF_SECURITY_ADMIN_PASSWORD=admin
            - GF_AUTH_DISABLE_LOGIN_FORM=false
            - GF_AUTH_GOOGLE_ENABLED=true
        restart: unless-stopped

    # 2. 로그인 폼이 비활성화된 그라파나 인스턴스 (포트 3001)
    grafana-disabled-login:
        image: grafana/grafana:latest
        container_name: grafana-disabled-login
        ports:
            - "3001:3000"
        environment:
            - GF_SECURITY_ADMIN_USER=admin
            - GF_SECURITY_ADMIN_PASSWORD=admin
            - GF_AUTH_DISABLE_LOGIN_FORM=true
            - GF_AUTH_GOOGLE_ENABLED=true
        restart: unless-stopped
```

이제 실행된 두 인스턴스에 접속해서 로그인 화면이 어떻게 구성되었는지를 확인해볼게요.

### 기본 로그인 화면 vs 로그인 폼 비활성화 화면 비교

#### 1. 기본 로그인 화면

먼저 **`grafana-standard` (포트 3000)** 으로 접속한 경우입니다. **`GF_AUTH_GOOGLE_ENABLED=true`** 설정으로 인해 기존의 아이디와 비밀번호 입력 폼과 함께 **Sign in with Google** 버튼이 동시에 표시됩니다. 이 때문에 사용자가 자신의 이메일 계정을 직접 입력해서 로그인해야 하는지, 혹은 연동된 구글 로그인을 클릭해야 하는지 헷갈릴 수 있습니다.

![기본 로그인 폼과 구글 로그인 버튼이 함께 노출되는 화면](/images/posts/grafana-oss-login-google/002.png)

#### 2. 로그인 폼 비활성화 화면

다음으로 **`grafana-disabled-login` (포트 3001)** 로 접속한 경우입니다. **`GF_AUTH_DISABLE_LOGIN_FORM=true`** 설정이 적용되어 아이디와 비밀번호를 입력하는 폼이 사라졌습니다. 오직 **Sign in with Google** 버튼만 깔끔하게 노출되므로, 사내 구글 계정(구글 워크스페이스)으로 로그인을 통일하여 사용자의 혼선을 방지할 수 있습니다.

![기본 로그인 폼이 숨겨지고 구글 로그인 버튼만 노출되는 화면](/images/posts/grafana-oss-login-google/001.png)

아이디와 비밀번호 입력을 숨기면 사용자는 구글 로그인을 해야 함을 명확하게 인지할 수 있습니다. 하지만, 관리자 계정(`admin`) 으로 접속해야 하는 경우 어떻게 해야 할까? 고민하게 되어버립니다.

이를 고려하여 아이디와 비밀번호 입력으로 우회할 수 있는 방법에 대해 알아보겠습니다.

## 3. GF_AUTH_OAUTH_AUTO_LOGIN 자동 로그인 및 우회

실무에서 구글 로그인 연동을 적용할 때, 기본 로그인 폼을 완전히 비활성화(`GF_AUTH_DISABLE_LOGIN_FORM=true`)하는 대신 **`GF_AUTH_DISABLE_LOGIN_FORM` 설정은 사용하지 않고(기본값 `false`), `GF_AUTH_OAUTH_AUTO_LOGIN=true`를 설정하는 방식**이 더 적합할 수 있습니다.

이렇게 구성하면 일반 사용자는 별도의 과정 없이 연동된 구글 로그인 화면으로 즉시 직행하도록 설정하면서도, 관리자는 비상시나 로컬 계정 진입이 필요할 때 아이디와 비밀번호를 입력하는 로그인 화면으로 안전하게 우회하여 접근할 수 있습니다.

기본 관리자 계정(`admin`) 등에 접속할 때 우회할 수 있는 주소는 **`http://localhost:3001/login?disableAutoLogin=true`** 이며, 이를 위해 두 환경 변수를 다음과 같이 조합하여 구성합니다.

이 방식을 적용하면 역할별로 다음과 같이 유연하게 대응할 수 있습니다.

- **일반 사용자** : `http://localhost:3001/`에 접근 시, 그라파나 로그인 페이지를 거치지 않고 연동된 구글 로그인 화면으로 즉시 자동 리다이렉트됩니다.
- **관리자 (비상 시)** : 구글 OAuth에 문제가 발생하거나 로컬 관리가 필요할 때, 우회 주소인 **`http://localhost:3001/login?disableAutoLogin=true`** 로 접속하여 보존된 기본 ID/PW 입력 폼을 통해 안전하게 로그인할 수 있습니다.

> [!TIP]
> **구글 로그인 페이지 직행 URL과 한계**
> 자동 리다이렉트(`GF_AUTH_OAUTH_AUTO_LOGIN=true`)를 설정하지 않은 상태에서도, **`/login/google`** 경로를 이용하면 구글 로그인으로 바로 진입할 수 있습니다. 다만, 이 주소를 직접 사용하면 이미 로그인된 상태이더라도 접속할 때마다 매번 로그인을 강제 수행하게 되므로 사용성이 떨어지고 불편할 수 있습니다.

## 4. 구글 워크스페이스 허용 도메인 제한 설정

로컬 환경에 도커 컴포즈를 구성하다 보니 **`GF_AUTH_GOOGLE_ALLOWED_DOMAINS`** 라는 아주 유용한 환경 변수도 함께 발견하게 되었습니다. 이 환경 변수를 이용하면 조직에서 사용하는 구글 워크스페이스 도메인만 접근이 가능하도록 완벽하게 허용 제한을 걸 수 있습니다.

이 설정을 적용하면 오직 조직에서 사용하는 도메인(예: `company.com`)으로만 Grafana에 접근할 수 있도록 확실히 제한할 수 있습니다. 이를 통해 개인 Gmail 계정이나 외부 구글 계정의 비정상적인 접근을 완벽히 차단하고, 사내 리소스를 안전하게 보호할 수 있습니다.

이번 실습을 통해 확실히 정리했으니, 내일 출근하면 우리 조직에서 구성해 놓은 그라파나에도 **`GF_AUTH_GOOGLE_ALLOWED_DOMAINS`** 환경 변수가 적절히 적용되어 보안 조치가 되어 있는지 구성하신 분에게 기회가 되면 한번 물어봐야겠습니다.

감사합니다.
