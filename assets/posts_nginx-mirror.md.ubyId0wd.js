import{_ as a,c as n,o as p,ag as e}from"./chunks/framework.Sr95JMjc.js";const _=JSON.parse('{"title":"엔진엑스 트래픽 미러링","description":"","frontmatter":{"title":"엔진엑스 트래픽 미러링","date":"2024-03-02T12:00+0900","tags":["nginx","mirror"]},"headers":[],"relativePath":"posts/nginx-mirror.md","filePath":"posts/nginx-mirror.md","lastUpdated":1777598574000}'),t={name:"posts/nginx-mirror.md"};function r(i,s,l,o,c,d){return p(),n("div",null,[...s[0]||(s[0]=[e(`<p>엔진엑스(Nginx)의 <code>ngx_http_mirror_module</code> 모듈을 사용하면 리버스 프록시로 애플리케이션에 전달하는 <a href="https://medium.com/gaurav-shukla/testing-your-code-against-production-using-nginx-mirroring-567b3c2f4921" target="_blank" rel="noreferrer">일부 트래픽을 복제하여 다른 애플리케이션으로 전달</a>할 수 있다. 우리는 이것을 활용해서 애플리케이션에 전달하는 트래픽을 알 수 없는 상황이지만 어떠한 문제가 발생하고 있을때 테스트를 위한 애플리케이션을 만들어서 구동하고 디버그할 수 있는 환경을 만들 수 있다.</p><h4 id="트래픽-미러링-설정" tabindex="-1">트래픽 미러링 설정 <a class="header-anchor" href="#트래픽-미러링-설정" aria-label="Permalink to &quot;트래픽 미러링 설정&quot;">​</a></h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>http {</span></span>
<span class="line"><span>    upstream backend_for_test {</span></span>
<span class="line"><span>        server app:8081;</span></span>
<span class="line"><span>        keepalive 128;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    server {</span></span>
<span class="line"><span>        proxy_set_header Host $host;</span></span>
<span class="line"><span>        proxy_set_header X-Real-IP $remote_addr;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;</span></span>
<span class="line"><span>        # hop-by-hop</span></span>
<span class="line"><span>        proxy_http_version 1.1;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        location /mtls/ {</span></span>
<span class="line"><span>            proxy_pass http://backend;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>            mirror /mirror;</span></span>
<span class="line"><span>            mirror_request_body on;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        location /mtls_mirror {</span></span>
<span class="line"><span>            internal;</span></span>
<span class="line"><span>            proxy_pass http://backend_for_test$request_uri;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre></div><blockquote><p>문제에 대한 원인을 파악하기 위한 요청에 바디 정보가 필요하지 않은 경우 mirror_request_body 옵션을 비활성화(off) 하세요.</p></blockquote><h4 id="트래픽-미러링-출력" tabindex="-1">트래픽 미러링 출력 <a class="header-anchor" href="#트래픽-미러링-출력" aria-label="Permalink to &quot;트래픽 미러링 출력&quot;">​</a></h4><p>일반적으로 서버 포트 오픈을 확인하는데 사용하는 Netcat 명령어를 통해 간단한 서버를 실행하고 복제된 트래픽에 대한 정보를 출력해볼 수 있다.</p><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">nc</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -lp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> localhost</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 8081</span></span></code></pre></div><blockquote><p>AWS 환경에서 운영하는 애플리케이션에 대한 트래픽 미러링은 <a href="https://aws.amazon.com/ko/blogs/tech/mirror-production-traffic-to-test-environment-with-vpc-traffic-mirroring/" target="_blank" rel="noreferrer">VPC 트래픽 미러링</a>을 구성하는 것이 적합합니다.</p></blockquote>`,8)])])}const m=a(t,[["render",r]]);export{_ as __pageData,m as default};
