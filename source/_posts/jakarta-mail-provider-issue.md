---
title: 자카르타 메일 프로바이더 오류
date: 2024-09-07T00:00+09:00
tags:
- 문제해결
- 트러블슈팅
toc:
  enable: false
---

# 👩‍💻 사용자 로그인 시 2차 인증 메일이 안와요

개발중인 애플리케이션 서버를 QA가 배포하고나서 사용자 로그인 시 **2차인증을 수행하기 위한 인증코드 메일이 수신이 안된다**는 버그 리포트를 해주었어요. 갑자기 어떤 문제로 인해 이메일이 발송되지 않았는지와 해결과정에 대해서 공유해보려고 합니다.

## 문제 원인 분석

먼저, 해당 서버에는 예외 상황을 추적할 수 있도록 Sentry가 도입되어 있는 상태였습니다. Sentry 에서는 수집된 예외가 없었기 때문에 즉시 알아채지 못하는 상황에 해당합니다. 아무튼, 애플리케이션 서버 로그를 확인하기 위해서 리눅스 서버에 접속하고 도커 컨테이너에 기록된 최근 로그를 살펴보았습니다.

```sh
# docker compose logs --since '2024-09-06T16:00+09:00' app
docker compose logs --since '5m' app
app | ... caused by: Not provider of jakarta.mail.util.StreamProvider was found
```

> 도커 컴포즈에서 --since 옵션을 사용하면 원하는 시점부터의 로그를 확인할 수 있어요

서버 로그에는 위와 같이 자카르타 메일의 StreamProvider를 찾을 수 없다는 오류 메시지가 남아있었는데요. 처음보는 오류 메시지 이므로 구글 검색을 해보니 [자카르타 메일 관련 깃허브에 이슈로 등록된 내용이 있음](https://github.com/jakartaee/mail-api/issues/665)을 확인했습니다. 이슈 내용은 젠킨스 플러그인에서 Jakarta Mail API 2.1.1 을 사용하면 위와 동일한 오류가 발생한다는 것이었습니다. 동일하게 젠킨스에서 발생한 것은 아니지만 [실행가능한 Jar 에서 클래스로더가 올바르지 않는다](https://github.com/spring-projects/spring-boot/issues/39843)는 이슈를 보게되었고 자카르타 메일에 대한 라이브러리 버전을 확인해보았습니다.

서버 애플리케이션에 해당되는 [스프링 부트 3.1.2의 의존성 버전 정보](https://docs.spring.io/spring-boot/docs/3.1.2/reference/html/dependency-versions.html)에서 검색을 해보니 아래와 같이 파악되었습니다.

- org.eclipse.angus:angus-mail:1.1.0
- org.eclipse.angus:angus-activation:2.0.1
- jakarta.mail:jakarta.mail-api:1.1.0
- jakarta.activation:jakarta.activation-api:2.1.2

우선 변경사항에서 의심되는 부분이 발견되지 않았기에 의존성 버전을 변경하여 배포를 시도해보아야 했습니다. build.gradle에 아래와 같이 **Jakarta Mail API 2.1.3** 를 추가하고 빌드 및 배포를 수행해보았습니다.

```groovy build.gradle
ext {
    set('angus-mail.version', '2.0.3') // from 1.1.0
    set('jakarta-mail.version', '2.1.3') // from 2.1.2
}
```

새롭게 배포된 애플리케이션에서도 메일이 발송되지 않았고 아래와 같은 **새로운 오류 메시지**가 남았습니다.

```sh
Provider for jakarta.activation.spi.MailcapRegistryProvider cannot be found
```

Jakarta Mail API 버전을 변경하면 **jakarta.activation-api** 도 변경될거라 생각했는데요. 디펜던시 트리를 자세히 살펴보지 않은게 대응 과정에서의 실수였습니다. 아래와 같이 **jakarta-activation** 에 대한 버전을 추가로 지정하고 다시 배포했습니다.

```groovy build.gradle
ext {
    set('angus-mail.version', '2.0.3')
    set('angus-activation.version', '2.0.2') // from 1.1.0
    set('jakarta-mail.version', '2.1.3')
    set('jakarta-activation.version', '2.1.3') // from 2.1.2
}
```

### 👩‍💻 2차 인증 메일 제대로 와요‼

일단 급하게 해결은 되었으니 다행이지만 더 자세한 내용에 대해서 살펴보아야겠죠? 먼저, 의존성 버전을 올리는 것은 많은 테스트가 필요한 위험한 작업임을 되돌아봐야합니다. 해당 프로젝트는 릴리즈한 제품은 아니었기에 운영 환경이 없었고 문제가 발생했던 것은 테스트 엔지니어가 기능 확인할 수 있는 테스트 환경이었기에 가능했습니다.

또한, 해당 오류는 로컬 환경에서 인텔리제이 IDE로 실행되는 애플리케이션에서는 발생하지 않았는데요. 실행가능한 Jar 에서 문제가 발생할 수 있다는 정보는 문제가 해결하고나서 더 자세한 내용을 찾아보고 정리하는 단계에서 알게되었습니다. 로컬에서 빌드하고 실행해보지 않은 접근에 대해서는 아쉬운 부분으로 생각되므로 개선해야할 부분 같습니다.

## 문제 해결 정리

> Not provider of jakarta.mail.util.StreamProvider was found
> Provider for jakarta.activation.spi.MailcapRegistryProvider cannot be found

- 스프링 부트에서 ForkJoinPool를 사용하는 경우 **Executable Jar** 에서 클래스로더가 올바르지 않을 수 있음
- 문제가 되었던 코드에는 **ParallelStream** 을 사용했기에 내부적으로 **ForkJoinPool**을 호출하는 상태
- Jakarta Mail 2.1.2 이하 버전에서 클래스로더가 **Jakarta Provider SPI**를 찾을 수 없는 결함이 있음
- Jakarta Mail 2.1.3 을 사용하기 위해서는 **Angus Mail Provider 2.0.3** 을 추가해야함

※ Angus Mail 은 Jakarta Mail Specification 2.1+ 에 대한 구현체 프로젝트라고 해요.

감사합니다.
