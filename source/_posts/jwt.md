---
title: JSON Web Token
date: 2022-07-29
---

최근 시스템에서 발송되는 특정 이메일에 포함되는 링크를 통해서 사용자가 관련된 페이지에 접근할 수 있도록 해달라는 요구사항이 있었습니다. 일반적으로 사용자가 이메일을 통해서 시스템에 접속하는 경우에는 자신의 계정과 비밀번호를 사용하여 시스템에 인증하기 전인 경우가 많습니다. 따라서, 이메일에 포함된 링크를 통해서 접근할 때 사용자 인증을 일시적으로 제공하는 방안을 도입해야합니다.

## Token-based Authentication
토큰 기반 인증 매커니즘은 사용자 계정과 비밀번호를 입력하지 않아도 시스템을 이용할 수 있는 권한을 제공하기 위한 방식입니다. 여기서 토큰이라함은 시스템이 인식할 수 있는 문자열 데이터를 말합니다. 휴대폰 문자 인증이나 이메일로 발송되는 인증코드 또는 링크를 토큰이라 부를 수 있습니다.

현재 시스템은 Spring Security OAuth를 통해 클라이언트 크레덴셜 기반의 토큰으로 OpenAPI를 사용할 수 있도록 제공하고 있는데 JWT가 아닌 JdbcTokenStore를 사용하고 있기에 SecureRandomBytesKeyGenerator로 만들어지는 액세스 토큰을 사용하게 되어있습니다. 개발자 커뮤니티를 보면 세션 기반 인증 매커니즘이 아닌 토큰 기반으로 JWT를 발급하고 서버와 클라이언트가 통신할 때 JWT를 요청 헤더에 포함시켜 시스템에 대한 권한 및 인가를 수행할 수 있도록 구성하는 것 같습니다. 

### JWT
[RFC7519](https://datatracker.ietf.org/doc/html/rfc7519)로 정의되어있는 JWT(JSON Web Token)은 사용자의 신원을 확인할 수 있는 정보를 Base64 인코딩으로 표현하면서 페이로드에 대한 전자서명을 통해서 인증 시스템에서 발급한 토큰을 신뢰할 수 있는지 검증하여 토큰에 포함된 정보를 토대로 권한 및 인가를 적용할 수 있습니다. JWT에 대해서는 아래의 링크를 통해서 간단하게 이해할 수 있습니다.

- [Introduction to JSON Web Tokens](https://jwt.io/introduction)
- [Get Started with JSON Web Tokens](https://auth0.com/learn/json-web-tokens/)

### URI Query String
_JSON Web Token (JWT) is a compact claims representation format intended for space constrained environments such as HTTP Authorization headers and URI query parameters._

이메일에 포함되는 링크는 GET 요청을 수행하는 URL(URI + Query String)이므로 일반적으로 HTTP 통신 시 Authorization 또는 X-Auth-Token 헤더에 토큰을 포함하여 전달할 수 없습니다. JWT는 그 자체로 Base64 URL Safe로 인코딩되므로 쿼리 파라미터에 포함하여 전달할 수 있습니다.

#### Token Parameter
이메일에 포함되는 링크에 토큰 정보가 어떻게 담겨지는지 두가지 예시를 살펴보겠습니다. 첫번째는 이메일과 인증을 위한 토큰이 Path Variable 형태로 URI에 포함되는 방식이며, 두번째는 URI에 대한 쿼리 스트링으로 토큰 파라미터가 포함됨을 보여줍니다.

- http://daily-devblog.com/api/regist/certify/kdevkr@gmail.com/$TOKEN
- https://careers.kakao.com/applicant/checkEmail?token=$TOKEN&jobOfferId=P-1

![](/images/posts/jwt/01.png)

두번째처럼 이메일에 포함된 링크를 나중에 클릭하더라도 시스템에서 인식할 수 있는 토큰인지 만료되었는지를 판단하여 시스템에 대한 인가를 판단하게 됩니다. 여기서 확인할 수 있듯이 이메일에는 시스템에서 발급한 토큰이 링크에 포함되어 유지되므로 보안 상 만료 시간을 최소화하는 것이 좋습니다.

### Implementation Sample
이메일 링크에 포함된 토큰 파라미터에 따라 토큰 기반 인증 매커니즘을 수행하고 사용자 인증을 수행할 수 있는 방안을 적용해보도록 하겠습니다. 간단한 샘플 형태로 만들고 일련의 프로세스를 이해할 수 있도록 공유하고자함이니 코드를 그대로 사용하기에는 문제점이 있을 수 있습니다.

#### Dependencies
우선 스프링 시큐리티 기반의 환경이라는 것을 기반으로 하며 JWT 발급과 검증을 위해서 사용할 [Java JWT](https://github.com/jwtk/jjwt) 라이브러리와 JWT 발급 시 서명할 키 페어를 불러올 수 있도록 [Bouncy Castle](https://www.bouncycastle.org/)를 의존성에 추가합니다.

```groovy
dependencies {
    implementation 'com.google.code.gson:gson:2.9.0'
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'
    implementation 'org.bouncycastle:bcprov-jdk18on:1.71'
}
```

#### Generate EC Key Pair
본 샘플에서는 [Cryptographic Algorithms for Digital Signatures and MACs](https://datatracker.ietf.org/doc/html/rfc7518#section-3) 목록 중에서 ES256이라는 서명 알고리즘을 사용하는 JWT 토큰을 발급하기 위해 P-256 곡선을 사용하는 EC 키 페어를 생성합니다.

```shell
openssl ecparam -name prime256v1 -genkey -noout -out ec-private.pem
openssl ec -in ec-private.pem -pubout -out ec-public.pem
openssl pkcs8 -topk8 -inform pem -in ec-private.pem -outform pem -nocrypt -out ec-private.pkcs8
```

#### Generate JWT
JWT 발급을 위한 EC 키 페어를 준비했으므로 클래스패스로부터 키 페어를 불러오고 토큰 발급을 위한 유틸 클래스를 작성합니다.

```java
package com.example.crypto.util;

import io.jsonwebtoken.SignatureAlgorithm;
import org.bouncycastle.util.io.pem.PemReader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import javax.crypto.spec.SecretKeySpec;
import javax.xml.bind.DatatypeConverter;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class KeyUtil {
    private KeyUtil() {
    }

    private static final Map<String, Key> signingKeyStore = new ConcurrentHashMap<>();
    private static final Map<String, Key> parseKeyStore = new ConcurrentHashMap<>();


    public static Key parseKey(SignatureAlgorithm signatureAlgorithm) {
        Key key = null;
        if (parseKeyStore.containsKey(signatureAlgorithm.name())) {
            key = parseKeyStore.get(signatureAlgorithm.name());
        }

        if (key != null) return key;

        try {
            String content;
            PemReader pemReader;
            X509EncodedKeySpec spec;
            KeyFactory kf;

            switch (signatureAlgorithm) {
                case HS256:
                    content = StreamUtils.copyToString(new ClassPathResource("jwt/hs256/secret.key").getInputStream(), StandardCharsets.UTF_8);
                    key = new SecretKeySpec(DatatypeConverter.parseBase64Binary(content), signatureAlgorithm.getJcaName());
                    break;
                case RS256:
                    content = StreamUtils.copyToString(new ClassPathResource("jwt/rs256/rsa-public.pem").getInputStream(), StandardCharsets.UTF_8);
                    pemReader = new PemReader(new StringReader(content));
                    spec = new X509EncodedKeySpec(pemReader.readPemObject().getContent());
                    kf = KeyFactory.getInstance("RSA");
                    key = kf.generatePublic(spec);
                    break;
                case ES256:
                    content = StreamUtils.copyToString(new ClassPathResource("jwt/es256/ec-public.pem").getInputStream(), StandardCharsets.UTF_8);
                    pemReader = new PemReader(new StringReader(content));
                    spec = new X509EncodedKeySpec(pemReader.readPemObject().getContent());
                    kf = KeyFactory.getInstance("EC"); // Elliptic Curve
                    key = kf.generatePublic(spec);
                    break;
                default:
                    throw new UnsupportedOperationException("Only support HS256, RS256, ES256");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        parseKeyStore.put(signatureAlgorithm.name(), key);
        return key;
    }

    public static Key signingKey(SignatureAlgorithm signatureAlgorithm) {
        Key key = null;
        if (signingKeyStore.containsKey(signatureAlgorithm.name())) {
            key = signingKeyStore.get(signatureAlgorithm.name());
        }

        if (key != null) return key;

        try {
            String content;
            PemReader pemReader;
            PKCS8EncodedKeySpec spec;
            KeyFactory kf;

            switch (signatureAlgorithm) {
                case HS256:
                    content = StreamUtils.copyToString(new ClassPathResource("jwt/hs256/secret.key").getInputStream(), StandardCharsets.UTF_8);
                    key = new SecretKeySpec(DatatypeConverter.parseBase64Binary(content), signatureAlgorithm.getJcaName());
                    break;
                case RS256:
                    content = StreamUtils.copyToString(new ClassPathResource("jwt/rs256/rsa-private.pem").getInputStream(), StandardCharsets.UTF_8);
                    pemReader = new PemReader(new StringReader(content));
                    spec = new PKCS8EncodedKeySpec(pemReader.readPemObject().getContent());
                    kf = KeyFactory.getInstance("RSA");
                    key = kf.generatePrivate(spec);
                    break;
                case ES256:
                    content = StreamUtils.copyToString(new ClassPathResource("jwt/es256/ec-private.pkcs8").getInputStream(), StandardCharsets.UTF_8);
                    pemReader = new PemReader(new StringReader(content));
                    spec = new PKCS8EncodedKeySpec(pemReader.readPemObject().getContent());
                    kf = KeyFactory.getInstance("EC"); // Elliptic Curve
                    key = kf.generatePrivate(spec);
                    break;
                default:
                    throw new UnsupportedOperationException("Only support HS256, RS256, ES256");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        signingKeyStore.put(signatureAlgorithm.name(), key);
        return key;
    }

}
```

```java
package com.example.crypto.util;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import io.jsonwebtoken.*;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.ZonedDateTime;
import java.util.*;

public class JwtUtil {
    private static final String REGEX = "^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$";
    private static final Gson gson = new Gson();
    private static final Type hashMapType = new TypeToken<HashMap<String, Object>>() {
    }.getType();

    private JwtUtil() {
    }

    public static boolean isJwt(String token) {
        return token != null && !token.isBlank() && token.matches(REGEX);
    }

    public static boolean isValid(String token) {
        if (!isJwt(token)) return false;
        return isValid(token, alg(token));
    }

    public static boolean isValid(String token, String alg) {
        Key publicKey = KeyUtil.signingKey(SignatureAlgorithm.forName(alg));
        JwtParser parser = Jwts.parserBuilder().setSigningKey(publicKey).build();
        return parser.isSigned(token);
    }

    private static String alg(String token) {
        if (!isJwt(token)) return null;

        String[] chunks = token.split("\\.");
        String header = new String(Base64.getUrlDecoder().decode(chunks[0]), StandardCharsets.UTF_8);
        Map<String, Object> headerMap = gson.fromJson(header, hashMapType);
        return (String) headerMap.get("alg");
    }

    public static String generate(String subject, long expires, Map<String, Object> claims, SignatureAlgorithm signatureAlgorithm) {
        long issuedAt = ZonedDateTime.now(TimeZone.getTimeZone("UTC").toZoneId()).toInstant().toEpochMilli();
        long expiration = issuedAt + expires;

        try {
            Key signingKey = KeyUtil.signingKey(signatureAlgorithm);
            if (signingKey == null) throw new JwtException("Not found signingKey for " + signatureAlgorithm.name());
            return Jwts.builder()
                    .setHeaderParam("typ", "JWT")
                    .setIssuer("JWT Sample Issuer")
                    .setSubject(subject)
                    .setIssuedAt(new Date(issuedAt))
                    .setExpiration(new Date(expiration))
                    .signWith(signingKey, signatureAlgorithm)
                    .addClaims(claims)
                    .compact();
        } catch (Exception e) {
            e.printStackTrace();
        }

        throw new UnsupportedJwtException("Cannot generate jwt");
    }

    public static Jws<Claims> parseClaims(String token) {
        return parseClaims(token, alg(token));
    }

    public static Jws<Claims> parseClaims(String token, String alg) {
        Key publicKey = KeyUtil.signingKey(SignatureAlgorithm.forName(alg));
        JwtParser parser = Jwts.parserBuilder().setSigningKey(publicKey).build();
        return parser.parseClaimsJws(token);
    }

}
```

#### Add Token Filter in SecurityFilterChain
시스템에서 발급된 토큰이 파라미터로 전달되었을 때 JWT를 검증하고 사용자 인증을 처리할 수 있는 필터를 작성하고 스프링 시큐리티 필터 체인에 등록합니다. 

__TokenAuthenticationFilter.java__

```java
package com.example.crypto.filter;

import com.example.crypto.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String ADDITIONAL_URI_PATTERN = "/users/{username}";
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private final UserDetailsService userDetailsService;

    public TokenAuthenticationFilter(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token = request.getParameter("token");
        if (JwtUtil.isJwt(token)) {
            String requestURI = request.getRequestURI();
            String base64RequestURI = Base64.getUrlEncoder().encodeToString(requestURI.getBytes(StandardCharsets.UTF_8));
            String redirectLoginUrl = "/login?redirect=" + base64RequestURI;

            boolean isValidToken;
            try {
                isValidToken = JwtUtil.isValid(token);
                if (isValidToken) {
                    Jws<Claims> claims = JwtUtil.parseClaims(token);
                    Claims body = claims.getBody();
                    String subject = body.getSubject();

                    if (pathMatcher.match(ADDITIONAL_URI_PATTERN, requestURI)) {
                        isValidToken = isValidWithVariables(body, requestURI);
                    }

                    if (isValidToken) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(subject);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, token, userDetails.getAuthorities());
                        SecurityContext securityContext = SecurityContextHolder.getContext();
                        securityContext.setAuthentication(authentication);
                        response.sendRedirect(requestURI);
                    }
                }
            } catch (Exception e) {
                if (e instanceof JwtException) {
                    e.printStackTrace();
                }
                isValidToken = false;
            }

            if (!isValidToken) {
                // NOTE: If token expired or invalid, redirect for login page.
                response.sendRedirect(redirectLoginUrl);
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private boolean isValidWithVariables(Claims body, String requestURI) {
        Map<String, String> variables = pathMatcher.extractUriTemplateVariables(ADDITIONAL_URI_PATTERN, requestURI);
        String userId = body.get("username", String.class);
        return variables.containsKey("username") && variables.get("username").equals(userId);
    }
}
```

__SecurityConfig.java__
간단한 샘플이므로 인메모리 사용자를 등록하는 스프링 시큐리티 환경을 구성합니다. 

```java
package com.example.crypto.config;

import com.example.crypto.filter.TokenAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableWebSecurity
@Configuration
public class SecurityConfig {

    // https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/in-memory.html
    @Bean
    public UserDetailsService users() {
        UserDetails mambo = User.builder()
                .username("mambo")
                .password("{noop}1234")
                .roles("USER", "ADMIN")
                .build();
        return new InMemoryUserDetailsManager(mambo);
    }

    // https://docs.spring.io/spring-security/reference/servlet/configuration/java.html#jc-httpsecurity
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenAuthenticationFilter tokenAuthenticationFilter) throws Exception {
        http.formLogin()
                .and().authorizeRequests().antMatchers("/users/{username}/**").authenticated()
                .and().addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

#### Generate JWT Test
테스트 코드를 통해서 토큰을 발급해보고 이메일에 포함될 링크처럼 토큰 파라미터에 토큰을 포함하여 브라우저 주소에 직접 입력해봅니다.

```java
@Slf4j
class JwtUtilTest {
    @Test
    void generateToken() {
        Assertions.assertDoesNotThrow(() -> {
            String subject = "mambo";
            long expires = Duration.ofMinutes(3L).toMillis();
            Map<String, Object> claims = new HashMap<>();
            claims.put("username", "mambo");
            String jwt = JwtUtil.generate(subject, expires, claims, SignatureAlgorithm.ES256);
            log.info("\nmambo.kr:8080/users/mambo?token={}", jwt);
        });
    }
}
```

토큰이 발급되고나서 3분 이내에는 로그인 처리가 됨을 확인할 수 있지만 만료된 이후라면 올바르게 서명된 토큰일지라도 로그인 페이지로 리디렉션됨을 확인할 수 있습니다.

> 본 글에서는 JWS으로만 구성된 JWT 토큰을 발급하여 신뢰할 수 있는 발급자로부터 서명된 것임을 증명하는 것을 기반으로 사용자 인증을 수행했습니다. 다만, JWT는 암호화되지 않은 상태로 이메일과 같은 곳에 노출되어있으므로 짧은 만료 시간을 두어 제한 시간내에만 인증할 수 있도록 하였습니다.
> 좀 더 시간이 주어진다면 JWS와 함께 JWE로 클레임 페이로드가 암호화된 JWT 토큰을 발급해볼 수 있는 것도 알아봐야할 것 같습니다. 본 글에서 사용했던 jjwt 라이브러리에서는 JWE를 지원하지 않으므로 [Nimbus JOSE + JWT](https://connect2id.com/products/nimbus-jose-jwt)로 대체해야 합니다.

## 참고
- [Spring Security Docs](https://docs.spring.io/spring-security/reference/servlet/configuration/java.html)
- [JWT Debugger](https://jwt.io/)
- [RFC7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [Introduction to JSON Web Tokens](https://jwt.io/introduction)

