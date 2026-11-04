<template>
  <div class="giscus-wrapper" v-if="giscusConfig?.repo && giscusConfig?.repoId">
    <div :key="route.path" ref="commentContainer" class="giscus-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

interface GiscusConfig {
  repo: string
  repoId: string
  category?: string
  categoryId?: string
  mapping?: string
  strict?: string
  reactionsEnabled?: string
  emitMetadata?: string
  inputPosition?: string
  lang?: string
}

const { isDark, theme } = useData()
const route = useRoute()
const commentContainer = ref<HTMLElement | null>(null)

const giscusConfig = computed<GiscusConfig | undefined>(() => theme.value.giscus)

function getTheme() {
  return isDark.value ? 'transparent_dark' : 'light'
}

function loadGiscus() {
  const config = giscusConfig.value
  if (!commentContainer.value || !config?.repo || !config?.repoId) return
  commentContainer.value.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', config.repo)
  script.setAttribute('data-repo-id', config.repoId)
  if (config.category) script.setAttribute('data-category', config.category)
  if (config.categoryId) script.setAttribute('data-category-id', config.categoryId)
  script.setAttribute('data-mapping', config.mapping ?? 'pathname')
  script.setAttribute('data-strict', config.strict ?? '0')
  script.setAttribute('data-reactions-enabled', config.reactionsEnabled ?? '1')
  script.setAttribute('data-emit-metadata', config.emitMetadata ?? '0')
  script.setAttribute('data-input-position', config.inputPosition ?? 'bottom')
  script.setAttribute('data-theme', getTheme())
  script.setAttribute('data-lang', config.lang ?? 'ko')
  script.setAttribute('data-loading', 'lazy')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true

  commentContainer.value.appendChild(script)
}

function updateTheme() {
  const iframe = commentContainer.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (!iframe) return

  iframe.contentWindow?.postMessage(
    {
      giscus: {
        setConfig: {
          theme: getTheme()
        }
      }
    },
    'https://giscus.app'
  )
}

onMounted(() => {
  loadGiscus()
})

watch(() => route.path, () => {
  loadGiscus()
})

watch(isDark, () => {
  updateTheme()
})
</script>

<style scoped>
.giscus-wrapper {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.giscus-container {
  min-height: 200px;
}
</style>

