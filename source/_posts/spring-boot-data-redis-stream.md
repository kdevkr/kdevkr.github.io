---
title: Redis Stream
date: 2024-06-22T12:00+09:00
tags:
- Redis Stream
---

소규모 애플리케이션 서버에서 레디스를 사용하고 있을때 RabbitMQ 또는 Apache Kafka와 같은 메시지 큐를 통해 비동기 이벤트에 대한 요구가 필요한 경우 별도의 메시지 큐 솔루션을 도입하는 것은 인프라 상 과도할 수도 있다. 이러한 경우 레디스에서 제공하는 스트림을 사용하여 메시지 기반의 프로그래밍을 수행할 수 있는데 스프링 부트 기반의 애플리케이션인 경우 [Spring Data Redis](https://spring.io/projects/spring-data-redis)에 [레디스 스트림에 대한 기능](https://docs.spring.io/spring-data/redis/reference/redis/redis-streams.html)을 포함하고 있으므로 쉽게 스트림에 메시지를 등록하고 컨슈머를 추가하여 메시지를 수신하도록 구현할 수 있다.

#### 메시지 없는 빈 스트림 생성하기

```sh
XGROUP CREATE stream_key group_name $ MKSTREAM
```

기본적인 레디스 명령어로는 위와 같이 컨슈머 그룹을 생성할 때 MKSTREAM 옵션을 지정하여 스트림이 존재하지 않은 경우에 스트림이 자동으로 생성되도록 할 수 있다. Spring Data Redis 에서는 RedisConnection 과 RedisStreamCommands 인터페이스에 xGroupCreate 라는 함수로 정의되어 있으므로 아래와 같이 구현하면 된다.

```java
String streamKey = "stream-1";
String groupName = "group-1";

if (Boolean.TRUE.equals(redisTemplate.hasKey(streamKey))) {
    redisTemplate.opsForStream().createGroup(streamKey, ReadOffset.lastConsumed(), groupName);
} else {
    RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
    RedisStreamCommands streamCommands = connection.streamCommands();
    streamCommands.xGroupCreate(streamKey.getBytes(StandardCharsets.UTF_8), groupName, ReadOffset.latest(), true);
}
```

#### StreamMessageListenerContainer

StreamMessageListenerContainer 와 StreamListener 를 활용하면 RedisTemplate 으로 스트림을 직접 읽지 않아도 다중 스레드를 통해 메시지를 수신하여 처리할 수 있다. 

```java
StreamMessageListenerContainer messageListenerContainer = StreamMessageListenerContainer.create(redisTemplate.getConnectionFactory(),
        StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                .hashKeySerializer(new StringRedisSerializer())
                .hashValueSerializer(new StringRedisSerializer())
                .build());

Consumer consumer = Consumer.from(groupName, consumerName);
StreamOffset<String> streamOffset = StreamOffset.create(streamKey, ReadOffset.lastConsumed());
Subscription subscription = messageListenerContainer.receiveAutoAck(consumer, streamOffset, record -> {
    System.out.println(record);
});
subscription.await(Duration.ofSeconds(1));

messageListenerContainer.start();
```
