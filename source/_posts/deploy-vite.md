---
title: Nginx로 Vite 프로젝트 배포하기
date: 2023-10-10T20:00+0900
tags:
- Nginx
- Vite
- Deployment
---

> Q. 프론트엔드 애플리케이션은 어떻게 배포를 해야할까?

오래전부터 기본적으로는 백엔드 애플리케이션에서 프론트 UI 구성을 위한 에셋들을 관리하고 함께 빌드되어 배포되는 방식을 취해왔다. 그러나, 백엔드 개발자와 프론트엔드 개발자로 나누어지더니 하나의 서비스를 구성하는 프론트엔드 애플리케이션과 백엔드 애플리케이션이 나누어지고 각 애플리케이션을 개발할 수 있는 환경이 만들어지고 있다. 보통 백엔드 애플리케이션을 빌드하면서 UI 에셋 파일들을 포함하므로 배포 과정은 백엔드 개발자가 담당했던 조직이 많았을 것 같다.

만약, 조직 구성으로 인해 프론트엔드 애플리케이션 개발을 위한 프론트엔드 팀이 있는 곳이라면 프론트엔드 개발자가 배포를 직접 수행할 수도 있어보인다. 회사마다 일하는 방식은 다를 수 있기 때문에 릴리즈에 대한 부분은 QA 엔지니어가 담당하기도 한다. 아무튼 Vite 기반 프로젝트를 배포하는 방안에 대해서 정리해보자.

> [Deploying a Static Site](https://vitejs.dev/guide/static-deploy.html#deploying-a-static-site)
> It is important to note that vite preview is intended for previewing the build locally and not meant as a production server.

로컬 환경에서 정적 페이지를 배포할 수 있는 웹 서버를 실행하는 preview 명령어를 제공하지만 위와 같이 프로덕션 환경을 위한 배포 서버는 아님에 주의해야한다. 기본적인 개념은 정적 배포를 위한 빌드 파일을 만들고나서 백엔드 서버 또는 웹 서버를 통해 정적 파일에 대한 응답을 처리하는 것이다.

- [Vite 프로덕션 버전으로 빌드하기](https://ko.vitejs.dev/guide/build.html)
- [Vite 백엔드 프레임워크와 함께 사용하기](https://ko.vitejs.dev/guide/backend-integration.html)

두번째 방식은 일반적으로 많이 사용되는 편으로 백엔드 서버가 스프링 부트 프로젝트라면 [정적 리소스 경로에 포함](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/static-resources.html)될 수 있도록 하면 된다. 백엔드 애플리케이션 빌드 시 클래스패스에 포함되어도 되고 애플리케이션 프로퍼티를 통해 특정 파일 경로를 지정해도 된다. 본 글에서 정리하고자 하는 건 첫번째 방식으로 프로덕션 배포를 위한 정적 파일을 빌드하고나서 Nginx와 같은 웹서버를 통해 정적 파일을 배포하는 것이다.

> Nginx 웹서버에서 정적 파일을 배포하고 백엔드 API 요청에 대해서는 리버스 프록시 구성을 하면 된다. 리버스 프록시 구성의 장점은 백엔드 애플리케이션의 포트를 감출 수 있게 되어 조금은 보안적인 인프라 구성이 될 수 있다는 것이다. 참고로 Vite 개발 서버에서도 [프록시 구성](https://ko.vitejs.dev/config/server-options.html#server-proxy)을 할 수 있게 제공한다.

#### Nginx 웹서버로 Vite 정적 파일 배포

```js vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    manifest: true,
    target: "esnext",
  },
  plugins: [vue()],
});
```

```sh Windows Terminal
$ yarn --cwd 'frontend' install
$ yarn --cwd 'frontend' run build --mode production
vite v4.4.11 building for production...
```

빌드 명령어를 수행하면 아래와 같이 dist 폴더 아래에 정적 파일들이 생성된다.

- dist/assets : 정적 에셋 모음
- dist/index.html : 진입점(EntryPoint) 파일
- manifest.json : 매니페스트 파일

생성된 정적 빌드 파일들을 [nginx.conf](https://github.com/kdevkr/nginx.conf) 의 static 폴더로 대체하여 테스트를 해보자. 제대로 동작하지 않을텐데 Nginx의 설정 파일의 구성이 백엔드 애플리케이션으로 기본적인 요청을 전달하도록 되어있기 때문이다. `/` 경로에 대해서는 index.html을 응답하도록 변경해야하고 백엔드에 대한 요청이 나중에 전달되도록 수정해야한다.

```conf nginx-vite.conf
server {
  index index.html;
  root /etc/nginx/static;
  try_files $uri /index.html =404;

  # 리버스 프록시
  location ~ ^/(api|version) {
      proxy_pass http://backend;
      proxy_redirect off;
      proxy_buffering off;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

      access_log /var/log/nginx/access.log;
  }
}
```

![](/images/posts/deploy-vite/01.png)  

기본적인 요청에 대해서는 static 폴더 기준으로 정적 파일을 사용해 응답하며 /api 및 /version 에 대해서만 백엔드 애플리케이션 요청으로 처리되도록 수정했다. 이제 아래와 같이 데모 애플리케이션이 정상적으로 보이며 /version에 대한 요청을 전달하면 백엔드 애플리케이션에서 해당 경로가 매핑되지 않아서 스프링 부트의 화이트라벨 페이지로 404 응답을 볼 수 있다. 프론트 요청과 백엔드 요청을 효율적으로 구분할 수 있는 방안은 더 연구하고 찾아보고 학습해야할 부분이다.  

사실 상 백엔드 애플리케이션에 프론트엔드에 대한 정적 파일을 포함시키는 게 간단하지만 정적 파일을 배포하는 경량의 웹 서버를 두는 게 백엔드 애플리케이션의 부하를 줄일 수 있는 방안이다. 정적 파일에 대한 요청을 처리하기 위해서 스레드 풀에서 스레드를 사용하는 것은 생각보다 영향이 클 수도 있다. `선택은 여러분의 몫이다.`
