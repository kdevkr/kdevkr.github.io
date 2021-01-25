---
title: 스프링 부트에서 모든 메시지 코드 가져오기
date: 2021-01-25
tags:
- Spring Boot
- Message Source
---

## ResourceBundleMessageSource
스프링 부트에서 기본적으로 제공하는 `ResourceBundleMessageSource`는 메시지에 대한 모든 코드를 가져올 수 있는 기능이 존재하지 않습니다. 예외적으로 ReloadableResourceBundleMessageSource이라는 메시지 소스는 `getMergedProperties(Locale locale)` 함수를 통해 로케일에 대한 메시지 프로퍼티를 가져올 수 있습니다.

## ReloadableResourceBundleMessageSource
하지만, getMergedProperties 함수는 접근제어자가 protected이므로 `ReloadableResourceBundleMessageSource`를 확장하는 클래스를 만들어야합니다.

```java
public class ExtendReloadableResourceBundleMessageSource extends ReloadableResourceBundleMessageSource {
    public Properties getMessages(Locale locale) {
        return getMergedProperties(locale).getProperties();
    }
}
```

## MessageSource Configuration
구성 메타 클래스를 만들어 ExtendReloadableResourceBundleMessageSource를 메시지 소스로 등록합니다. 애플리케이션 컨텍스트에 `messageSource` 빈이 존재하는 경우 `MessageSourceAutoConfiguration`은 적용되지 않습니다.

따라서, 다음과 같이 `MessageSourceProperties`도 등록되도록 합니다.

```java
@Configuration
@EnableConfigurationProperties
public class MessageSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.messages")
    public MessageSourceProperties properties() {
        return new MessageSourceProperties();
    }

    @Bean
    public MessageSource messageSource(MessageSourceProperties properties) {
        ExtendReloadableResourceBundleMessageSource messageSource = new ExtendReloadableResourceBundleMessageSource();
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
        return messageSource;
    }
}
```

### spring.messages.basename
ReloadableResourceBundleMessageSource를 확장하는 클래스를 만들었지만 스프링 부트의 기본 `spring.messages.basename` 값인 `messages`으로 메시지 프로퍼티를 가져올 수 없습니다.

내부적인 코드 이슈로 인하여 클래스패스에 위치한 `messages.properties`을 리소스로 가져오지 못합니다.

따라서, spring.messages.basename에 클래스패스를 포함하여 명시합니다.

```properties
spring.messages.basename=classpath:/messages
```
