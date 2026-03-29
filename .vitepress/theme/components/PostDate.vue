<template>
  <div class="post-date" v-if="date">
    <span>{{ date }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, frontmatter } = useData()

const date = computed(() => {
    if (!page.value.relativePath.startsWith('posts/')) return undefined
    const raw = frontmatter.value.date
    if (!raw) return undefined
    return new Date(raw).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})
</script>

<style scoped>
.post-date {
    font-size: 13px;
    color: var(--vp-c-text-2);
    margin-bottom: 1rem;
}
</style>
