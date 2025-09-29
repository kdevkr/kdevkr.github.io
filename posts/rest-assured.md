---
title: REST Assured
date: 2024-08-09T23:00+09:00
---

[REST Assured](https://rest-assured.io/)를 사용하면 자바 애플리케이션에서 **인수 테스트**를 위한 코드를 작성할 수 있다. 현재 조직은 테스트 커버리지를 체크하지 않고 비즈니스 레이어를 위주로 테스트 코드를 작성하기로 했었다. 온프레미스 형태의 B2B 솔루션이 아닌 **SaaS 서비스**를 준비하면서 **테스트 자동화**를 위해 많은 고민을 하고 있다. 일단 [Playwright](https://playwright.dev/)와 [Allure Report](https://allurereport.org/)를 사용하고자 준비중이라 이에 맞춰 서비스 개발 시 Allure Report와 통합할 수 있는 **JUnit5 + Rest Assured**로 테스트 코드를 작성하려고 한다.

#### Gradle Dependencies

Rest Assured 와 함께 [Hamcrest](https://hamcrest.org/JavaHamcrest/)를 많이 사용하는 것 같은데 스프링 부트 스타터의 테스트 의존성에는 기본적으로 Hamcrest를 포함하고 있다. 단위 테스트 코드를 작성할 때 Hamcrest를 사용해본적은 없어서 이번 기회에 잘 활용해보도록 해야겠다.

```groovy build.gradle
dependencies {
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.rest-assured:rest-assured:5.5.0'
}
```

#### Behavior Driven Development

그동안은 테스트 코드를 작성하더라도 TDD를 수행하지는 않았으며 솔루션 커스터마이징 요구사항에 맞는지만 확인해왔다. Rest Assured는 BDD로 E2E 테스트 코드를 작성할 수 있도록 제공해주기 때문에 프론트엔드나 QA 엔지니어가 작성하는 Playwright 와도 비슷하게 작성해갈 수 있을 것으로 보인다.

```java
@DisplayName("End to End Test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DemoApplicationTests {

    @LocalServerPort
    int port;

    @BeforeEach
    void setup() {
        RestAssured.port = port;
    }

    @Test
    void whenGet_thenOk() {
        RestAssured
                .given()
                .filter(new AllureRestAssured())
                .log().all()
                .header(HttpHeaders.USER_AGENT,
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")

                .when()
                .get("/")

                .then()
                .log().ifValidationFails()
                .statusCode(HttpStatus.OK.value())
                .body(Matchers.is("Hello World"));
    }
}
```

#### Allure REST Assured

그래들 플러그인을 추가하고 **allureReport** 또는 **allureServe** 태스크를 실행하면 Allure 리포트를 확인할 수 있다.

```groovy build.gradle
plugins {
    id 'io.qameta.allure' version '2.12.0'
}

dependencies {
    testImplementation platform('io.qameta.allure:allure-bom:2.28.0')
    testImplementation "io.qameta.allure:allure-junit5"
    testImplementation "io.qameta.allure:allure-rest-assured"
}
```

![Allure Report](/images/posts/rest-assured/01.png)

#### 참고 링크

- [A Guide to REST-assured](https://www.baeldung.com/rest-assured-tutorial)
- [Headers, Cookies and Parameters with REST-assured](https://www.baeldung.com/rest-assured-header-cookie-parameter)
- [Getting and Verifying Response Data with REST-assured](https://www.baeldung.com/rest-assured-response)
- [REST Assured Authentication](https://www.baeldung.com/rest-assured-authentication)
- [Allure REST Assured](https://allurereport.org/docs/restassured/)