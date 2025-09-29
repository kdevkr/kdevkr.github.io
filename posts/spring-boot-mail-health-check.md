---
title: 스프링 부트 메일 헬스체크 캐시하기
date: 2024-06-23T11:00+09:00
tags:
- Spring Boot Actuator
- MailHealthIndicator
---

토스의 [Spring Boot Actuator의 헬스체크 살펴보기](https://toss.tech/article/how-to-work-health-check-in-spring-boot-actuator)라는 글을 보고 스프링 부트 액추에이터에서 기본으로 제공하는 MailHealthIndiator의 헬스 체크 결과를 별도로 요청하는 경우 `management.endpoint.health.cache-time-to-live` 속성으로 캐시되지 않음을 확인했다. 해당 속성은 전체 헬스 체크 결과를 반환하는 헬스 엔드포인트(/actuator/health)에 해당하는 캐시 옵션으로 메일에 대한 헬스 엔드포인트(/actuator/health/mail)에 대해서는 적용되지 않는다.

스프링 부트 액추에이터의 [MailHealthIndicator](https://github.com/spring-projects/spring-boot/blob/main/spring-boot-project/spring-boot-actuator/src/main/java/org/springframework/boot/actuate/mail/MailHealthIndicator.java) 는 JavaMailSenderImpl의 testConnection 함수를 호출하여 헬스 체크 결과를 반환하도록 작성되어있다. MailHealthIndicator라는 이름으로 HealthIIndicator를 구현하면 기본적으로 제공하는 MailHealthIndicator 대신에 등록되므로 SMTP 서버로의 연결 수행 결과를 캐시하여 응답하도록 작성해볼 수 있다.

#### CachableMailHealthIndicator

```java
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.mail.MailHealthIndicator;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component("mailHealthIndicator")
public class CachableMailHealthIndicator extends MailHealthIndicator implements InitializingBean {
    private Cache<String, Health> cache;

    public CachableMailHealthIndicator(JavaMailSenderImpl javaMailSender) {
        super(javaMailSender);
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        Health cached = cache != null ? cache.getIfPresent("mail") : null;
        if (cached != null) {
            builder.status(cached.getStatus()).withDetails(cached.getDetails());
            return;
        }

        try {
            super.doHealthCheck(builder);
        } catch (Exception e) {
            builder.down(e);
        }

        if (cache != null) {
            Health health = builder.withDetail("datetime", Instant.now()).build();
            cache.put("mail", health);
        }
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        cache = CacheBuilder.newBuilder()
                .maximumSize(1)
                .expireAfterWrite(Duration.ofSeconds(30))
                .build();
    }
}
```

![268ms → 4ms](/images/posts/spring-boot-mail-health-check/01.png)

> CacheableMailHealthIndicator는 호스트 정보 뿐만 아니라 **캐시된 시간**을 포함하여 언제 측정된 결과인지도 확인할 수 있습니다.