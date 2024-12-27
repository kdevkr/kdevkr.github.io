---
title: Keycloak - Kakao Identity Provider
date: 2024-12-27T23:00+09:00
tags:
- Keycloak
- Kakao
---

키클록(Keycloak)의 렐름(Realm)에 카카오를 IdP(Identity Provider)로 추가하고 카카오 계정으로 사용자 인증을 해보자. 카카오 소셜 프로바이더는 완전하지는 않지만 [OpenID Connect를 지원](https://developers.kakao.com/docs/latest/ko/kakaologin/utilize#oidc)한다. 따라서, <U>OpenID Connect v1.0</U> 를 추가하여 로그인 화면에 노출시킬 수 있다.

####  OpenID Connect Provider 추가

OpenID Connect Provider 추가 시 <U>Discovery endpoint</U> 에 카카오 로그인의 [OpenID Connect Discovery Metadata](https://kauth.kakao.com/.well-known/openid-configuration) 주소를 입력하면 OpenID Connect 메타데이터를 불러와서 자동으로 입력해준다. 그리고 카카오 디펠로퍼스에서 REST API 키와 클라이언트 시크릿을 다음의 메뉴에서 확인하고 설정하자.

- Client ID : 내 애플리케이션 → 앱 설정 → 앱 키 (REST API 키)
- Client Secret : 내 애플리케이션 → 제품 설정 → 카카오 로그인 → 보안 (Client Secret)

![](/images/posts/keycloak-kakao-idp/01.png)

#### 카카오 로그인 OpenID Connect 활성화 설정 및 Redirect URI 추가

카카오 로그인 제품 설정의 OpenID Connect 옵션을 활성화하고 키클록에 추가한 IdP에 표시되는 <U>Redirect URI</U> 주소를 카카오 로그인의 Redirect URI 목록에 추가하자.

![](/images/posts/keycloak-kakao-idp/02.png)

#### Authorization Code Flow with PKCE (Optional)

카카오 프로바이더에서는 <U>RS256</U> 알고리즘 과 <U>PKCE</U>를 지원한다. 단, PKCE 방식은 <U>S256</U>으로 지정되어야한다.

![](/images/posts/keycloak-kakao-idp/03.png)

#### 사용자 콘솔 로그인 화면

카카오 IdP가 추가되었다면 <U>사용자 콘솔(account-console)</U>의 로그인 화면에 카카오 프로바이더가 옵션으로 표시되는 것을 확인할 수 있을 것이다. 

![](/images/posts/keycloak-kakao-idp/04.png)

#### 카카오 계정 로그인 화면

사용자 콘솔의 로그인 화면에서 카카오 프로바이더 이름을 선택하면 카카오 계정 로그인 화면으로 리다이렉트되며 카카오 계정으로 로그인하고 동의 항목에 따라 진행하면 키클록 사용자로 추가된다. 만약, 아래와 같이 <U>카카오 계정(이메일)에 대한 수집 항목</U>에 동의했다면 사용자 이름과 이메일이 모두 이메일로 설정되며 사용자 정보 입력 단계없이 사용자가 만들어지고 사용자 콘솔 화면이 보인다.

![](/images/posts/keycloak-kakao-idp/05.png)

#### Add Identity Provider Mapper

카카오 로그인에 대한 수집 항목에 따라 <U>User Attribute</U> 에 추가하는 것은 개별적인 테스트가 필요해보인다. 예를 들어, <U>Attribute Importer</U>를 통해 Username 를 지정하려고 할때 입력된 클레임 정보가 없다면 빈 값이 들어가서 로그인은 가능하지만 관리자 콘솔의 사용자 목록에서 상세 정보를 확인하거나 삭제하는 것이 불가능하더라.

![](/images/posts/keycloak-kakao-idp/06.png)