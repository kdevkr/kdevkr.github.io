---
title: 자바 메일 발송 시 장애 처리
date: 2024-06-16T20:00+0900
tags:
- JavaMailSenderImpl
- Simple Email Service
- Sending Limits
---

스프링 프레임워크 기반의 애플리케이션 서버에서는 `JavaMailSenderImpl`을 사용하여 쉽게 [이메일](https://docs.spring.io/spring-framework/reference/integration/email.html)을 보내는 기능을 구현할 수 있다. 그러나, 이메일 발송에 대한 인터페이스와 구현을 제공하므로 메일 발송 실패에 따른 장애 처리에 대해서는 별도로 고려해야할 필요가 있다. 예를 들어, 다수의 스레드로 이메일 대기열 큐를 빠르게 소진한다면 [Amazon SES 계정의 발신 할당량과 관련된 오류](https://docs.aws.amazon.com/ko_kr/ses/latest/dg/manage-sending-quotas-errors.html) 중 초당 이메일 수에 대한 제한량을 넘어서는 경우 454 Throttling failure: Maximum sending rate exceeded 오류가 발생한다.

#### ThreadPoolExecutor를 통한 메일 대기열 큐 병렬 처리

```java
BlockingQueue<MimeMessage> waitingQueue = new LinkedBlockingQueue<>(50000);

Thread thread = new Thread(() -> {
    while (true) {
        try {
            MimeMessage message = waitingQueue.take();
            javaMailSender.send(message);
        } catch (Throwable e) {
            log.error(e.getMessage(), e);
        }
    }
});

thread.setName("Mail-Thread");
thread.setDaemon(true);
thread.start();
```

위 코드는 간단하게 메일 대기열 큐를 순차적으로 소진하는 단일 스레드로 이메일을 발송하는 코드로 대기열 큐에 쌓이는 메일의 수가 많아진다면 ThreadPoolExecutor를 사용하여 메일 발송에 대한 처리를 병렬로 수행할 수 있다. 메일 발송 처리를 병렬로 수행한다면 SMTP 서버의 발신 한도에 대해서 고려해야한다.

```java
int coreSize = Runtime.getRuntime().availableProcessors();
ThreadFactory threadFactory = new ThreadFactoryBuilder().setNameFormat("Mail-Thread-%d").build();
ThreadPoolExecutor executor = new ThreadPoolExecutor(coreSize, coreSize, 10, TimeUnit.SECONDS, new LinkedBlockingQueue<>(), threadFactory);

BlockingQueue<MimeMessage> waitingQueue = new LinkedBlockingQueue<>(50000);

Thread thread = new Thread(() -> {
    while (true) {
        if (waitingQueue.isEmpty()) {
            continue;
        }

        executor.execute(() -> {
            try {
                MimeMessage message = waitingQueue.take();
                javaMailSender.send(message);
            } catch (Throwable e) {
                log.error(e.getMessage(), e);
            }
        });
    }
});

thread.setName("Mail-Thread");
thread.setDaemon(true);
thread.start();
```

#### Spring Retry를 통한 메일 발송 실패 시 재시도 전략 - [Guide to Spring Retry](https://www.baeldung.com/spring-retry)

이메일 발송 실패 건에 대해서 Spring Retry를 통해 재시도 로직을 쉽게 구현할 수 있다. 메일 발송을 위한 RetryTemplate 구성 시 재시도 전략을 구성하고 메일을 발송하는 함수를 RetryTemplate로 감싸면 된다. context.getRetryCount() 함수를 통해 재시도 횟수를 가져올 수 있다.

```java
RetryTemplate retryTemplate = new RetryTemplateBuilder()
        .maxAttempts(3)
        .exponentialBackoff(Duration.ofSeconds(10L), 2, Duration.ofMinutes(1L))
        .retryOn(List.of(MessagingException.class, MailException.class))
        .build();

BlockingQueue<MimeMessage> waitingQueue = new LinkedBlockingQueue<>(50000);

Thread thread = new Thread(() -> {
    while (true) {
        if (waitingQueue.isEmpty()) {
            continue;
        }

        retryTemplate.execute(context -> {
            try {
                MimeMessage message = waitingQueue.take();
                javaMailSender.send(message);
            } catch (Throwable e) {
                log.error(e.getMessage(), e);
            }
        });
    }
});

thread.setName("Mail-Thread");
thread.setDaemon(true);
thread.start();
```

#### Guava RateLimiter를 통한 초당 이메일 발송 시도 제한 - [Quick Guide to the Guava RateLimiter](https://www.baeldung.com/guava-rate-limiter)

AWS SES의 발신 한도 중에는 초당 보낼 수 있는 이메일 수에 대한 제한량이 있으므로 Guava RateLimiter를 통해 초당 이메일 발송 수를 넘어서지 않도록 방어하는 코드를 작성할 수 있다. 물론, SMTP 서버를 다수의 애플리케이션 서버에서도 연결할 가능성이 있으므로 발신 할당량에 대한 모니터링 및 발신 한도를 별도로 관리할 필요는 있다.

```java
RateLimiter rateLimiter = RateLimiter.create(14);

Thread thread = new Thread(() -> {
    while (true) {
        if (waitingQueue.isEmpty()) {
            continue;
        }

        boolean acquire = rateLimiter.tryAcquire(1);
        if (acquire) {
            executor.execute(() -> {
                try {
                    MimeMessage message = waitingQueue.take();
                    javaMailSender.send(message);
                } catch (Throwable e) {
                    log.error(e.getMessage(), e);
                }
            });
        }
    }
});
thread.setName("Mail-Thread");
thread.setDaemon(true);
thread.start();
```

> Guava RateLimiter는 초당 호출에 대한 제한만 가능하므로 분당 이메일 발송을 제한하고 싶다면 Resilience4j의 RateLimiter를 도입해야합니다.

#### Resilience4j CircuitBreaker를 통한 메일 발송 중단 - [Guide to Resilience4j](https://www.baeldung.com/resilience4j)

SMTP 서버의 발신 한도 제한을 넘어서는 경우에 대한 장애 처리를 위해 [Resilience4j](https://github.com/resilience4j/resilience4j)를 도입할 수 있다. 하루동안 메일을 보낼 수 있는 할당량을 초과하거나 초당 보낼 수 있는 이메일 수에 제한이 되었다면 일정 시간동안 이메일 발송을 시도하지 않도록 `CircuitBreaker`를 사용하여 장애 전파 방지를 구현할 수 있다. AWS SES의 발신 한도인 아래의 두개 항목에 대해서 처리를 고려하도록 하자.

- 454 Throttling failure: Maximum sending rate exceeded (1초당 이메일 발송 수 제한량)
- 454 Throttling failure: Daily message quota exceeded (24시간 당 이메일 발송 할당량)

```java
CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("MailSendingLimitExceeded");
RateLimiter rateLimiter = RateLimiter.create(14);

Thread thread = new Thread(() -> {
    while (true) {
        if (waitingQueue.isEmpty()) {
            continue;
        }

        boolean permission = circuitBreaker.tryAcquirePermission();
        permission &= rateLimiter.tryAcquire(1);
        if (permission) {
            executor.execute(() -> {
                try {
                    MimeMessage message = waitingQueue.take();
                    javaMailSender.send(message);
                } catch (Throwable e) {
                    String failReason = e.getMessage();
                    if (failReason != null
                            && failReason.contains("454 Throttling failure")) {
                        circuitBreaker.transitionToClosedState();
                    }
                    log.error(failReason, e);
                }
            });
        }
    }
});
thread.setName("Mail-Thread");
thread.setDaemon(true);
thread.start();
```

#### JavaMailSenderImpl은 매번 연결한다?!

일부 시스템 환경에서 AWS SES의 SMTP 서버를 동일한 리전이 아닌 상당히 멀리 떨어져있는 리전에 구성된 SMTP를 통해 메일 발송을 시도하는 경우 커넥션에 대한 소요 시간이 크다는 것을 알 수 있었다. 예를 들어, US East (Ohio) 리전의 SMTP 엔드포인트를 Asia Pacific (Seoul) 리전에서 연결하는 경우 약 2초 정도의 시간이 소요되는데 동일한 리전에서 연결하면 약 100ms 가 걸린다. 

JavaMailSenderImpl의 connectTransport 함수를 사용하여 testConnection 또는 doSend 함수에서 연결을 수행하는 것을 확인할 수 있는데 MimeMessage 목록을 send 함수 파라미터로 전달할 때 연결을 수행하고 해제하므로 이메일을 하나씩 보내도록 구현했다면 이메일을 보낼때마다 연결을 수행하는 것이다.

```java JavaMailSenderImpl
protected Transport connectTransport() throws MessagingException {
    String username = this.getUsername();
    String password = this.getPassword();
    if ("".equals(username)) {
        username = null;
        if ("".equals(password)) {
            password = null;
        }
    }

    Transport transport = this.getTransport(this.getSession());
    transport.connect(this.getHost(), this.getPort(), username, password);
    return transport;
}
```

[SimpleJavaMail의 Batch Module](https://www.simplejavamail.org/configuration.html#section-reusing-connections)은 Transport 연결에 대한 커넥션 풀을 사용한다고 되어있으므로 SMTP 서버로의 연결 수행시간이 오래걸린다면 Transport 에 대한 커넥션 풀을 이용해보는 것도 좋은 방법으로 생각된다.

