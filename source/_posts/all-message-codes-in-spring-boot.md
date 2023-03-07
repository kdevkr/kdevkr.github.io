---
title: 스프링 부트에서 모든 메시지 코드 가져오기
date: 2021-01-25
tags:
- Spring Boot
- Message Source
---

> 관련 코드: 
> https://github.com/kdevkr/spring-demo/commit/aed02f456d13316aee257aaa04eda49a52e07320

스프링 부트에서 자동 구성에 의해 제공하는 ResourceBundleMessageSource는 특정 로케일에 대한 모든 메시지 코드를 가져오는 함수를 지원하지 않는다. 그러나, ReloadableResourceBundleMessageSource는 프로퍼티 뿐만 아니라 XML 파일로 되어있는 메시지 번들을 불러와서 메시지 소스를 구성할 수 있게 지원하며 getMergedProperties(Locale locale) 함수를 통해서 특정 로케일에 대한 메시지 프로퍼티를 가져오는 것을 확인할 수 있다. 다만, getMergedProperties 함수의 접근 제어자가 protected 인 관계로 ReloadableResourceBundleMessageSource에 대한 인스턴스를 생성해도 호출할 수 없다.

``` java
protected PropertiesHolder getMergedProperties(Locale locale) {
    PropertiesHolder mergedHolder = this.cachedMergedProperties.get(locale);
    if (mergedHolder != null) {
        return mergedHolder;
    }
}
```

#### CustomResourceBundleMessageSource
ReloadableResourceBundleMessageSource의 getMergedProperties 함수를 호출하기 위하여 확장 클래스를 만들어야한다. 앞서 이야기했듯이 접근제어자가 protected 이므로 특정 로케일을 가지는 프로퍼티를 조회하는 함수를 작성할 수 있다.

```java
public class CustomResourceBundleMessageSource extends ReloadableResourceBundleMessageSource {
    public Properties getMessages(Locale locale) {
        return getMergedProperties(locale).getProperties();
    }
}
```

#### MessageConfiguration
그리고 이제 스프링 부트의 자동 구성에 의해 추가되는 메시지 소스가 아니라 CustomResourceBundleMessageSource가 애플리케이션 컨텍스트에 등록될 수 있도록 구성 클래스를 추가해야한다. 스프링 부트에 의해 자동 구성되어지는 MessageSourceAutoConfiguration는 messageSource라는 이름의 빈이 등록되지 않는 경우에 활성화 되도록 되어있으므로 messageSource를 빈으로 등록하면 된다.

```java
@Configuration
public class MessageConfiguration {

    @Bean
    @ConfigurationProperties(prefix = "spring.messages")
    public MessageSourceProperties properties() {
        return new MessageSourceProperties();
    }

    @Bean
    public MessageSource messageSource(MessageSourceProperties properties, ResourceLoader resourceLoader) {
        CustomResourceBundleMessageSource messageSource = new CustomResourceBundleMessageSource();
        if (StringUtils.hasText(properties.getBasename())) {
            messageSource.setBasenames(StringUtils
                    .commaDelimitedListToStringArray(StringUtils.trimAllWhitespace(properties.getBasename())));
        }
        if (properties.getEncoding() != null) {
            messageSource.setDefaultEncoding(properties.getEncoding().name());
        }
        messageSource.setFallbackToSystemLocale(properties.isFallbackToSystemLocale());
        Duration cacheDuration = properties.getCacheDuration();
        if (cacheDuration != null) {
            messageSource.setCacheMillis(cacheDuration.toMillis());
        }
        messageSource.setAlwaysUseMessageFormat(properties.isAlwaysUseMessageFormat());
        messageSource.setUseCodeAsDefaultMessage(properties.isUseCodeAsDefaultMessage());
        messageSource.setResourceLoader(resourceLoader);
        return messageSource;
    }
}
```
#### spring.messages.basename
ReloadableResourceBundleMessageSource를 확장하는 클래스를 만들었지만 스프링 부트의 기본 spring.messages.basename 값인 messages 로는 메시지 프로퍼티를 가져올 수 없다. 기본적으로 사용되는 리소스 로더가 DefaultResourceLoader 이므로 리소스 여부를 확인할 때 메시지 파일을 올바르게 찾을 수 없다. 따라서, spring.messages.basename에 클래스패스를 포함하여 명시해야 한다.

```properties
spring.messages.basename=classpath:i18n/messages
```

#### Messages API
메시지 소스가 CustomResourceBundleMessageSource로 등록되어있으므로 메시지 코드를 제공하는 API를 만들어서 프론트엔드 애플리케이션에서도 동일한 메시지를 활용할 수 있게 제공할 수 있다.

```java
@GetMapping(value = "/messages")
public ResponseEntity<Object> messages(Locale locale) {
    CustomResourceBundleMessageSource messageSource = (CustomResourceBundleMessageSource) this.messageSource;
    Map<String, Object> messages = new HashMap<>();

    Properties allMessages = messageSource.getMessages(locale);

    Set<Map.Entry<Object, Object>> entries = allMessages.entrySet();
    for(Map.Entry<Object, Object> entry : entries) {
        Object key = entry.getKey();
        Object value = entry.getValue();

        messages.put((String) key, value);
    }

    return ResponseEntity.ok(messages);
}
```