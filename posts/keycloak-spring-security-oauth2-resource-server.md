----
title: Keycloak + Spring Security OAuth 2.0 Resource Server
date: 2024-12-19T23:00+09:00
tags:
- Keycloak
- Spring Security
- OAuth 2.0 Resource Server
----

프론트엔드 채널에서 Keycloak 를 통해 발급하여 백엔드 요청으로 전달되는 JWT 토큰에 대한 검증을 위해 Spring Security의 [OAuth 2.0 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)를 사용하여 JWT 토큰이 신뢰할 수 있는 곳에서 서명되었는지 확인하는 것을 알아보자. 본 글에서는 사용자 인증에 대한 Authorization Code Flow를 백엔드 채널로 전달하여 토큰을 교환하는 과정을 거치지 않고 [JavaScript Keycloak Adapter](https://www.keycloak.org/securing-apps/javascript-adapter)를 사용하여 PKCE 기반으로 발급된 토큰을 전달받는다고 가정한다.

- Keycloak 26.0.6
- Spring Boot 3.4.0
- spring-security-oauth2-resource-server:6.4.1

#### OAuth 2.0 Resource Server

일반적인 예제에서는 OAuth2 Authorization Server, OAuth2 Client 를 포함하지만 토큰 발급 과정을 서비스 애플리케이션에서 수행하지 않는다면 리소스 서버에 대한 의존성인 `spring-boot-starter-oauth2-resource-server` 만을 포함해도 된다

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-security'
}
```

```yaml application.yml
spring.security:
    oauth2:
        resourceserver:
            jwt:
               issuer-uri: ${keycloak.issuer-uri}

keycloak:
     issuer-uri: http://localhost:8080/realms/mambo
    jwk-set-uri: http://localhost:8080/realms/mambo/protocol/openid-connect/cert
    client-id: backend
```

서비스 애플리케이션에서 사용될 애플리케이션 속성은 위와 같으며 스프링 시큐리티에 대한 설정을 진행해보자.

```java SecurityConfiguration
@Configuration
@RequiredArgsConstructor
public class SecurityConfiguration {
    private final KeycloakProperties keycloakProperties;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.formLogin(AbstractHttpConfigurer::disable);
        http.httpBasic(AbstractHttpConfigurer::disable);
        http.csrf(AbstractHttpConfigurer::disable);

        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/").permitAll()
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                .anyRequest().denyAll());

        http.oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakJwtAuthenticationConverter())));
        return http.build();
    }
}
```

```java KeycloakJwtAuthenticationConverter
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private static final String TYPE = "type";
    private static final String RESOURCE_ACCESS = "resource_access";
    private static final String ACCOUNT = "account";
    private static final String ROLES = "roles";
    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Object username = jwt.getClaims().get("preferred_username");
        Set<GrantedAuthority> authorities = extractAuthorities(jwt);
        return new JwtAuthenticationToken(jwt, authorities, username == null ? null : String.valueOf(username));
    }

    private Set<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<String> roleSet = new HashSet<>();

        Map<String, Object> claims = jwt.getClaims();
        for (Map.Entry<String, Object> entry : claims.entrySet()) {
            String key = entry.getKey();

            if (key.equals(TYPE)) {
                roleSet.add(String.valueOf(entry.getValue()));
            } else if (key.equals(RESOURCE_ACCESS)) {
                Map<String, List<String>> resourceAccess = (Map<String, List<String>>) entry.getValue();
                if (resourceAccess.containsKey(ACCOUNT)) {
                    Map<String, List<String>> account = (Map<String, List<String>>) resourceAccess.get("account");
                    if (account.containsKey(ROLES)) {
                        roleSet.addAll(account.get(ROLES));
                    }
                }
            }
        }

        return roleSet.stream()
                .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role))
                .collect(Collectors.toSet());
    }
}
```

위 예시와 같이 KeycloakJwtAuthenticationConverter 를 구현하지 않고 **JwtAuthenticationConveter** 를 사용하고 JwtGrantedAuthoritiesConverter 를 작성해도 된다. 참고로 Keycloak 에서 발급되는 OIDC 토큰에는 iss 가 포함되어 있으므로 JwtDecoder 또는 issuer-uri 와 [jwk-set-uri](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html#oauth2resourceserver-jwt-jwkseturi)를 명시하는게 필요하진 않다.

#### JWT 토큰 검증 오류 시

기본적인 **BearerTokenAuthenticationEntryPoint** 는 오류에 대한 내용을 `WWW-Authenticate` 응답 헤더에 포함된다. 만약, `401 Unauthorized` 에 대한 오류 내용을 응답 바디로 반환하고자 한다면 **AuthenticationEntryPoint** 커스터마이징 해서 설정하도록 하자.

#### Resource Owner Password Credentials

![](/images/posts/keycloak/01.png)

클라이언트에 Direct access grants 옵션을 활성화 되어있다면 [Postman을 통해](https://www.baeldung.com/postman-keycloak-endpoints#3-token-endpoint) [Resource Owner Password Credentials](https://www.keycloak.org/securing-apps/oidc-layers#_resource_owner_password_credentials_flow) 방식으로 토큰을 발급하여 백엔드에 전달하여 테스트 해볼 수 있다.