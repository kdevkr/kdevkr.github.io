---
title: 키클록 커스터마이징
date: 2024-12-21T09:00+09:00
tags:
- Keycloak
- User Federation
---

키클록(Keycloak)을 도입하여 통합 인증을 구현하는 경우 기본적인 인증과 인가에 대해서는 해결해주므로 편리할 것 같지만 시스템에서 필요로 하는 모든 요구사항을 커버해주지는 않는다. 일부 시스템에서 요구되는 기능을 처리하고자 하는 경우에는 [Server Developer Guide](https://www.keycloak.org/docs/latest/server_development/)를 참고하여 원하는 동작을 수행할 수 있도록 커스터마이징 해야한다. 

#### 키클록 로그인 테마

[Keycloakify](https://www.keycloakify.dev/)를 통해 직접 프리마커 템플릿을 작성하지 않고서 커스텀 테마를 구성할 수 있는 것 같지만 아무래도 조직에서 리액트를 다루고 있지 않으므로 키클록 테마를 커스터마이징하는 것이 가장 공수가 큰 부분일 것 같다.

- [Customizing Themes for Keycloak](https://www.baeldung.com/spring-keycloak-custom-themes)
- [Customizing the Login Page for Keycloak](https://www.baeldung.com/keycloak-custom-login-page)

#### 외부 사용자  DB를 연동하고자 하는 경우

일반적으로 User Federation 을 위해 외부 사용자 DB를 사용할 수 있도록 User Storage SPI 의 [UserStorageProvider](https://www.keycloak.org/docs/latest/server_development/#_user-storage-spi)를 구현해야한다. 키클록이 관리하는 [사용자 식별자 에 대한 형식(Storage Ids)](https://www.keycloak.org/docs/latest/server_development/#storage-ids)에 대해서 알아야할 것 같다.

#### 로그인 시 OTP 코드를 이메일 또는 SMS 로 받으려는 경우

키클록에서 제공하는 Configure OTP의 경우 TOTP Authenticator를 등록하는 방식으로 진행하기 때문에 OTP 코드를 [이메일](https://github.com/mesutpiskin/keycloak-2fa-email-authenticator), [SMS](https://github.com/cooperlyt/keycloak-phone-provider) 또는 카카오 알림톡으로 보내기 위해서는 이에 대한 [Service Provider Interface](https://medium.com/@shreyasmk.mathur/mastering-multi-factor-authentication-in-keycloak-sms-email-and-totp-setup-guide-957305b92be1) 를 구현해야한다.

#### 서비스 애플리케이션에서 OTP 또는 패스키 등록

키클록의 사용자 콘솔(Account Console)에서 Authenticator 또는 Passkey를 등록하는 것을 서비스 애플리케이션에서 구현하여 수행할 수 있는지는 더 찾아봐야할 것 같다. 만약, 불가능한 경우 키클록 사용자 콘솔에 대한 [테마를 커스터마이징](https://www.baeldung.com/spring-keycloak-custom-themes) 할 수 밖에 없을 것 같다.

#### 사용자 인증 시 새로운 디바이스에 대한 알림을 제공하는 경우

[Event Listener SPI](https://www.keycloak.org/docs/latest/server_development/#_events)의 EventListenerProvider를 구현하여 로그인 이벤트를 감지하고 인증된 디바이스 세션 정보를 토대로 새로운 디바이스에 대한 알림을 구현할 수 있다. 키클록 자체적으로 신규 발급 여부를 제공해주지는 않으므로 별도의 저장소에 디바이스에 대한 정보를 저장하고 비교하는 방식으로 구현해야할 것 같다.