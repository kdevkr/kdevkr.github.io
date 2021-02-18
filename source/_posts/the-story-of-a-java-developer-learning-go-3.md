---
title: 자바 개발자가 Go를 배우는 이야기 3탄
date: 2021-02-18 09:00:00
---

![](../images/posts/gopher03.png#compact)

자바로 웹 애플리케이션을 작성하고 실행하기 위해서는 서블릿이라는 개념도 알아야하고 톰캣과 같은 서블릿 컨테이너를 실행하여 서블릿을 동작시켜야하빈다. 반면에 Go는 표준으로 제공하는 `net/http` 패키지 만으로도 애플리케이션이 작성할 수 있으며 별도의 실행 컨테이너 없이 네이티브 바이너리로 바로 실행됩니다.

물론 자바 웹 애플리케이션을 작성할 때 서블릿 또는 JSP 보다는 스프링 프레임워크를 주로 사용하며 요즘에는 스프링 부트 프로젝트로 애플리케이션이 개발됩니다. 다만, 웹 애플리케이션 기능 개발을 위한 의존성 라이브러리를 포함할 때마다 애플리케이션은 점점 무거워지고 컴파일 및 빌드 시간이 늘어나게 됩니다.

> 자바 애플리케이션을 빌드하는데 걸리는 시간이 어마어마합니다.

## Diff Java
클라이언트 정보를 출력하는 웹 애플리케이션을 스프링 부트로 만들어보고 비교를 해봤습니다. 먼저, 그레이들(Gradle)을 빌드 및 의존성 관리 도구로 사용하는 스프링 부트 프로젝트를 시작하면 그레이들을 다운받고 빌드되기를 기다립니다.

```sh
Download https://services.gradle.org/distributions/gradle-6.8.2-bin.zip finished, took 2 s 549 ms (107.84 MB)
Starting Gradle Daemon...
Gradle Daemon started in 3 s 975 ms

BUILD SUCCESSFUL in 1m 29s
```

> 어휴, 맨 처음 그레이들이 빌드되는데 1분 30초 정도 걸렸네요.

그리고 스프링 부트 애플리케이션에 요청된 클라이언트 정보를 출력하는 핸들러 함수를 다음과 같이 작성합니다.

```java DemoApplication.java
@RestController
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/")
    public ResponseEntity<String> handler(@RequestHeader("user-agent") String userAgent) {
        return ResponseEntity.ok(userAgent);
    }

}
```

> 스프링 프레임워크 덕분에 생각보다 핸들러 함수 작성이 쉽고 빠릅니다. 

이제 스프링 부트 애플리케이션을 실행해볼까요?

```sh Debug Console
2021-02-18 00:13:59.245  INFO 8372 --- [           main] com.example.demo.DemoApplication         : Starting DemoApplication using Java 11.0.7 on DESKTOP-OJJ4TB3 with PID 8372 (C:\Users\Mambo\sample-web\build\classes\java\main started by Mambo in C:\Users\Mambo\sample-web)
2021-02-18 00:13:59.248  INFO 8372 --- [           main] com.example.demo.DemoApplication         : No active profile set, falling back to default profiles: default
2021-02-18 00:13:59.903  INFO 8372 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2021-02-18 00:13:59.911  INFO 8372 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2021-02-18 00:13:59.911  INFO 8372 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.41]
2021-02-18 00:13:59.983  INFO 8372 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2021-02-18 00:13:59.983  INFO 8372 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 685 ms
2021-02-18 00:14:00.117  INFO 8372 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
2021-02-18 00:14:00.259  INFO 8372 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2021-02-18 00:14:00.268  INFO 8372 --- [           main] com.example.demo.DemoApplication         : Started DemoApplication in 1.313 seconds (JVM running for 2.981)
2021-02-18 00:14:05.269  INFO 8372 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
2021-02-18 00:14:05.270  INFO 8372 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2021-02-18 00:14:05.270  INFO 8372 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 0 ms
```

> 간단한 웹 애플리케이션을 실행하는데 3초 정도 소요됩니다.

자바 웹 애플리케이션을 실행하기 위해 스프링 프레임워크가 내부적으로 서블릿을 작성하고 임베디드 톰캣이라고 하는 내장형 서블릿 컨테이너를 구동하기 까지 많은 과정을 거쳤기 때문입니다. 확실히 Go 언어로 작성된 애플리케이션 보다는 별도의 과정이 더 수행되는 것이라 볼 수 있죠.

이번에는 그레이들로 애플리케이션을 빌드해봅시다. 얼마나 걸릴까요?

```sh Windows Terminal
PS C:\Users\Mambo\sample-web> .\gradlew build -x test
Starting a Gradle Daemon (subsequent builds will be faster)

BUILD SUCCESSFUL in 12s
4 actionable tasks: 4 executed
```

> 소스코드 수정 없이 빌드를 수행할 경우 컴파일 과정이 캐시되어 3초로 줄어들긴 합니다.

빌드된 파일 용량을 확인해보겠습니다.

![](../images/posts/learning-go-build-size-diff.png)

> Go 언어로 작성된 웹 애플리케이션 실행 파일 용량이 생각보다 크지가 않네요. 
> Hello World 출력하는 애플리케이션도 2MB 인데...

간단한 웹 애플리케이션이지만 자바 보다는 Go로 애플리케이션 작성이 쉬웠고 빌드도 빠른 것이 확인됩니다.

## Go Packages
제가 2021년에 만들어보고자 하는 토이 프로젝트는 재직중인 회사에서 주 사업 분야로 참여하고 있는 에너지 분야와 관련됩니다. 바로 스마트 미터에 대한 전력 데이터를 시뮬레이션할 수 있도록 제공해주는 애플리케이션을 만들어보고 싶은데요. 

회사에서 제공하고 있는 서비스는 전력 에너지에 대한 여러가지 사용량과 데이터 항목을 에너지 관련 기업으로부터 수집하고 이를 모니터링하고 전력 수요 관리를 수행합니다. 그러나 개발 시 여러가지 형태의 데이터가 필요한데 에너지 분야에 대한 시뮬레이터가 많이 없을 뿐더러 제공받았던 시뮬레이터들이 대부분 의미없는 값을 주는 형태였습니다.

> 값이 0인 것이 대부분...

그래서 다음과 같은 기능이 포함하는 애플리케이션을 개발하고자 합니다.

- 국내 전력 수급 현황 및 수급 예보 정보 모니터링
- 특정 지역에 대한 시간별 날씨 모니터링
- 스마트 미터 전력량 데이터 시뮬레이터
- 일자별 전력량 데이터를 CSV 포맷으로 다운로드
- MQTT 퍼블리싱 에이전트

Go 언어로 위 기능들을 적용할 수 있는지 기능별로 관련된 패키지를 검색해보았습니다.

### 국내 전력 수급 현황 및 수급 예보 정보 모니터링
국내 전력 수급 현황 및 수급 예보에 대한 정보는 [공공데이터포털](https://www.data.go.kr]의 한국전력거래소에서 제공하는 [전력수급예보조회](https://www.data.go.kr/data/15051436/openapi.do)와 [현재전력수급현황조회](https://www.data.go.kr/data/15056640/openapi.do) API로 수집할 수 있습니다. 이 오픈 API들은 응답 데이터를 XML으로만 내려주므로 Go로 작성된 웹 애플리케이션에서 HTTP 요청을 수행하고 응답받은 XML 형식의 문자열 데이터를 파싱할 수 있는 라이브러리가 필요합니다.

Go로 작성된 HTTP 클라이언트 라이브러리와 XML 파싱 라이브러리를 찾아보면 다음과 같습니다.

- [resty](https://github.com/go-resty/resty)
- [encoding/xml](https://golang.org/pkg/encoding/xml/)

### 특정 지역에 대한 시간별 날씨 모니터링
전기 에너지를 만들 수 있는 태양광 패널의 경우 설치된 지역의 날씨 정보 중 일사량과 발전량을 비교하는게 중요합니다. 특정 지역(위, 경도)에 대한 시간별 날씨 정보는 [Open Weather API](https://openweathermap.org/)를 활용할 예정이며 날씨 데이터를 JSON 형식의 문자열로 제공하므로 이를 Go 구조체로 변환하는 작업을 수행해야 합니다.

- [encoding/json](https://golang.org/pkg/encoding/json)

### 스마트 미터 전력량 시뮬레이터
스마트 미터 전력량 시뮬레이터는 이 토이 프로젝트의 핵심이라고 할 수 있는데요. 이 전력량을 계산 또는 예측하는데 기준이 되는 수치를 시스템 정보 중 현재 메모리 사용량을 측정해서 활용할 까 생각중입니다. 그리고 이 측정을 반복해서 수행해야하므로 자바에서 사용되는 스케줄 라이브러리인 쿼츠 스케줄러와 같은 패키지가 필요합니다.

- [cron](https://github.com/robfig/cron)
- [goCron](https://github.com/jasonlvhit/gocron)

### 일자별 전력량 데이터를 CSV 포맷으로 다운로드
계산 또는 예측된 전력량을 애플리케이션에서는 데이터베이스에 저장하고 이를 CSV 포맷으로 다운로드 할 수 있는 기능을 포함하고자 합니다. 언제든지 특정 기간에 대한 전력 데이터를 제공받을 수 있어야합니다. 이를 위해 Go 구조체에 담긴 데이터를 CSV 형식의 문자열로 변환하는 작업을 수행해야합니다.

- [encoding/csv](https://golang.org/pkg/encoding/csv/)
- [gocsv](https://github.com/gocarina/gocsv)

Go 표준 패키지인 encoding/csv을 사용하는 것도 나쁘지 않아보입니다만 `gocsv`를 이용하면 CSV 파일을 읽어서 Go 구조체로 변환할 수 있습니다.

### MQTT 퍼블리싱 에이전트
MQTT는 경량의 패킷으로 통신하는 프로토콜로써 IoT와 같은 디바이스에서 통신하기 위해 주로 활용됩니다.

- [Eclipse Paho MQTT Go client](https://github.com/eclipse/paho.mqtt.golang)

> 전력 관련 장비들은 모드버스(Modbus)라고 하는 산업용 통신 프로토콜을 사용합니다.

## Go Projects
토이 프로젝트를 진행하기에 앞서 Go로 작성된 여러가지 프로젝트를 살펴보도록 합시다. 깃허브에서 Go 언어를 기반의 리파지토리를 찾아보면 다음과 같은 프로젝트를 찾을 수 있습니다.

- [Docker](https://github.com/docker/docker-ce)
- [Kubernetes](https://github.com/kubernetes/kubernetes)
- [etcd](https://github.com/etcd-io/etcd)
- [Istio](https://github.com/istio/community)
- [Traefik](https://github.com/traefik/traefik)
- [Flannel](https://github.com/coreos/flannel)
- [Github CLI](https://github.com/cli/cli)
- [Grafana](https://github.com/grafana/grafana)
- [fzf](https://github.com/junegunn/fzf)
- [Go Ethereum](https://github.com/ethereum/go-ethereum)
- [Influxdb](https://github.com/influxdata/influxdb)
- [Vault](https://github.com/hashicorp/vault)
- [Node Version Manager for Windows](https://github.com/coreybutler/nvm-windows)

> `fzf`가 Go로 만들어졌었네요?

쿠버네티스 또는 Github CLI 프로젝트처럼 만들어질 프로젝트는 `헥사고날 아키텍처(Hexagonal architecture)` 구조를 따르는 것으로 하겠습니다. 솔직히 어려움이 많겠지만 토이 프로젝트니까 도전해봅니다.

감사합니다.