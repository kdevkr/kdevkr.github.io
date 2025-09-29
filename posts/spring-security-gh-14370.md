---
title: Couldn't find FilterChainProxy
date: 2023-12-29T18:00+0900
tags:
- Spring Security
- issue-14370
---

> https://github.com/spring-projects/spring-security/issues/14370
> https://github.com/spring-projects/spring-security/commit/7cd626fe2569346b945feec40fa16f231a558fde

```java
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'springSecurityFilterChain': Failed to instantiate [org.springframework.security.config.annotation.web.configuration.WebMvcSecurityConfiguration$CompositeFilterChainProxy]: Constructor threw exception
	at org.springframework.beans.factory.support.ConstructorResolver.instantiate(ConstructorResolver.java:322) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.ConstructorResolver.autowireConstructor(ConstructorResolver.java:310) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.autowireConstructor(AbstractAutowireCapableBeanFactory.java:1354) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBeanInstance(AbstractAutowireCapableBeanFactory.java:1191) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:561) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:521) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:325) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:323) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:199) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:312) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:199) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingletons(DefaultListableBeanFactory.java:975) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:960) ~[spring-context-6.1.2.jar:6.1.2]
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:625) ~[spring-context-6.1.2.jar:6.1.2]
	at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:146) ~[spring-boot-3.2.1.jar:3.2.1]
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:762) ~[spring-boot-3.2.1.jar:3.2.1]
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:464) ~[spring-boot-3.2.1.jar:3.2.1]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:334) ~[spring-boot-3.2.1.jar:3.2.1]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1358) ~[spring-boot-3.2.1.jar:3.2.1]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1347) ~[spring-boot-3.2.1.jar:3.2.1]
	at com.example.uptime.SpringBootUptimeApplication.main(SpringBootUptimeApplication.java:23) ~[main/:na]
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.security.config.annotation.web.configuration.WebMvcSecurityConfiguration$CompositeFilterChainProxy]: Constructor threw exception
	at org.springframework.beans.BeanUtils.instantiateClass(BeanUtils.java:223) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.SimpleInstantiationStrategy.instantiate(SimpleInstantiationStrategy.java:111) ~[spring-beans-6.1.2.jar:6.1.2]
	at org.springframework.beans.factory.support.ConstructorResolver.instantiate(ConstructorResolver.java:319) ~[spring-beans-6.1.2.jar:6.1.2]
	... 21 common frames omitted
Caused by: java.lang.IllegalStateException: Couldn't find FilterChainProxy in [org.springframework.web.servlet.handler.HandlerMappingIntrospector$$Lambda$881/0x000001d78949a2d0@6b2fdffc, org.springframework.security.web.debug.DebugFilter@2ca3d826]
	at org.springframework.security.config.annotation.web.configuration.WebMvcSecurityConfiguration$CompositeFilterChainProxy.findFilterChainProxy(WebMvcSecurityConfiguration.java:302) ~[spring-security-config-6.2.1.jar:6.2.1]
	at org.springframework.security.config.annotation.web.configuration.WebMvcSecurityConfiguration$CompositeFilterChainProxy.<init>(WebMvcSecurityConfiguration.java:214) ~[spring-security-config-6.2.1.jar:6.2.1]
	at java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method) ~[na:na]
	at java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:77) ~[na:na]
	at java.base/jdk.internal.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45) ~[na:na]
	at java.base/java.lang.reflect.Constructor.newInstanceWithCaller(Constructor.java:499) ~[na:na]
	at java.base/java.lang.reflect.Constructor.newInstance(Constructor.java:480) ~[na:na]
	at org.springframework.beans.BeanUtils.instantiateClass(BeanUtils.java:210) ~[spring-beans-6.1.2.jar:6.1.2]
	... 23 common frames omitted
```

#### 오류원인

스프링 부트 3.1.5 부터 3.2.1 까지의 버전에서 @EnableWebSecurity의 debug 옵션을 활성화하는 경우 FilterChainProxy 가 아닌 DebugFilter가 등록되어 애플리케이션 컨텍스트 구성 시 오류가 발생하는 문제가 있다는 소식이다. 스프링 부트와 함께 스프링 시큐리티에 대해서 학습하는 개발자에게는 생각보다 큰 이슈일 수도 있어보인다.

#### 해결방안

```groovy
ext['spring-security.version'] = '6.2.2'
```

이 글을 작성하는 2023년 12월 29일 기준으로 스프링 시큐리티 6.1.7 또는 6.2.2 버전이 릴리즈 되지 않은 상태이다. 그래서 급하게 문제를 해결하고 싶다면 아래와 같은 임시 조치가 필요하다.

- @EnableWebSecurity의 debug 옵션을 사용하지 않음 (로그 레벨로 대체)
- Spring Boot 3.1.4 이하의 버전을 사용
