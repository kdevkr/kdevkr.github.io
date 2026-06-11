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
          <div class="post-card-meta">
            <time :datetime="post.date.string" class="post-card-date">{{ post.date.string }}</time>
            <div v-if="post.tags && post.tags.length" class="post-card-tags">
              <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="post-card-tag">
                #{{ tag }}
              </span>
            </div>
          </div>
          <h3 class="post-card-title">{{ post.title }}</h3>
          <p v-if="post.description" class="post-card-description">{{ post.description }}</p>
        </a>
      </article>
    </div>
  </div>
</div>

<style>
.archive-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

@media (min-width: 640px) {
  .archive-container {
    padding: 0 48px 5rem;
  }
}

@media (min-width: 960px) {
  .archive-container {
    padding: 0 64px 5rem;
  }
}

.archive-container .year-section {
  margin-top: 4.5rem;
}

.archive-container .year-section:first-child {
  margin-top: 2.5rem;
}

.archive-container .year-title {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--vp-c-text-1);
  margin: 0 0 1.8rem 0;
  border-top: none;
  border-bottom: none;
  text-decoration: none;
  border-left: 6px solid var(--vp-c-brand-1);
  padding: 0.1rem 0 0.1rem 1rem;
  line-height: 1;
  letter-spacing: -0.03em;
}

.archive-container .posts-feed {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.archive-container .post-card-wrapper {
  width: 100%;
}

.vp-doc .archive-container .post-card {
  display: block;
  padding: 1.75rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  text-decoration: none !important;
  color: inherit;
  transition: border-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), 
              background-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), 
              transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), 
              box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.vp-doc .archive-container .post-card:hover {
  text-decoration: none !important;
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-mute);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.08);
}

.vp-doc .archive-container .post-card:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 16px;
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
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.archive-container .post-card-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.archive-container .post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.archive-container .post-card-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.vp-doc .archive-container .post-card:hover .post-card-tag {
  color: var(--vp-c-brand-1);
}

.archive-container .post-card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 0 0.6rem 0;
  line-height: 1.4;
  text-wrap: pretty;
  transition: color 0.25s ease;
}

.vp-doc .archive-container .post-card:hover .post-card-title {
  color: var(--vp-c-brand-1);
}

.archive-container .post-card-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .vp-doc .archive-container .post-card {
    padding: 1.5rem;
    border-radius: 12px;
  }
}
</style>
