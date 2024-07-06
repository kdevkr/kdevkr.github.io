---
title: PWA 와 FCM 푸시 알림
date: 2024-07-06T22:00:00+09:00
tags:
- PWA
- FCM
---

#### PWA의 서비스 워커는 HTTPS를 요구

PWA 앱에서 푸시 알림을 보내기 위해서는 사용자가 사이트 또는 앱에 대한 알림 권한을 허용해야하며 PWA 앱이 종료되어있어도 백그라운드 상태에서 동작하는 서비스 워커가 필요하다. Vite 기반으로 구성되어있는 프로젝트에서는 [PWA Plugin for Vite](https://vite-pwa-org.netlify.app/)로 쉽게 PWA 설치 지원과 함께 서비스 워커를 등록할 수 있게 설정할 수 있다. 서비스 워커는 HTTPS 에서 동작해야하므로 개발 환경에서는 [vite-plugin-mkcert](https://github.com/liuweiGL/vite-plugin-mkcert)가 도움이 될 수 있다.

#### 서비스 워커의 상태 변경을 고려하기

서비스 워커의 생명 주기를 이해하고 새로 설치되거나 업데이트되는 서비스 워커로 인해 메시지 수신이 원활하지 않을 수 있다는 점을 인지해야한다. [ServiceWorkerGlobalScope.skipWaiting](https://developer.mozilla.org/ko/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting) 이나 [Clients::claim()](https://developer.mozilla.org/ko/docs/Web/API/Clients/claim)이 도움이 될 수도 있다.

##### 서비스 워커 파일이 firebase-messaging-sw.js 일 필요는 없다

```js main.js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(
        import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw',
        {type: import.meta.env.MODE === 'production' ? 'classic' : 'module'}
    ).then(registration => {
        console.log('register service worker', registration)
    })
}
```

FCM 관련 일부 글에서 서비스 워커의 파일이 반드시 `firebase-messaing-sw.js` 이어야 한다고 언급하는데 잘못된 정보에 해당되며 FCM 메시지 수신을 위해서 PWA 앱에서 사용중인 `서비스 워커 내에 Firebase SDK를 초기화`하는게 중요한 부분이다. 위 코드와 같이 개발 환경에서는 [dev-sw.js](https://vite-pwa-org.netlify.app/guide/development#injectmanifest-strategy)를 서비스 워커로 등록하여 사용할 수 있음을 보여준다.

#### FCM 푸시 알림이 여러번 표시되는 문제 🔥

[PWA 앱의 푸시 알림에서 FCM 메시지가 여러번 표시되는 문제](https://github.com/kdevkr/mambo-box/blob/main/errors/2024-07-06.md)와 같이 백그라운드 상태에 있는 PWA 앱에서 푸시 알림이 여러번 표시되는 이유는 [자바스크립트 클라이언트에서 메시지 수신](https://firebase.google.com/docs/cloud-messaging/js/receive?hl=ko)시 알림 메시지에 의한 기본 화면 표시에 대해 고려하지 않은 문제에 해당된다. 자바스크립트 클라이언트에서 커스텀 메시지로 푸시 알림을 제공하고 싶다면 서버에서는 알림 메시지가 포함되지 않은 데이터 메시지로 구성하여 전달해야한다.

#### 자바스크립트 클라이언트 API 키는 안전하다

일반적으로 자바스크립트로 동작하는 SDK에 대한 키는 외부에 노출될 수 밖에 없으므로 FCM 메시지를 수신할 수 있는 최소한의 권한을 보유한다. FCM 콘솔에서 [웹 푸시 인증서](https://developer.chrome.com/blog/web-push-interop-wins?hl=ko#introducing_vapid_for_server_identification)는 `최대 2개까지 발급`할 수 있으므로 `VAPID`를 환경별로 나누어서 사용하는 것도 좋아보인다. 더 자세한 내용은 [Firebase용 API 키 사용 및 관리에 대해 알아보기](https://firebase.google.com/docs/projects/api-keys?hl=ko)를 참고하여 고려해보도록 하자.

#### 시스템 규모에 따른 토큰 관리 전략

[FCM 등록 토큰 관리를 위한 권장사항](https://firebase.google.com/docs/cloud-messaging/manage-tokens?hl=ko)과 [FCM 메시지를 대규모로 전송할 때의 권장사항](https://firebase.google.com/docs/cloud-messaging/scale-fcm?hl=ko)를 참고하여 시스템에 저장되어 메시지 전송 시 사용되는 토큰의 수를 관리하는게 필요하다. 서버에서는 사용자가 PWA 앱을 삭제하는지를 감지하여 더이상 토큰이 사용되지 않는지 알 수 없다. FCM 메시지 전송 시 무제한으로 발송할 수는 없으므로 오랫동안 사용되지 않거나 만료된 토큰은 주기적으로 삭제하는 작업이 있어야한다.

#### iOS의 PWA 앱 지원 여부

안드로이드와 크롬 브라우저와 달리 iOS 또는 사파리 브라우저에 따라 PWA 앱 설치 및 푸시 API를 지원하는지의 여부가 다름을 인지해야한다. 또한, 홈 화면으로 추가되는 앱은 반드시 기본으로 제공되는 사파리 브라우저로 실행되는 것도 중요한 부분에 해당된다.

- [Safari 16.1 and macOS 16.4 iOS & iPadOS 부터 Push API 지원](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- [유럽 연합의 국가에서 iOS 17.4 이상에서 PWA 지원 종료](https://developer.apple.com/support/dma-and-apps-in-the-eu/)
