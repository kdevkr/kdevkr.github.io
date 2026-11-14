import { defineConfig, type Plugin, type UserConfig } from 'vitepress'
import { withSidebar, generateSidebar } from 'vitepress-sidebar';
import { withPwa } from '@vite-pwa/vitepress';
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from "@tailwindcss/vite";
import { mark } from '@mdit/plugin-mark';
import footnote from 'markdown-it-footnote';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

const SITE_URL = 'https://kdev.ing'
const SITE_TITLE = 'Mambo Blog'
const SITE_DESCRIPTION = 'Today I Learned — 백엔드, 프론트엔드, 인프라 개발 노트'
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo/snorlax-111.jpg`

const EXCLUDED_PATTERNS = [
  'archive/**',
  '**/.agents/**',
  '**/.claude/**',
  'CLAUDE.md',
  'CLAUDE.local.md',
  'AGENTS.md',
  'README.md',
]

const vitePressOptions: UserConfig = {
  pwa: {
    outDir: '.vitepress/dist',
    registerType: 'autoUpdate',
    includeAssets: [
      'favicon/favicon.ico',
      'favicon/favicon-16x16.png',
      'favicon/favicon-32x32.png',
      'favicon/apple-touch-icon.png',
      'favicon/android-chrome-192x192.png',
      'favicon/android-chrome-512x512.png',
    ],
    manifest: {
      id: '/',
      name: SITE_TITLE,
      short_name: 'Mambo',
      description: SITE_DESCRIPTION,
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/favicon/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/favicon/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/favicon/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}']
    },
    experimental: {
      includeAllowlist: true
    }
  },

  vite: {
    server: {
      allowedHosts: ['.ts.net'],
    },
    plugins: [
      tailwindcss(),
      groupIconVitePlugin(),
      ViteImageOptimizer({
        png: { quality: 80 },
        jpeg: { quality: 80 },
        webp: { quality: 75 },
        avif: { quality: 70 },
      }),
      sidebarHmrPlugin(),
    ],
    resolve: {
      alias: [
        {
          find: /^.*\/VPDocFooter\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/DocFooter.vue', import.meta.url))
        }
      ]
    },
  },

  lang: 'ko-KR',
  title: "Mambo",
  description: "Today I Learned 🔥",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Posts', link: '/posts', activeMatch: '^/posts/' },
      { text: 'Sleep', link: '/sleep/', activeMatch: '^/sleep/' },
      { text: 'About', link: '/about' }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kdevkr' }
    ],

    search: {
      provider: 'local'
    },

    sidebar: {
      '/posts/': [
        {
          text: 'Posts',
          items: [
            { text: '전체 보기', link: '/posts' }
          ]
        }
      ],
      '/sleep/': [
        {
          text: 'Sleep',
          items: [
            { text: '전체 보기', link: '/sleep/' }
          ]
        }
      ]
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2017-present Mambo'
    },

    giscus: {
      repo: 'kdevkr/kdevkr.github.io',
      repoId: 'MDEwOlJlcG9zaXRvcnkxNTQxNjA4OTA=',
      category: 'Announcements',
      categoryId: 'DIC_kwDOCTBO-s4CYmQM',
      mapping: 'pathname',
      inputPosition: 'bottom',
      lang: 'ko'
    }
    
  },


  /** markdown-it + shiki */
  markdown: {
    config: (md) => {
      md.use(mark)
      md.use(footnote)
      md.use(groupIconMdPlugin)
    },
    languageAlias: {
    },
    image: {
      lazyLoading: true
    }
  },

  cleanUrls: true,
  lastUpdated: true,
  srcExclude: EXCLUDED_PATTERNS,

  sitemap: {
    hostname: SITE_URL,
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'description', content: SITE_DESCRIPTION }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_TITLE }],
    ['meta', { property: 'og:title', content: SITE_TITLE }],
    ['meta', { property: 'og:description', content: SITE_DESCRIPTION }],
    ['meta', { property: 'og:image', content: DEFAULT_OG_IMAGE }],
    ['meta', { property: 'og:url', content: SITE_URL }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: SITE_TITLE }],
    ['meta', { name: 'twitter:description', content: SITE_DESCRIPTION }],
    ['meta', { name: 'twitter:image', content: DEFAULT_OG_IMAGE }],
  ],

  transformHead({ pageData }) {
    const fm = pageData.frontmatter
    const isPost = pageData.relativePath.startsWith('posts/')
    if (!isPost && pageData.relativePath !== 'index.md') return []

    const title = fm.title ? `${fm.title} | ${SITE_TITLE}` : SITE_TITLE
    const description = fm.description || SITE_DESCRIPTION
    const resolveImage = (raw?: string) => {
      if (!raw) return DEFAULT_OG_IMAGE
      return raw.startsWith('http') ? raw : `${SITE_URL}${raw}`
    }
    const image = resolveImage(fm.image)
    const url = `${SITE_URL}/${pageData.relativePath.replace(/\.md$/, '').replace(/^index$/, '')}`
    const type = isPost ? 'article' : 'website'

    return [
      ['meta', { property: 'og:type', content: type }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: image }],
    ]
  },
}

function sidebarHmrPlugin(): Plugin {
  let siteConfig: any
  let lastSidebarJson = ''

  const normalizeFsPath = (filePath: string) =>
    filePath
      .replace(/\\/g, '/')
      .replace(/^[A-Z]:/, (drive) => drive.toLowerCase())
      .replace(/\/+$/, '')

  return {
    name: 'kdev:sidebar-hmr',
    apply: 'serve',
    configResolved(config) {
      siteConfig = (config as any).vitepress
      lastSidebarJson = JSON.stringify(siteConfig?.site?.themeConfig?.sidebar ?? {})
    },
    configureServer(server) {
      const rootDir = normalizeFsPath(siteConfig?.srcDir ?? process.cwd())

      const isTargetMarkdown = (file: string) => {
        const normalized = normalizeFsPath(file)
        if (!normalized.endsWith('.md')) return false
        return (
          normalized.startsWith(`${rootDir}/posts/`) ||
          normalized.startsWith(`${rootDir}/sleep/`)
        )
      }

      const updateSidebar = (file: string) => {
        if (!isTargetMarkdown(file)) return

        try {
          const newSidebar = generateSidebar(vitePressSideBarOptions)
          const nextSidebarJson = JSON.stringify(newSidebar)
          if (nextSidebarJson === lastSidebarJson) return

          lastSidebarJson = nextSidebarJson
          if (siteConfig?.site?.themeConfig) {
            siteConfig.site.themeConfig.sidebar = newSidebar
          }

          const clientModuleGraph =
            server.environments?.client?.moduleGraph ?? server.moduleGraph
          const siteDataMod = clientModuleGraph.getModuleById('/@siteData')
          if (siteDataMod) {
            clientModuleGraph.invalidateModule(siteDataMod)
          }

          server.ws.send({
            type: 'custom',
            event: 'vitepress:sidebar-update',
            data: newSidebar,
          })
        } catch (err) {
          server.config.logger.warn(
            `[kdev:sidebar-hmr] 사이드바 갱신 실패: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      }

      server.watcher.on('add', updateSidebar)
      server.watcher.on('change', updateSidebar)
      server.watcher.on('unlink', updateSidebar)
    },
  }
}

const vitePressSideBarOptions = [
  {
    // sidebar options for posts
    documentRootPath: '/',
    collapsed: true,
    capitalizeFirst: true,

    scanStartPath: 'posts',
    resolvePath: '/posts/',

    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterDate: true,
    sortMenusOrderByDescending: true,

    excludeByGlobPattern: EXCLUDED_PATTERNS,
  },
  {
    // sidebar options for sleep
    documentRootPath: '/',
    collapsed: true,
    capitalizeFirst: true,

    scanStartPath: 'sleep',
    resolvePath: '/sleep/',

    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterDate: true,
    sortMenusOrderByDescending: true,

    excludeByGlobPattern: [
      ...EXCLUDED_PATTERNS,
      'sleep/index.md',
      'index.md'
    ],
  }
]

// https://vitepress.dev/reference/site-config
export default withPwa(defineConfig(withSidebar(vitePressOptions, vitePressSideBarOptions)));

