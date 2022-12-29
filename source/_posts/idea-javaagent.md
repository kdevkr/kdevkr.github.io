---
title: 인텔리제이 자바 에이전트 실행하기
date: 2022-12-29
---

> 본 글의 APM 자바 에이전트 적용 예제는 [kdevkr/spring-demo-apm](https://github.com/kdevkr/spring-demo-apm) 리포지토리를 참고하실 수 있습니다.

[부하 및 성능 테스트는 어떻게 하는거지?](/load-testing/)에서 언급한 것처럼 로컬 환경에 성능 테스트에 대한 환경을 구성하기 위해서 Scouter, Pinpoint, Elastic APM과 같은 APM 솔루션들의 자바 에이전트를 실행해야하는 상황이 발생합니다. 실제로는 테스트 환경에 애플리케이션을 배포하고 애플리케이션 서버를 구동하는 경우에 [javaagent 플래그로 에이전트 파일을 지정](https://docs.newrelic.com/docs/apm/agents/java-agent/installation/include-java-agent-jvm-argument/#spring-boot)하면 됩니다.

제가 하고싶었던 것은 로컬 환경에 APM 서버를 구축하고 인텔리제이를 통해 애플리케이션 서버를 실행하는 경우에 자바 에이전트를 적용해보고 싶었습니다. 인텔리제이를 사용하면서 스프링 부트 애플리케이션을 실행할 때 특정 프로파일을 활성화하거나 환경변수를 통해서 일부 프로퍼티를 커스텀하게 적용해본 케이스는 있으나 자바 에이전트를 지정해본 경험은 없었습니다. 

#### Path Variables
인텔리제이 문서 상에는 [Path variables](https://www.jetbrains.com/help/idea/absolute-path-variables.html) 항목으로 경로 변수를 추가하거나 빌트인되어 있는 경로 변수를 확인할 수 있습니다. 그리고 아래와 같이 실행 구성에서 Path Variables를 사용할 수 있다고도 안내해주고 있네요.

> You can use path variables to specify paths and command-line arguments for external tools and in some run configurations. For more information, see Built-in IDE macros.

따라서 프로젝트 폴더에 자바 에이전트 파일이 위치한다면 빌트인 된 경로 변수를 사용하여 지정할 수 있다는 의미가 됩니다.

#### Elastic APM 자바 에이전트
```
-javaagent:$PROJECT_DIR$/agent/elastic-apm-agent-1.26.1.jar
-Delastic.apm.server_urls=http://localhost:8200
-Delastic.apm.service_name=spring-demo-apm
-Delastic.apm.application_packages=com.example.demo
-Delastic.apm.environment=dev
```

**$PROJECT_DIR$** 는 인텔리제이에 내장된 프로젝트 경로에 대한 변수이며 JVM 옵션에서도 사용할 수 있습니다. 프로젝트 경로 변수가 아니라 직접 프로젝트 경로를 입력해야하는 경우에는 [쌍따옴표를 사용](https://stackoverflow.com/a/45115316)해야만 합니다.

![](/images/posts/idea-javaagent/01.png)

#### 실행 구성 저장
인텔리제이에서는 실행 및 디버그 구성을 파일로도 저장하여 공유할 수 있도록 지원합니다. Run/Debug Configurations의 상단 우측을 보면 파일로 저장 옵션이 있으며 이를 체크하는 경우 프로젝트 루트 경로의 .run 폴더에 실행 구성 파일이 생성됩니다. 예제 리포지토리의 [SpringDemoApplication [Elastic APM].run.xml](https://github.com/kdevkr/spring-demo-apm/blob/main/.run/SpringDemoApplication%20%5BElastic%20APM%5D.run.xml)와 같이 확인하실 수 있습니다. 주의해야할 사항은 빌트인 경로 변수를 사용하여 프로젝트 경로를 자동으로 지정할 수 있었으나 실행 구성을 다시 확인해보니 프로젝트 경로 변수는 실제 프로젝트 경로로 변경되어있음을 확인할 수 있습니다. 따라서, 누군가에게 실행 구성을 공유해야한다면 프로젝트 경로 변수로 지정된 상태에서 저장하는게 좋을 것 같습니다.

![](/images/posts/idea-javaagent/02.png)

감사합니다.