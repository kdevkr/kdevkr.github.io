---
title: ParallelStream 과 동시성 문제
date: 2024-09-19T10:30+09:00
tags:
- ParallelStream
- ArrayList
- HashSet
---

자바 신입 개발자 면접 질문 중에 멀티스레드와 동시성 문제는 대부분의 회사에서 단골 질문에 해당한다. 조직의 주니어 개발자가 멀티스레드를 고려하지 않고 비즈니스 요구사항을 처리하기 위해 코드를 수정한 결과로 인해 시스템에서 주요 기능 중 하나인 **이벤트 모니터링 화면에서 데이터가 간헐적으로 올바르지 않은 문제가 발생함**이 리포트 되었다.

#### 동시성 문제가 발생하는 코드

멀티스레드에 의한 병렬 처리 시 동시성 문제가 발생했던 비즈니스 로직 코드는 대충 아래와 같다고 볼 수 있다.

```java
List<Customer> customers = IntStream.rangeClosed(1, 100)
                .mapToObj(i -> new Customer().setId(String.valueOf(i)))
                .toList();

List<String> optIds = new ArrayList<>();
customers.parallelStream().forEach(customer -> {
    optIds.add(customer.getId());

    // customer 에 대한 데이터 조회 로직
});
System.out.println("expected: 100, size: " + optIds.size());
```

위 코드에서 **ArrayList 에 저장되는 목록의 결과가 매번 동일함이 보장이 되는가?** 가 중요한 부분인데 실제로 테스트 코드를 돌려보면 간헐적으로 100개가 아닌 97개가 목록에 포함되는 경우를 확인할 수 있을 것이다. 멀티스레드에 의해서 add 함수가 동시에 호출되는 경우에는 ConcurrentModificationException와 같은 예외가 발생하지 않는게 중요한 부분이다.

#### ArrayList 와 HashSet에 대한 동기화 컬렉션

일반적으로 많이 사용되는 **ArrayList** 과 **HashSet** 에 데이터를 추가할 때 **ParallelStream 을 사용하는 경우** 위와 같이 동시성 문제로 인해 제대로 추가되지 않는 항목이 존재할 수 있다. 이로 인한 동시성 문제를 해결하기 위해서는 아래와 같이 **Synchronized 키워드를 사용하거나 동기화 문제를 고려한** 컬렉션 클래스들이 존재한다.

- ConcurrentSkipListSet
- CopyOnWriteArrayList
- Collections.synchronizedList();
- CopyOnWriteArraySet
- Collections.synchronizedSet();
- ConcurrentHashMap.newKeySet();

동시성 문제가 발생했던 비즈니스 로직에서 CopyOnWriteArrayList 와 CopyOnWriteArraySet은 쓰기 작업에 대한 오버헤드가 있다는 점을 고려하여 Collections.synchronizedList 를 사용하는 것으로 결정하여 수정하였다.

> 자바에서 병렬처리 시 동시성을 고려해야하는 것은 기초적인 부분에 해당되어 주니어 개발자에게 아쉬운 부분이긴 하나 이러한 문제를 내재하게 된 가장 큰 원인은 요구사항을 처리한 당시에 개발 리드로써 코드 리뷰를 상세하게 해주지 않았던 것이므로 스스로 반성해야할 부분이라 생각됩니다.
