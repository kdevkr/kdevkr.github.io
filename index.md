---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Mambo Blog
  text: Today I Learned 🔥
  tagline: 잠만보처럼 푸근하고 수달처럼 귀염뽀짝한 개발자
  actions:
    - theme: brand
      text: Posts
      link: /posts
    - theme: alt
      text: About
      link: https://kdev.ing/about
  image:
    src: /images/logo/snorlax-111.jpg

features:
  - icon: 🛠️
    title: Fullstack
    details: Spring Boot로 안정적인 백엔드 서버를 설계하고, Vite와 Vue로 쾌적한 프론트엔드를 개발해요. AWS 클라우드를 통해 최적의 인프라 경험을 늘리고 있어요.
  - icon: 🤖
    title: AI Ops
    details: Claude, Gemini 같은 AI 도구를 개발 워크플로우에 적극 활용하고 있어요. 코드 리뷰, 커밋 자동화, 작업 내용 공유 등 반복 작업을 최소화할 수 있는 개발 환경을 설정해요.
---

<script setup>
import { data as posts } from '.vitepress/theme/posts.data.ts';

const top5 = posts.slice(0, 5)
</script>

<div class="grid gap-y-2 mt-10">
  <h1>최근 포스트</h1>
  <ul>
    <li v-for="(post, i) in top5" :key="i">
      <a class="VPButton medium brand" :href="post.url">{{post.title}}</a> <small>({{post.date.string}})</small>
    </li>
  </ul>
</div>