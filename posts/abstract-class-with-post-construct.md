---
title: 추상 클래스에서 @PostConstruct를 사용할 때
date: 2024-09-04T01:00+09:00
tags:
- PostConstruct
- InitializeBean
- ApplicationReadyEvent
---

[애플리케이션 실행 시 초기화](https://www.baeldung.com/running-setup-logic-on-startup-in-spring)해야하는 로직이 필요한 경우 ApplicationReadyEvent에 대한 이벤트 리스너를 작성하거나 **@PostConstruct가 선언된 함수** 또는 InitializeBean 인터페이스의 afterPropertiesSet 함수를 오버라이딩하여 수행할 수 있다. 이 중에서 오늘은 @PostConstruct를 추상 클래스에 선언했을때의 문제에 대해 다루어보려고 한다.

#### @PostConstruct with abstract class

여러가지 서비스 로직에서 사용하는데 공통적으로 사용될 함수나 필드를 제공하기 위하여 서비스 클래스에 대한 추상 클래스를 만들 수 있다. 만약, 아래와 같이 @PostConstruct가 선언된 함수를 만들었고 이를 확장해서 만든 A 서비스, B 서비스, C 서비스가 있다고 가정하면 initialize 함수는 몇번 호출될까?

```java
@Service
public abstract class AbstractService {
    @PostConstruct
    public void init() {
        System.out.println(getClass().getSimpleName() + "initialize");
    }
}
```

```sh Terminal
AService initialize
BService initialize
CService initialize
```

정답은 1번도 4번도 아닌 추상 클래스를 제외한 **A,B,C 서비스 3번 호출됨**을 알 수 있다.

신규 프로젝트에서 상위 시스템에 의존함에 따라 **API 통신을 위한 인증 토큰을 발급해오는 로직을 init 함수에 구현**해두었다. 로컬에서 개발하다가 상위 시스템과의 통신에 대한 트레이스 로그를 활성화하고 애플리케이션 서버 로그를 살펴보던 중 **애플리케이션 실행 시 인증 토큰 발급을 위한 요청이 주르륵 서비스 개수만큼 호출**되는 것을 확인하게 되었다.

서비스 클래스마다 개별로 발급하여 사용하면 의미가 있을 수 있지만 **여러번 요청하더라도 상위 시스템에서 동일한 토큰을 발급을 해주도록 구현되어** 있으므로 AbstractService 기준으로 단 한번만 발급되면 되는게 의도된 동작으로 판단했다. 이에 대한 해결책으로 인증 토큰을 AbstractService의 클래스 내부 변수가 아닌 전역 변수로 변환하고 init 함수에서 토큰 발급 유무를 우선적으로 확인하여 토큰이 없는 경우에만 발급 로직을 수행하도록 수정했다.

> 관련된 커밋 히스토리를 찾아보니 해당 코드가 작성된 것은 프로젝트 초기였으며 당시에는 추상 클래스를 확장한 서비스 클래스가 단 하나였는데요. 그래서 당시에는 인지하지 못하고 트레이스 로그를 활성화해본 지금에서야 내재된 오류 아닌 결함이 발견되었을 것 같습니다.
