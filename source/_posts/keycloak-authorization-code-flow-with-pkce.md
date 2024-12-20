---
title: Keycloak Authorization Code Flow + PKCE
date: 2024-12-20T22:00+09:00
tags:
- SSO
- PKCE
- Keycloak
---

#### Keycloak JavaScript Adapter

```js keycloak.js
await keycloak.init({
    flow: 'standard', // implicit, hybrid
    pkceMethod: 'S256',
    onLoad: 'check-sso'
});
```

[keycloak-js](https://www.keycloak.org/securing-apps/javascript-adapter)는 키클록 서버로부터 인증을 수행할 수 있도록 지원한다. 클라이언트 인증에 대해 Implicit Flow 를 수행한다면 토큰을 바로 발급받을 수 있지만 이 경우 리프레시 토큰을 포함하지 않는다. 그리고 updateToken 함수로 액세스 토큰을 갱신하기 위해서는 리프레시 토큰이 필요하기 때문에 Authorization Code Flow를 수행하는 방식으로 인증해야한다.

#### 프론트 채널 인증에 대한 보안 이슈

Authorization Code Flow 뿐만 아니라 Implicit Flow 는 키클록에서 발급된 토큰 정보가 리다이렉트 주소에 포함되므로 인프라 구성과 트래픽 흐름에 따라 토큰 정보가 노출되거나 가로채어질 수 있다. 따라서, 보안 관점에 따라 백 채널로 인증 과정을 수행하는 것을 검토할 필요가 있다. 더 나아가 프론트 채널에서 Authorization Code Flow를 수행하기 위해서 키클록에서 Capability config의 Client authentication 를 비활성화하는 경우 Authorization 을 활성화 할 수 없다. 

> 클라이언트에 대한 상세 권한 기능이 필요하다면 서버 사이드 인증을 수행해야 합니다.

#### 리프레시 토큰 발급하기

프론트 채널의 Authorization Code Flow 에서 리프레시 토큰을 발급받고자 하는 경우 Advanced 설정에서 OpenID Connect Compatibility Modes 의 Use refresh tokens 가 체크되어 있어야 한다.

##### Settings → Capacity Config

![](/images/posts/keycloak/02.png)

- Client authentication 비활성화
- Authentication flow의 Standard flow 활성화

##### Advanced →  OpenID Connect Compatibility Modes

![](/images/posts/keycloak/03.png)

- Use refresh tokens 활성화
- Advanced Settings의 Proof Key for Code Exchange Code Challenge Method를 S256로 선택

