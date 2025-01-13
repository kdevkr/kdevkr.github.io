---
title: Spring Boot 3 Actuator Key Sanitize
date: 2025-01-13T22:00+09:00
tags:
- Actuator
- Sanitize
---

```java Spring Boot 2
@ConfigurationProperties("management.endpoint.env")
public class EnvironmentEndpointProperties {
    private String[] keysToSanitize;

    public EnvironmentEndpointProperties() {
    }

    public String[] getKeysToSanitize() {
        return this.keysToSanitize;
    }

    public void setKeysToSanitize(String[] keysToSanitize) {
        this.keysToSanitize = keysToSanitize;
    }
}
```

스프링 부트 2에서 액추에이터 엔드포인트에 대해 민감한 데이터가 노출되는 것을 방지하기 위해서 <U>keys-to-sanitize</U> 속성을 통해 특정 키 패턴에 대한 데이터가 마스킹 되도록 지원했습니다. 그러나, 스프링 부트 3 부터는 키 기반이 아닌 <U>인증 및 역할(Role) 기반의 Sanitize를 수행</U>하는 것으로 변경되었습니다. 이에 대한 정보는 마이그레이션 가이드의 [Actuator Endpoints Sanitization](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide#actuator-endpoints-sanitization)로 기재되어 있으며 **EnvironmentEndpointProperties** 는 아래와 같이 변경되었습니다.

```java Spring Boot 3
@ConfigurationProperties("management.endpoint.env")
public class EnvironmentEndpointProperties {
    private Show showValues;
    private final Set<String> roles;

    public EnvironmentEndpointProperties() {
        this.showValues = Show.NEVER;
        this.roles = new HashSet();
    }

    public Show getShowValues() {
        return this.showValues;
    }

    public void setShowValues(Show showValues) {
        this.showValues = showValues;
    }

    public Set<String> getRoles() {
        return this.roles;
    }
}
```

```yaml application.yaml
management:
  endpoints:
    web:
      exposure:
        include:
          - health
          - env
  endpoint:
    env:
      show-values: when_authorized
      roles: ADMIN
```

#### Customizing Sanitization

스프링 부트 3 에서 기존의 키 패턴 기반의 Sanitize 를 적용하고자 한다면 공식 문서의 [Customizing Sanitization](https://docs.spring.io/spring-boot/how-to/actuator.html#howto.actuator.customizing-sanitization)에 따라 <U>SanitizingFunction</U> 인터페이스의 구현체를 빈으로 등록해야 합니다. 스프링 부트 2.7 버전의 [Sanitizer](https://github.com/spring-projects/spring-boot/blob/2.7.x/spring-boot-project/spring-boot-actuator/src/main/java/org/springframework/boot/actuate/endpoint/Sanitizer.java) 코드를 참고하여 구현하면 될 것 같습니다.

```java ActuatorSanitizingFunction
@Component
public class ActuatorSanitizingFunction implements SanitizingFunction {
    private static final String[] REGEX_PARTS = {"*", "$", "^", "+"};

    private static final Set<String> DEFAULT_KEYS_TO_SANITIZE = new LinkedHashSet<>(
            Arrays.asList("password", "secret", "key", "token", ".*credentials.*", "vcap_services",
                    "^vcap\\.services.*$", "sun.java.command", "^spring[._]application[._]json$"));

    private static final Set<String> URI_USERINFO_KEYS = new LinkedHashSet<>(
            Arrays.asList("uri", "uris", "url", "urls", "address", "addresses"));

    private static final Pattern URI_USERINFO_PATTERN = Pattern
            .compile("^\\[?[A-Za-z][A-Za-z0-9\\+\\.\\-]+://.+:(.*)@.+$");

    private final List<Pattern> keysToSanitize = new ArrayList<>();

    static {
        DEFAULT_KEYS_TO_SANITIZE.addAll(URI_USERINFO_KEYS);
    }

    public ActuatorSanitizingFunction(
            @Value("${management.endpoint.additionalKeysToSanitize:}") List<String> additionalKeysToSanitize) {
        addKeysToSanitize(DEFAULT_KEYS_TO_SANITIZE);
        addKeysToSanitize(URI_USERINFO_KEYS);
        addKeysToSanitize(additionalKeysToSanitize);
    }

    private Pattern getPattern(String value) {
        if (isRegex(value)) {
            return Pattern.compile(value, Pattern.CASE_INSENSITIVE);
        }
        return Pattern.compile(".*" + value + "$", Pattern.CASE_INSENSITIVE);
    }

    private boolean isRegex(String value) {
        for (String part : REGEX_PARTS) {
            if (value.contains(part)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public SanitizableData apply(SanitizableData data) {
        if (data.getValue() == null) {
            return data;
        }

        for (Pattern pattern : keysToSanitize) {
            if (pattern.matcher(data.getKey()).matches()) {
                if (keyIsUriWithUserInfo(pattern)) {
                    return data.withValue(sanitizeUris(data.getValue().toString()));
                }

                return data.withValue(SanitizableData.SANITIZED_VALUE);
            }
        }

        return data;
    }

    private void addKeysToSanitize(Collection<String> keysToSanitize) {
        for (String key : keysToSanitize) {
            this.keysToSanitize.add(getPattern(key));
        }
    }

    private boolean keyIsUriWithUserInfo(Pattern pattern) {
        for (String uriKey : URI_USERINFO_KEYS) {
            if (pattern.matcher(uriKey).matches()) {
                return true;
            }
        }
        return false;
    }

    private Object sanitizeUris(String value) {
        return Arrays.stream(value.split(",")).map(this::sanitizeUri).collect(Collectors.joining(","));
    }

    private String sanitizeUri(String value) {
        Matcher matcher = URI_USERINFO_PATTERN.matcher(value);
        String password = matcher.matches() ? matcher.group(1) : null;
        if (password != null) {
            return StringUtils.replace(value, ":" + password + "@", ":" + SanitizableData.SANITIZED_VALUE + "@");
        }
        return value;
    }

}
```

위와 같이 SanitizingFunction 인터페이스를 구현하게 되면 관리자(ADMIN)로 인증된 사용자가 <U>/actuator/env 엔드포인트</U>를 호출해도 아래와 같이 <U>민감한 정보는 마스킹되어 처리된 것</U>을 확인할 수 있습니다. 이처럼 시스템에서 사용되는 민감한 정보는 보호될 수 있도록 보완합시다.

```json
{
    "name": "Config resource 'class path resource [application.yml]' via location 'optional:classpath:'",
    "properties": {
        "management.endpoints.web.exposure.include[0]": {
            "value": "health",
            "origin": "class path resource [application.yml] - 6:13"
        },
        "management.endpoints.web.exposure.include[1]": {
            "value": "env",
            "origin": "class path resource [application.yml] - 7:13"
        },
        "management.endpoint.env.show-values": {
            "value": "always",
            "origin": "class path resource [application.yml] - 10:20"
        },
        "management.endpoint.env.roles": {
            "value": "ADMIN",
            "origin": "class path resource [application.yml] - 11:14"
        },
        "spring.datasource.password": {
            "value": "******",
            "origin": "class path resource [application.yml] - 14:15"
        }
    }
}
```

#### 참고 자료
- https://stackoverflow.com/a/77731779
- [Sanitize Actuator Endpoint with Spring Boot 3](https://levelup.gitconnected.com/sanitize-actuator-endpoint-with-sprint-boot-3-5e2c4edae1c9)
- [Spring Boot Docs - Sanitize Sensitive Values](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.sanitization)
