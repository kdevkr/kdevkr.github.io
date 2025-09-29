---
title: VitePress로 나를 소개하기
date: 2025-03-22T22:00+09:00
tags:
- Vite
- VitePress
- Github Page
---

[VitePress](https://vitepress.dev/)는 Vite와 Vue가 통합된 마크다운 기반의 정적 사이트 생성 도구로, 문서 작성을 위한 탁월한 개발자 경험(DX)을 제공합니다. VitePress는 개발자 소개 페이지를 만들기에 아주 적합한 도구입니다. 마크다운으로 콘텐츠를 작성하면서도 필요한 경우 Vue 컴포넌트를 활용할 수 있어 자유롭게 나를 표현할 수 있습니다. GitHub Pages와 연동하면 무료로 호스팅도 가능하니, 개발 경력이나 프로젝트 포트폴리오를 정리하는 데 효과적인 방법이 될 수 있습니다. 저는 VitePress가 베타 버전이었을 때 [소개 페이지](https://kdev.ing/about)를 처음 구축했으며, 최근 공식 릴리즈 버전으로 업그레이드하면서 콘텐츠를 개선하고 영어 번역을 추가하여 배포했습니다.

#### VitePress에 대한 대체제

개발자 소개 페이지를 만들 때 VitePress 외에도 다양한 선택지가 있습니다. 리액트 기반의 [Docusaurus](https://docusaurus.io/), Nuxt 기반의 [Nuxt Content](https://content.nuxt.com/), Next.js 기반의 [Nextra](https://nextra.site/) 등이 있으며, 정적 사이트 생성기로 유명한 Hexo, Hugo, Gatsby도 좋은 대안입니다. 이 중에서 저는 Vue 기반이면서 빠른 개발 경험을 제공하는 VitePress를 선택했습니다. 이제 VitePress로 나를 소개하는 페이지를 어떻게 만들 수 있는지 살펴보겠습니다.

#### 나를 소개하는 페이지 만들기

VitePress를 시작하면 [프로젝트 폴더 구조](https://vitepress.dev/ko/guide/getting-started#file-structure)에 따라 구성 파일이 포함된 .vitepress 폴더와 인덱스 페이지(index.md)가 생성됩니다. 저는 소개 페이지에 [Home Page 레이아웃](https://vitepress.dev/reference/frontmatter-config#layout)을 Frontmatter로 적용하고, Vue 스크립트를 활용해 개발자 경력 연차를 동적으로 계산하여 표시했습니다. 이제 VitePress의 [마크다운 확장 기능](https://vitepress.dev/guide/markdown)을 활용하여 나만의 개성이 담긴 소개 콘텐츠를 추가하면 됩니다.

```html index.md
---
title: Introduction
layout: home
---

<script setup>
import dayjs from 'dayjs'
const date = '2017-04-01'
const diffYears = dayjs().diff(date, 'year')
const diffMonths = dayjs().diff(date, 'month') % 12
</script>

<span :title="`${diffYears}년 ${diffMonths+1}개월`">{{ diffYears + 1 }}년 차</span>
```

#### 방명록을 위한 댓글 추가하기

소개 페이지에 댓글 기능이 반드시 필요한 것은 아니지만, 방명록 형태로 소통할 수 있는 기능을 추가하고 싶다면 외부 댓글 시스템을 연동할 수 있습니다. VitePress 자체에는 댓글 기능이 내장되어 있지 않지만, Github Discussions 기반의 댓글 시스템인 [giscus](https://giscus.app/ko)와 같은 서비스를 활용할 수 있습니다. VitePress는 [마크다운 문서에 Vue 컴포넌트를 추가](https://vitepress.dev/ko/guide/using-vue#using-vue-in-markdown)할 수 있어서 외부 댓글 시스템을 비교적 쉽게 통합할 수 있습니다. 저는 [Comment.vue 컴포넌트를 만들어 적용](https://github.com/kdevkr/about/blob/e1d32b5ba3cae708dee4013ef44f85d427302a46/about/index.md?plain=1#L58)했으며, VitePress가 Vite를 빌드 도구로 사용하기 때문에 .env 파일에서 giscus 관련 설정값을 관리할 수 있었습니다.

```html Comment.vue
<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter, title, lang } = useData()
const langCd = lang.value.split('-')[0];

const repo = import.meta.env.VITE_GISCUS_REPO;
const repoId = import.meta.env.VITE_GISCUS_REPO_ID;
const category = import.meta.env.VITE_GISCUS_CATEGORY;
const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID;
const mapping = import.meta.env.VITE_GISCUS_MAPPING;
const theme = import.meta.env.VITE_GISCUS_THEME;
</script>

<template>
    <component v-if="frontmatter.comment !== false" :key="title" :is="'script'" src="https://giscus.app/client.js"
        :data-repo="repo" :data-repo-id="repoId" :data-category="category" :data-category-id="categoryId"
        :data-mapping="mapping" data-strict="0" data-reactions-enabled="1" data-emit-metadata="0"
        data-input-position="bottom" :data-lang="langCd" :data-theme="theme" data-loading="lazy" crossorigin="anonymous"
        async />
</template>
```

#### Github Page로 배포하기

VitePress 공식 문서에서는 [Github Pages](https://vitepress.dev/guide/deploy#github-pages)에 대한 배포 가이드를 제공하고 있어 쉽게 나만의 소개 페이지를 배포할 수 있습니다. 공식 가이드에서 제안하는 기본 워크플로우를 참고하되, 저는 제 프로젝트 구조와 요구사항에 맞게 워크플로우를 작성했습니다. 공식 문서의 워크플로우는 npm을 사용하지만, 저는 yarn을 패키지 매니저로 선택했고, 특정 폴더만 빌드하도록 `yarn about:build` 커스텀 스크립트를 정의했습니다. 또한 `peaceiris/actions-gh-pages` 액션을 사용하여 배포 과정을 간소화했습니다. 이렇게 작성한 워크플로우는 메인 브랜치에 새로운 커밋이 푸시될 때마다 자동으로 배포 파이프라인을 실행하여 최신 상태의 소개 페이지를 유지합니다. 제가 작성한 워크플로우는 다음과 같습니다.

```yml .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches:
      - main
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: yarn
      - run: yarn install --frozen-lockfile

      - name: Build
        run: yarn about:build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: about/.vitepress/dist
```

---

끝으로, 현재 보고 계시는 기술 블로그는 VitePress가 아닌 Hexo 기반으로 작성되어 있습니다. VitePress는 Hexo에 비해 Vue 컴포넌트 통합과 빌드 속도 면에서 훨씬 간결하고 효율적이지만, 마이그레이션 과정에서 몇 가지 어려움이 있습니다. 특히 Hexo의 복잡한 플러그인 의존성, 마크다운 렌더링 방식의 차이, 그리고 테마 시스템의 완전한 재구성이 필요합니다. 또한 기존에 작성된 수많은 포스트의 프론트매터 형식과 마크다운 내 특수 문법들을 모두 VitePress 호환 방식으로 변환해야 하는 작업량이 상당합니다. 이러한 이유로 소개 페이지와 블로그를 별도로 관리해야 하는 점이 아쉽지만, 각 도구의 장점을 최대한 활용하는 방향으로 관리하고자 합니다.
