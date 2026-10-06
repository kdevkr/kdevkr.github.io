---
layout: home
title: 일상 기록장
pageClass: sleep-page
---

<script setup>
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { data as rawPosts } from '../.vitepress/theme/sleep.data.ts';

// 데이터 안전성 검증 및 필터링
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
const selectedYear = ref('');
const filteredYears = computed(() => years.filter(year => !selectedYear.value || year === selectedYear.value));
</script>

<div class="sleep-layout">
<div class="editorial-hero-backdrop">
  <div class="editorial-hero-container">
    <header class="editorial-hero-card">
      <div class="editorial-hero-badge">
        <span class="badge-icon" aria-hidden="true">📖</span>
        <span class="badge-text">일상 기록장</span>
      </div>
      <div class="editorial-hero-content">
        <p class="editorial-hero-tagline">포근한 이불 속에서 끄적여보는 나른한 일상 이야기 💤</p>
      </div>
      <div class="editorial-hero-media">
        <img src="/images/logo/sleep.jpg" alt="Sleep 잠만보 카드" class="editorial-hero-img" />
      </div>
    </header>
  </div>
</div>

<div class="archive-container">
  <div class="year-filter">
    <h2 v-if="filteredYears.length" class="year-title">{{ filteredYears[0] }}</h2>
    <div class="year-select">
      <select id="sleep-year" v-model="selectedYear" aria-label="포스트 연도">
        <option value="">전체 연도</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}년</option>
      </select>
      <svg class="year-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  </div>
  <div v-for="year in filteredYears" :key="year" class="year-section">
    <h2 v-if="year !== filteredYears[0]" class="year-title">{{ year }}</h2>
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

</div>

<style>
/* 
  에디토리얼 매거진/저널 테마
  - posts.md 와 100% 동일한 연도별 그룹핑, 피드 구조, 카드 배경 및 호버 트랜지션
  - 마우스 오버 시만 뱃지 톤(--sleep-accent)으로 전환
*/
.sleep-page {
  --posts-list-bg: #f8f7fc;
  --posts-card-bg: var(--vp-c-bg);
  --sleep-accent: #d97706;
  --sleep-accent-soft: rgba(217, 119, 6, 0.12);
}

.dark .sleep-page {
  --posts-list-bg: #1c1b22;
  --posts-card-bg: var(--vp-c-bg-soft);
  --sleep-accent: #fbbf24;
  --sleep-accent-soft: rgba(251, 191, 36, 0.16);
}

/* 홈 레이아웃 기본 하단 여백 제거 */
.sleep-page .VPHome {
  margin-bottom: 0 !important;
}

/* posts.md와 동일한 리스트 배경 그라데이션 */
.sleep-page .VPHome > .vp-doc {
  max-width: none;
  padding: 0;
  background: linear-gradient(var(--vp-c-bg), var(--posts-list-bg) 80px);
}

/* 하단 푸터 영역 분리 */
.sleep-page .VPFooter {
  background-color: var(--vp-c-bg) !important;
  border-top: 1px solid var(--vp-c-divider) !important;
}

/* 히어로 뒷배경 앰비언트 글로우 */
.editorial-hero-backdrop {
  position: relative;
  width: 100%;
  padding: 3.5rem 1.5rem 2.5rem;
  background: 
    radial-gradient(80% 65% at 50% 15%, rgba(245, 158, 11, 0.11) 0%, rgba(251, 191, 36, 0.04) 50%, transparent 80%),
    radial-gradient(45% 45% at 85% 25%, rgba(52, 211, 153, 0.07) 0%, transparent 70%),
    radial-gradient(35% 35% at 15% 35%, rgba(244, 114, 182, 0.05) 0%, transparent 70%);
  overflow: hidden;
}

.dark .editorial-hero-backdrop {
  background: 
    radial-gradient(80% 65% at 50% 15%, rgba(251, 191, 36, 0.08) 0%, rgba(217, 119, 6, 0.03) 50%, transparent 80%),
    radial-gradient(45% 45% at 85% 25%, rgba(16, 185, 129, 0.05) 0%, transparent 70%),
    radial-gradient(35% 35% at 15% 35%, rgba(129, 140, 248, 0.04) 0%, transparent 70%);
}

.editorial-hero-container {
  max-width: 820px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 통합 히어로 글래스 카드 (무테두리) */
.editorial-hero-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none !important;
  border-radius: 28px;
  padding: 2.75rem 2.5rem;
  box-shadow: 
    0 20px 40px -15px rgba(217, 119, 6, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.02);
  display: grid;
  grid-template-areas: "badge media" "content media";
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem 2.5rem;
  position: relative;
}

.dark .editorial-hero-card {
  background: var(--vp-c-bg-soft);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none !important;
  box-shadow: 
    0 24px 48px -18px rgba(0, 0, 0, 0.45);
}

.editorial-hero-content {
  grid-area: content;
  flex: 1;
  min-width: 0;
}

/* 뱃지 형태의 메인 타이틀 */
.editorial-hero-badge {
  grid-area: badge;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--vp-c-text-1);
  padding: 0;
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0;
  line-height: 1.4;
  letter-spacing: -0.015em;
}

.editorial-hero-badge .badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  font-size: 1rem;
}

/* 서브 태그라인 */
.editorial-hero-tagline {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.65rem 0;
  line-height: 1.5;
  letter-spacing: -0.015em;
  word-break: keep-all;
}

/* 잠만보 카드 자체 단독 배치 */
.editorial-hero-media {
  grid-area: media;
  min-width: 0;
  max-width: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editorial-hero-img {
  display: block;
  width: 220px;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.22);
}

/* 포스트 목록 컨테이너 (posts.md 와 100% 동일) */
.sleep-page .archive-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

@media (min-width: 640px) {
  .sleep-page .archive-container {
    padding: 2.5rem 48px 5rem;
  }
}

@media (min-width: 960px) {
  .sleep-page .sleep-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: start;
    gap: 2rem;
    max-width: 1280px;
    margin: 0 auto;
    padding: 3rem 48px 5rem;
  }

  .sleep-page .sleep-layout .editorial-hero-backdrop {
    min-width: 0;
    padding: 0;
    overflow: visible;
  }

  .sleep-page .sleep-layout .editorial-hero-card {
    grid-template-areas: "badge" "media" "content";
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    align-items: center;
    text-align: center;
    padding: 2rem 1.5rem;
    gap: 2rem;
  }

  .sleep-page .sleep-layout .editorial-hero-media {
    align-self: center;
  }

  .sleep-page .sleep-layout .editorial-hero-badge {
    justify-self: center;
  }

  .sleep-page .sleep-layout .archive-container {
    min-width: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
}

.sleep-page .archive-container .year-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  color: var(--vp-c-text-1);
}

.sleep-page .vp-doc .archive-container .year-filter .year-title {
  margin: 0 !important;
}

.sleep-page .archive-container .year-select {
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
  color: var(--vp-c-text-2);
}

.sleep-page .archive-container .year-filter select {
  appearance: none;
  min-height: 44px;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background-color: var(--posts-card-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.sleep-page .archive-container .year-filter select:hover,
.sleep-page .archive-container .year-filter select:focus-visible {
  border-color: var(--vp-c-text-2);
}

.sleep-page .archive-container .year-filter option {
  background-color: var(--posts-card-bg);
  color: var(--vp-c-text-1);
}

.sleep-page .archive-container .year-select-arrow {
  position: absolute;
  top: 50%;
  right: 0.875rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.sleep-page .archive-container .year-filter select:focus-visible {
  outline: 2px solid var(--vp-c-text-2);
  outline-offset: 2px;
}

.sleep-page .archive-container .year-section + .year-section {
  margin-top: 4.5rem;
}

.sleep-page .vp-doc .archive-container .year-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
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

.sleep-page .vp-doc .archive-container .year-title::before {
  content: '';
  width: 8px;
  height: 8px;
  box-sizing: border-box;
  flex-shrink: 0;
  border: 1.5px solid var(--vp-c-text-2);
  background-color: var(--vp-c-text-2);
  border-radius: 50%;
}

.sleep-page .archive-container .posts-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sleep-page .archive-container .post-card-wrapper {
  width: 100%;
}

.sleep-page .vp-doc .archive-container .post-card {
  position: relative;
  display: block;
  padding: 1.5rem 4rem 1.5rem 1.5rem;
  background-color: var(--posts-card-bg);
  border: 0;
  border-radius: 12px;
  text-decoration: none !important;
  color: inherit;
}

.sleep-page .vp-doc .archive-container .post-card:hover {
  text-decoration: none !important;
}

.sleep-page .vp-doc .archive-container .post-card:focus-visible {
  outline: 2px solid var(--sleep-accent);
  outline-offset: 2px;
  border-radius: 12px;
}

.sleep-page .vp-doc .archive-container .post-card-title,
.sleep-page .vp-doc .archive-container .post-card-description,
.sleep-page .vp-doc .archive-container .post-card-date,
.sleep-page .vp-doc .archive-container .post-card-tag {
  text-decoration: none !important;
}

.sleep-page .archive-container .post-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.25rem;
  margin-top: 1rem;
}

.sleep-page .archive-container .post-card-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.sleep-page .archive-container .post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.sleep-page .archive-container .post-card-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.sleep-page .vp-doc .archive-container .post-card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 !important;
  line-height: 1.4;
  text-wrap: pretty;
  transition: color 0.25s ease;
}

.sleep-page .vp-doc .archive-container .post-card:hover .post-card-title,
.sleep-page .vp-doc .archive-container .post-card:focus-visible .post-card-title {
  color: var(--sleep-accent);
}

.sleep-page .archive-container .post-card-arrow {
  position: absolute;
  right: 1.5rem;
  top: calc(50% - 10px);
  color: var(--sleep-accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sleep-page .archive-container .post-card:hover .post-card-arrow,
.sleep-page .archive-container .post-card:focus-visible .post-card-arrow {
  opacity: 1;
  transform: none;
}

@media (hover: none) {
  .sleep-page .archive-container .post-card-arrow {
    opacity: 1;
    transform: none;
  }
}

.sleep-page .vp-doc .archive-container .post-card-description {
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
  .editorial-hero-backdrop {
    padding: 2rem 1rem 1.5rem;
  }
  .editorial-hero-card {
    grid-template-areas: "badge" "media" "content";
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    padding: 2rem 1.5rem;
    gap: 1.75rem;
    text-align: center;
  }
  .editorial-hero-img {
    width: 220px;
  }
  .editorial-hero-badge {
    justify-self: center;
  }
  .sleep-page .archive-container {
    padding-top: 1.5rem;
  }
  .sleep-page .vp-doc .archive-container .post-card {
    padding: 1.25rem 3.5rem 1.25rem 1.25rem;
  }
  .sleep-page .archive-container .post-card-arrow {
    right: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sleep-page .archive-container .post-card-title,
  .sleep-page .archive-container .post-card-arrow {
    transition: none;
  }
}
</style>
