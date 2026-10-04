---
layout: home
pageClass: posts-page

hero:
    name: Posts
    tagline: 에러와 삽질을 냠냠 씹어 삼키며 든든하게 성장하는 기록 🛠️
    image:
        src: /images/logo/posts.jpg
---

<script setup>
import dayjs from 'dayjs';
import { data as rawPosts } from './.vitepress/theme/posts.data.ts';

// 데이터 안전성 검증 및 필터링 (반드시 date와 date.time이 유효한 객체만 수집)
const posts = (rawPosts || []).filter(item => item && item.date && !Number.isNaN(item.date.time));

// 연도별 그룹화 직접 구현
const postsByYear = posts.reduce((acc, item) => {
  const year = dayjs(item.date.time).format('YYYY');
  if (!acc[year]) {
    acc[year] = [];
  }
  acc[year].push(item);
  return acc;
}, {});

// 연도 역순 정렬
const years = Object.keys(postsByYear).sort((a, b) => b - a);
</script>

<div class="archive-container">
  <div v-for="year in years" :key="year" class="year-section">
    <h2 class="year-title">{{ year }}</h2>
    <div class="posts-feed" role="feed" aria-busy="false">
      <article v-for="post in postsByYear[year]" :key="post.url" class="post-card-wrapper">
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
</div>

<style>
.posts-page {
  --posts-list-bg: #f8f7fc;
  --posts-card-bg: var(--vp-c-bg);
}

.dark .posts-page {
  --posts-list-bg: #1c1b22;
  --posts-card-bg: var(--vp-c-bg-soft);
}

.posts-page .VPHome > .vp-doc {
  max-width: none;
  padding: 0;
  background: linear-gradient(var(--vp-c-bg), var(--posts-list-bg) 80px);
}

.posts-page .VPHero .image {
  inset: var(--vp-nav-height) 0 0;
  height: auto;
  min-height: 0;
}

.posts-page .VPHero .image-src {
  right: max(24px, calc((100% - 1024px) / 2));
  height: calc(100% - 24px);
}

@media (min-width: 960px) {
  .posts-page .VPHero .container {
    padding-right: 360px;
  }
}

@media (max-width: 959px) {
  .posts-page .VPHero .image-src {
    right: 50%;
  }
}

.archive-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

@media (min-width: 640px) {
  .archive-container {
    padding: 2.5rem 48px 5rem;
  }
}

@media (min-width: 960px) {
  .archive-container {
    padding: 2.5rem 64px 5rem;
  }
}

.archive-container .year-section {
  margin-top: 4.5rem;
}

.archive-container .year-section:first-child {
  margin-top: 0;
}

.vp-doc .archive-container .year-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1.25rem !important;
  border-top: none;
  border-bottom: none;
  text-decoration: none;
  padding: 0;
  line-height: 1;
  letter-spacing: -0.03em;
}

.archive-container .posts-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.archive-container .post-card-wrapper {
  width: 100%;
}

.vp-doc .archive-container .post-card {
  position: relative;
  display: block;
  padding: 1.5rem 4rem 1.5rem 1.5rem;
  background-color: var(--posts-card-bg);
  border: 0;
  border-radius: 12px;
  text-decoration: none !important;
  color: inherit;
}

.vp-doc .archive-container .post-card:hover {
  text-decoration: none !important;
}

.vp-doc .archive-container .post-card:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 12px;
}

.vp-doc .archive-container .post-card-title,
.vp-doc .archive-container .post-card-description,
.vp-doc .archive-container .post-card-date,
.vp-doc .archive-container .post-card-tag {
  text-decoration: none !important;
}

.archive-container .post-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.25rem;
  margin-top: 1rem;
}

.archive-container .post-card-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.archive-container .post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.archive-container .post-card-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.vp-doc .archive-container .post-card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 !important;
  line-height: 1.4;
  text-wrap: pretty;
  transition: color 0.25s ease;
}

.vp-doc .archive-container .post-card:hover .post-card-title,
.vp-doc .archive-container .post-card:focus-visible .post-card-title {
  color: var(--vp-c-brand-1);
}

.archive-container .post-card-arrow {
  position: absolute;
  right: 1.5rem;
  top: calc(50% - 10px);
  color: var(--vp-c-brand-1);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.archive-container .post-card:hover .post-card-arrow,
.archive-container .post-card:focus-visible .post-card-arrow {
  opacity: 1;
  transform: none;
}

@media (hover: none) {
  .archive-container .post-card-arrow {
    opacity: 1;
    transform: none;
  }
}

.vp-doc .archive-container .post-card-description {
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

@media (max-width: 639px) {
  .posts-page .VPHero {
    min-height: 280px;
    padding-top: calc(var(--vp-nav-height) + 32px);
    padding-bottom: 32px;
  }

  .archive-container {
    padding-top: 1.5rem;
  }

  .vp-doc .archive-container .post-card {
    padding: 1.25rem 3.5rem 1.25rem 1.25rem;
  }

  .archive-container .post-card-arrow {
    right: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .archive-container .post-card-title,
  .archive-container .post-card-arrow {
    transition: none;
  }
}
</style>
