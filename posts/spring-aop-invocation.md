---
title: Spring AOP - Self Invocation
date: 2024-09-05T23:00+09:00
---

> @Cacheable self-invocation (in effect, a method within the target object calling another method of the target object). 
> The cache annotation will be ignored at runtime

스프링 프레임워크에서 개발자가 경험하기 쉬운 실수는 동일한 클래스 내에서 비동기 또는 캐시 어노테이션이 선언된 함수를 내부적으로 호출하도록 비즈니스 로직을 작성하는 것 입니다. 이러한 문제가 발생하는 경우에는 [Self Invocation](https://www.baeldung.com/spring-invoke-cacheable-other-method-same-bean)이 되지 않도록 별도의 클래스로 분리되도록 리팩토링을 진행하거나 [Self-Injection](https://www.baeldung.com/spring-self-injection)이 되도록 수정해야합니다. 그외에 아래와 같은 방법들도 있지만 선호되지 않습니다.

```java
@Service
public class AService extends AbstractService {
    @Cacheable(cacheNames = "a", key = "#root.methodName", unless = "#result == null")
    public String getA() {
        return "A";
    }

    public String getAA() {
        return ((AService) AopContext.currentProxy()).getA();
    }
}
```

- AdviceMode.ASPECTJ (AspectJ Weaving)
- AopContext.currentProxy()
- ApplicationContext.getBean()

스프링 프레임워크 기반의 애플리케이션 서버를 작성하는 개발자라면 [프록시 매커니즘](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)에 대해서 이해하고 있어야 합니다. 기본적인 프록시(CGLib) 또는 JDK 프록시가 무엇인지 알고있어야 왜 public 접근제어자가 아니거나 내부 호출인 경우 AOP를 수행할 수 없는지를 이해할 수 있습니다.
