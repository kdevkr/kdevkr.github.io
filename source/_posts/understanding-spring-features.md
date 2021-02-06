---
title: 스프링 부트 기능에 대하여 알아보자
date: 2020-10-30
tags:
- Spring Boot
---

본 글은 스프링 부트 공식 레퍼런스를 읽으면서 정리하였음을 알려드립니다.

## Initialize a New Project
`Spring CLI`의 `init` 명령 또는 [start.spring.io](https://start.spring.io/)을 통해 스프링 부트 애플리케이션을 시작할 수 있습니다.

다음은 우분투 환경에서 Spring CLI를 설치하고 프로젝트를 시작하는 예시입니다.

```zsh
> sudo apt-get install build-essential curl file git

> test -d ~/.linuxbrew && eval $(~/.linuxbrew/bin/brew shellenv)
> test -d /home/linuxbrew/.linuxbrew && eval $(/home/linuxbrew/.linuxbrew/bin/brew shellenv)
> test -r ~/.bash_profile && echo "eval \$($(brew --prefix)/bin/brew shellenv)" >>~/.bash_profile
> echo "eval \$($(brew --prefix)/bin/brew shellenv)" >>~/.profile

> brew --version
Homebrew 2.5.6
Homebrew/linuxbrew-core (git revision 997f0; last commit 2020-10-22)
```

Homebrew를 통해 Spring CLI를 설치합니다.

```zsh
> brew tap pivotal/tap
> brew install springboot

> spring version
Spring CLI v2.3.5.RELEASE
```

Spring CLI를 통해 Gradle 빌드 시스템 및 JDK 11을 사용하는 애플리케이션을 시작합니다.
```zsh
> spring init --build=gradle --java-version=1.11 --dependencies=web --packaging=jar app.zip
Using service at https://start.spring.io
Content saved to 'app.zip'

> unzip app.zip -d app

# sudo apt-get install tree
> tree
.
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── com
    │   │       └── example
    │   │           └── app
    │   │               └── DemoApplication.java
    │   └── resources
    │       ├── application.properties
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── com
                └── example
                    └── app
                        └── DemoApplicationTests.java

16 directories, 10 files
```

## Build Systems
스프링 애플리케이션은 다양한 빌드 시스템을 사용할 수 있지만 스프링 개발자들은 의존성 관리를 지원하고 `Maven Central` 저장소를 사용할 수 있는 `Maven` 또는 [`Gradle`](https://docs.spring.io/spring-boot/docs/current/gradle-plugin/reference/html/)을 선택하는 것을 추천합니다.

### Dependency Management
릴리즈된 스프링 부트는 선별된 의존성에 대한 목록을 제공합니다. 의존성에 대한 버전은 스프링 부트가 관리하므로 빌드 설정에서 의존성에 대한 버전을 지정할 필요가 없습니다. 선별된 의존성 목록은 `Bills of Materials`(spring-boot-dependencies)으로 제공됩니다.

### Starters
[Starter](https://docs.spring.io/spring-boot/docs/current/reference/html/using-spring-boot.html#using-boot-starter)는 연관된 기술에 대한 의존성을 편리하게 포함시킬 수 있는 프로젝트입니다. 

- spring-boot-starter
- spring-boot-starter-json
- spring-boot-starter-aop
- spring-boot-starter-freemarker
- spring-boot-starter-jdbc
- spring-boot-starter-mail
- spring-boot-starter-quartz
- spring-boot-starter-security
- spring-boot-starter-validation
- spring-boot-starter-web
- spring-boot-starter-websocket
- spring-boot-starter-actuator
- spring-boot-starter-logging
- spring-boot-starter-undertow

예를 들어, `spring-boot-starter-json`는 Jackson 또는 Gson 라이브러리가 클래스패스에 있다면 ObjectMapper 또는 Gson 빈을 자동으로 구성합니다.

## Locating the Main Application Class
메인 애플리케이션 클래스는 다른 클래스 위의 최상위 패키지에 위치하는 것이 좋습니다.

```
com
 +- example
     +- demo
         +- Application.java
         |
         +- customer
         |   +- Customer.java
         |   +- CustomerController.java
         |   +- CustomerService.java
         |   +- CustomerRepository.java
         |
         +- order
             +- Order.java
             +- OrderController.java
             +- OrderService.java
             +- OrderRepository.java
```

### @SpringBootApplication Annotation

@SpringBootApplication를 선언함으로써 다음의 어노테이션들을 포함합니다.
- @EnableAutoConfiguration
- @ComponentScan
- @Configuration

```java
@SpringBootApplication // same as @Configuration @EnableAutoConfiguration @ComponentScan
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## Auto Configuration
스프링 부트는 의존성을 기반으로 스프링 애플리케이션에 대한 기본 구성을 시도합니다. 예를 들어, `HSQLDB`가 클래스 패스에 있으며 특정 데이터베이스 커넥션 빈을 구성하지 않은 경우 스프링 부트는 인-메모리 데이터베이스를 자동으로 구성합니다.

> 스프링 부트를 사용한다면 자동 구성에 대하여 이해하셔야 합니다.

### Disabling Specific Auto Configuration Classes
만약, 특정 자동 설정 클래스를 동작하지 않기를 원한다면 `@SpringBootApplication`의 속성 또는 `spring.autoconfigure.exclude` 프로퍼티를 설정하여 자동 구성 클래스를 제외하여 해당 자동 구성을 해제할 수 있습니다.

## Spring Beans and Dependency Injection
`@SpringBootApplication`이 루트 패키지에 위치한 메인 클래스에 선언됨으로써 `@Component`, `@Service`, `@Repository`, `@Controller`등 애플리케이션 컴포넌트들은 자동으로 스프링 빈으로 등록됩니다. 만약, 빈 생성자가 하나라면 `@Autowired` 선언을 제외할 수 있습니다.

```java
@Service
public class DatabaseAccountService implements AccountService {
    private final RiskAssessor riskAssessor;

    public DatabaseAccountService(RiskAssessor riskAssessor) {
        this.riskAssessor = riskAssessor;
    }
    // ...
}
```

> 생성자를 통한 의존성 주입과 함께 `final` 키워드를 통해 RiskAssessor 의존성이 변경되지 않음을 보장할 수 있습니다.




## Startup Failure

## Lazy Initialization

## Application Events and Listeners

- ApplicationStartingEvent
- ApplicationEnvironmentPreparedEvent
- ApplicationContextInitializedEvent
- ApplicationPreparedEvent
- ApplicationStartedEvent
- AvailabilityChangeEvent
- ApplicationReadyEvent
- AvailabilityChangeEvent
- ApplicationFailedEvent
- WebServerInitializedEvent
- ContextRefreshedEvent

## Externalized Configuration
스프링 부트는 서로 다른 환경에서 동일한 애플리케이션 코드로 작동할 수 있도록 구성 외부화를 제공합니다. Properties 또는 YAML 파일, 환경 변수, 명령줄 인자를 통해 구성에 대한 외부화가 가능합니다. 스프링 부트는 프로퍼티 값을 재정의하기 위하여 특별한 `PropertySource` 순서를 사용합니다.

예를 들면, 다음과 같습니다.
- Command line arguments.
- OS environment variables.
- Profile-specific application properties outside of your packaged jar
- Profile-specific application properties packaged inside your jar
- Application properties outside of your packaged jar
- Application properties packaged inside your jar

### Accessing Command Line Properties


### Application Property Files

- A /config subdirectory of the current directory
- The current directory
- A classpath /config package
- The classpath root



## Profiles
스프링 프로파일은 특정 환경에 맞게 애플리케이션 구성을 구분할 수 있는 방법을 제공합니다. `@Component`, `@Configuration`, `@ConfigurationProperties`에 `@Profile`을 선언하여 실행 시 제한을 적용할 수 있습니다.

예를 들면, 다음과 같이 프로덕션 환경에서만 활성화되는 구성 메타정보 클래스를 만들 수 있습니다.
```java
@Configuration(proxyBeanMethods = false)
@Profile("production")
public class ProductionConfiguration {
    // ...
}
```

## Packaging Executable Jars

