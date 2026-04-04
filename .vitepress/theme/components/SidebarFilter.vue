<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import { data as posts } from '../posts.data'

const route = useRoute()
const selectedYear = ref<number | null>(null)
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const years = computed(() => {
  const yearSet = new Set(posts.map(p => new Date(p.date.time).getFullYear()))
  return Array.from(yearSet).sort((a, b) => b - a)
})

const countByYear = computed(() => {
  const map = new Map<number, number>()
  posts.forEach(p => {
    const y = new Date(p.date.time).getFullYear()
    map.set(y, (map.get(y) ?? 0) + 1)
  })
  return map
})

const label = computed(() => selectedYear.value ? `${selectedYear.value}년` : '전체 연도')

function select(year: number | null) {
  selectedYear.value = year
  open.value = false
}

function onOutsideClick(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onOutsideClick))
onUnmounted(() => document.removeEventListener('click', onOutsideClick))

// --- 필터링 ---
const STYLE_ID = 'vp-sidebar-filter-style'

function applyFilter() {
  if (typeof document === 'undefined') return

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    document.head.appendChild(styleEl)
  }

  const year = selectedYear.value
  if (year === null) {
    styleEl.textContent = ''
    return
  }

  const toHide = posts.filter(p => new Date(p.date.time).getFullYear() !== year)
  const hideSelectors = toHide.flatMap(p => {
    const base = p.url.replace(/\/+$/, '')
    return [
      `.VPSidebarItem:has(> .item > a.link[href="${base}"])`,
      `.VPSidebarItem:has(> .item > a.link[href="${base}/"])`,
    ]
  })

  styleEl.textContent = [
    `.VPSidebarItem.collapsed > .items { display: block !important; }`,
    ...(hideSelectors.length
      ? [`${hideSelectors.join(', ')} { display: none !important; }`]
      : []),
  ].join('\n')
}

watch(selectedYear, () => nextTick(applyFilter))
watch(() => route.path, () => nextTick(applyFilter))
onMounted(() => nextTick(applyFilter))
</script>

<template>
  <div class="sf-root" ref="rootEl">
    <button class="sf-trigger" :class="{ active: selectedYear !== null }" @click="open = !open">
      <span>{{ label }}</span>
      <svg class="sf-chevron" :class="{ rotated: open }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Transition name="sf-drop">
      <ul v-if="open" class="sf-menu">
        <li>
          <button class="sf-option" :class="{ selected: selectedYear === null }" @click="select(null)">
            <span>전체 연도</span>
            <span class="sf-badge">{{ posts.length }}</span>
          </button>
        </li>
        <li v-for="year in years" :key="year">
          <button class="sf-option" :class="{ selected: selectedYear === year }" @click="select(year)">
            <span>{{ year }}년</span>
            <span class="sf-badge">{{ countByYear.get(year) ?? 0 }}</span>
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.sf-root {
  position: relative;
  padding: 10px 16px 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.sf-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  line-height: 1.6;
  transition: border-color 0.15s, color 0.15s;
  gap: 6px;
}

.sf-trigger:hover,
.sf-trigger.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.sf-chevron {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.sf-chevron.rotated {
  transform: rotate(180deg);
}

.sf-menu {
  position: absolute;
  top: calc(100% - 4px);
  left: 16px;
  right: 16px;
  z-index: 100;
  list-style: none;
  margin: 0;
  padding: 4px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dark .sf-menu {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.sf-option {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.sf-option:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.sf-option.selected {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.sf-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-3);
  line-height: 1.6;
}

.sf-option.selected .sf-badge {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

/* 드롭 애니메이션 */
.sf-drop-enter-active,
.sf-drop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.sf-drop-enter-from,
.sf-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
