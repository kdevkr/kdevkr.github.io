---
title: 레디스 웹소켓 알람 동기화
date: 2024-03-14T23:00+0900
tags:
- Redis
- Websocket
---

#### 웹소켓 알람 갱신 동기화

대부분의 예제는 채팅으로 공유되고 있지만 일반적인 웹 애플리케이션에서의 웹소켓 기능은 서버에서 클라이언트로의 알람과 이벤트를 즉시 전달하기 위해서 사용하고 있을 것이다. 단일 애플리케이션에서는 고려하지 않아도 될 부분이지만 스케일 아웃되어 분산 처리되는 애플리케이션에 각각 연결된 웹소켓으로 특정 서버에서 발생하여 만들어지는 알람 정보를 즉시 전달하기 위해서는 전파하고 동기화하는 방안이 필요하다. [Redis(Pub/Sub)로 로컬 캐시 동기화하기](https://pompitzz.github.io/blog/Redis/LocalCacheSyncWithRedisPubSub.html)와 비슷하다.

```java
@Slf4j
@SpringBootApplication
public class Application implements MessageListener {
    private static final ChannelTopic topic = ChannelTopic.of("NOTIFICATIONS");

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Autowired
    public StringRedisTemplate redisTemplate;

    @Bean
    public CommandLineRunner commandLineRunner() {
        return args -> redisTemplate.convertAndSend(topic.getTopic(), "REQUIRE.SYNC");
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(this, topic);
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter() {
        return new MessageListenerAdapter(this);
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        log.info("receive: {}", message);
    }
}
```

#### 활용 클래스 목록

레디스에 의한 Pub/Sub을 구현하기 위해서 사용되는 스프링 프레임워크 클래스들은 아래와 같다.

- RedisMessageListenerContainer
- RedisConnectionFactory
- MessageListenerAdapter
- MessageListener
- StringRedisTemplate
- ChannelTopic

#### 참고 링크

- [How to use pub/sub channels in Redis](https://redis.io/docs/interact/pubsub/)
- [Pub/Sub Messaging](https://docs.spring.io/spring-data/redis/reference/redis/pubsub.html)
- [PubSub Messaging with Spring Data Redis](https://www.baeldung.com/spring-data-redis-pub-sub)