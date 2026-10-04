---
layout: home
pageClass: sleep-page

hero:
    name: Sleep
    tagline: 포근한 이불 속에서 끄적이는 나른한 일상 기록 💤
    image:
        src: /images/logo/sleep.jpg
---

<script setup>
import dayjs from 'dayjs';
import { data as rawPosts } from '../.vitepress/theme/sleep.data.ts';

// 데이터 안전성 검증 및 최신순 정렬
const posts = (rawPosts || [])
  .filter(item => item && item.date && !Number.isNaN(item.date.time))
  .sort((a, b) => b.date.time - a.date.time);
</script>

<div class="booklet-wrapper">
  <div class="booklet-note">
    삶을 지탱하는 주거와 금융, 그리고 일상에서 부딪히며 배운 소소한 경험들을 모아둔 작은 기록장입니다.
  </div>
  <main class="booklet-stream">
    <article v-for="post in posts" :key="post.url" class="booklet-entry">
      <a :href="post.url" class="booklet-link">
        <div class="booklet-meta">
          <time :datetime="post.date.string" class="booklet-date">
            {{ dayjs(post.date.time).format('YYYY년 M월 D일') }}
          </time>
          <div v-if="post.tags && post.tags.length" class="booklet-tags">
            <span v-for="tag in post.tags" :key="tag" class="booklet-tag">
              #{{ tag }}
            </span>
          </div>
        </div>
        <h2 class="booklet-title">{{ post.title }}</h2>
        <p v-if="post.description" class="booklet-desc">
          {{ post.description }}
        </p>
      </a>
    </article>
  </main>
</div>

<style>
/* 
  포근한 소책자 테마
  - 거대한 랜딩 스타일을 걷어내고, 손에 쥐는 다이어리 같은 스케일과 온도를 부여
*/
.sleep-page {
  --sleep-bg: #faf7f2;
  --sleep-text: #2a241f;
  --sleep-sub: #695e54;
  --sleep-dim: #9e9386;
  --sleep-line: #ebe3d6;
  --sleep-accent: #b45309;
}

.dark .sleep-page {
  --sleep-bg: #14161b;
  --sleep-text: #eee8df;
  --sleep-sub: #a19a8f;
  --sleep-dim: #6b665d;
  --sleep-line: #242730;
  --sleep-accent: #fbbf24;
}

/* 페이지 전체 배경을 하나의 포근한 공간으로 일체화 */
.sleep-page .VPHome {
  background-color: var(--sleep-bg) !important;
  min-height: 100vh;
}

.sleep-page .VPHome > .vp-doc {
  max-width: none;
  padding: 0;
  background-color: var(--sleep-bg) !important;
}

/* 상단 히어로 스케일 축소 및 단정화 */
.sleep-page .VPHero {
  padding-top: 2rem !important;
  padding-bottom: 2rem !important;
}

.sleep-page .VPHero .name {
  font-size: 2.2rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.03em !important;
  color: var(--sleep-text) !important;
}

.sleep-page .VPHero .tagline {
  font-size: 1rem !important;
  color: var(--sleep-sub) !important;
  margin-top: 0.5rem !important;
}

.sleep-page .VPHero .image-src {
  max-height: 160px !important;
  border-radius: 20px;
}

/* 소책자 본문 컨테이너 (640px 안팎의 아늑한 독서 폭) */
.booklet-wrapper {
  max-width: 660px;
  margin: 0 auto;
  padding: 1rem 1.5rem 7rem;
}

/* 소책자 프롤로그 한 줄 */
.booklet-note {
  font-size: 0.94rem;
  color: var(--sleep-sub);
  line-height: 1.7;
  padding-bottom: 2rem;
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--sleep-line);
  letter-spacing: -0.015em;
}

/* 글 목록 */
.booklet-stream {
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
}

.booklet-entry {
  display: block;
  padding-bottom: 3rem;
  border-bottom: 1px solid var(--sleep-line);
}

.booklet-entry:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.vp-doc .booklet-link {
  display: block;
  text-decoration: none !important;
  color: inherit !important;
}

.booklet-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.booklet-date {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--sleep-accent);
  letter-spacing: -0.01em;
}

.booklet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.booklet-tag {
  font-size: 0.8rem;
  color: var(--sleep-dim);
}

.vp-doc .booklet-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--sleep-text);
  line-height: 1.45;
  letter-spacing: -0.025em;
  margin: 0 0 0.7rem 0 !important;
  border: none !important;
  padding: 0 !important;
  transition: color 0.15s ease;
}

.vp-doc .booklet-link:hover .booklet-title {
  color: var(--sleep-accent);
}

.booklet-desc {
  font-size: 0.96rem;
  color: var(--sleep-sub);
  line-height: 1.7;
  margin: 0;
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
