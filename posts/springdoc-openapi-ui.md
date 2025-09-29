---
title: Springdoc OpenAPI UI
date: 2024-02-04T09:00+0900
---

Springdoc OpenAPI UI는 OpenAPI 3 기반의 Swagger API 문서를 작성할 수 있게 제공해주는 라이브러리이다. 오늘은 Springdoc OpenAPI UI 를 사용하는 방법에 대해서 학습해보면서 알게된 유용한 정보들 대해서 공유해보고자 한다. 

#### Select a definition 기본 선택하기

GroupeOpenAPI를 등록하여 하나가 아닌 다수의 API 그룹을 정의하고자 할때 `springdoc.swagger-ui.urls-primary-name`에 기본으로 선택하고 싶은 [그룹 이름을 입력하면 기본으로 선택](https://github.com/springdoc/springdoc-openapi/issues/2022)되어진다. 그룹 표시 순서 정렬에 의해 기본값이 먼저 노출되지 않을 때 유용하다.

```yml
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    groups-order: desc
    urls-primary-name: v1
```

![](/images/posts/springdoc-openapi-ui/01.png)

#### 서버 URL 직접 관리하기

기본으로 만들어주는 URL로도 충분할 수 있지만 API 문서에 대한 서버를 별도로 제공하고자 한다면 호출할 수 있는 엔드포인트를 노출해줄 필요가 있다. 이러한 경우 해당 기능은 제공해주지 않기 때문에 서버 주소에 대한 ConfigurationProperties를 만들고 주입하면 된다.

```yml
springdoc:
  server:
    - url: /
      description: Default
```

```java
@Getter
@RequiredArgsConstructor
@ConstructorBinding
@ConfigurationProperties(prefix = "springdoc")
public class SpringdocServersProperties {
    private final List<Server> servers;
}
```

```java
@Bean
public OpenAPI openAPI(SpringdocServersProperties serversProperties) {
    return new OpenAPI().servers(serversProperties.getServers());
}
```


#### 기본 응답 메시지 표시 비활성화

실무에서는 GlobalOpenApiCustomizer 를 사용해서 [기본으로 제공되는 응답 메시지 중에서 일부에 대해서만 표시](https://github.com/springdoc/springdoc-openapi/issues/381#issuecomment-579583870)되도록 했는데 [스택오버플로우의 답변](https://stackoverflow.com/a/66871601)을 보니 기본적으로 @ControllerAdvice에 의해 찾아주어 추가해주는 응답 메시지를 제외할 수 있다.

```yml
springdoc:
  override-with-generic-response: false
```

```java
@Bean
public GlobalOpenApiCustomizer globalOpenApiCustomizer() {
    return openapi -> openapi.getPaths().values()
        .forEach(pathItem -> pathItem.readOperations()
            .forEach(operation -> operation.getResponses()
            .addApiResponse("500", new ApiResponse().description("Server Error")
                .content(new Content().addMediaType("application/json", new MediaType())))));
}
```

#### Could not resolve pointer: /components/schemas/XXX does not exist in document

API 그룹마다 다른 인증 방식을 사용하기 위해서 분리한다면 아래와 같이 .components 를 지정하는 것을 주의하도록 해야한다. 인증 스키마 이외에 요청과 응답에 대한 스키마 클래스가 포함되지 않기 때문에 .getComponents 를 이용하여 인증 스키마를 추가하자.

```java
@Bean
public GroupedOpenApi apiV1() {
    SecurityScheme bearerScheme = new SecurityScheme()
        .type(SecurityScheme.Type.HTTP)
        .in(SecurityScheme.In.HEADER)
        .scheme("bearer")
        .bearerFormat("JWT");

    return GroupedOpenApi.builder()
        .group("v1")
        .pathsToMatch("/api/**")
        .addOpenApiCustomiser(openapi -> openapi.info(info())
            .addSecurityItem(new SecurityRequirement().addList(DEFAULT_AUTH))
            //.components(new Components().addSecuritySchemes(DEFAULT_AUTH, bearerScheme)) // Resolve error!
            .getComponents().addSecuritySchemes(DEFAULT_AUTH, bearerScheme)
        )
        .build();
}
```

> 이에 대한 자세한 코드는 [spring-boot2-springdoc](https://github.com/kdevkr/spring-boot-2-springdoc.git) 에서 확인할 수 있습니다.
