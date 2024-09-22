---
title: 레디스
date: 2024-09-04T00:00+09:00
tags:
- Redis
- NoSQL
- Cache
- Queue
---

Java 기반의 스프링 애플리케이션을 개발하면서 **레디스**라는 기술을 아래와 같은 요구사항을 처리하기 위해 사용해왔지만 레디스에 대해서 자세히 알아보고 더 효율적으로 사용할 수 있는가를 고민해본적은 없었던 것 같다. 과연 스스로 **레디스 기술에 대한 역량을 보유**하고 있다고 생각이 되는가를 고민해보려고 한다.

- 사용자 세션 클러스터링
- 데이터베이스 결과 캐시
- EXPIRE TTL을 활용한 인증
- Redis Pub/Sub을 활용한 실시간 알림 데이터 전파
- Redis Streams를 활용한 이벤트 비동기 메시지 처리

#### 다른 환경에서의 레디스 활용

많은 개발자들이 레디스에 대한 정보들을 공유해놓은 것들을 참고해서 다른 도메인 환경에서는 어떻게 레디스를 활용하는지를 살펴보도록 하자. 우선, 게임 시스템에서는 사용자들의 [랭킹에 대한 리더보드](https://redis.io/solutions/leaderboards/)를 구성하기 위하여 Sorted Sets(ZSET)를 활용하는 것으로 확인된다. 이커머스 도메인에서는 [재고 관리](https://techblog.woowahan.com/2709/)에서 쿠폰이나 세일 이벤트로 인하여 [동시성 이슈를 처리](https://hudi.blog/distributed-lock-with-redis/)하기 위해 사용되는 것으로 보인다. 또한, JWT와 같은 토큰 기반 인증 시스템으로 구성한 경우 비밀번호 변경에 의한 로그아웃 처리를 위해 레디스를 통해 블랙리스트를 구현하기도 하는 것 같다.

레디스에 저장해야할 데이터 규모가 크다거나 HA 구성을 위해 레디스 클러스터로 운영해볼 기회가 없는 것은 아쉬운 부분이긴하다. 대규모 트래픽을 경험할 수 있는 환경이 아니더라도 레디스 서버를 위해서 선택하는 AWS EC2 인스턴스 유형의 권장사양이라거나 레디스 클러스터를 운용해야하는데 레디스 서버를 관리하고 운영해줄 데이터베이스 엔지니어가 조직에 없다면 레디스 호환의 관리형 서비스인 AWS ElasticCache 가 더 좋은 선택지일까에 대한 생각을 미리 해봤으면 좋았을 것 같다.

#### 레디스 서버 모니터링

개인적으로 프로메테우스와 그라파나를 활용하여 모니터링 시스템을 구축했을때는 레디스에 대한 매트릭을 수집하여 간단하게 모니터링을 해보았으나 APM 솔루션인 New Relic 으로 전환하고나서는 레디스에 대해서는 별도로 모니터링을 수행하고 있지는 않고 있다. New Relic 에서도 [Redis 모니터링 통합](https://docs.newrelic.com/kr/docs/infrastructure/host-integrations/host-integrations-list/redis/redis-integration/)을 지원하고 있으므로 도입해봐도 좋을 것 같으니 서버 엔지니어이신 부장님과 협의하에 시도는 해보아야겠다. AWS ElasticCache 를 사용하게 된다면 자체적으로 [모니터링 지표를 제공](https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/red-ug/CacheMetrics.WhichShouldIMonitor.html)해주므로 CloudWatch 에서 어떤 항목을 살펴보아야하는지 알아두어야 할 것 같다.

#### 더 자세히 배울 수 있는 정보를 모아보자

레디스를 검색해서 관련한 정보들을 모아보았는데 꽤나 많다. 조금씩 살펴보며 레디스 활용에 대해 더 자세히 알아가봐야겠다.

- [컬리 | 풀필먼트 입고 서비스팀에서 분산락을 사용하는 방법 - Spring Redisson](https://helloworld.kurly.com/blog/distributed-redisson-lock/)
- [하이퍼커넥트 | 레디스와 분산 락](https://hyperconnect.github.io/2019/11/15/redis-distributed-lock-1.html)
- [지마켓 | 지마켓 대기열 시스템 파헤치기](https://dev.gmarket.com/46)
- [카카오 | 카카오톡 캐싱 시스템의 진화 — Kubernetes와 Redis를 이용한 캐시 팜 구성](https://tech.kakao.com/posts/406)
- [카카오 | DNS 기반의 Redis HA 구현](https://tech.kakao.com/posts/316)
- [지마켓 | Redis를 통한 현재 접속 유저 파악하기](https://dev.gmarket.com/17)
- [올리브영 | Redis Pub/Sub을 활용한 쿠폰 발급 비동기 처리](https://oliveyoung.tech/blog/2023-08-07/async-process-of-coupon-issuance-using-redis/)
- [카카오페이 | Redis on Kubernetes 플랫폼을 구성해 나가기](https://tech.kakaopay.com/post/kakaopaysec-redis-on-kubernetes/)
- [채널톡 | 채널톡 실시간 채팅 서버 개선 여정 - 1편 : 레디스의 'Pub/Sub'](https://channel.io/ko/blog/real-time-chat-server-1-redis-pub-sub)
- [라인 | 대규모 Redis를 운영하며 살아남기](https://techblog.lycorp.co.jp/ko/running-redis-at-scale)
- [우아한테크 | 선착순 이벤트 서버 생존기](https://www.youtube.com/watch?v=MTSn93rNPPE)
- [우아한테크 | 선착순 쿠폰 발급](https://techblog.woowahan.com/2514/)
- [여기어때 | Redis&Kafka를 활용한 선착순 쿠폰 이벤트 개발기](https://techblog.gccompany.co.kr/redis-kafka를-활용한-선착순-쿠폰-이벤트-개발기-feat-네고왕-ec6682e39731)
- [리멤버 | 유저 목록을 Redis Bitmap 구조로 저장하여 메모리 절약하기](https://blog.dramancompany.com/2022/10/%EC%9C%A0%EC%A0%80-%EB%AA%A9%EB%A1%9D%EC%9D%84-redis-bitmap-%EA%B5%AC%EC%A1%B0%EB%A1%9C-%EC%A0%80%EC%9E%A5%ED%95%98%EC%97%AC-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EC%A0%88%EC%95%BD%ED%95%98%EA%B8%B0/)
- [라인 | 실시간 추천 서비스를 위해 메시지 큐잉 도입하기](https://techblog.lycorp.co.jp/ko/building-a-messaging-queuing-system-with-redis-streams)
- [채널톡 | Distributed Lock 구현 과정](https://channel.io/ko/blog/distributedlock_2022_backend)
- [NHN 클라우드| 대규모 환경에서 레디스 캐시 성능을 높이기](https://meetup.nhncloud.com/posts/251)
- [우아한테크 | ElastiCache 운영을 위한 우아한 가이드](https://www.youtube.com/watch?v=JH07ABaRPWo)
- [NHN 클라우드 | Redis 야무지게 사용하기](https://www.youtube.com/watch?v=92NizoBL4uA)
- [카카오 | Docker Swarm 기반 Redis SaaS 플랫폼 구축사례](https://www.youtube.com/watch?v=-GsWFaQg6Q0)
- [AWS | 일반적인 ElastiCache 사용 사례 및 지원 방법](https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/red-ug/elasticache-use-cases.html)
- [토스 | 캐시 문제 해결 가이드 - DB 과부하 방지 실전 팁](https://toss.tech/article/25301)
- [지마켓 | 초보 개발자를 위한 Redis Cluster Migration 가이드라인](https://dev.gmarket.com/71)
- [카카오 | 쿠버네티스에 레디스 캐시 클러스터 구축기](https://tech.kakao.com/posts/491)
- [Redis를 활용하여 Request 5배 더 받기](https://chrisjune-13837.medium.com/redis-redis%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%98%EC%97%AC-%EC%84%9C%EB%B2%84-%EC%9A%94%EC%B2%AD-%EC%86%8D%EB%8F%84-%EC%A4%84%EC%9D%B4%EA%B8%B0-8132ea90bc39)
- [네이버 | ZooKeeper를 활용한 Redis Cluster 관리](https://d2.naver.com/helloworld/294797)
- [지마켓 | Redis Lua Script를 이용해서 API Rate Limiter개발](https://dev.gmarket.com/69)

😮 레디스와 관련하여 유명하신 개발자분의 비싼 [유료 강의](https://fastcampus.co.kr/pages/29568)도 있더라 