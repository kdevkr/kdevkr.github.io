---
title: 벨리데이션 오류 메시지가 사용자 언어로 처리되지 않은 이유
date: 2022-02-17
tags:
- Jakarta Bean Validation
- Hibernate Validator
---

> 스프링 부트 애플리케이션에서 벨리데이션 오류 메시지가 사용자가 언어로 처리되지 않는 사유를 경험하여 이와 같은 문제가 발생한 이유에 대해서 알아보고 스프링에서 제공하는 벨리데이션에 대해서 정리한 글입니다.

## 자카르타 벨리데이션
스프링 부트 애플리케이션에서는 벨리데이션 스타터를 통해 [자카르타 벨리데이션](https://beanvalidation.org/2.0/) 기반의 [하이버네이트 벨리데이터](https://hibernate.org/validator/)를 사용하여 벨리데이션을 수행할 수 있는 기능을 제공합니다. 이 스타터가 포함되면 **ValidationAutoConfiguration**이라는 자동 구성 클래스를 통해 기본적인 벨리데이터(Validator)를 사용할 수 있도록 빈으로 등록해줍니다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```

그래서 스프링 부트 개발자들은 별도의 설정없이 컨트롤러 핸들러 함수에 전달되는 사용자 요청 정보를 간단하게 검증할 수 있게 됩니다. 또한, 하이버네이트 벨리데이터 라이브러리에는 벨리데이션을 위한 어노테이션에 대한 기본적인 **벨리데이션 메시지 소스 번들** 을 포함하고 있어 한국어나 영어와 같이 주요 국가에서 사용하는 언어에 대해서는 메시지를 처리하여 번역된 메시지를 사용자에게 제공할 수 있습니다.

![org.hibernate.validator.ValidationMessages](/images/posts/spring-validation/hibernate-validator-01.png)

### 유효성 검사
[Validation 어디까지 해봤니?](https://meetup.toast.com/posts/223)에서 알 수 있듯이 자카르타 벨리데이션의 팩토리 함수를 통해 간단하게 벨리데이터를 생성하고 자바 빈 클래스에 저장된 정보가 올바른지 필드 검증을 쉽게 수행할 수 있습니다.

```java
@Service
public class LoginService {
    public boolean validate(Account.Login login) {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        Set<ConstraintViolation<Account.Login>> constraintViolations = validator.validate(login);
        return constraintViolations.isEmpty();
    }
}
```

### 로케일 이슈
자카르타 벨리데이션의 팩토리 함수로 만들어지는 벨리데이터는 기본값으로 정의된 설정을 통해서 벨리데이션을 수행하기 때문에 `사용자의 언어 정보에 따라 벨리데이션에 대한 오류 메시지가 번역되지 않는 문제`가 있습니다. 이러한 문제는 고객의 요구사항에 의해서 CSV 또는 엑셀 파일을 업로드하여 웹 서비스를 이용할 때 필수로 등록되어야하는 과정을 벌크 형식으로 지원해야했고 구현 과정에서 애플리케이션 컨텍스트에 등록된 벨리데이터가 아닌 팩토리 함수로 만들어지는 벨리데이터를 사용해서 벨리데이션을 수행하면서 발견되었습니다.

```sh
LoginController : [ConstraintViolationImpl{interpolatedMessage='공백일 수 없습니다', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
LoginController : locale: en_US
```

> 위와 같이 로그인 요청 정보에 대한 벨리데이션을 수행하였고 로그인 요청을 한 사용자의 언어 정보와 함께 벨리데이션 오류에 대한 메시지를 출력해보면 사용자의 언어가 아니라 시스템 로케일 정보인 한국어로 메시지가 번역되어 처리되었음을 확인할 수 있습니다.

```java
MessageInterpolator messageInterpolator = Validation.byDefaultProvider().configure().getDefaultMessageInterpolator();
if (messageInterpolator instanceof ResourceBundleMessageInterpolator) {
    log.info("defaultMessageInterpolator is ResourceBundleMessageInterpolator");
}
Validator validator = Validation.byDefaultProvider()
                .configure()
                .messageInterpolator(messageInterpolator)
                .buildValidatorFactory()
                .getValidator();

Set<ConstraintViolation<Account.Login>> constraintViolations = validator.validate(loginInfo);
```

기본 메시지 인터폴레이터를 가져와서 ResourceBundleMessageInterpolator 클래스의 인스턴스인지를 비교해보면 위 로그가 출력되는 것을 확인할 수 있습니다. 그리고 동일하게 사용자 언어가 아닌 시스템 로케일을 기반으로 메시지가 처리됨을 보여줍니다.

```
LoginController : defaultMessageInterpolator is ResourceBundleMessageInterpolator
LoginController : [ConstraintViolationImpl{interpolatedMessage='공백일 수 없습니다', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
LoginController : locale: en_US
```

## 사용자 언어 기반의 메시지 처리
기본 벨리데이터는 시스템 로케일을 기반으로 메시지가 처리됨을 확인하였으니 사용자의 언어 정보를 기반으로 메시지를 처리하기 위해서는 어떻게 하여야하는지 알아보도록 하겠습니다. [MessageInterpolator](https://docs.jboss.org/hibernate/validator/3.0/api/org/hibernate/validator/MessageInterpolator.html) 인터페이스를 사용하여 메시지를 처리하도록 되어있기 때문에 사용자의 언어 정보를 사용하는 MessageInterpolator를 적용해야합니다.

스프링에서 사용자의 요청에 의한 스레드 내에서는 LocaleContextHolder 클래스를 통해 사용자의 로케일 정보를 쉽게 가져올 수 있도록 제공합니다. 그리고 이 클래스를 사용해서 로케일 정보를 가져와서 메시지를 처리하는 [**LocaleContextMessageInterpolator**](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/beanvalidation/LocaleContextMessageInterpolator.html)를 제공하고 있습니다.

기본 메시지 인터폴레이터인 ResourceBundleMessageInterpolator를 LocaleContextMessageInterpolator의 생성자로 전달하여 MessageInterpolator를 대체하여 적용해보도록 하겠습니다.

```java
MessageInterpolator messageInterpolator = Validation.byDefaultProvider().configure().getDefaultMessageInterpolator();
if (messageInterpolator instanceof ResourceBundleMessageInterpolator) {
    log.info("defaultMessageInterpolator is ResourceBundleMessageInterpolator");
}

messageInterpolator = new LocaleContextMessageInterpolator(messageInterpolator);

Validator validator = Validation.byDefaultProvider()
        .configure()
        .messageInterpolator(messageInterpolator)
        .buildValidatorFactory()
        .getValidator();

Set<ConstraintViolation<Account.Login>> constraintViolations = validator.validate(loginInfo);
```

그리고 다시 사용자의 로그인 요청을 수행해보고 어떻게 벨리데이션 오류 메시지가 번역되는지 확인해보죠.

```sh
LoginController : [ConstraintViolationImpl{interpolatedMessage='must not be blank', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
LoginController : locale: en_US
```

> 앞선 과정을 통해서 벨리데이션에 대한 메시지 처리는 MessageInterpolator를 사용하므로 LocaleContextMessageInterpolator를 적용하면 스프링에서 관리하는 로케일 정보를 사용해서 메시지를 처리할 수 있음을 이해했습니다.

### LocalValidatorFactoryBean
[LocalValidatorFactoryBean](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/beanvalidation/LocalValidatorFactoryBean.html)는 벨리데이션 스타터에 의해서 자동으로 등록되는 벨리데이터입니다. 컨트롤러의 핸들러 함수로 전달되는 과정에서 이 벨리데이터를 통해서 사용자의 요청 정보를 검증하며 벨리데이션 오류 메시지를 제공하게 됩니다.

현재 조직에서는 오래전에 공유한 [XML로 다국어 메시지 관리하기](managing-i18n-messages-with-xml)에서처럼 XML 파일을 기반으로 다국어 메시지 정보를 관리하고 있으며 이 메시지 소스를 사용하도록 자동 구성이 아닌 LocalValidatorFactoryBean를 직접 벨리데이터 빈으로 등록하여 사용하고 있습니다.

```java
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@Configuration
public class MessageConfig {
    @Bean
    public LocalValidatorFactoryBean validator(CustomMessageSource customMessageSource) {
        LocalValidatorFactoryBean factoryBean = new LocalValidatorFactoryBean();
        factoryBean.setValidationMessageSource(customMessageSource);
        return factoryBean;
    }
}
```

위와 같이 LocalValidatorFactoryBean를 등록할 때 벨리데이션 메시지 소스를 지정하는 것은 하이버네이트 벨리데이터에 의해 클래스패스에 포함된 ValidationMessages를 사용하지 못한다는 내재된 결함을 가지게 됩니다.

```sh
LoginController : [ConstraintViolationImpl{interpolatedMessage='javax.validation.constraints.NotBlank.message', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
LoginController : locale: en_US
```

> 기본으로 사용되는 ValidationMessages 대신에 벨리데이션 메시지 소스를 지정하였기에 해당 메시지로 처리되지 않았습니다. 왜냐하면 JSR-303 어노테이션에 대한 메시지는 직접 정의하지 않았기 때문이죠.

```java
@Bean
public LocalValidatorFactoryBean validator(CustomMessageSource messageSource) {
    LocalValidatorFactoryBean factoryBean = new LocalValidatorFactoryBean();
    factoryBean.setValidationMessageSource(messageSource);

    MessageInterpolator defaultMessageInterpolator = Validation.byDefaultProvider().configure().getDefaultMessageInterpolator();
    LocaleContextMessageInterpolator localeContextMessageInterpolator = new LocaleContextMessageInterpolator(defaultMessageInterpolator);
    factoryBean.setMessageInterpolator(localeContextMessageInterpolator);
    return factoryBean;
}
```

현재 조직처럼 사용자 정의 메시지 소스를 벨리데이션 메시지 소스로도 사용하도록 지정하였다면 위와 같이 MessageInterpolator를 지정하는게 좋습니다. 이때에도 사용자의 언어 정보에 따라 메시지가 처리되도록 LocaleContextMessageInterpolator를 적용해야합니다.

#### MessageInterpolatorFactory
LocalValidatorFactoryBean을 자동 구성하는 ValidationAutoConfiguration 클래스를 살펴보면 LocaleContextMessageInterpolator이 아니라 스프링 부트에서 추가된 MessageInterpolatorFactory를 통해 MessageInterpolator를 가져와서 등록하는 것을 확인할 수 있습니다.

```java
public class ValidationAutoConfiguration {
    @Bean
    public static LocalValidatorFactoryBean defaultValidator(ApplicationContext applicationContext) {
        LocalValidatorFactoryBean factoryBean = new LocalValidatorFactoryBean();
        MessageInterpolatorFactory interpolatorFactory = new MessageInterpolatorFactory(applicationContext);
        factoryBean.setMessageInterpolator(interpolatorFactory.getObject());
        return factoryBean;
    }
}
```

이를 참고하여 사용자 정의 메시지 소스 번들을 벨리데이션 메시지 소스로 지정하였더라도 MessageInterpolatorFactory를 통해 ResourceBundleMessageInterpolator에 의해서 메시지가 번역되어 처리됨을 확인할 수 있습니다.

```java
@Bean
public LocalValidatorFactoryBean validator(CustomMessageSource messageSource) {
    LocalValidatorFactoryBean factoryBean = new LocalValidatorFactoryBean();
    factoryBean.setValidationMessageSource(messageSource);

    MessageInterpolatorFactory messageInterpolatorFactory = new MessageInterpolatorFactory();
    factoryBean.setMessageInterpolator(messageInterpolatorFactory.getObject());
    return factoryBean;
}
```

> 그런데 앞선 자카르타 팩토리 함수에 의해 생성된 벨리데이터도 ResourceBundleMessageInterpolator를 사용하였는데 어떻게 LocalValidatorFactoryBean는 사용자 언어 정보에 따라 오류 메시지를 처리해주게 되는 것일까요?

```java
MessageInterpolator targetInterpolator = this.messageInterpolator;
if (targetInterpolator == null) {
    targetInterpolator = configuration.getDefaultMessageInterpolator();
}
configuration.messageInterpolator(new LocaleContextMessageInterpolator(targetInterpolator));
```

위 코드는 LocalValidatorFactoryBean이 빈으로 등록되고 난 후 afterPropertiesSet 함수에 의해 수행되는 코드 중 일부입니다. LocalValidatorFactoryBean을 빈으로 등록할 때 MessageInterpolatorFactory에 의해 가져온 ResourceBundleMessageInterpolator를 지정하였지만 이를 다시 LocaleContextMessageInterpolator로 변환하여 등록함을 확인할 수 있습니다. 

결국 LocalValidatorFactoryBean을 빈으로 등록할 때는 다음과 같이 LocaleContextMessageInterpolator를 전달하지 않아도 됨을 의미합니다.

```java
@Bean
public LocalValidatorFactoryBean validator(CustomMessageSource messageSource) {
    LocalValidatorFactoryBean factoryBean = new LocalValidatorFactoryBean();
    factoryBean.setValidationMessageSource(messageSource);
    factoryBean.setMessageInterpolator(Validation.byDefaultProvider().configure().getDefaultMessageInterpolator());
    return factoryBean;
}
```

### 사용자 정의 메시지
그렇다면 다음과 같이 ValidationMessages에 정의된 메시지 코드를 정의하면 어떻게 메시지가 처리될까요?

```xml
<messages>
    <entry key="javax.validation.constraints.NotBlank.message">
        <ko_KR><![CDATA[[사용자 정의] 공백일 수 없습니다]]></ko_KR>
        <en_US><![CDATA[[Custom] must not be blank]]></en_US>
    </entry>
</messages>
```

NotBlank에 대한 메시지를 정의했지만 ValidationMessages에 정의된 메시지로 처리됨을 확인할 수 있을겁니다. 이렇게 되는 이유는 setValidationMessageSource 함수 동작에 있습니다. setValidationMessageSource 함수의 코드를 살펴보면 파라미터로 전달된 메시지 소스를 기반으로 ResourceBundleMessageInterpolator를 만들어서 MessageInterpolator를 변경하도록 되어있기 때문입니다.

```java
public void setValidationMessageSource(MessageSource messageSource) {
    this.messageInterpolator = HibernateValidatorDelegate.buildMessageInterpolator(messageSource);
}

private static class HibernateValidatorDelegate {
    public static MessageInterpolator buildMessageInterpolator(MessageSource messageSource) {
        return new ResourceBundleMessageInterpolator(new MessageSourceResourceBundleLocator(messageSource));
    }
}
```

> 결국 setValidationMessageSource와 setMessageInterpolator는 동시에 적용할 수 없으므로 사용자 정의 메시지 소스를 지정한 것이 의미없는 쓰레기 코드가 됩니다.

스프링 부트 2.6.0 버전부터는 MessageInterpolatorFactory 생성자가 메시지 소스를 받을 수 있도록 수정되었고 생성자에 의해 전달된 메시지 소스가 있다면 MessageSourceMessageInterpolator로 변경하여주는 코드가 추가되어있습니다.
```java
@Override
public MessageInterpolator getObject() throws BeansException {
    MessageInterpolator messageInterpolator = getMessageInterpolator();
    if (this.messageSource != null) {
        return new MessageSourceMessageInterpolator(this.messageSource, messageInterpolator);
    }
    return messageInterpolator;
}
```

### 사용자 정의 제약사항
사용자 정의 메시지 소스를 제공하더라도 메시지 패턴에서 {value}와 같은 파라미터 표현이 불가능합니다. 예를 들어, 다음과 같이 어떤 값에 대한 길이를 제한한다고 가정하여 @Min 어노테이션을 부여했다고 가정하겠습니다.

```xml
<messages>
    <entry key="javax.validation.constraints.Min.message">
        <ko_KR><![CDATA[(사용자 정의) {value} 보다 같거나 커야합니다]]></ko_KR>
        <en_US><![CDATA[(Custom) must be greater than or equal to {value}]]></en_US>
    </entry>
</messages>
```

사용자 정의 메시지에서 VailidationMessages에 정의된 것처럼 파라미터 표현을 사용해보겠습니다.

```
org.springframework.web.util.NestedServletException: Request processing failed; nested exception is javax.validation.ValidationException: HV000149: An exception occurred during message interpolation
...
Caused by: java.lang.IllegalArgumentException: can't parse argument number: value
	at java.base/java.text.MessageFormat.makeFormat(MessageFormat.java:1451) ~[na:na]
	at java.base/java.text.MessageFormat.applyPattern(MessageFormat.java:491) ~[na:na]
	at java.base/java.text.MessageFormat.<init>(MessageFormat.java:390) ~[na:na]
...
Caused by: java.lang.NumberFormatException: For input string: "value"
	at java.base/java.lang.NumberFormatException.forInputString(NumberFormatException.java:65) ~[na:na]
	at java.base/java.lang.Integer.parseInt(Integer.java:652) ~[na:na]
	at java.base/java.lang.Integer.parseInt(Integer.java:770) ~[na:na]
	at java.base/java.text.MessageFormat.makeFormat(MessageFormat.java:1449) ~[na:na]
```

> 이러한 파라미터 표현은 Hibernate Validator에서 지원하는 표현식이므로 MessageFormat가 지원하는 표현식과는 다릅니다. MessageFormat는 {0}, {1} 이렇게 숫자 기반의 표현식을 지원하기 때문에 표현식 제약이 발생합니다. 아쉽지만 사용자 정의 메시지에서 파라미터 표현식을 사용하지 않을 수 밖에 없고 파라미터 표현식을 사용해야한다면 ValidationMessages 리소스 번들을 클래스패스에 재정의해서 사용할 수 밖에 없습니다. 

언어별 메시지가 정의된 프로퍼티 파일을 보완하고자 XML로 메시지를 정의하여 메시지 소스를 만들어서 사용했지만 의도하지 않은 제약이 생겨버렸습니다. 불편하더라도 벨리데이션 메시지는 프로퍼티 파일로 관리해서 ResourceBundleMessageInterpolator에 의해 처리되도록 해야할 것 같습니다.

감사합니다.

## 참고

- [XML로 다국어 메시지 관리하기](/managing-i18n-messages-with-xml)
- [Validation 어디까지 해봤니?](https://meetup.toast.com/posts/223)