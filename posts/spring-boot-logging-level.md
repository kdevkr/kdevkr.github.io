---
title: 스프링 부트 로깅 레벨 선언 (feat. Yaml)
date: 2023-06-25T14:00+0900
tags:
- Logging
- Yaml
---

```properties application.properties
logging.level.org.springframework.security.web.FilterChainProxy=TRACE
```

스프링 부트 애플리케이션에서 logging.level 하위에 패키지와 클래스 명을 선언하면 로깅 레벨을 쉽게 조정할 수 있고 스프링 부트 프로젝트를 만들면 기본으로 사용되는 프로퍼티(.properties) 파일에는 위와 같이 작성해야 한다. 그러나, 아무래도 프로퍼티 파일의 여러가지 문제점으로 인해 application.yml 파일로 변경하여 사용할 것이다. Yaml은 계층으로 키를 관리하기 때문에 인텔리제이 IDEA에서 `org.springframework.security.web.FilterChainProxy`를 그대로 복사하여 붙여넣기를 시도하는 경우 아래와 같이 자동으로 키를 만들어주게 된다.

> 패키지 명을 입력하면 다음 디렉토리를 자동으로 알려주기는 하나 해당 디렉토리에서 존재하는 클래스까지는 알려주지 않으므로 FilterChainProxy의 클래스 위치를 찾아서 상단에 기재된 패키지 명을 복사하는게 더 빠르고 편리하다.

```yaml application.yml
logging:
  level:
    org:
      springframework:
        security:
          web:
            FilterChainProxy:

```

위와 같이 만들어지는게 잘못된 것은 아니지만 가독성이나 유지 관리 면에서는 너무 길어지므로 비효율적이라 생각한다. 여기서 logging.level 하위 계층을 표현하는 경우에 작은 따옴표(`'`)를 활용하면 한줄로 표현할 수 있다. 

```yaml application.yml
logging:
  level:
    'org.springframework.security.web.FilterChainProxy': TRACE
```

> 작은 따옴표로 하나의 키로 표현할 수 있게 되지만 맨 뒤에 콜론은 자동으로 붙여주지 않으므로 옆으로 이동하여 콜론을 포함한 로그 레벨을 입력해야한다. 개인적으로는 콜론까지 입력하는 부분은 그렇게 불편한 부분은 아니라고 생각된다.

#### 로그 그룹 (Optional)
스프링 부트 2.1+ 부터는 로그 레벨 뿐만 아니라 특정 클래스들에 대한 로그 레벨을 한번에 관리할 수 있는 [로그 그룹](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.1-Release-Notes#logging-groups)을 지원하고 Yaml 문법을 활용하여 작은 따옴표가 없어도 표현할 수 있다.

```yaml application.yml
logging:
  level:
    study: TRACE
  group:
    study:
      - org.springframework.web
      - org.springframework.jdbc.core
      - org.springframework.security.web.FilterChainProxy
```

로그 그룹을 사용한다면 굳이 작은 따옴표가 필요하지 않지만 일반적으로 로그 레벨 조정은 세부적인 클래스 단위로 변경하는 경우가 많기 때문에 많이 활용되진 않는다. 이와 같이 [스프링 부트 공식 문서의 Logging 항목](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.logging)에서도 다루지 않는 내용이기 때문에 생략된 정보가 없는지는 별도로 찾아보는 행위도 간혹 필요하다. 본 글에서 공유한 내용은 그저 Yaml 파일에 대한 기본 문법을 활용한 것이다.

