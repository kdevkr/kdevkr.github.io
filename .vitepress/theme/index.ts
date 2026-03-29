// https://vitepress.dev/guide/custom-theme
import { h, nextTick } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PostDate from './components/PostDate.vue'
import 'virtual:group-icons.css'
import './tailwind.css'; // Import your Tailwind CSS file
import './style.css'
import './font.css'

function normalizePath(path: string) {
  return path.replace(/\/$/, '').replace(/\.html$/, '') || '/'
}

function updateActiveSidebarItem(href: string) {
  nextTick(() => {
    const currentPath = normalizePath(href)
    document.querySelector('.VPSidebarItem.is-active')?.classList.remove('is-active')
    for (const link of document.querySelectorAll<HTMLAnchorElement>('.VPSidebarItem a.VPLink')) {
      if (normalizePath(link.getAttribute('href') ?? '') === currentPath) {
        link.closest('.VPSidebarItem')?.classList.add('is-active')
        link.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        break
      }
    }
  })
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(PostDate)
    })
  },
  enhanceApp({ router }) {
    if (globalThis.window !== undefined) {
      router.onAfterRouteChange = updateActiveSidebarItem
    }
  }
} satisfies Theme
