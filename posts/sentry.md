---
title: Sentry
date: 2023-05-19
tags:
- sentry-java
- sentry-javascript
---

Sentry는 오류 또는 예외를 추적하기 위한 도구로 회사에서 시스템을 구성하는 언어인 자바, 파이썬, Vue 등 다양한 언어 플랫폼과의 연동을 지원한다. Sentry를 도입하게 되는 이유는 개발자가 테스트하는 과정에서 발견되지 않고 QA 엔지니어가 테스트하는 과정 혹은 고객 테스트 환경에서 마지막으로 검수하는 과정에서 발견되지 않은 취약점을 알아채기 위함이다. 그동안 경험했던 대부분의 품질 이슈는 명확하지 않은 요구사항과 부족한 리뷰 과정으로 인해서 인프라 구성과 사용자의 동작에 따라 발생하는 상황이 대부분이었다고 생각한다.

- [Platforms > Java > Spring Boot](https://docs.sentry.io/platforms/java/guides/spring-boot/)
- [Platforms > Browser JavaScript > Vue](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [Platforms > Python > Flask](https://docs.sentry.io/platforms/python/guides/flask/)

> 시스템의 데이터를 분석하고 예측하는 기능의 경우 별도의 파이썬 애플리케이션을 담당하는 팀에서 관리하고 있으므로 Sentry를 도입하진 않고 있다.

## Self-Hosted Sentry
[Self-Hosted Sentry](https://develop.sentry.dev/self-hosted/)에서 제공하는 설치 스크립트를 사용하여 On-Premise 환경에서 Sentry를 구성하고 실행하였다. 설치 스크립트와 도커 컴포즈 문서를 제공하기 때문에 실행 자체는 간단한데 생각보다 많은 컨테이너가 구동되는 부분이 있다. 인프라 비용을 아끼고자 리소스 자원 사용률이 저조한 인스턴스에 실행한 상태인데 별도의 인스턴스로 분리하는 것을 고려하고 있다.

> Keep in mind that all this setup uses single-nodes for all services, including Kafka. For larger loads, you'd need a beefy machine with lots of RAM and disk storage. To scale up even further, you are very likely to use clusters with a more complex tool, such as Kubernetes. Due to self-hosted installations' very custom nature, we do not offer any recommendations or guidance around scaling up.

## Spring Boot
시스템을 구성하는 애플리케이션에서 [Spring Boot](https://docs.sentry.io/platforms/java/guides/spring-boot/)를 사용하고 있다면 sentry-spring-boot-starter를 추가하여 자동 구성을 사용할 수 있다. 

```groovy
implementation platform('io.sentry:sentry-bom:6.19.0')
implementation 'io.sentry:sentry-spring-boot-starter'
```

> When you are using multiple Sentry dependencies, you can avoid specifying the version of each dependency with a [BOM or Bill Of Materials](https://docs.sentry.io/platforms/java/configuration/bill-of-materials/).

개발자가 체크하지 않은 예외는 기본적으로 수집되며 @ExceptionHandler를 선언한 예외 처리 함수에서 Sentry 서버로 예외 정보를 전달하도록 코드를 구현하면 된다.

```java
import io.sentry.Sentry;

try {
    throw new Exception("This is a test.");
} catch (Exception e) {
    Sentry.captureException(e);
}
```

### 예외 수집 정보 커스터마이징
[Advanced Usage](https://docs.sentry.io/platforms/java/guides/spring-boot/advanced-usage/) 문서에 따르면 이벤트를 처리하거나 Sentry에 수집된 오류를 보내기 직전에 조작할 수 있는 콜백을 제공하고 있다. 노출되면 안되는 정보는 명시적으로 제거할 수 있으며 수집하지 않을 예외 클래스에 대해서는 [Ignored Exceptions For Type](https://docs.sentry.io/platforms/java/guides/spring-boot/configuration/#ignored-exceptions-for-type)을 지정하여 제외시킬 수 있다.

```yaml
sentry.ignored-exceptions-for-type:
  - org.springframework.security.access.AccessDeniedException
  - org.springframework.security.authentication.BadCredentialsException
```

특정 예외 클래스 이외에 일부 에러 이벤트를 필터링하고자 한다면 SentryOptions.BeforeSendCallback 인터페이스를 구현한 클래스를 빈으로 등록하여 처리할 수 있다.

```java
@Component
public class CustomBeforeSendCallback implements SentryOptions.BeforeSendCallback {
    @Override
    public SentryEvent execute(SentryEvent event, Hint hint) {
        // Example: Never send server name in events
        event.setServerName(null);
        return event;
    }
}
```

### 사용자 정보 수집하기
Spring MVC 모듈을 사용하고 있다면 [Record User Information](https://docs.sentry.io/platforms/java/guides/spring-boot/record-user/) 문서를 참고하여 사용자 이름(Principal#name)과 IP 주소를 수집하도록 활성화 할 수 있다. 만약, 스프링 시큐리티를 사용하여 인증 체계를 구현하였다면 UserDetails의 Username이 오류와 함께 기록된다.

```yml
sentry.send-default-pii: true
```

### 비동기 함수 처리
Sentry's SDK for Java는 스코프와 컨텍스트를 ThreadLocal에 저장하도록 구현되어있다. [Async Methods](https://docs.sentry.io/platforms/java/guides/spring-boot/async/) 문서에 따르면 Sentry Context에서 비동기 함수에 올바르게 접근하기 위해서는 ThreadPoolTaskExecutor 내에 SentryTaskDecorator를 적용해야 한다고 설명한다.

```java
@Configuration(proxyBeanMethods = false)
public class SentryConfiguration {
    @Bean
    public SentryTaskDecorator sentryTaskDecorator() {
        return new SentryTaskDecorator();
    }
}

@Configuration
public class AsyncMethodConfiguration implements AsyncConfigurer {

    private final SentryTaskDecorator sentryTaskDecorator;

    public AsyncMethodConfiguration(SentryTaskDecorator sentryTaskDecorator) {
        this.sentryTaskDecorator = sentryTaskDecorator;
    }

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(sentryTaskDecorator);
        executor.initialize();
        return executor;
    }
}
```

### 메모리 누수

![](https://user-images.githubusercontent.com/17937604/234151792-235d3da4-87be-41b1-af36-be464883e895.png)
![](/images/posts/sentry/01.png)

TransactionPerfomanceCollector에 의한 메모리 누수 문제가 있었으며 6.13.0 그리고 6.13.1 에서 OOM 문제가 해결되었다.

- 6.13.0 - Prevent OOM by disabling TransactionPerformanceCollector for now ([#2498](https://github.com/getsentry/sentry-java/pull/2498))
- 6.13.1 - Fix transaction performance collector oom ([#2505](https://github.com/getsentry/sentry-java/pull/2505))

이외에도 지속적으로 성능 개선과 여러가지 문제가 해결되고 있으니 주기적으로 Sentry 서버를 업그레이드해야할 필요성이 있어보인다.

## Vue
[Sentry for Vue](https://docs.sentry.io/platforms/javascript/guides/vue/)를 참고하여 Vue 애플리케이션에서 발생하는 오류들도 수집할 수 있다. 

```shell
npm install --save @sentry/vue
```

```js sentry.js
import Vue from 'vue'
import * as Sentry from '@sentry/vue'
import axios from 'axios';

export function init(router) {
    Sentry.init({
        Vue,
        dsn: process.env.SENTRY_DSN,
        envinroment: process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE
        integrations: [
            new Sentry.BrowserTracing({
                routingInstrumentation: Sentry.vueRouterInstrumentation(router)
            }),
        ],
        tracingOptions: {
            trackComponents: true
        },
        attachProps: true,
        logErrors: true,
        tracesSampleRate: 1.0,
    })
}
```

> process.env.SENTRY_DSN와 process.env.SENTRY_RELEASE는 빌드하는 과정에서 주입되도록 구현해야하며 process.env.SENTRY_RELEASE는 SourceMap을 업로드하는 과정에서 등록하는 릴리즈 버전과 동일해야한다.

### API 오류 시 요청과 응답 정보 수집하기
Browser JavaScript SDK에서도 기본적인 스크립트 오류는 자동으로 수집되며 Axios와 같은 HTTP 클라이언트 요청 라이브러리를 사용한다면 아래와 같이 API 요청 과정에서 오류가 발생한다면 Sentry로 수집되도록 작성해야한다. 

```js
axios.interceptors.response.use(
    response => response,
    error => {
        const { url, params, data } = error.config
        Sentry.setContext('Request', {
            url,
            params,
            data
        })

        const { status, data } = error.config
        Sentry.setContext('Response', {
            status,
            data
        })

        Sentry.captureException(error)
        return Promise.reject(error)
    })
```

### 인증 사용자 정보 수집하기
[Identify Users](https://docs.sentry.io/platforms/javascript/enriching-events/identify-user/) 문서를 참고하면 사용자 이름과 아이피 주소를 수집할 수 있도록 구성할 수 있다. 기본적으로는 아이피 주소가 수집되는데 인증된 사용자라면 사용자 식별 아이디나 이름을 가져올 수 있으므로 아래와 같이 보다 정확한 정보를 수집할 수 있다.

```js
Sentry.setUser({ 
  id: window.auth.userId,
  username: window.auth.userName,
  ip_address: '{{auto}}'
})
```

> If the user's ip_address is set to "{{auto}}", Sentry will infer the IP address from the connection between your app and Sentry's server.

### 스택 트레이스 추적하기
일반적으로 Vue와 같은 애플리케이션은 빌드되어 배포되는 경우에 번들을 최소화하는 과정을 거치게 되므로 오류가 Sentry에 수집되더라도 스택 트레이스를 통해 원인이 되는 코드 라인을 제대로 찾아가기 힘들 가능성이 있다. 브라우저가 아닌 Sentry 에서 만큼은 스택 트레이스를 깔끔하게 볼 수 있도록 SourceMap을 지원하고 있다. 다음은 Webpack을 번들러로써 사용하고 있을때 사용할 수 있는 플러그인을 설치하는 예시를 보여준다.

```shell
npm install --save-dev @sentry/webpack-plugin
```

```js webpack.config.prd.js
const SentryWebpackPlugin = require("@sentry/webpack-plugin")

module.exports = {
  devtool: "source-map",
  plugins: [
    new SentryWebpackPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      include: "./dist",
      ignore: ["node_modules", "webpack.config.js", "webpack.config.prod.js"],
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.env.SENTRY_RELEASE
    })
  ]
}
```

SENTRY_RELEASE는 빌드와 런타임 시점의 값을 동일하게 사용해야 Sentry에서 제대로 추적할 수 있음에 주의해야한다. 런타임 구성 시 사용하는 DSN가 아니라 [Sentry 사용자에 대한 토큰](https://docs.sentry.io/api/auth/#auth-tokens)을 발급해야하며 프로젝트 정보도 포함해야한다.

## 끝마치며
카카오페이에서 공유한 [Sentry로 우아하게 프론트엔드 에러 추적하기](https://tech.kakaopay.com/post/frontend-sentry-monitoring/)와 라인에서 공유한 [Sentry로 사내 에러 로그 수집 시스템 구축하기](https://engineering.linecorp.com/ko/blog/log-collection-system-sentry-on-premise)를 참고하여 Sentry 활용에 대해 더 자세히 알아갈 수 있다. 개인적으로 도입은 쉬워보이지만 원하는 방식대로 커스터마이징 하기에는 생각보다 어려운 것 같다. 서버 애플리케이션과 다르게 프론트엔드 애플리케이션에서는 Data Source Name (DSN)가 브라우저에 노출되므로 보안 관점에서는 테스트 환경에만 도입해야할 것으로 생각된다.

