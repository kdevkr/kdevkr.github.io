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
import { data as posts } from './.vitepress/theme/posts.data.ts';

const top5 = posts.slice(0, 5)
</script>

<div v-if="top5 && top5.length > 0" class="recent-posts-container mt-12">
  <div class="recent-posts-header">
    <h2 class="section-title">최근 포스트</h2>
    <a href="/posts" class="all-posts-link" aria-label="전체 포스트 보기">
      전체 보기 <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>

  <div class="posts-feed" role="feed" aria-busy="false">
    <article v-for="(post, i) in top5" :key="i" class="post-card-wrapper">
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

<style scoped>
.recent-posts-container {
  margin-top: 3rem;
}

.recent-posts-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.75rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
  border: none;
  padding: 0;
  letter-spacing: -0.02em;
  text-wrap: pretty;
}

.all-posts-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s ease, transform 0.2s ease;
}

.all-posts-link:hover {
  color: var(--vp-c-brand-2);
}

.all-posts-link:hover .arrow {
  transform: translateX(3px);
}

.all-posts-link .arrow {
  transition: transform 0.2s ease;
}

.all-posts-link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
  border-radius: 4px;
}

.posts-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card-wrapper {
  width: 100%;
}

.post-card {
  display: block;
  padding: 1.5rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.25s ease, background-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-mute);
  transform: translateY(-2px);
  box-shadow: var(--vp-shadow-1);
}

.post-card:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 12px;
}

.post-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.post-card-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.post-card-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.post-card:hover .post-card-tag {
  color: var(--vp-c-brand-1);
}

.post-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  text-wrap: pretty;
  transition: color 0.2s ease;
}

.post-card:hover .post-card-title {
  color: var(--vp-c-brand-1);
}

.post-card-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>