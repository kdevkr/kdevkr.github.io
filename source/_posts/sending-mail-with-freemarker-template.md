---
title: 프리마커 템플릿으로 이메일 발송하기
date: 2019-03-19
updated: 2022-03-04
comments: true
---

> 현재 조직에서는 스프링 부트의 기본 템플릿 엔진인 타임리프를 사용하지 않고 이메일 발송에는 프리마커 템플릿 엔진을 사용해서 변환한 HTML 형식의 이메일을 전달합니다. 

## 프리마커 템플릿 엔진
일반적으로 많이 사용되는 템플릿 엔진은 [타임리프](https://www.thymeleaf.org/)이기는 하지만 사용하기 어려운 문법과 다른 템플릿 엔진과의 렌더링 성능 문제로 인하여 이메일 발송처럼 대량으로 렌더링할 가능성이 있다면  [FreeMarker](https://freemarker.apache.org/) 또는 [Mustache](https://mustache.github.io/) 템플릿 엔진을 사용하는 것이 좋습니다. 

### 프리마커 스타터
스프링 부트 프리마커 스타터 의존성을 통해 프리마커 템플릿으로 이메일을 발송하기 위한 라이브러리들을 참조합니다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-freemarker'
    implementation 'org.springframework.boot:spring-boot-starter-mail'
}
```

### SMTP 메일 서버
이메일을 발송하기 위해서는 SMTP 프로토콜을 사용하는 메일 서버가 필요합니다. 많은 무료 메일 서버 솔루션이 있으나 일반적으로 많이 사용하는 구글이나 네이버 이메일 계정의 몇가지 설정을 통해서 SMTP 메일 서버를 이용할 수 있습니다. 

#### Gmail SMTP
지메일 계정으로 발신 메일 서버를 이용하기 위해서는 다음과 같이 인증 옵션과 함께 SSL(465) 또는 TLS(587)용 포트를 사용해야합니다.

```.properties
spring.mail.protocol=smtp
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=username@gmail.com
spring.mail.password=password
spring.mail.properties.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.test-connection=true
```

##### 지메일 계정 인증 오류
메일 서버 연결 시 다음과 같이 인증 오류가 발생하는 경우 [보안 수준이 낮은 앱의 액세스](https://myaccount.google.com/u/0/lesssecureapps)를 허용해야합니다. 

```sh
Caused by: java.lang.IllegalStateException: Mail server is not available
...
Caused by: javax.mail.AuthenticationFailedException: 535-5.7.8 Username and Password not accepted. Learn more at
```

> 보안 정책 변경에 따라 [2022년 5월 30일](https://support.google.com/accounts/answer/6010255)부터는 지메일 계정으로 SMTP 서버를 이용할 수 없을 수 있습니다. 

### 자바 이메일 발송
지메일 계정으로 SMTP 서버에 인증까지 완료했다면 실제로 이메일을 발송할 수 있는지 테스트 해보아야 합니다.

```java
@SpringBootTest
class GmailSmtpTests {

    @Autowired
    private JavaMailSenderImpl javaMailSender;

    @Test
    void sendMail() {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, StandardCharsets.UTF_8.name());

        mimeMessageHelper.setFrom("Mambo <kdevkr.gmail.com>");
        mimeMessageHelper.setTo("kdevkr@gmail.com");
        mimeMessageHelper.setSubject("Java Mail Test");
        mimeMessageHelper.setText("<h5>Hello World</h5>", true);

        javaMailSender.send(mimeMessage);
    }
}
```

#### 프리마커 템플릿 적용하기
프리마커 템플릿 파일을 작성하고 템플릿 엔진을 사용해서 HTML 형식의 문자열을 이메일 내용으로 전달하여 발송하도록 구현하면 됩니다. 저는 [HTML Email Template 만들기](https://heropy.blog/2018/12/30/html-email-template/)라는 글을 참고하여 템플릿을 작성하였습니다.

```java
@SpringBootTest
class GmailSmtpTests {

    @Autowired
    private JavaMailSenderImpl javaMailSender;

    @Autowired
    private FreeMarkerConfigurationFactoryBean configurationFactoryBean;

    @Test
    void sendMail() {
        Configuration configuration = configurationFactoryBean.createConfiguration();
        Template template = configuration.getTemplate("email.ftlh");

        Map<String, Object> model = new HashMap<>();
        model.put("title", "Java Mail Test");
        model.put("content", "Hello World");
        String content = FreeMarkerTemplateUtils.processTemplateIntoString(template, model);

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, StandardCharsets.UTF_8.name());

        mimeMessageHelper.setFrom("Mambo <kdevkr.gmail.com>");
        mimeMessageHelper.setTo("kdevkr@gmail.com");
        mimeMessageHelper.setSubject("Java Mail Test with FreeMarker");
        mimeMessageHelper.setText(content, true);

        javaMailSender.send(mimeMessage);
    }
}
```

> 기본 프리마커 템플릿 폴더는 클래스패스의 **templates** 입니다.
> spring.freemarker.template-loader-path=classpath:/templates/

![](/images/posts/sending-mail-with-freemarker-template/example.png)

감사합니다.

## 참고

- [Spring Boot Docs - Template Engines](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.servlet.spring-mvc.template-engines)
- [SpringHow - Send HTML emails with FreeMarker Templates](https://springhow.com/spring-boot-email-freemarker/)
- [Introduction to Using FreeMarker in Spring MVC](https://www.baeldung.com/freemarker-in-spring-mvc-tutorial)
