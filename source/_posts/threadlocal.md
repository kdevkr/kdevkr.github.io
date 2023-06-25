---
title: ThreadLocal
date: 2023-06-25T16:00+09:00
tags:
- Java
- ThreadLocal
---

> 스프링 시큐리티의 SecurityContextHolder를 사용하셨던데 ThreadLocal에 대해서 이야기해보세요.

스프링 애플리케이션에서 내부적으로 많이 사용되는 클래스 중 하나는 **ThreadLocal** 이라는 자바 기본 클래스라고 할 수 있다. 신입 웹 개발자들에 대한 인터뷰를 진행하다보면 스프링 프레임워크와 스프링 시큐리티를 사용했음에도 불구하고 내부적으로 어떤 동작을 하는지 모르거나 ThreadLocal 이라는 자바 언어에서의 기본 지식에 대해서 들어보지 못한 경우가 많다. 대부분 유명한 김영한님의 강의를 수강했다고 이력서에 기재했기 때문에 이 ThreadLocal에 대한 부분을 다루지 않았다고 생각했는데 찾아보니 [ThreadLocal](https://www.youtube.com/watch?v=ljrgXkzagaU)이라는 부분에 대해서도 언급하고 있기에 수강자들이 일부 내용을 스스로 생략하고 넘어갔을 것 같다.

#### XXXContextHolder
⁕ org.springframework.web.context.request.RequestContextHolder  
⁕ org.springframework.context.i18n.LocaleContextHolder  
⁕ org.springframework.security.core.context.SecurityContextHolder  

위와 같이 ContextHolder로 끝나도록 이름이 정의된 클래스는 내부적으로 ThreadLocal을 사용하도록 구현되어있는 대표적인 스프링 프레임워크의 클래스이다. 인텔리제이 IDEA를 통해서 위 클래스들을 사용하는 다른 클래스를 따라가보면 어떻게 활용하고 있는지를 이해할 수 있는데 **RequestContextHolder와 LocaleContextHolder**의 생성과 삭제는 RequestContextFilter에서 수행하고 있으며 **SecurityContextHolder**는 SecurityContextHolderFilter에서 관리하고 있음을 찾을 수 있다.

> 이와 같이 일반적인 자바 개발자들도 ThreadLocal과 Filter를 구현하여 동일한 스레드 내에서는 언제든지 정보를 가져올 수 있는 패턴을 만들 수 있다는 이야기이다. ThreadLocal 자체가 스레드 내에 정보 공유를 위한 지역 변수이기 때문이다.

#### RequestContextFilter
RequestContextFilter에서는 HttpServletRequest의 로케일 정보와 ServletRequestAttributes를 ThreadLocal에 저장하도록 구현되어있다. 다른 필터를 거치고 난 후 반드시 ThreadLocal에 있는 정보들을 제거하도록 되어있는 부분이 중요하다. RequestContextHolder에 저장되는 클래스는 ServletRequestAttributes 이며 이전에 공유한 [레디스 장애 회고](/redis-memory-usage-issue/)에서도 내부 구현을 살펴본 클래스에 해당한다.

#### SecurityContextHolderFilter
스프링 시큐리티 5.7+ 부터는 SecurityContextPersistenceFilter가 아닌 SecurityContextHolderFilter로 대체되어 사용된다. SecurityContextPersistenceFilter로 처리되던 것이 SecurityContextHolderFilter 에서는 어떠한 방식으로 구현되었는지 비교해보아도 좋은 학습이 될 것 같다. Supplier 인터페이스를 활용하여 SecurityContext를 지연되어 처리하는 방식으로 변경하였다.

많은 회사에서 신입 개발자에게 바라는 역량 중 기본 지식에 대한 이야기는 사용하는 기술에 대해서 내부적으로 사용되는 기본 개념이 있는지 찾아보는 편인가를 말하는게 아닐까? 비록 신입 웹 개발자로 일하기 위해서 실무 기술에 대한 역량을 배우고 어필하는 건 어쩔 수 없는 상향 평준화된 부분이 있지만 기본적인 지식과 관련된 지식은 없는지 찾아보고 지속적인 학습에 대한 어필도 필요할 것이다.


