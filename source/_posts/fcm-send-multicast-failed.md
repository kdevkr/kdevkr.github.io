---
title: 레거시 FCM 발송 불가
date: 2024-11-03T23:00+09:00
tags:
- Firebase Admin Java SDK
- Deprecated
---

#### [FCM features deprecated in June 2023](https://firebase.google.com/support/faq#fcm-23-deprecation)

![](/images/posts/fcm-send-multicast-failed/01.png)

> java.lang.IllegalArgumentException: No enum constant com.google.firebase.ErrorCode.UNIMPLEMENTED

Firebase 콘솔 관리자에게 레거시 API 제한에 대한 메일이 사전에 전달되었으며, 링크 내용에 따라 **2024년 6월 21일 부터 배치 전송에 대한 요청이 실패**할 수 있다. Firebase Admin Java SDK의 레거시 버전을 사용중이며 sendMulticast를 호출하고 있다면 **9.2.0 이상의 최신 버전으로 변경하고 sendEachForMulticast를 사용해야**한다.

- Upgrade firebase-admin-java:9.2.0+
- Use sendEachForMulticast instead of sendMulticast

#### 관련 링크
- https://firebase.google.com/support/faq#fcm-23-deprecation
- https://github.com/firebase/firebase-admin-java/issues/976