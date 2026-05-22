<template>
  <footer class="VPDocFooter" v-if="isPostPage">
    <div class="pager">
      <div class="pager-link prev" v-if="prev">
        <a :href="prev.url" class="pager-card">
          <div class="pager-header">
            <svg class="pager-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span class="desc">이전 글</span>
          </div>
          <span class="title">{{ prev.title }}</span>
          <span class="date">{{ prev.date.string }}</span>
        </a>
      </div>
      <div v-else class="pager-empty"></div>
      
      <div class="pager-link next" v-if="next">
        <a :href="next.url" class="pager-card">
          <div class="pager-header">
            <span class="desc">다음 글</span>
            <svg class="pager-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
          <span class="title">{{ next.title }}</span>
          <span class="date">{{ next.date.string }}</span>
        </a>
      </div>
      <div v-else class="pager-empty"></div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as posts } from '../posts.data.ts'

const { page } = useData()

const isPostPage = computed(() => page.value.relativePath.startsWith('posts/'))

const currentIndex = computed(() => {
    const currPath = page.value.relativePath.replace(/\.md$/, '')
    return posts.findIndex(p => {
        const postPath = p.url.replace(/^\//, '').replace(/\/$/, '')
        return postPath === currPath
    })
})

// posts는 최신순(내림차순) 정렬: index 0 = 가장 최신
// 이전 글 = 더 오래된 글 = posts[i + 1]
// 다음 글 = 더 최신 글 = posts[i - 1]
const prev = computed(() => {
    const i = currentIndex.value
    return i > -1 && i < posts.length - 1 ? posts[i + 1] : undefined
})

const next = computed(() => {
    const i = currentIndex.value
    return i > 0 ? posts[i - 1] : undefined
})
</script>

<style scoped>
.VPDocFooter {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--vp-c-divider);
}

.pager {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

@media (min-width: 640px) {
    .pager {
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
    }
}

.pager-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 110px;
    padding: 1.25rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    background-color: var(--vp-c-bg-soft);
    text-decoration: none !important;
    color: var(--vp-c-text-1) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    transition: 
        border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
        background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
        transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.pager-card:hover {
    border-color: var(--vp-c-brand-1);
    background-color: var(--vp-c-bg-mute);
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
}

.dark .pager-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark .pager-card:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2);
}

.pager-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.6rem;
    color: var(--vp-c-text-3);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.prev .pager-header {
    justify-content: flex-start;
}

.next .pager-header {
    justify-content: flex-end;
}

.pager-arrow {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--vp-c-text-3);
}

.pager-card:hover .pager-arrow {
    color: var(--vp-c-brand-1);
}

.prev .pager-card:hover .pager-arrow {
    transform: translateX(-4px);
}

.next .pager-card:hover .pager-arrow {
    transform: translateX(4px);
}

.pager-card .title {
    font-size: 14.5px;
    font-weight: 700;
    line-height: 1.45;
    color: var(--vp-c-text-1);
    transition: color 0.2s ease;
    flex-grow: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pager-card:hover .title {
    color: var(--vp-c-brand-1);
}

.prev .title {
    text-align: left;
}

.next .title {
    text-align: right;
}

.pager-card .date {
    margin-top: 0.75rem;
    font-size: 11px;
    color: var(--vp-c-text-3);
    align-self: flex-start;
}

.next .date {
    align-self: flex-end;
}

.pager-empty {
    display: none;
}

@media (min-width: 640px) {
    .pager-empty {
        display: block;
    }
}
</style>
