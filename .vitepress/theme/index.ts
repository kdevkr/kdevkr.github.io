// https://vitepress.dev/guide/custom-theme
import { h, nextTick } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PostDate from './components/PostDate.vue'
import SidebarFilter from './components/SidebarFilter.vue'
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
      'sidebar-nav-before': () => h(SidebarFilter),
      'doc-before': () => h(PostDate)
    })
  },
  enhanceApp({ router }) {
    if (globalThis.window !== undefined) {
      router.onAfterRouteChange = updateActiveSidebarItem

      // 서드파티 스크립트 (AdSense, Analytics) 지연 로딩
      const initThirdParty = () => {
        let initialized = false
        const events = ['mouseover', 'keydown', 'touchmove', 'touchstart', 'scroll']
        const loadScripts = () => {
          if (initialized) return
          initialized = true
          events.forEach(event => window.removeEventListener(event, loadScripts))

          // Google Analytics
          const gaScript = document.createElement('script')
          gaScript.async = true
          gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-V8LF04VMBF'
          document.head.appendChild(gaScript)

          const gaConfig = document.createElement('script')
          gaConfig.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V8LF04VMBF');
          `
          document.head.appendChild(gaConfig)

          // Google AdSense
          const adsScript = document.createElement('script')
          adsScript.async = true
          adsScript.crossOrigin = 'anonymous'
          adsScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9304279418886145'
          document.head.appendChild(adsScript)
        }
        events.forEach(event => {
          window.addEventListener(event, loadScripts, { passive: true, once: true })
        })
      }

      initThirdParty()
    }
  }
} satisfies Theme
