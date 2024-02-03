---
title: SpringDoc UI 인증을 위한 토큰 기본값 표시
date: 2024-02-03T11:00+0900
tags:
- 
---

[Configure JWT Authentication for OpenAPI](https://www.baeldung.com/openapi-jwt-authentication)를 참고하면 SpringDoc UI를 사용할 때 JWT 인증을 위해 Bearer 스키마 유형을 구성할 수 있음을 쉽게 알 수 있다. 그러나, Bearer와 같은 인증 방식의 경우 OAuth 와는 다르게 기본값을 적용할 수 있는 방안이 없다. 스웨거 문서에서 API를 호출해보고 싶은 경우 대부분 스프링 시큐리티에서 제공하는 HTTP 기본 인증이나 폼 로그인을 하지 못하도록 비활성화하기 때문에 사용자 로그인을 수행할 수 있는 엔드포인트를 만들어서 문서에 노출하여 토큰을 발급할 수 있도록 해야한다.

> 기본적으로 프로젝트 개발 시 Bearer 인증 시 Input 박스에 기본값을 넣어둘 방안은 없습니다.

#### SecurityScheme

```java
@SecurityScheme(
    name = "Bearer Authentication",
    type = SecuritySchemeType.HTTP,
    in = SecuritySchemeIn.HEADER,
    bearerFormat = "JWT",
    scheme = "bearer"
)
@Configuration
public class DocsConfig {}
```

![Configure JWT Authentication for OpenAPI](https://www.baeldung.com/wp-content/uploads/2022/06/auth-modal.png)

위 링크에서 `Bearer Authentication` 에 대한 이미지를 잘 살펴보면 `Description` 이 표시되는 걸 확인할 수 있다. 인증 방법에 대한 설명을 제공하는 부분이지만 일반 텍스트 뿐만 아니라 HTML 태그가 가능한 것으로 보인다. 본 글에서는 이것을 이용해서 **개발 환경에서는 테스트 사용자에 대한 이름과 토큰이 표시될 수 있도록** 할 예정이다.

#### Customize SecurityScheme

`@SecurityScheme` 어노테이션으로 글로벌 인증에 대한 설정을 구성했다면 [OpenAPI를 빈으로 등록하는 구성](https://www.baeldung.com/openapi-jwt-authentication#3-global-configuration)으로 변경이 필요하다. 
아래는 애플리케이션 속성으로 등록된 사용자 토큰 정보를 Description 영역에 표시될 수 있도록 구현한 예제이다. 

```java
@Configuration
public class DocsConfig {
    public static final String DEFAULT_AUTH = "JWT Authentication";

    @Bean
    public OpenAPI openAPI(BearerTokenProperties bearerTokenProperties) {
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(DEFAULT_AUTH);
        SecurityScheme securityScheme = new SecurityScheme()
            .name(DEFAULT_AUTH)
            .type(SecurityScheme.Type.HTTP)
            .in(SecurityScheme.In.HEADER)
            .scheme("bearer")
            .bearerFormat("JWT");

        if (bearerTokenProperties.isEnabled() && !bearerTokenProperties.getTokens().isEmpty()) {
            List<BearerTokenProperties.BearerToken> tokens = bearerTokenProperties.getTokens();
            // NOTE: It is rendered as a markdown.
            String description = tokens.stream()
                .map(item -> String.format("**%s** %s", item.getName(), item.getToken()))
                .collect(Collectors.joining("\n\n"));
            securityScheme.description(description);
        }

        return new OpenAPI()
            .addSecurityItem(securityRequirement)
            .components(new Components()
                .addSecuritySchemes(DEFAULT_AUTH, securityScheme));
    }
}
```

```java
@Getter
@ConstructorBinding
@RequiredArgsConstructor
@ConfigurationProperties("springdoc.bearer")
public class BearerTokenProperties {
    private final boolean enabled;
    private final List<BearerToken> tokens;

    @Getter
    @RequiredArgsConstructor
    public static class BearerToken {
        private final String name;
        private final String token;
    }
}
```

```yml application-dev.yml
springdoc:
  bearer:
    enabled: on
    tokens:
      - name: Default
        token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
      - name: User2
        token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

![](/images/posts//springdoc-ui-bearer-authentication/01.png)

> 참고로 위 예제 코드를 보면 마크다운 형식으로 문자열을 구성했는데 개발자 도구로 Description 영역을 살펴보니 마크다운 렌더링으로 되고 있어서 굳이 HTML 태그를 사용하지 않았습니다. 마크다운에 익숙하지 않는 개발자라면 일반 HTML 태그로 만드시면 됩니다.
