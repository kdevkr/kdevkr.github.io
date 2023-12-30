---
title: Simple Java Mail 로 이메일 보내기
date: 2023-12-30T23:00+0900
tags:
- Gmail SMTP
- Simple Java Mail
---

[Gmail SMTP](/gmail-smtp/) 을 작성하면서 구글 계정으로 이메일을 발송하는 것을 다룬 것도 1년이 넘게 지났다. 스프링 부트 기반의 프로젝트에서 spring-boot-starter-mail 모듈을 통해 JavaMailSender로 이메일을 보낼 수 있는 구현을 쉽게 찾아볼 수 있다. 우연히 알게된 [Simple Java Mail](https://www.simplejavamail.org/) 라이브러리는 JavaMailSender 와 MimeMessageHelper와 같은 클래스에 익숙하지 않은 초보 개발자들에게 간단하게 메일 발송을 할 수 있도록 API를 제공해준다.

#### Features

이메일 발송에 대한 설정을 깊게 들어가면 어려울 수 있으나 초보 개발자에게 적합한 특징은 아래와 같다.

- [Fluent API](https://www.simplejavamail.org/features.html#section-builder-api)
- [Spring Support](https://www.simplejavamail.org/configuration.html#section-spring-support)
- [Thread-Safe](https://www.simplejavamail.org/features.html#section-reusable-mailer)
- [이메일 검증 지원](https://www.simplejavamail.org/features.html#section-email-validation)

#### SSL and TLS with Google mail

기존에 [프리마커 템플릿으로 이메일 발송하기](/sending-mail-with-freemarker-template/) 에서 처럼 Gmail SMTP 서버를 이용할 때 STARTTLS 방식을 사용했었던 것처럼 어떻게 설정해야하는지를 [SSL and TLS with Google mail](https://www.simplejavamail.org/features.html#section-gmail)에서 설명해주고 있다. STARTTLS 방식은 [SMTP_TLS](https://www.simplejavamail.org/security.html#section-transport-strategy-tls)를 사용해야함을 알 수 있다.

```java
@Import(SimpleJavaMailSpringSupport.class)
@SpringBootApplication
public class SimpleMailApplication {
    public static void main(String[] args) {
        SpringApplication.run(SimpleMailApplication.class, args);
    }
}
```

```yml application.yml
simplejavamail.javaxmail.debug: true
simplejavamail.smtp.host: smtp.gmail.com
simplejavamail.smtp.port: 587
simplejavamail.transportstrategy: SMTP_TLS
simplejavamail.smtp.username: kdevkr@gmail.com
simplejavamail.smtp.password: '앱 비밀번호'
```

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class GmailSmtpTests {
    @Autowired
    Mailer mailer;

    @Test
    void sendMail() {
        Assertions.assertDoesNotThrow(() -> mailer.testConnection());

        Email email = EmailBuilder.startingBlank()
                .from("Mambo <kdevkr@gmail.com>")
                .to("kdevkr@gmail.com")
                .withSubject("Java Mail Test with simplejavamail")
                .withPlainText("Hello world")
                .buildEmail();

        Assertions.assertDoesNotThrow(() -> mailer.sendMail(email));
    }
}
```

> 앱 비밀번호 발급은 [Gmail SMTP](/gmail-smtp/) 글을 참고하세요.

#### Convert Email to MimeMessage

EmailConverter, MailerHelper, JMail 클래스를 통해 유용한 기능을 제공하는데 EmailConverter를 이용하면 Email 을 MimeMessage로 변환하는 것을 제공해주기 때문에 JavaMailSender와의 통합도 유용해보인다.

```java
Email email = EmailBuilder.startingBlank().buildEmail();
MimeMessage mimeMessage = EmailConverter.emailToMimeMessage(email);
```

> 더 자세히 spring-boot-starter-mail 과 비교해보고 싶다면 [Feature Comparison Matrix](https://www.simplejavamail.org/feature-matrix.html) 문서를 참고해보세요.
