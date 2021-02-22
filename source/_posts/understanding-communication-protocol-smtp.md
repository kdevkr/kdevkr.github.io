---
title: 통신 프로토콜 이해하기 시리즈 - SMTP
date: 2021-02-22
categories:
- Communication Protocol
tags:
- protocol
- smtp
---

통신 프로토콜 이해하기 시리즈는 컴퓨터 또는 디바이스 간 통신에 사용되는 다양한 프로토콜을 이해하는 시간을 가집니다. 실무에서 다양한 프로젝트를 진행하다보면 통신에 사용되는 프로토콜이 다양하다는 것을 느낄 수 있습니다. 이번 통신 프로토콜 이해하기 시리즈에서 살펴볼 통신 프로토콜은 `SMTP`입니다.

## SMTP
SMTP(Simple Mail Transfer Protocol)은 메일 서버간 이메일 송수신에 사용되는 네트워크 프로토콜로 25 포트를 할당합니다. 

### 메일 서버별 SMTP 프로토콜 설정
메일 서버별 SMTP 프로토콜 설정 정보를 통해 잘 알려진 메일 서버들이 25번 포트가 아니라 `SMTP over SSL`인 경우에는 `465` 포트를 할당하며 더 나아가 `SMTP over TLS`인 경우 `587` 포트를 할당하는 것을 알 수 있습니다.

#### Gmail
- SMTP 주소: smtp.gmail.com
- SSL 포트: 465
- TLS/STARTTLS 포트: 587
- Auth: 예

#### Daum
- SMTP 주소: smtp.daum.net
- SSL 포트: 465

#### Naver
- SMTP 주소: smtp.naver.com
- SSL 포트: 465
- TLS 포트: 587

### 구글 SMTP 메일 서버
다양한 메일 서버 또는 [James](https://james.apache.org/index.html)를 통해 자체 메일 서버를 구축할 수 있으나 구글 이메일 계정을 통해 메일 발송을 위한 SMTP 메일 서버를 사용할 수 있습니다.

#### 보안 수준이 낮은 앱의 액세스
구글 이메일 계정으로 구글 SMTP 메일 서버를 사용하기 위해서는 구글 이메일 계정에 대한 [보안 수준이 낮은 앱의 액세스](https://www.google.com/settings/security/lesssecureapps)를 허용해야 합니다.

## 참고
- [SMTP | 정보통신기술용어해설](http://www.ktword.co.kr/abbr_view.php?m_temp1=196)
- [Which SMTP Port Should I Use? | Mailgun](https://www.mailgun.com/blog/which-smtp-port-understanding-ports-25-465-587/)
- [이메일 클라이언트의 SMTP와 기타 설정 변경 | Gmail](https://support.google.com/mail/answer/7126229?hl=ko)