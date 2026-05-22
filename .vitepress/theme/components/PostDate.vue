<template>
  <div class="post-meta" v-if="date">
    <div class="meta-item date-badge">
      <svg class="meta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <time :datetime="rawDate">{{ date }}</time>
    </div>
    <div v-if="tags && tags.length" class="meta-item tags-wrapper">
      <svg class="meta-icon tag-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
      <span v-for="tag in tags" :key="tag" class="meta-tag">{{ tag }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, frontmatter } = useData()

const rawDate = computed(() => frontmatter.value.date)

const date = computed(() => {
    if (!page.value.relativePath.startsWith('posts/')) return undefined
    const raw = rawDate.value
    if (!raw) return undefined
    
    const d = new Date(raw)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
})

const tags = computed(() => {
    const rawTags = frontmatter.value.tags
    if (!rawTags) return []
    return Array.isArray(rawTags) ? rawTags : [rawTags]
})
</script>

<style scoped>
.post-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: 13px;
    color: var(--vp-c-text-3);
    margin-bottom: 2rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px dashed var(--vp-c-divider);
    font-weight: 500;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.meta-icon {
    opacity: 0.6;
    flex-shrink: 0;
    color: var(--vp-c-text-3);
}

.tag-icon {
    margin-right: 0.1rem;
}

.date-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    background-color: var(--vp-c-default-soft);
    color: var(--vp-c-text-2);
    border: 1px solid transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    font-family: var(--vp-font-family-mono);
    line-height: 1.4;
}

.date-badge:hover {
    border-color: var(--vp-c-default-soft);
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    transform: translateY(-1px);
}

.tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
}

.meta-tag {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    background-color: var(--vp-c-brand-soft);
    color: var(--vp-c-brand-1);
    border: 1px solid transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    line-height: 1.4;
}

.meta-tag:hover {
    border-color: var(--vp-c-brand-1);
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-brand-1);
    transform: translateY(-1px);
}
</style>

