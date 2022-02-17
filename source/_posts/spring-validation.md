---
title: 벨리데이션 오류 메시지가 사용자 언어로 처리되지 않은 이유
date: 2022-02-17
tags:
- Jakarta Bean Validation
- Hibernate Validator
---

> 스프링 부트 애플리케이션에서 벨리데이션 오류에 대한 메시지가 사용자 언어에 따라 처리되지 않는 사유를 경험하였고 이와 같은 문제가 발생한 원인을 분석하고 벨리데이션에 대해 정리한 글입니다.

## 자카르타 벨리데이션
[Validation 어디까지 해봤니?](https://meetup.toast.com/posts/223)에서 소개하듯이 스프링 부트의 벨리데이션 스타터를 추가하면 [Jakarta Bean Validation API](https://beanvalidation.org/2.0/)와 함께 [Hibernate Validator](https://hibernate.org/validator/) 라이브러리가 의존성으로 포함됩니다. 그리고 ValidationAutoConfiguration 이라는 자동 구성 클래스를 통해 LocalValidatorFactoryBean가 기본적인 Validator 빈으로 등록됩니다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```

하이버네이트 벨리데이터에는 기본적인 메시지 소스 번들을 포함하고 있기 때문에 자카르타 벨리데이션에서 제공하는 어노테이션이나 하이버네이트 벨리데이터에서 제공하는 어노테이션에 대한 메시지를 별도로 정의하지 않아도 한국 또는 일본 등과 같은 주요 국가에서 사용하는 언어에 대해서는 메시지를 처리할 수 있습니다.

> 하이버네이트 벨리데이터에서 관리하는 메시지 소스 번들 파일은 ValidationMessages 입니다.

### 오류 메시지 처리
자카르타 벨리데이션은 자체적으로 팩토리 함수를 통해 간단하게 벨리데이터를 생성할 수 있습니다. 그래서 별다른 설정이 없어도 하이버네이트 벨리데이터 구현체에 의한 벨리데이터로 자바 빈 클래스의 필드 검증을 수행할 수 있습니다. 예를 들어, 다음과 같이 벨리데이션을 수행하죠.

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
스프링 컨트롤러의 핸들러 함수에서 `@Valid` 또는 `@Validated`에 의해 처리되는 벨리데이션은 애플리케이션 컨텍스트에 등록된 SmartValidator인 LocalValidatorFactoryBean에 의해서 수행되었기 때문에 이번 글의 주요 핵심인 사용자 언어로 메시지가 처리되지 않는 현상이 발생하지 않습니다. 그러나 이번에는 고객의 요구사항에 의해 CSV 또는 엑셀 파일을 업로드하여 어떠한 정보를 벌크 형식으로 추가할 수 있게 지원해야했고 그 과정에서 입력된 정보를 검증하기 위해서 **기본 자카르타 벨리데이터**를 생성하여 처리했습니다. 기본 자카르타 벨리데이터를 사용하여 벨리데이션을 수행하고 오류 사항에 대해 처리된 메시지를 확인해보면 시스템의 로케일 정보를 기반으로 번역되는 것을 확인할 수 있었습니다.

```sh
LoginController : [ConstraintViolationImpl{interpolatedMessage='공백일 수 없습니다', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
LoginController : locale: en_US
```

> 로그인 요청 시 사용자의 언어는 en_US 이지만 벨리데이션 오류 메시지는 시스템 로케일 정보인 ko_KR을 기준으로 번역되었습니다. 이와 같이 많은 글을 참고해보면 기본 벨리데이터로 여러 언어에 대해서 시도해보는 경우 시스템 로케일 값을 변경하는 것을 확인할 수 있습니다.

## 사용자 언어 기반의 메시지 처리
파일 업로드를 통해 벌크 형식으로 입력된 정보를 검증하고 사용자의 언어 정보에 따라 메시지를 처리하려면 어떻게 해야될까요? 사용자의 언어 정보를 기반으로 메시지를 제공하기 위해서는 기본으로 사용되는 MessageInterpolator를 설정해야만 합니다. 다행히도 스프링 프레임워크에는 LocaleContextHolder.getLocale 함수를 기반으로 메시지를 처리할 수 있게 구현된 [**LocaleContextMessageInterpolator**](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/beanvalidation/LocaleContextMessageInterpolator.html)를 제공합니다.

```java
Configuration<?> configuration = Validation.byDefaultProvider().configure();
MessageInterpolator defaultMessageInterpolator = configuration.getDefaultMessageInterpolator();
LocaleContextMessageInterpolator localeContextMessageInterpolator = new LocaleContextMessageInterpolator(defaultMessageInterpolator);

Validator defaultValidator = configuration
        .messageInterpolator(localeContextMessageInterpolator)
        .buildValidatorFactory()
        .getValidator();
```

> 기본 자카르타 벨리데이터 수행 시 시스템 로케일 기반으로 번역된 메시지는 아래와 같이 로그인을 요청한 사용자의 언어 정보를 기반으로 메시지가 정상적으로 처리되었습니다.


```sh
[ConstraintViolationImpl{interpolatedMessage='must not be blank', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
locale: en_US
```

### LocalValidatorFactoryBean
현재 조직에서는 오래전에 공유한 [XML로 다국어 메시지 관리하기](managing-i18n-messages-with-xml)에서처럼 XML 파일을 기반으로 다국어 메시지 정보를 관리하고 있습니다. 그리고 이 메시지 소스를 사용하도록 LocalValidatorFactoryBean를 직접 빈으로 등록하고 있었죠. 

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

> 현재 조직에서 Validator 빈으로 등록하여 사용하고 있던 LocalValidatorFactoryBean는 조직에서 정의한 메시지에 대해서는 처리할 수 있을테지만 하이버네이트 벨리데이터에 포함된 ValidationMessages를 통해서는 메시지가 처리되지 않는 문제를 내재하고 있었습니다.

```sh
LoginController : [ConstraintViolationImpl{interpolatedMessage='javax.validation.constraints.NotBlank.message', propertyPath=loginId, rootBeanClass=class com.example.springboot.bean.Account$Login, messageTemplate='{javax.validation.constraints.NotBlank.message}'}]
LoginController : locale: en_US
```

기본 자카르타 벨리데이터 대신에 애플리케이션 컨텍스트에 빈으로 등록된 Validator인 LocalValidatorFactoryBean를 사용했지만 벨리데이터에서 사용하는 벨리데이션 메시지 소스를 사용자 정의된 메시지 소스 번들로 지정하였기에 하이버네이트 벨리데이터에 포함된 벨리데이션 메시지 소스를 적용되지 않았습니다.

> 벨리데이션 메시지 소스를 계층으로 구성하였지만 벨리데이션에 대한 오류 메시지를 확인해보면 번역된 메시지로 처리되지 않습니다. 그 이유는 앞서 알게된 MessageInterpolator가 등록되지 않았기 때문입니다.

#### LocaleContextMessageInterpolator
자카르타 기본 벨리데이터에서 알게된 바와 같이 LocaleContextMessageInterpolator를 등록하면 사용자 언어 정보를 기반으로 메시지가 번역되어 처리됩니다.

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

#### MessageInterpolatorFactory
스프링 부트에서 제공하는 MessageInterpolatorFactory를 통해 MessageInterpolator를 등록할 수도 있습니다.

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

> MessageInterpolatorFactory는 클래스패스에 있는 MessageInterpolator를 가져오도록 되어있습니다.
> 따라서, 하이버네이트 벨리데이터에 포함된 ResourceBundleMessageInterpolator를 MessageInterpolator로 등록하게 됩니다.

이렇게 해서 자카르타 기본 벨리데이터를 통해 사용자 언어 정보에 따라 메시지를 처리하기 위해서는 LocaleContextMessageInterpolator를 등록해야하며 스프링 프레임워크에서 제공하는 LocalValidatorFactoryBean를 사용하더라도 MessageInterpolatorFactory를 사용하도록 구성해야한다는 것을 알게되었습니다.

## 참고

- [XML로 다국어 메시지 관리하기](/managing-i18n-messages-with-xml)
- [Validation 어디까지 해봤니?](https://meetup.toast.com/posts/223)