---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
pageClass: home-page

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
import { data as posts } from './.vitepress/theme/posts.data.ts';

const top5 = posts.slice(0, 5)
</script>

<div v-if="top5 && top5.length > 0" class="recent-posts-container">
  <div class="recent-posts-header">
    <h2 class="section-title">최근 포스트</h2>
    <a href="/posts" class="all-posts-link" aria-label="전체 포스트 보기">
      <span>전체 보기</span>
      <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </svg>
    </a>
  </div>

  <div class="posts-feed" role="feed" aria-busy="false">
    <article v-for="(post, i) in top5" :key="i" class="post-card-wrapper">
      <a :href="post.url" class="post-card" :aria-label="`${post.title} 포스트 읽기`">
        <h3 class="post-card-title">{{ post.title }}</h3>
        <svg class="post-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
        <p v-if="post.description" class="post-card-description">{{ post.description }}</p>
        <div class="post-card-meta">
          <time :datetime="post.date.string" class="post-card-date">{{ post.date.string }}</time>
          <div v-if="post.tags && post.tags.length" class="post-card-tags">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="post-card-tag">
              #{{ tag }}
            </span>
          </div>
        </div>
      </a>
    </article>
  </div>
</div>

<style>
.home-page {
  --posts-list-bg: #f8f7fc;
  --posts-card-bg: var(--vp-c-bg);
}

.dark .home-page {
  --posts-list-bg: #1c1b22;
  --posts-card-bg: var(--vp-c-bg-soft);
}

/* 홈 전체 하단 마진 제거로 푸터와의 배경 단절 방지 */
.home-page .VPHome {
  margin-bottom: 0 !important;
}

/* Hero 아래 Features 영역부터 배경 전환 */
.home-page .VPHomeFeatures {
  background: linear-gradient(var(--vp-c-bg), var(--posts-list-bg) 80px);
  padding-top: 1.5rem;
  padding-bottom: 2rem;
}

/* Fullstack, AI Ops 카드 스타일 일체화 */
.home-page .VPHomeFeatures .VPFeature {
  background-color: var(--posts-card-bg);
  border: 0;
  border-radius: 16px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.home-page .VPHomeFeatures .VPFeature:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.08);
}

/* 최근 포스트 영역 */
.home-page .VPHome > .vp-doc {
  max-width: none;
  padding: 0;
  background-color: var(--posts-list-bg);
}

.home-page .recent-posts-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 1rem 1.5rem 5rem;
}

@media (min-width: 640px) {
  .home-page .recent-posts-container {
    padding: 1rem 48px 5rem;
  }
}

@media (min-width: 960px) {
  .home-page .recent-posts-container {
    padding: 1rem 64px 5rem;
  }
}

/* 하단 푸터(copyright) 영역 분리 */
.home-page .VPFooter {
  background-color: var(--vp-c-bg) !important;
  border-top: 1px solid var(--vp-c-divider) !important;
}

.home-page .recent-posts-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.home-page .vp-doc .recent-posts-header .section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 !important;
  border: none;
  padding: 0;
  letter-spacing: -0.025em;
  line-height: 1.2;
  white-space: nowrap;
}

.home-page .all-posts-link {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.home-page .all-posts-link:hover {
  color: var(--vp-c-brand-2);
  background-color: var(--vp-c-brand-soft);
}

.home-page .all-posts-link .arrow {
  transition: transform 0.2s ease;
}

.home-page .all-posts-link:hover .arrow {
  transform: translateX(3px);
}

.home-page .all-posts-link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.home-page .posts-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.home-page .post-card-wrapper {
  width: 100%;
}

.home-page .post-card {
  position: relative;
  display: block;
  padding: 1.5rem 4rem 1.5rem 1.5rem;
  background-color: var(--posts-card-bg);
  border: 0;
  border-radius: 12px;
  text-decoration: none !important;
  color: inherit;
  transition: background-color 0.25s ease;
}

.home-page .post-card:hover {
  text-decoration: none !important;
}

.home-page .post-card:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 12px;
}

.home-page .post-card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 !important;
  line-height: 1.4;
  text-wrap: pretty;
  transition: color 0.25s ease;
}

.home-page .post-card:hover .post-card-title,
.home-page .post-card:focus-visible .post-card-title {
  color: var(--vp-c-brand-1);
}

.home-page .post-card-arrow {
  position: absolute;
  right: 1.5rem;
  top: calc(50% - 10px);
  color: var(--vp-c-brand-1);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.home-page .post-card:hover .post-card-arrow,
.home-page .post-card:focus-visible .post-card-arrow {
  opacity: 1;
  transform: none;
}

@media (hover: none) {
  .home-page .post-card-arrow {
    opacity: 1;
    transform: none;
  }
}

.home-page .post-card-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0.5rem 0 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-page .post-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.25rem;
  margin-top: 1rem;
}

.home-page .post-card-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.home-page .post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.home-page .post-card-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

@media (max-width: 639px) {
  .home-page .recent-posts-container {
    padding-top: 1.5rem;
  }

  .home-page .post-card {
    padding: 1.25rem 3.5rem 1.25rem 1.25rem;
  }

  .home-page .post-card-arrow {
    right: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page .post-card-title,
  .home-page .post-card-arrow,
  .home-page .all-posts-link .arrow {
    transition: none;
  }
}
</style>
