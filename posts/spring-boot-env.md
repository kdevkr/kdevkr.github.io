---
title: Spring Boot Environment Variables
date: 2025-01-19T10:00+09:00
tags:
- Spring Boot
- Environment
- Properties
- Dotenv
---

회사에서 프로젝트 리파지토리 내 존재하는 환경별 속성 파일을 제거하고 환경 변수를 이용하기로 요구되었습니다. 개발 과정에서는 인텔리제이의 [EnvFile 플러그인](https://plugins.jetbrains.com/plugin/7861-envfile)을 이용해 로컬에 만든 .env 파일을 환경 변수로 적용할 수 있었지만 단위 테스트 코드를 실행할 때에는 매번 실행 환경을 수정하는게 불편해서 단위 테스트 시 환경 변수를 적용하기 위한 방법에 대해서 찾아봤습니다.

#### spring-dotenv
[spring-dotenv](https://github.com/paulschwarz/spring-dotenv)를 사용하면 애플리케이션 속성 파일에 환경 변수 형태로 적용할 수 있지만  <u>애플리케이션 속성 파일에 따라 자동으로 적용되지는 않는다</u>는 단점이 있습니다. 예를 들어, 스프링 부트 애플리케이션의 배너를 제외하기 위해서 SPRING_MAIN_BANNERMODE이 dotenv 파일에 정의되어 있어도 애플리케이션 속성 파일에  <u>SPRING_MAIN_BANNERMODE를 사용하도록 별도로 지정하지 않으면</u> 사용할 수 없습니다.

```properties
# dev.env
SPRING_MAIN_BANNERMODE=off

# application.properties
spring.main.banner-mode=${SPRING_MAIN_BANNERMODE:console}
```

> 기본적으로 OS 환경 변수는 정해진 패턴에 따라 스프링 부트에서 지원하는 [Externalized Configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.relaxed-binding.environment-variables)에 따라 애플리케이션 속성으로 반영됩니다. 따라서, [도커 컴포즈](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/#use-the-env_file-attribute) 또는 [Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/use-environment-file.html)에서는 dotenv 파일로 환경변수를 지정할 수 있죠.

#### Environment를 커스터마이징할 수 있는 여러가지 방법

- [EnvironmentPostProcessor](https://www.baeldung.com/spring-boot-environmentpostprocessor)
- ContextConfiguration + ApplicationContextListener + [TestPropertyValues](https://docs.spring.io/spring-boot/reference/testing/test-utilities.html#testing.utilities.test-property-values)
- [@TestPropertySource](https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-testpropertysource.html)

단위 테스트 코드를 실행하는 경우 위와 같은 방법으로 Environment를 커스터마이징할 수 있는데요. 이를 통해서 일부 애플리케이션 속성을 변경할 수 있지만 .env 파일을 지정할 순 없습니다. 앞서 spring-dotenv를 사용하려면 애플리케이션 속성 파일에 재정의가 필요하고 단위 테스트를 개별로 수행할 때마다 실행 환경에서 EnvFile 플러그인을 활성화하기에는 너무나도 불편합니다.

#### 스프링 배너 출력은 Environment로 동작하지 않는다?

이 글을 작성하기 위해서 테스트를 해보던 중 스프링 배너 출력에 대한 속성값은 TestPropertySource와 DotenvPropertySource 모두 Environment에 반영되어 테스트는 통과했으나 실제 스프링 배너 출력은 변경되기 이전의 값으로 동작했고 TestPropertyValues 또는 EnvironmentPostProcessor 에서  <u>시스템 프로퍼티로 등록해야만</u> 제대로 반영되어 출력되지 않는 것을 확인할 수 있었습니다.

```java
@ActiveProfiles("test")
@SpringBootTest
class ApplicationTests {}
```

프로덕션 배포가 아닌 단위 테스트 시에는 .env 파일을 사용하지 않고 별도의 애플리케이션 속성 파일(application-test.yml)을 두고 [@ActiveProfiles](https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-activeprofiles.html)를 활용하는 것이 그나마 제일 나은 선택지일 것 같습니다. 스프링 배너 출력에 대한 동작은 실제로 크리티컬한 부분은 아니지만 스프링 프레임워크에서 제공해주는 애플리케이션 속성에 따라 동작 여부가 다르다는 건 중요한 부분이라고 생각됩니다. 

spring-dotenv 또는 [spring.config.import를 통해 .env 파일을 적용하는 예시](https://github.com/spring-projects/spring-boot/issues/24229#issuecomment-783343327)가 많은데 주의해서 사용할 필요가 있겠네요.