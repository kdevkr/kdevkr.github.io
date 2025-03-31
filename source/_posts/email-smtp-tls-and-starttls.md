---
title: SMTP TLS 와 STARTTLS
date: 2025-03-31T22:00+09:00
tags:
- SMTP
- STARTTLS
- Implict TLS
---

자바 애플리케이션에서 이메일 발송을 위해 SMTP 연결 시 465 또는 587 포트를 사용하면서 TLS 암호화를 수행하는 걸 볼 수 있습니다. 그동안 신경쓰지 않았던 부분이지만 SMTP 연결 시 암호화를 수행하는 방식에는 `암묵적인 TLS 연결(Implict TLS)`과 [기회주의적 TLS](https://en.wikipedia.org/wiki/Opportunistic_TLS) 라고 부르는 `STARTTLS(Explicit TLS)` 방식으로 나누어집니다. 지난 [Simple Java Mail 로 이메일 보내기](/gmail-smtp-with-simplejavamail/)에서는 STARTTLS 방식으로 알려진 587 포트로 연결을 했었음을 알 수 있습니다.

#### STARTTLS?

STARTTLS 는 암묵적으로 TLS 연결을 수행하는 것이 아니라 일반 연결을 수행하고 나서 SMTP 서버에 `STARTTLS 명령을 보내어 암호화 채널로의 전환을 명시적으로 요청`하는 방식입니다. 일반적으로 STARTTLS를 사용하게 된 이유에는 오래전에 RFC 상에서 465 포트가 폐기됨에 따라 587 포트로의 전환이 유도되었다고 하는 사실이 있습니다. [RFC 8314](https://datatracker.ietf.org/doc/html/rfc8314)에서 이메일 제출을 위해서 사용될 [465 포트 등록](https://datatracker.ietf.org/doc/html/rfc8314#section-7.3)이 제안되었고 예전과 다르게 이제는 SSL/TLS 암호화를 사용하는 것이 기본적인 관점이므로 대부분의 SMTP 서버는 TLS 암호화를 지원하고 있습니다.

#### Implict TLS 와 STARTTLS

우리는 SMTP 서버에서 지원하는 방식에 따라 [암묵적 TLS 연결과 STARTTLS 방식을 선택](https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html)할 수 있음을 알 수 있습니다. AWS SES SMTP와 Gmail SMTP 서버처럼 TLS와 STARTTLS를 모두 지원한다면 `암묵적으로 TLS 연결을 바로 수행하는 465 포트 사용을 권장`합니다. 예를 들어, AWS SES SMTP와 Gmail SMTP는 465 포트와 587 포트를 모두 지원하지만 [네이버메일 SMTP](https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html)에서는 명시적인 연결을 수행하는 587 포트, [카카오메일 SMTP](https://cs.kakao.com/helps_html/1073194913)에서는 암묵적으로 연결을 수행하는 465 포트를 사용해야 합니다.

감사합니다.
