---
title: 스프링 동적 이메일 템플릿
date: 2024-01-20T15:00+0900
tags:
- Email Template
- Thymeleaf
- SpringTemplateEngine
- StringTemplateResolver
---

HR 솔루션인 그리팅처럼 [사용자가 직접 이메일 템플릿을 관리](https://blog.greetinghr.com/recruiter-email-template/)하는 건 시스템이나 서비스마다 요구사항이 생길 수 있다. 그리팅 이메일의 경우 내부적인 템플릿은 서비스 자체에서 관리하고 템플릿 변수를 제공하여 이메일 내용만 입력하는 구성이지만 B2B 서비스(솔루션)의 경우 서비스 사업자가 아닌 해당 사업자 정보로 대체하고 싶은 고객들이 생긴다.

스프링 프레임워크 기반의 애플리케이션에서 [Thymeleaf](https://docs.spring.io/spring-framework/reference/web/webmvc-view/mvc-thymeleaf.html), FreeMarker, Mustache 와 같은 템플릿 엔진을 쉽게 사용할 수 있어서 이메일 템플릿을 만들고 컨텍스트 정보와 함께 HTML로 변환하여 이메일로 발송하는 건 [Sending email in Spring with Thymeleaf](https://www.thymeleaf.org/doc/articles/springmail.html)와 같은 예제도 공유되어있어 구현하는건 간단하다. 사용자가 직접 템플릿을 관리하는 방식을 타임리프 템플릿으로 이야기해보자면 StringTemplateResolver 클래스를 통해 아래와 같이 템플릿 파일 경로가 아닌 HTML 문자열 자체로 변환할 수 있다.

```java
@Slf4j
@AllArgsConstructor
@Service
public class MailService {
    private final MessageSource messageSource;

    private SpringTemplateEngine templateEngine;

    @PostConstruct
    public void init() {
        templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(new StringTemplateResolver());
        templateEngine.setTemplateEngineMessageSource(messageSource);
    }

    public String processTemplate(String template, Map<String, Object> variables) {
        return processTemplate(template, variables, Locale.getDefault());
    }

    public String processTemplate(String template, Map<String, Object> variables, Locale locale) {
        if (locale == null) {
            locale = Locale.getDefault();
        }
        return templateEngine.process(template, new Context(locale, variables));
    }
}
```

#### StringTemplateResolver

StringTemplateResolver는 StringTemplateResource를 통해 외부 파일이나 리소스에 액세스하는게 아니라 문자열을 템플릿 자체로 간주하며 기본적으로는 캐시할 수 없다고 설정된다. 아래의 테스트 코드는 클래스패스에 위치한 메일 템플릿 양식을 문자열로 변환하여 처리할 수 있음을 보여준다. 실제로는 데이터베이스에 저장된 템플릿을 사용하게 될 것이다.

```java
@Test
void Test_sendEmail_from_TextTemplate_withHtml() {
    Assertions.assertDoesNotThrow(() -> {
        ClassPathResource resource = new ClassPathResource("templates/mail/2fa.html");
        String html = FileCopyUtils.copyToString(new BufferedReader(new InputStreamReader(resource.getInputStream())));
        // String html = """
        //     <h1>Two-Factor Authentication</h1>
        //     <h2>Hi, [[${name}]]</h2>
        //     <p>The two-step authentication code for the login request is as follows.</p>
        //     <p>Please enter it on the authentication screen within the time limit.</p>
        //     <p>Verification Code: <span style="font-size:20px;">[[${code}]]</span></p>
        //     """;
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", "Mambo");
        variables.put("code", 123456);

        String htmlContent = mailService.processTemplate(html, variables, Locale.forLanguageTag("ko_KR"));
        Recipient recipient = new Recipient("Mambo", "kdevkr@gmail.com", Message.RecipientType.TO);
        Email email = mailService.prepare("[Auth] Requested Two Factor Authentication", htmlContent, recipient);
        MimeMessage mimeMessage = mailService.convertTo(email);
        mailService.send(mimeMessage);
    });
}
```

> 위 코드에서는 주석을 통해 2fa.html 파일에 2차 인증을 위한 이메일 템플릿이 어떻게 작성되었는지를 보여줍니다.

#### 텍스트 템플릿 모드

위 예시에서는 일반적인 템플릿 표현식이 아니라 텍스트 모드의 템플릿 표현식을 사용했다. 프론트엔드 기술에 의해서 사용자가 이메일 템플릿을 쉽게 작성할 수 있게 지원하면 좋지만 그것이 준비되기 전에는 위와 같이 텍스트 모드로 작성하여 조금은 더 쉽게 표현할 수 있다. 

- [Expression inlining](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#expression-inlining)
- [Textual template modes](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#textual-template-modes)
- [Expression Utility Objects](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#appendix-b-expression-utility-objects)

#### 동적 템플릿으로 발송된 이메일

![](/images/posts/spring-dynamic-email-template/01.png)
