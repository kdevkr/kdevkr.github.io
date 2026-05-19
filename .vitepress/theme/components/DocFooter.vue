<template>
  <footer class="VPDocFooter" v-if="isPostPage">
    <div class="pager">
      <div class="pager-link prev" v-if="prev">
        <a :href="prev.url">
          <span class="desc">이전 글</span>
          <span class="title">{{ prev.title }}</span>
          <span class="date">{{ prev.date.string }}</span>
        </a>
      </div>
      <div class="pager-link next" v-if="next">
        <a :href="next.url">
          <span class="desc">다음 글</span>
          <span class="title">{{ next.title }}</span>
          <span class="date">{{ next.date.string }}</span>
        </a>
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
    return i > -1 && i < posts.length - 1 ? posts[i + 1] : undefined
})

const next = computed(() => {
    const i = currentIndex.value
    return i > 0 ? posts[i - 1] : undefined
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
.pager-link .date {
    display: inline-block;
    margin-top: 4px;
    padding: 1px 6px;
    font-size: 11px;
    border-radius: 4px;
    background-color: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
}

</style>
