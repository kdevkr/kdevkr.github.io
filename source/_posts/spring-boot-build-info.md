---
title: 스프링 부트 빌드 정보
date: 2023-03-21
---

> 본 글에 대한 관련 코드는 https://github.com/kdevkr/spring-demo 에서 참고할 수 있습니다.

스프링 부트 프로젝트에서 빌드 정보를 가져오기 위해서는 그래들이나 메이븐 플러그인에 따라 아래와 같이 buildInfo()가 동작하도록 구성해야한다. 이렇게 구성하면 빌드 단계에서 클래스패스에 META-INF/build.properties라는 파일에 빌드 정보가 포함된다.

```gradle build.gradle
springBoot {
    buildInfo()
}
```

클래스패스에 추가된 build-info.properties의 내용은 ProjectInfoAutoConfiguration 클래스에 의해서 BuildProperties 클래스가 빈으로 등록되게 된다. 그래서 우리는 아래와 같이 BuildProperties를 기반으로 빌드 정보를 제공하는 API를 작성할 수 있다.

```java BuildController.java
@RestController
public class BuildController {

    private final BuildProperties buildProperties;

    public BuildController(final BuildProperties buildProperties) {
        this.buildProperties = buildProperties;
    }

    @GetMapping("build-info")
    public BuildProperties buildInfo() {
        return buildProperties;
    }
}
```

하지만, 그래들 명령어에 의해 빌드된 애플리케이션 파일으로 실행된 것이 아니라 인텔리제이와 같은 IDE로 구동하는 경우라면 BuildProperties가 등록되지 않으므로 오류가 발생한다. 클래스패스에 있는 빌드 정보를 먼저 사용할 수 있도록 @AutoConfiguration을 통해 자동 구성 클래스를 만들고 ProjectInfoAutoConfiguration가 동작한 이후에 수행하도록 하면 된다.

```java BuildConfiguration.java
//@Import(ProjectInfoAutoConfiguration.class)
@AutoConfiguration(after = ProjectInfoAutoConfiguration.class)
@Configuration
public class BuildConfiguration {
    @ConditionalOnMissingBean(BuildProperties.class)
    @Bean
    public BuildProperties buildProperties() {
        Properties properties = new Properties();
        properties.setProperty("time", DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        properties.setProperty("artifact", "demo");
        properties.setProperty("group", "kr.kdev");
        properties.setProperty("name", "demo");
        properties.setProperty("version", "local");
        return new BuildProperties(properties);
    }
}
```

> 위 코드에서 @AutoConfiguration는 스프링 부트 2.7 에서 추가된 어노테이션이므로 이전 버전이라면 @Import를 통해 수동으로 동작하도록 해야한다.

그러면 이제 개발 환경에서는 ProjectInfoAutoConfiguration에 의해 BuildProperties가 등록되지 않더라도 코드로 정의된 BuildProperties가 등록되어 오류가 발생하지 않는다. 빌드된 애플리케이션에서는 빌드 정보 API가 등록되므로 아래와 같이 빌드 정보를 확인할 수 있다.

```powershell Windows Terminal
# java -jar '-Dspring.profiles.active=prod' .\demo-1.0.0.jar
# /build-info
{"name":"demo","version":"local","time":"2023-03-22T13:13:58.186Z","artifact":"demo","group":"kr.kdev"}
```