---
title: Trace OAuth Requests
date: 2022-08-10
tags:
- HttpTrace
- ContentCaching
---

> Failed to find access token

OAuth API 요청 시 JdbcTokenStore에서 액세스 토큰을 찾을 수 없을 때 기록되는 INFO 레벨의 로그 입니다. 액세스 토큰을 찾을 수 없다는 이야기는 올바르지 않은 요청인데도 불구하고 INFO 레벨로 되어있는 부분에 대해서는 의아하긴 합니다만 위 정보만으로는 어떤 토큰에 의해서 어떠한 OAuth API에 대해 요청되었는지를 확인할 수 없습니다.

일반적으로 인프라 레벨에서 [ELB](https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/load-balancer-access-logs.html) 또는 [Nginx](https://docs.nginx.com/nginx/admin-guide/monitoring/logging/#setting-up-the-access-log)와 같은 프록시 단계에서 액세스 로그를 남기는데 대부분의 액세스 로그에서는 요청 헤더 정보를 상세하게 기록하지 않고 간결하게 남기도록 설정되므로 토큰 정보가 포함되는 Authorization 헤더를 확인할 수 없습니다.

## Bearer Authentication
현재 시스템은 Spring Security OAuth 모듈을 통해 JDBC 기반의 Opaque 토큰으로 되어있는 Bearer 인증을 지원하는 OpenAPI를 제공하고 있습니다. 그러나, 일부 사용자들이 IoT 디바이스를 구현 시 OpenAPI를 사용할 때 잘못된 토큰을 사용하는 문제가 사업팀으로부터 리포트 되었는데 단순하게 잘못된 액세스 토큰이 전달되었다는 로그에 대해서 원인 파악을 요구하는데 불구하고 파악할 수 있는 정보가 남아있지 않았습니다.

사실 OpenAPI의 각 핸들러로 전달되는 부분에 대해서는 AOP가 적용되어 핸들러에 대한 파라미터 들과 클라이언트 아이디와 토큰 정보를 이미 엘라스틱서치에 API 로그로 저장하고 있었습니다. 다만 문제는 잘못된 토큰에 대한 요청은 스프링 시큐리티 필터 체인에 의해서 핸들러까지 진입하기 전에 오류 응답으로 처리되었기에 API 로그가 남지 않았다는 것이 파악되었습니다.

> 어떠한 문제에 대해서 파악할 수 있는 정보는 남겨야하므로 인증된 사용자가 OpenAPI를 사용한 로그 외에 OAuth에 대한 모든 요청에 대해서는 별도로 남기도록 개선하고자 하였습니다.

### OAuth2AuthenticationProcessingFilter
```java
eventPublisher.publishAuthenticationFailure(new BadCredentialsException(failed.getMessage(), failed),
					new PreAuthenticatedAuthenticationToken("access-token", "N/A"));
```

Bearer 토큰에 대한 인증을 처리하는 OAuth2AuthenticationProcessingFilter에서 AuthenticationEventPublisher를 사용하여 인증 성공이나 오류에 대한 이벤트를 발생시키므로 DefaultAuthenticationEventPublisher를 빈으로 등록하고 이벤트 리스너를 구현하면 어떤 토큰을 사용하여 요청했는지는 기록할 수 있는데 이벤트 리스너로 전달되는 이벤트 정보에는 요청과 응답에 대한 정보가 존재하지 않으므로 원하는 만큼의 정보를 로그로 기록할 수 없습니다.

> 원하는 기능은 대부분 인터넷에 검색하면 나오기에 이리저리 찾아보았습니다.

### AbstractRequestLoggingFilter
AbstractRequestLoggingFilter.getMessagePayload 함수를 보면 내부적으로 ContentCachingRequestWrapper를 사용하는 것을 확인할 수 있는데 [ContentCachingResponseWrapper](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/ContentCachingResponseWrapper.html)에 대해서 살펴보니 요청에 대한 응답을 내려준 이후에도 응답 페이로드를 읽을 수 있도록 지원한다는 내용을 확인했습니다.

> 잘못된 토큰에 대한 요청의 응답으로 액세스 토큰 정보를 전달하므로 응답 페이로드를 가져올 수 있다면 사용된 토큰을 로그로써 확인할 수 있다는 이야기입니다.

### HttpTraceFilter
Spring Boot Actuator 모듈을 사용하여 어드민 페이지를 구현해놓았기에 [HttpTraceEndpoint](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.tracing)를 통해서 일부 요청에 대한 트레이스 정보를 확인할 수 있는 점을 떠올려 HttpTraceFilter를 살펴보니 TraceableHttpServletRequest와 TraceableHttpServletResponse를 사용하여 요청과 응답에 대한 정보를 가져오는 것을 확인할 수 있었습니다.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
    if (!isRequestValid(request)) {
        filterChain.doFilter(request, response);
        return;
    }
    TraceableHttpServletRequest traceableRequest = new TraceableHttpServletRequest(request);
    HttpTrace trace = this.tracer.receivedRequest(traceableRequest);
    int status = HttpStatus.INTERNAL_SERVER_ERROR.value();
    try {
        filterChain.doFilter(request, response);
        status = response.getStatus();
    }
    finally {
        TraceableHttpServletResponse traceableResponse = new TraceableHttpServletResponse(
                (status != response.getStatus()) ? new CustomStatusResponseWrapper(response, status) : response);
        this.tracer.sendingResponse(trace, traceableResponse, request::getUserPrincipal,
                () -> getSessionId(request));
        this.repository.add(trace);
    }
}
```

> 단, TraceableHttpServletRequest와 TraceableHttpServletResponse는 final 키워드가 설정된 클래스이므로 다른 패키지에서 활용할 수 없습니다.

### OAuthFilter
앞서 살펴본 클래스들을 종합하여 OAuth 요청과 응답에 대한 정보를 이벤트로 발생시키는 필터를 구현합니다. 

```java
@Slf4j
@Component
public class OAuthFilter extends OncePerRequestFilter implements ApplicationEventPublisherAware {
    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final HttpExchangeTracer tracer;
    private final DefaultTokenServices defaultTokenServices;
    private ApplicationEventPublisher applicationEventPublisher;

    public OAuthFilter(HttpTraceProperties traceProperties, DefaultTokenServices defaultTokenServices) {
        this.tracer = new HttpExchangeTracer(traceProperties.getInclude());
        this.defaultTokenServices = defaultTokenServices;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        boolean isApiV1 = pathMatcher.match("/oauth/v1/**", requestURI);
        if (isApiV1) {
            TraceableHttpServletRequest traceableRequest = new TraceableHttpServletRequest(request);
            ContentCachingResponseWrapper cachingResponseWrapper = new ContentCachingResponseWrapper(response);

            HttpTrace trace = this.tracer.receivedRequest(traceableRequest);
            int status = HttpStatus.INTERNAL_SERVER_ERROR.value();
            try {
                filterChain.doFilter(request, cachingResponseWrapper);
                status = response.getStatus();
            } finally {
                TraceableHttpServletResponse traceableResponse = new TraceableHttpServletResponse(
                        (status != response.getStatus()) ? new CustomStatusResponseWrapper(cachingResponseWrapper, status) : cachingResponseWrapper);
                this.tracer.sendingResponse(trace, traceableResponse, request::getUserPrincipal,
                        () -> getSessionId(request));

                String clientId = null;
                if (applicationEventPublisher != null) {
                    try {
                        String tokenValue = (String) request.getAttribute(OAuth2AuthenticationDetails.ACCESS_TOKEN_VALUE);
                        OAuth2Authentication authentication = defaultTokenServices.loadAuthentication(tokenValue);
                        clientId = authentication.getOAuth2Request().getClientId();
                    } catch (InvalidTokenException ignored) {}
                    applicationEventPublisher.publishEvent(new OAuthTraceEvent(trace, traceableResponse.getResponseBody(), clientId));
                }
            }

        } else {
            filterChain.doFilter(request, response);
        }
    }

    private String getSessionId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return (session != null) ? session.getId() : null;
    }

    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    static final class TraceableHttpServletRequest implements TraceableRequest {
        private final HttpServletRequest request;

        TraceableHttpServletRequest(HttpServletRequest request) {
            this.request = request;
        }

        @Override
        public String getMethod() {
            return this.request.getMethod();
        }

        @Override
        public URI getUri() {
            String queryString = this.request.getQueryString();
            if (!StringUtils.hasText(queryString)) {
                return URI.create(this.request.getRequestURL().toString());
            }
            try {
                StringBuffer urlBuffer = appendQueryString(queryString);
                return new URI(urlBuffer.toString());
            } catch (URISyntaxException ex) {
                String encoded = UriUtils.encodeQuery(queryString, StandardCharsets.UTF_8);
                StringBuffer urlBuffer = appendQueryString(encoded);
                return URI.create(urlBuffer.toString());
            }
        }

        private StringBuffer appendQueryString(String queryString) {
            return this.request.getRequestURL().append("?").append(queryString);
        }

        @Override
        public Map<String, List<String>> getHeaders() {
            return extractHeaders();
        }

        @Override
        public String getRemoteAddress() {
            return this.request.getRemoteAddr();
        }

        private Map<String, List<String>> extractHeaders() {
            Map<String, List<String>> headers = new LinkedHashMap<>();
            Enumeration<String> names = this.request.getHeaderNames();
            while (names.hasMoreElements()) {
                String name = names.nextElement();
                headers.put(name, Collections.list(this.request.getHeaders(name)));
            }
            return headers;
        }
    }

    static final class TraceableHttpServletResponse implements TraceableResponse {
        private final HttpServletResponse delegate;

        TraceableHttpServletResponse(HttpServletResponse response) {
            this.delegate = response;
        }

        @Override
        public int getStatus() {
            return this.delegate.getStatus();
        }

        @Override
        public Map<String, List<String>> getHeaders() {
            return extractHeaders();
        }

        private Map<String, List<String>> extractHeaders() {
            Map<String, List<String>> headers = new LinkedHashMap<>();
            for (String name : this.delegate.getHeaderNames()) {
                headers.put(name, new ArrayList<>(this.delegate.getHeaders(name)));
            }
            return headers;
        }

        public String getResponseBody() throws IOException {
            if (this.delegate instanceof ContentCachingResponseWrapper) {
                String body = null;
                ContentCachingResponseWrapper wrapper = (ContentCachingResponseWrapper) this.delegate;
                int status = wrapper.getStatus();
                byte[] buf = wrapper.getContentAsByteArray();
                if (status != 200 && buf.length > 0) {
                    body = new String(buf, 0, buf.length, wrapper.getCharacterEncoding());
                }
                wrapper.copyBodyToResponse();
                return body;
            }
            return null;
        }
    }

    private static final class CustomStatusResponseWrapper extends HttpServletResponseWrapper {
        private final int status;

        private CustomStatusResponseWrapper(HttpServletResponse response, int status) {
            super(response);
            this.status = status;
        }

        @Override
        public int getStatus() {
            return this.status;
        }
    }
}
```

잘못된 토큰에 대한 응답 처리는 OAuth2AuthenticationProcessingFilter에서 OAuthException을 던지게 되면서 수행하므로 우리는 그전에 응답 페이로드를 캐시하여 가져올 수 있도록 ContentCachingResponseWrapper를 이후 필터로 전달했습니다. 

#### OAuthTraceEvent
OAuthTraceEvent는 OAuth API에 대한 요청과 응답 정보에서 올바른 토큰으로 요청된 것은 클라이언트 아이디가 존재하므로 요청 헤더 중 Authorization에 포함된 토큰까지 로그로 저장할 필요는 없습니다. 토큰 자체를 제외하기 보다는 토큰의 일부를 마스킹 처리하는 방향으로 구현하였습니다.

```java
@Getter
public class OAuthTraceEvent extends ApplicationEvent {

    private final HttpTrace.Request request;
    private final HttpTrace.Response response;
    private final HttpTrace.Principal principal;
    private final HttpTrace.Session session;
    private final String responseBody;
    private final String clientId;
    private final long timeTaken;
    private final long traceTimestamp;

    public OAuthTraceEvent(HttpTrace trace, String responseBody, @Nullable String clientId) {
        super(trace);
        this.clientId = clientId;
        if (clientId != null && !"" .equals(clientId)) {
            protectAuthorization(trace);
        }
        this.timeTaken = trace.getTimeTaken();
        this.request = trace.getRequest();
        this.response = trace.getResponse();
        this.principal = trace.getPrincipal();
        this.session = trace.getSession();
        this.responseBody = responseBody;
        this.traceTimestamp = trace.getTimestamp().toEpochMilli();
    }

    private void protectAuthorization(HttpTrace trace) {
        if (clientId != null && !"" .equals(clientId)) {
            Map<String, List<String>> headers = trace.getRequest().getHeaders();
            List<String> authorization = headers.get("Authorization");
            for (int i = 0; i < authorization.size(); i++) {
                String s = authorization.get(i);
                if (s.startsWith("Bearer") || s.startsWith("bearer")) {
                    s = s.replaceAll("(?<=.{19}).", "*");
                    authorization.set(i, s);
                }
            }
        }
    }
}
```

이제 우리는 OAuthTraceEvent를 처리하는 이벤트 리스너에서 애플리케이션 로그 또는 엘라스틱서치에 저장하도록 구현하면 됩니다.

## 참고

- [Spring – Log Incoming Requests](https://www.baeldung.com/spring-http-logging)  
- [Production-ready Features - 8. HTTP Tracing](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.tracing)