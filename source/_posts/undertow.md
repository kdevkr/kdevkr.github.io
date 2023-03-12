---
title: 언더토우
date: 2023-03-12
---

자바 언어로 웹 애플리케이션을 개발하는 경우에 대부분 스프링 프레임워크 또는 스프링 부트 프로젝트를 기반으로 시작하기 때문에 직접 자바 서블릿을 작성하여 아파치 톰캣이나 언더토우와 같은 웹 애플리케이션 서버를 실행하여 배포해보는 경험을 하는 신입 개발자가 많지 않을 것 같다. 그래서 초보 개발자들을 위해 그래들 프로젝트로 언더토우 라이브러리를 추가하고 간단하게 Hello World를 찍어보는 것을 공유하고자 한다.

#### 인텔리제이 커뮤니티 에디션 설치하기
인텔리제이 커뮤니티 에디션은 스프링에 대한 유용한 기능을 지원하지는 않지만 메이븐이나 그래들 프로젝트에 대해서는 지원하고 있다. 빌드 시스템은 Gradle로 선택하고 Download JDK를 통해서 Temurin 17을 선택하여 다운로드 하자. 그러면 JUnit이 기본적으로 포함된 그래들 프로젝트가 생성된다. 

![](/images/posts/undertow/01.png)
![](/images/posts/undertow/02.png)

#### 언더토우 패키지 추가하기
[메이븐 중앙 저장소](https://central.sonatype.com/search?smo=true&q=io.undertow&namespace=io.undertow)에 등록되어 있는 패키지 중에서 undertow-core와 undertow-servlet 모듈을 추가하자. 

```gradle
dependencies {
    implementation 'io.undertow:undertow-core:2.3.4.Final'
    implementation 'io.undertow:undertow-servlet:2.3.4.Final'
}
```

#### Hello World 핸들러 작성하기
[언더토우 공식 문서](https://undertow.io/undertow-docs/undertow-docs-2.1.0/index.html#undertow-core)에 따라 기본적으로 생성되어있는 Main 클래스를 수정해서 Hello World를 출력하는 웹 애플리케이션을 작성해보자. 그리고 Main 클래스 좌측에 표시된 화살표를 눌러서 디버그 모드로 애플리케이션을 실행하자. 특히 백엔드 개발자라면 무조건 디버그 모드로 실행하는 습관을 들여야한다.

```java
package org.example;

import io.undertow.Undertow;
import io.undertow.util.Headers;

public class Main {
    public static void main(String[] args) {
        Undertow server = Undertow.builder()
                .addHttpListener(8080, "localhost")
                .setHandler(exchange -> {
                    exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/plain");
                    exchange.getResponseSender().send("Hello World");
					System.out.println("Hello World");
                })
                .build();
        server.start();
    }
}
```

#### 언더토우 HTTP 핸들러 교체하기
크롬 브라우저를 실행해서 localhost:8080을 입력하면 Hello World가 출력된다. 그러나, 인텔리제이 콘솔에 표시된 것을 살펴보면 Hello World가 두번 출력될 것이다. 우리는 브라우저로 한번 접근했을 뿐인데 왜 두번 출력되는지 의아한 것을 인지해야한다. 이러한 접근은 문제 파악의 시작점이다. (아직은 익숙치 않겠지만) F12를 눌러 개발자 도구를 표시한 후 Network 탭을 누른 뒤 F5를 눌러서 페이지를 새로고침 해보면 localhost 이외에 favicon.ico라는 것이 있음을 확인할 수 있다. 이 파비콘이라는 것은 웹 사이트 탭 왼쪽에 표시되는 작은 로고를 의미한다. 그러니까, 브라우저는 파비콘 표시를 위해 자동으로 추가 요청하고 있는 것이다. 더 자세하게 살펴보면 우리가 작성한 코드대로 text/plain 타입에 Hello World가 전달되었음을 확인할 수 있을 것이다.

![](/images/posts/undertow/03.png)

```java
package org.example;

import io.undertow.Handlers;
import io.undertow.Undertow;
import io.undertow.util.Headers;

public class Main {
    public static void main(String[] args) {
        Undertow server = Undertow.builder()
                .addHttpListener(8080, "localhost")
                .setHandler(Handlers.path()
                        .addExactPath("/", exchange -> {
                            exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/plain");
                            exchange.getResponseSender().send("Hello World");
                            System.out.println("Hello World");
                        }))
                .build();
        server.start();
    }
}
```

결국, 기존 코드의 핸들러는 모든 요청에 대해 Hello World를 출력하는 애플리케이션이 된 것을 의미한다. 이것을 메인 요청에 대해서만 Hello World를 출력할 수 있도록 핸들러를 교체해보자. 위와 같이 PathHandler를 사용하면 특정 경로를 처리할 핸들러를 별도로 등록할 수 있게 제공한다. 실행중인 애플리케이션을 종료한 후 다시 시작해보면 favicon.ico에 대해서는 요청을 처리하지 않아 404라는 의미로 빨간색으로 표시되었고 인텔리제이 콘솔에는 의도한 것처럼 Hello World가 단 한번 출력됨을 알 수 있다.

#### 언더토우 서블릿 컨테이너로 전환하기
앞선, Hello World 출력은 언더토우의 코어 모듈을 사용하여 처리하는 핸들러를 등록했을 뿐이다. 우리는 처음에 서블릿 모듈까지 추가했으므로 자바 서블릿을 사용하는 웹 애플리케이션으로 전환해보자. 언더토우 서블릿 모듈의 사용법도 [공식 문서를 참고](https://undertow.io/undertow-docs/undertow-docs-2.1.0/index.html#undertow-servlet)하면 된다. 어느정도 눈치챈 사람들이 있다면 MVC 패턴을 들어봤거나 DispatcherServlet의 용도를 아는 것일 것이다. 현재는 본래 용도가 아닌 Hello World를 출력하기 위한 서블릿이기에 몰라도 되므로 궁금한 사람들만 찾아보자.

```java
package org.example;

import io.undertow.Handlers;
import io.undertow.Undertow;
import io.undertow.servlet.Servlets;
import io.undertow.servlet.api.DeploymentInfo;
import io.undertow.servlet.api.DeploymentManager;
import jakarta.servlet.ServletException;

public class Main {
    public static void main(String[] args) throws ServletException {
        DeploymentInfo deployment = Servlets.deployment()
                .setClassLoader(Main.class.getClassLoader())
                .setContextPath("/")
                .setDeploymentName("main.war")
                .addServlets(Servlets.servlet("DispatcherServlet", DispatcherServlet.class)
                        .addMapping("/"));

        DeploymentManager manager = Servlets.defaultContainer().addDeployment(deployment);
        manager.deploy();

        Undertow server = Undertow.builder()
                .addHttpListener(8080, "localhost")
                .setHandler(Handlers.path()
                        .addExactPath("/", manager.start()))
                .build();
        server.start();
    }
}
```

```java
package org.example;

import io.undertow.util.Headers;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public class DispatcherServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.addHeader(Headers.CONTENT_TYPE.toString(), "text/plain");
        resp.getWriter().println("Hello World");
    }
}
```

앞선 코드의 문제점은 디스패처서블릿이 본 용도가 아니므로 시간이 많다면 본인이 생각하는 방식대로 고쳐보는 것도 추천한다. 많은 신입 개발자들이 오해하는 것은 효율적인 관점에서 코드 작성에 대해 정답이 있다는 것이라고 생각한다는 것일지 모르겠다. 유용한 정보일지는 모르겠으나 누군가에게는 도움이 되는 글이었으면 한다.