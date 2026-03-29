<template>
  <footer class="VPDocFooter" v-if="isPostPage">
    <div class="pager">
      <div class="pager-link prev" v-if="prev">
        <a :href="prev.url">
          <span class="desc">이전 글</span>
          <span class="title">{{ prev.title }}</span>
        </a>
      </div>
      <div class="pager-link next" v-if="next">
        <a :href="next.url">
          <span class="desc">다음 글</span>
          <span class="title">{{ next.title }}</span>
        </a>
      </div>
    </div>
    <div class="edit-info">
      <div class="last-updated" v-if="lastUpdated">
        <p class="VPLastUpdated">마지막 수정: <time :datetime="String(lastUpdated)">{{ formattedLastUpdated }}</time></p>
      </div>
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
    return i !== -1 && i < posts.length - 1 ? posts[i + 1] : undefined
})

const next = computed(() => {
    const i = currentIndex.value
    return i > 0 ? posts[i - 1] : undefined
})

const lastUpdated = computed(() => page.value.lastUpdated)
const formattedLastUpdated = computed(() => {
    const lu = lastUpdated.value
    if (!lu) return ''
    return new Date(lu).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})
</script>

<style scoped>
.VPDocFooter {
    padding-top: 1.5rem;
    border-top: 1px solid var(--vp-c-divider);
}
.pager {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
}
.pager-link .desc {
    display: block;
    font-size: 12px;
    color: var(--vp-c-text-muted);
}
.pager-link .title {
    display: block;
    font-weight: 600;
}
</style>
