---
title: Sentry를 도입한 이유
date: 2023-04-16
---

조직 내에서 그동안 개인적으로 도입해서 사용해왔던 SonarQubue, Promethues 와 Grafana, 그리고 Harbor와 같은 오픈소스 프로젝트들을 정리하였습니다. 정리하게 된 이유는 개발자의 관리 포인트가 늘어나고 신경쓰게 되지 않는다는 부분으로 조직에서 공식적으로 도입하기로 결정한 부분이 아니기에 존재 자체를 모르는 분들이 많았기 때문입니다. 현재 유지중인 오픈소스 프로젝트는 아래와 같습니다.

- Uptime Kuma  
- k6  
- Sentry (신규)  

최근에 Sentry를 일본 고객 환경에 대한 테스트 환경과 고객이 테스트하는 환경에 도입하는 것을 최종적으로 결정하였습니다. 그 이유는 품질 이슈에 대한 문제 때문이며 개발자와 QA 엔지니어가 눈으로 확인하지 못한 사용자가 사용하면서 발생하고 있는 여러가지 오류를 기록하고 더 나은 제품을 만들어가기 위함입니다. 더 자세한 내용은 아래의 기업에서 공유한 글들을 확인해보세요.

- [Sentry로 사내 에러 로그 수집 시스템 구축하기](https://engineering.linecorp.com/ko/blog/log-collection-system-sentry-on-premise)
- [Sentry로 우아하게 프론트엔드 에러 추적하기](https://tech.kakaopay.com/post/frontend-sentry-monitoring/)

#### Data Source Name (DSN)
> Data Source Name. A DSN tells the Sentry SDK where to send events so the events are associated with the correct project. Sentry automatically assigns you a DSN when you create a project.

백엔드와 프론트엔드 애플리케이션에서 발생하는 오류들을 추적할 수 있도록 수집하는 경우 [Data Source Name (DSN)](https://docs.sentry.io/product/sentry-basics/dsn-explainer/)라고 하는 프로젝트 별로 발급할 수 있는 식별자를 사용하여 인증할 수 있게 지원합니다. 사용하는 언어 및 프레임워크에 따라 프로젝트를 선택하여 생성하면 연동 메뉴얼과 함께 DSN를 보여주고 SDK에 어떻게 적용하는지 예시를 제공하므로 Sentry와의 연동은 생각보다 어렵지 않습니다.

#### Auth Tokens
![](/images/posts/why-use-sentry/01.png)

애플리케이션 오류를 수집하는 엔드포인트에서는 Data Source Name (DSN) 기반의 인증을 수행하지만 Sentry CLI 또는 자바스크립트에 대한 [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)를 업로드하기 위해서는 사용자에 대한 API Key를 발급하여 사용하게 됩니다. 이제 우리는 Sentry에서 Bearer와 DSN 이라는 형식의 인증 방식을 지원하는 것을 확인했습니다.

#### Spring Boot
![](/images/posts/why-use-sentry/02.png)

[스프링 부트](https://docs.sentry.io/platforms/java/guides/spring-boot/) 기반의 애플리케이션에 대해서는 sentry-spring-boot-starter-jakarta와 같은 스타터를 사용하여 별다른 구성 없이도 DSN을 적용할 수 있도록 제공하고 있습니다.

```gradle build.gradle
dependencies {
    implementation platform('io.sentry:sentry-bom:6.17.0')
    implementation 'io.sentry:sentry-spring-boot-starter-jakarta'
    implementation 'io.sentry:sentry-logback'
    implementation 'io.sentry:sentry-jdbc'
}
```

> 메이븐이나 그래들에서 [Bill Of Materials](https://docs.sentry.io/platforms/java/configuration/bill-of-materials/)을 사용하면 버전 관리를 용이하게 할 수 있습니다.

```yml application.yml
sentry:
  dsn: https://4b1f7d5c5bbb4f6d97f7fa1e9b011235@o1348527.ingest.sentry.io/4505018308493312
  traces-sample-rate: 1.0
  send-default-pii: on
  enable-user-interaction-tracing: on
  enable-user-interaction-breadcrumbs: on
  ignored-exceptions-for-type:
   - org.springframework.security.access.AccessDeniedException
```

#### Sentry.captureXXX
Sentry SDK를 통해 오류를 전달하기 위해서는 Sentry.captureException 또는 Sentry.captureMessage와 같은 API를 사용하면 됩니다. 또한, 애플리케이션 실행 시 발생하는 런타임 예외들은 [Unhandled Errors](https://docs.sentry.io/product/sentry-basics/integrate-backend/capturing-errors/#unhandled-errors)로써 수집됩니다.

- Sentry.captureException
- Sentry.captureMessage
- Sentry.captureEvent

따라서, RuntimeException을 추적하기 위해 굳이 Try/Catch 문법을 사용할 필요는 없으며 일반적으로는 @ControllerAdvice가 붙은 핸들러 함수에서 처리되도록 정의한 예외들을 Sentry.captureException을 사용하여 전달하도록 수정하면 됩니다.

#### Customize Sentry Options
릴리즈 버전 정보를 깃이나 애플리케이션 프로퍼티로 정의하여 Sentry로 전달할 수도 있지만 스프링 부트 애플리케이션에서는 [빌드 정보](/spring-boot-build-info/)를 가져와서 활용할 수 있으므로 아래와 같이 실행중인 릴리즈 버전 정보를 전달할 수 있게 구성할 수 있습니다. 또한, 기본적으로 수집되는 정보들을 확인하고 수집된 정보를 전달하기 전에 SentryOptions.BeforeSendCallback를 사용하여 불필요한 항목들을 제외시킬 수도 있습니다.

```java
@Configuration(proxyBeanMethods = false)
public class SentryConfiguration {

    @Bean
    public Sentry.OptionsConfiguration<SentryOptions> custom(@Autowired(required = false) BuildProperties buildProperties) {
        return options -> {
            if (buildProperties != null) {
                options.setRelease(buildProperties.getVersion());
            } else {
                options.setRelease("v1.0.0");
            }
        };
    }

    @Component
    public static class CustomBeforeSendCallback implements SentryOptions.BeforeSendCallback {
        @Override
        public SentryEvent execute(SentryEvent event, Hint hint) {
            event.setServerName(null);
            return event;
        }
    }
}
```

#### Self-Hosted Sentry
개인 개발자가 아닌 팀에서 Sentry를 사용하기 위해서는 팀 플랜 이상의 비용을 지불해야하기에 [Self-Hosted Sentry](https://develop.sentry.dev/self-hosted/)를 사용하여 테스트 환경의 자원 중 사용량이 상대적으로 적은 서버에 직접 구성하여 사용해보고 있습니다. 그런데 생각보다 많은 컨테이너를 실행하고 여러가지 인스턴스가 단일 노드로 실행되기에 너무 많은 에러가 수집될 수 있다면 비용을 지불하고 사용하는 것이 관리 포인트를 줄일 수 있는 방안이 될 것 같습니다.

