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
  - icon: ⚡️
    title: Backend
    details: 스프링 부트로 안정적이고 확장성 있는 서버 애플리케이션을 개발하고 있어요.
  - icon:
      src: /icons/vite.svg
      alt: Vite
      width: 30
    title: Frontend
    details: Vite와 Vue를 활용해 빠르고 직관적인 사용자 경험을 제공하려고 노력해요.
  - icon: 🚀
    title: Infrastructure
    details: 리눅스와 AWS 인프라 기반으로 시스템을 효율적으로 운영하고 있습니다.
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