---
title: 스프링 벨리데이션
date: 2022-02-17
tags:
- Jakarta Bean Validation
- Hibernate Validator
---

#### 자카르타 벨리데이션
스프링 부트에서 제공하는 벨리데이션은 spring-boot-starter-validation 모듈에 포함되어 있으며 [Jakarta Bean Validation](https://beanvalidation.org/)을 따르는 [Hibhernate Validator](https://github.com/hibernate/hibernate-validator/)를 의존하고 있다. 스프링 부트에 의한 자동 구성은 ValidationAutoConfiguration으로 수행하며 LocalValidatorFactoryBean를 기본 Validator 빈으로써 등록함을 확인할 수 있다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```

#### LocalValidatorFactoryBean
애플리케이션 컨텍스트에 존재하는 메시지 소스를 기반으로 보간을 처리하는 MessageSourceMessageInterpolator가 사용되도록 구현되어있다. [MessageInterpolatorFactory](https://github.com/spring-projects/spring-boot/blob/main/spring-boot-project/spring-boot/src/main/java/org/springframework/boot/validation/MessageInterpolatorFactory.java)의 내부 구현을 살펴보면 메시지 소스가 없다면 하이버네이트 벨리데이터의 ResourceBundleMessageInterpolator가 사용되나 스프링 부트에 의해 메시지 소스 자체도 자동 구성되므로 결국 MessageSourceMessageInterpolator가 사용된다고 인지하면 된다.

```java
@Bean
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
@ConditionalOnMissingBean(Validator.class)
public static LocalValidatorFactoryBean defaultValidator(ApplicationContext applicationContext,
        ObjectProvider<ValidationConfigurationCustomizer> customizers) {
    LocalValidatorFactoryBean factoryBean = new LocalValidatorFactoryBean();
    factoryBean.setConfigurationInitializer((configuration) -> customizers.orderedStream()
        .forEach((customizer) -> customizer.customize(configuration)));
    MessageInterpolatorFactory interpolatorFactory = new MessageInterpolatorFactory(applicationContext);
    factoryBean.setMessageInterpolator(interpolatorFactory.getObject());
    return factoryBean;
}
```

최종적으로는 MessageSourceMessageInterpolator가 [LocaleContextMessageInterpolator](https://github.com/spring-projects/spring-framework/blob/main/spring-context/src/main/java/org/springframework/validation/beanvalidation/LocaleContextMessageInterpolator.java)로 래핑되며 LocaleContextHolder.getLocale()를 사용하여 스프링 웹 요청에 의한 스레드에 대해 로케일 기반으로 메시지 보간이 처리되도록 지원한다. 

#### 기본 벨리데이션 메시지
하이버네이트 벨리데이터 라이브러리 내에는 기본으로 정의된 [ValidationMessages](https://github.com/hibernate/hibernate-validator/tree/main/engine/src/main/resources/org/hibernate/validator)를 포함하고 있다. 따라서, @NotEmpty 또는 @Length, @Email 과 같은 자카르타 벨리데이션에 정의되어있는 Constraints에 대해서는 기본적으로 메시지 보간으로 처리될 수 있다.

![org.hibernate.validator.ValidationMessages](/images/posts/spring-validation/hibernate-validator-01.png)

#### 유효성 검사
[Validation 어디까지 해봤니?](https://meetup.toast.com/posts/223)에서 알 수 있듯이 자카르타 벨리데이션의 팩토리 함수를 통해 간단하게 벨리데이터를 생성하고 자바 빈 클래스에 저장된 정보가 올바른지 필드 검증을 쉽게 수행할 수 있다. 그러나, 스프링 부트를 사용한다면 자동 구성되는 LocalValidatorFactoryBean를 사용하는 것이 좋다.

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

#### 사용자 정의 메시지 제약사항
스프링 메시지 소스에 사용자 정의 메시지를 지정하더라도 메시지 패턴에서 {value}와 같은 파라미터 표현이 불가능하다. 예를 들어, 다음과 같이 어떤 값에 대한 길이를 제한한다고 가정하여 @Min 어노테이션을 부여했다고 가정해보자.

```xml
<messages>
    <entry key="javax.validation.constraints.Min.message">
        <ko_KR><![CDATA[(사용자 정의) {value} 보다 같거나 커야합니다]]></ko_KR>
        <en_US><![CDATA[(Custom) must be greater than or equal to {value}]]></en_US>
    </entry>
</messages>
```

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

이러한 파라미터 표현은 Hibernate Validator에서 지원하는 표현식이므로 MessageFormat으로 지원하는 표현식과는 다르다. MessageFormat는 {0}, {1} 이렇게 숫자 기반의 표현식을 지원하기 때문에 표현식 제약이 발생한다. 아쉬운 부분이지만 사용자 정의 메시지에서 파라미터 표현식을 사용해야한다면 ValidationMessages 리소스 번들을 클래스패스에 재정의해서 사용할 수 밖에 없을 것 같다.
