---
title: Spring Session
date: 2022-12-04
tags:
- Session
- Redis
---

> 본 글은 [레디스 관련 결함](https://github.com/kdevkr/mambo-box/blob/main/errors/2022-11-30.md)을 경험한 것을 토대로 스프링 세션 레디스에 대한 동작을 정리하기 위해서 작성한 것 입니다.

많은 자바 개발자가 스프링 부트 프로젝트를 사용하는 이유는 별다른 코드 구현 없이도 여러 개발자들에 의해 작성되어진 로직을 자동으로 구성하면서 쉽고 빠르게 원하는 기능과 동작을 애플리케이션에 적용시키기 위한 목적이 크다고 생각합니다. 하지만, 자바 뿐만 아니라 다른 언어의 프레임워크에서도 구현된 코드들을 전부 확인하고 사용하지는 않을 경우가 많을텐데요. 스프링 프레임워크의 구현 범위가 상당히 많다보니 스프링 프레임워크의 개념 혹은 동작에 대해서 대충 이해하고 넘어가거나 아는 선에서 사용하는 편입니다.

스프링 세션 레디스에 의한 결함을 만들어낸 이유도 RequestContextHolder를 통해서 스레드 로컬에 저장된 요청 정보를 가져올 수 있고 RequestContextHolder로 부터 가져온 RequestAttributes에 세션 아이디를 가져올 수 있는 함수가 있기에 사용했던 것으로부터 시작됩니다. 개인적인 경험으로 볼때는 스프링 세션과 레디스를 함께 사용하는 것은 단순하게 스프링 세션 레디스에 대한 의존성만 추가하고 레디스에 연결할 수 있는 정보 그리고 스프링 세션을 활성화하는 어노테이션을 추가하는 것 뿐이므로 내재된 코드가 어떻게 동작하는지 제대로 확인할 필요성은 없었습니다.

#### TCP와 HTTP의 세션은 다르다.
> Spring Session provides transparent integration with HttpSession. This means that developers can switch the HttpSession implementation out with an implementation that is backed by Spring Session.

TCP에서의 세션은 연결을 의미하지만 HTTP에서의 세션은 연결에 대한 상태를 의미합니다. 스프링 세션은 TCP 레벨이 아닌 [HTTP 세션](https://docs.spring.io/spring-session/reference/http-session.html)에 대한 통합을 지원합니다. 그리고 기본적으로는 메모리에 세션을 저장하게 되는 것을 JDBC 기반으로 관계형 데이터베이스에 저장한다거나 레디스를 사용해서 세션 저장소로 활용할 수 있도록 제공하는 것도 포함하고 있습니다.

#### WAS는 세션 관리를 지원한다.
톰캣이나 언더토우와 같은 WAS에서도 자체적으로 [메모리 기반의 세션](https://github.com/undertow-io/undertow/blob/master/core/src/main/java/io/undertow/server/session/Session.java)을 지원하도록 구현되어있습니다. 스프링 세션에서는 서블릿 컨테이너(WAS)가 자체적인 세션을 생성하지 않도록 [AbstractHttpSessionApplicationInitializer](https://github.com/spring-projects/spring-session/blob/main/spring-session-core/src/main/java/org/springframework/session/web/context/AbstractHttpSessionApplicationInitializer.java)를 통해 springSessionRepositoryFilter 이라는 이름의 특수한 필터를 등록하여 모든 요청에 대해서 처리되도록 요구합니다.

> Fortunately, both HttpSession and HttpServletRequest (the API for obtaining an HttpSession) are both interfaces. This means that we can provide our own implementations for each of these APIs.
> This highlights why it is important that Spring Session's SessionRepositoryFilter be placed before anything that interacts with the HttpSession.

#### 스프링 세션은 자체 구현 세션으로 전환한다.
SessionRepositoryFilter가 수행하는 중요한 역할은 자바 서블릿 스펙의 HTTP 세션을 자체적인 세션 클래스로 전환하는 것 입니다. 그리고 내부적으로 HTTP 세션과 스프링 세션을 연결하기 위해서 쿠키 기반의 HttpSessionIdResolver를 사용하도록 되어있죠. 결국 SessionRepository 구현체에 따라 JDBC 기반으로 데이터베이스 세션 정보를 저장하는지 레디스에 저장하는지 구분되어지는 것입니다.

> Switches the HttpSession implementation to be backed by a Session. The SessionRepositoryFilter wraps the HttpServletRequest and overrides the methods to get an HttpSession to be backed by a Session returned by the SessionRepository.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
    request.setAttribute(SESSION_REPOSITORY_ATTR, this.sessionRepository);

    SessionRepositoryRequestWrapper wrappedRequest = new SessionRepositoryRequestWrapper(request, response);
    SessionRepositoryResponseWrapper wrappedResponse = new SessionRepositoryResponseWrapper(wrappedRequest,
            response);

    try {
        filterChain.doFilter(wrappedRequest, wrappedResponse);
    }
    finally {
        wrappedRequest.commitSession();
    }
}
```

SessionRepositoryFilter의 위 구현처럼 가장 먼저 처리됨으로써 요청 스레드 내부에서 변경되어진 세션에 대해서는 응답이 완료된 이후에 최종적으로 반영된다는 것을 알 수 있습니다. 그래서 경험했던 레디스 결함에서도 서비스 혹은 퍼시스턴스 레이어에서 세션이 생성되더라도 세션 정보를 레디스에 저장하게 된 것입니다.

> 레디스에 저장되는 자세한 내용은 스프링 세션 공식 문서의 [Storage Details](https://docs.spring.io/spring-session/docs/2.4.6/reference/html5/#api-redisindexedsessionrepository-storage)에서 확인할 수 있습니다.

#### 스프링 세션 레디스는 스케줄링을 통해 만료된 키를 삭제한다.
SessionCleanupConfiguration에서 RedisSessionExpirationPolicy의 cleanExpiredSessions 함수를 스케줄러에 등록하여 스프링에서 자체적으로 제공하는 스케줄링에 의해 만료된 키가 삭제됩니다. 다만, 레디스의 만료 이벤트의 타이밍 문제로 인해서 TTL이 만료된 이후에 레디스가 알아서 삭제하도록 스프링 세션 레디스에서는 명시적으로 키를 삭제하지 않고 단순히 조회(액세스)합니다.

> We do not explicitly delete the keys, since, in some instances, there may be a race condition that incorrectly identifies a key as expired when it is not. Short of using distributed locks (which would kill our performance), there is no way to ensure the consistency of the expiration mapping. By simply accessing the key, we ensure that the key is only removed if the TTL on that key is expired.
