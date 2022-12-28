---
title: 인텔리제이 자바 에이전트 실행하기
date: 2022-12-29
---

> 본 글의 APM 자바 에이전트 적용 예제는 [kdevkr/spring-demo-apm](https://github.com/kdevkr/spring-demo-apm) 리포지토리를 참고하실 수 있습니다.

[부하 및 성능 테스트는 어떻게 하는거지?](/load-testing/)에서 언급한 것처럼 로컬 환경에 성능 테스트에 대한 환경을 구성하기 위해서 Scouter, Pinpoint, Elastic APM과 같은 APM 솔루션들의 자바 에이전트를 실행해야하는 상황이 발생했습니다. [병목 지점을 제대로 확인하기 위해서](https://www.youtube.com/watch?v=UqZBqs1Yle8)는 요청에 대한 트랜잭션을 추적할 수 있는 방법을 준비해야하니까요. 인텔리제이를 사용하면서 스프링 부트 애플리케이션을 실행할 때 프로파일을 적용하거나 환경변수를 통해서 특정 프로퍼티를 커스텀하게 적용해본적은 있었으나 자바 에이전트를 적용해본 케이스는 없었습니다. 

대부분의 예제에서는 스프링 부트 프로젝트를 패키징된 상태에서 java -jar 명령어를 사용하여 애플리케이션 서버를 구동하는 시점에 [-javaagent 인자를 통해서 에이전트를 등록할 수 있는 방법](https://docs.newrelic.com/docs/apm/agents/java-agent/installation/include-java-agent-jvm-argument/#spring-boot)을 설명하고 있습니다. 더 찾아본 결과 -javaagent는 JVM 플래그이므로 JVM Options로도 적용할 수 있다는 정보를 확인하였습니다.

#### Elastic APM 자바 에이전트
```
-javaagent:$PROJECT_DIR$/agent/elastic-apm-agent-1.26.1.jar
-Delastic.apm.server_urls=http://localhost:8200
-Delastic.apm.service_name=spring-demo-apm
-Delastic.apm.application_packages=com.example.demo
-Delastic.apm.environment=dev
```

**$PROJECT_DIR$** 는 인텔리제이에서 참조하는 프로젝트 경로에 대한 변수이며 JVM 옵션에서도 활용할 수 있습니다. 처음에는 프로젝트 소스코드를 받고 컴퓨터마다 다른 프로젝트 경로를 수동으로 적용해야하나 생각했으나 역시나 이것도 찾아보니 방법이 있었더군요. 프로젝트 경로 변수가 아니라 직접 프로젝트 경로를 입력해야하는 경우에는 [쌍따옴표를 사용](https://stackoverflow.com/a/45115316)해야만 합니다.

![](/images/posts/idea-javaagent/01.png)

#### 실행 구성 저장
인텔리제이에서는 실행 및 디버그 구성을 파일로도 저장하여 공유할 수 있도록 지원합니다. Run/Debug Configurations의 상단 우측을 보면 파일로 저장 옵션이 있으며 이를 체크하는 경우 프로젝트 루트 경로의 .run 폴더에 실행 구성 파일이 생성됩니다. 예제 리포지토리의 [SpringDemoApplication [Elastic APM].run.xml](https://github.com/kdevkr/spring-demo-apm/blob/main/.run/SpringDemoApplication%20%5BElastic%20APM%5D.run.xml)와 같이 확인하실 수 있습니다.

![](/images/posts/idea-javaagent/02.png)

감사합니다.