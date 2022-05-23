---
title: Gmail SMTP
date: 2022-05-23
tags:
- Gmail
- SMTP
---

오래전에 [프리마커 템플릿으로 이메일 발송하기](/sending-mail-with-freemarker-template/)라는 주제로 구글 SMTP 서버를 사용해서 스프링 부트 애플리케이션에서 이메일을 발송하는 것을 다루어 보았었는데요. 구글의 보안 정책의 변경에 따라서 [2022년 5월 30](https://support.google.com/accounts/answer/6010255)일부터는 보안 수준이 낮은 앱의 액세스가 활성된 계정으로는 SMTP 서버를 이용할 수 없게 되었습니다. 그러면 구글 SMTP 서버를 더이상 사용할 수 없는 것일까요?

## Gmail SMTP
보안 수준이 낮은 앱의 액세스를 활성화한 계정에서는 사용자 이름과 비밀번호를 사용해서 Gmail SMTP와 같은 서드 파티 앱에 인증할 수 있었지만 이제는 사용자의 계정을 더 안전하게 보호하기 위해서 사용자 이름과 비밀번호를 사용해서 서드 파티 앱과 기기에 로그인 요청하는 것을 지원하지 않습니다. 이제는 Gmail SMTP 서버를 이용하기 위해서는 보안 수준이 높은 Gmail 계정을 만들고나서 사용자 이름과 비밀번호가 아닌 다른 방식으로 인증을 요청해야만 합니다.

### 2단계 인증 활성화
보안 수준이 높은 Gmail 계정을 만들기 위해서는 먼저 2단계 인증을 활성화하여야 합니다. 구글 계정 관리 > 보안 메뉴에 들어가면 아래와 같이 2단계 인증을 사용중인지를 확인할 수 있습니다.

![](/images/posts/gmail-smtp/02.png)

위와 같이 2단계 인증을 활성화 하지 않았다면 2단계 인증을 클릭해서 안내에 따라서 다음과 같이 인증을 완료하고 2단계 인증을 활성화합니다.

![구글 계정에 입력된 전화번호로 인증](/images/posts/gmail-smtp/03.png)

![전화 또는 문자메시지로 받은 인증번호 입력 후 인증 완료](/images/posts/gmail-smtp/04.png)

![2단계 인증 활성화 완료](/images/posts/gmail-smtp/05.png)

### 앱 비밀번호 추가
2단계 인증이 활성화 되고나서 앱 비밀번호라는 부분이 추가되었습니다. 앱 비밀번호를 추가하면 Gmail SMTP와 같은 2단계 인증을 지원하지 않는 앱에서도 로그인할 수 있다고 알려주는데요. 앞서 말한 사용자 이름과 비밀번호 방식이 아닌 다른 방식으로 인증할 수 있다는 이야기입니다.

![](/images/posts/gmail-smtp/06.png)

![](/images/posts/gmail-smtp/07.png)

이제 발급된 16자리의 앱 비밀번호를 잘 복사해두고 Gmail SMTP 인증에 사용하면 됩니다.

### 이메일 발송
[Gmail SMTP를 사용하기 위한 정보](https://github.com/kdevkr/spring-demo-freemarker/tree/main/src/main/resources/config)는 달라지지 않으며 우리가 수정해야할 부분은 구글 이메일 계정에 대한 비밀번호 대신에 앞서 발급한 16자리의 앱 비밀번호를 사용하는 것입니다. 

![](/images/posts/gmail-smtp/08.png)

더이상 보안 수준 낮은 앱의 액세스 활성화 없이도 Gmail SMTP 서버를 이용해볼 수 있는 것을 확인했습니다.

감사합니다.


