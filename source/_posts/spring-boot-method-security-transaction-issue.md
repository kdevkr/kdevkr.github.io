---
title: 메소드 보안에 의한 트랜잭션 이슈
date: 2024-01-28T22:00+0900
tags:
- Transactional
- EnableGlobalMethodSecurity
- PermissionEvaluator
- TransactionInterceptor
---

메소드 보안을 잘 활용하고 있었으나 메소드 보안에 의해 트랜잭션이 적용되지 않게 된 문제가 발생했던 시스템은 스프링 부트 기반의 프로젝트로 아래와 같이 구성되어 있음을 공유하고자 한다. 시스템을 이용하는 사용자가 클라이언트 크레덴셜을 발급하고 OAuth 토큰을 발급하여 OpenAPI를 이용할 수 있으며 OpenAPI 에 대한 권한을 처리하기 위해서 스프링 시큐리티의 [메소드 보안](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)과 함께 PermissionEvaluator를 구현하여 커스텀 표현식을 사용하고 있었다.

- Spring Boot 2.3.12.RELEASE
- Spring Security OAuth
- EnableGlobalMethodSecurity with PermissionEvaluator
- UserDetailsService + ClientDetailsService

```java JdbcConfiguration
@EnableTransactionManagement
@Configuration
public class JdbcConfiguration implements TransactionManagementConfigurer {

    @Override
    public PlatformTransactionManager annotationDrivenTransactionManager() {
        return null;
    }
}
```

```java MethodSecurityConfiguration
@AllArgsConstructor
@EnableGlobalMethodSecurity(prePostEnabled = true)
@Configuration
public class MethodSecurityConfiguration extends GlobalMethodSecurityConfiguration {
    private final ApplicationContext applicationContext;

    @Override
    protected MethodSecurityExpressionHandler createExpressionHandler() {
        OAuth2MethodSecurityExpressionHandler expressionHandler = new OAuth2MethodSecurityExpressionHandler();
        expressionHandler.setApplicationContext(applicationContext);
        return expressionHandler;
    }
}
```

```java AuthPermissionEvaluator
@AllArgsConstructor
@Component("auth")
public class AuthPermissionEvaluator implements PermissionEvaluator {
    private final UserService userService;

    public boolean isAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        ClientDetails clientDetails = userService.loadClientByClientId(authentication.getName());
        if (clientDetails instanceof UserClient) {
            UserClient userClient = (UserClient) clientDetails;
            return userClient.getScope().contains("all");
        }
        return false;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        return true;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return true;
    }
}
```

```yml application.yml
spring:
  aop:
    auto: true
    proxy-target-class: true
  datasource:
    hikari:
      auto-commit: false
```

#### 메소드 보안과 트랜잭션 처리 순서 문제

트랜잭션이 동작하지 않는 문제에 대해서 확인해보면 아래와 같이 TransactionAspectSupport가 스택트레이스에 포함되지 않는 것을 확인할 수가 있다. @EnableGlobalMethodSecurity(prePostEnabled = true) 와 GlobalMethodSecurityConfiguration 그리고 @EnableTransactionManagement() 인 상태에서 커스텀 PermissionEvaluator를 사용하게 되면 트랜잭션 인터셉터가 동작하지 않을 수 있게 되고 @Transactional을 명시하더라도 트랜잭션이 생성되지 않을 수 있는 문제를 내재하게 된다.

```java TransactionAspectSupport 가 동작하지 않는 경우
com.example.demo.user.UserRepository.update(UserRepository.java:42)
com.example.demo.user.UserRepository$$FastClassBySpringCGLIB$$c53b685e.invoke(<generated>)
org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:792)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor.invoke(AuthorizationManagerBeforeMethodInterceptor.java:162)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:707)
com.example.demo.user.UserRepository$$EnhancerBySpringCGLIB$$7a11f77b.update(<generated>)
com.example.demo.user.UserService.update(UserService.java:70)
com.example.demo.user.UserService.update(UserService.java:66)
com.example.demo.user.UserApi.updateUser(UserApi.java:28)
com.example.demo.user.UserApi$$FastClassBySpringCGLIB$$df90bb86.invoke(<generated>)
```

```java TransactionAspectSupport 가 동작하는 경우
com.example.demo.user.UserRepository.update(UserRepository.java:42)
com.example.demo.user.UserRepository$$FastClassBySpringCGLIB$$c53b685e.invoke(<generated>)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.transaction.interceptor.TransactionInterceptor$1.proceedWithInvocation(TransactionInterceptor.java:123)
org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:388)
org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:707)
com.example.demo.user.UserRepository$$EnhancerBySpringCGLIB$$964218d2.update(<generated>)
com.example.demo.user.UserService.update(UserService.java:70)
com.example.demo.user.UserService.update(UserService.java:66)
com.example.demo.user.UserApi.updateUser(UserApi.java:28)
com.example.demo.user.UserApi$$FastClassBySpringCGLIB$$df90bb86.invoke(<generated>)
```

#### [Migrating from @EnableGlobalMethodSecurity](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html#migration-enableglobalmethodsecurity)

이와 같이 트랜잭션 인터셉터가 적용되지 않는 문제로 인하여 @EnableGlobalMethodSecurity 를 @EnableMethodSecurity를 사용하여 아래와 같이 @EnableTransactionManagement 의 순서를 0으로 지정하면 해결된다.

```java
@EnableTransactionManagement(order = 0)
@Configuration
public class JdbcConfiguration implements TransactionManagementConfigurer {

    @Override
    public PlatformTransactionManager annotationDrivenTransactionManager() {
        return null;
    }
}

@EnableMethodSecurity
@Configuration
public class MethodSecurityConfiguration {
}
```

```java
com.example.demo.user.UserRepository.update(UserRepository.java:43)
com.example.demo.user.UserRepository$$FastClassBySpringCGLIB$$c53b685e.invoke(<generated>)
org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:792)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.transaction.interceptor.TransactionInterceptor$1.proceedWithInvocation(TransactionInterceptor.java:123)
org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:388)
org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:707)
com.example.demo.user.UserRepository$$EnhancerBySpringCGLIB$$38621c9f.update(<generated>)
com.example.demo.user.UserService.update(UserService.java:70)
com.example.demo.user.UserService.update(UserService.java:66)
com.example.demo.user.UserApi.updateUser(UserApi.java:28)
com.example.demo.user.UserApi$$FastClassBySpringCGLIB$$df90bb86.invoke(<generated>)
org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:792)
org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)
org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:762)
org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor.invoke(AuthorizationManagerBeforeMethodInterceptor.java:162)
```

UserApi의 핸들러 함수에 부여된 @PreAuthorize 로 인하여 AuthorizationManagerBeforeMethodInterceptor가 스택트레이스에 포함되는 걸 확인할 수 있고 TransactionInterceptor 에 의해 @Transactional 이 적용된 리파지토리 함수가 호출되기 이전에 트랜잭션 생성을 시도하는 걸 확인할 수 있다. 재현한 샘플 프로젝트와 다르게 실제로는 @EnableGlobalMethodSecurity를 사용하고 PermissionEvaluator 구현체 내에서 UserService를 나중에 참조하도록 @Lazy 를 부여하는 방식으로 해결이 되었는데 그 이유에 대해서는 조금 더 찾아봐야할 것 같다.

> 참고로, hikari.auto-commit 옵션이 적용되어 있었다면 @Transactional 이 동작하지 않아도 인지하지 못하고 반영되었을 것 같네요.

#### 참고

- https://stackoverflow.com/a/40724843
- https://github.com/spring-projects/spring-security/issues/13152
- https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html#changing-the-order