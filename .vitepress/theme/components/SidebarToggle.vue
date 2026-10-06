<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useLayout } from 'vitepress/theme'

const { hasSidebar } = useLayout()
const isCollapsed = ref(false)

function applyCollapsedState(collapsed: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('sidebar-collapsed', collapsed)
}

function toggle(e?: Event) {
  if (e) {
    e.stopPropagation()
    e.preventDefault()
  }
  isCollapsed.value = !isCollapsed.value
  if (typeof window !== 'undefined') {
    localStorage.setItem('vp-sidebar-collapsed', String(isCollapsed.value))
  }
  applyCollapsedState(isCollapsed.value)
}

function handleKeydown(e: KeyboardEvent) {
  // Ctrl + [ 또는 Cmd + [ 로 사이드바 토글
  if ((e.ctrlKey || e.metaKey) && e.key === '[') {
    e.preventDefault()
    toggle()
  }
}

onMounted(() => {
  const saved = localStorage.getItem('vp-sidebar-collapsed')
  if (saved === 'true') {
    isCollapsed.value = true
    if (hasSidebar.value) {
      applyCollapsedState(true)
    }
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})

// 페이지 이동 시 사이드바 없는 페이지에서는 접힘 클래스 해제, 사이드바가 있으면 저장된 상태 복원
watch(hasSidebar, (visible) => {
  if (!visible) {
    applyCollapsedState(false)
  } else if (isCollapsed.value) {
    applyCollapsedState(true)
  }
})
</script>

<template>
  <button
    v-if="hasSidebar"
    type="button"
    class="sidebar-toggle-btn"
    :class="{ 'is-collapsed': isCollapsed }"
    :title="isCollapsed ? '사이드바 펼치기 (Ctrl+[)' : '사이드바 접기 (Ctrl+[)'"
    :aria-label="isCollapsed ? '사이드바 펼치기' : '사이드바 접기'"
    @click.stop.prevent="toggle"
    @mousedown.stop.prevent
    @pointerdown.stop.prevent
    @keydown.enter.stop.prevent="toggle"
    @keydown.space.stop.prevent="toggle"
  >
    <!-- 패널 아이콘 (좌측 사이드바 표시) -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="sidebar-toggle-icon"
    >
      <!-- 외곽 창 -->
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <!-- 사이드바 구분선 -->
      <line x1="9" y1="3" x2="9" y2="21" />
      <!-- 접힘/펼침 화살표 인디케이터 -->
      <path v-if="!isCollapsed" d="m16 9-3 3 3 3" />
      <path v-else d="m13 9 3 3-3 3" />
    </svg>
  </button>
</template>

<style scoped>
.sidebar-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  margin-left: 8px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-toggle-icon {
  pointer-events: none;
}

.sidebar-toggle-btn:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-default-soft);
}

.sidebar-toggle-btn.is-collapsed {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-soft);
}

/* 960px 미만 모바일 화면에서는 VitePress 기본 햄버거 메뉴를 사용하므로 숨김 */
@media (max-width: 959px) {
  .sidebar-toggle-btn {
    display: none !important;
  }
}
</style>
