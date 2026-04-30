import { defineConfig, type UserConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar';
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from "@tailwindcss/vite";
import { mark } from '@mdit/plugin-mark';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

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
  vite: {
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
            },
        },
    },
    plugins: [
      tailwindcss(),
      groupIconVitePlugin(),
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
      { text: 'About', link: 'https://kdev.ing/about/' }
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
      ]
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2017-present Mambo'
    }
    
  },


  /** markdown-it + shiki */
  markdown: {
    config: (md) => {
      md.use(mark)
      md.use(groupIconMdPlugin)
    },
    languageAlias: {
      // 'q': 'plaintext'
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
    ['script', { async: '', src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9304279418886145', crossorigin: 'anonymous' }],
    ["script", { async: '', src: "https://www.googletagmanager.com/gtag/js?id=G-V8LF04VMBF" }],
    ["script", {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-V8LF04VMBF');"],
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

const vitePressSideBarOptions = {
  // sidebar options
  documentRootPath: '/',
  collapsed: true,
  rootGroupLink: '/',
  capitalizeFirst: true,

  scanStartPath: '/posts',
  resolvePath: '/posts',

  useTitleFromFrontmatter: true,
  sortMenusByFrontmatterDate: true,
  sortMenusOrderByDescending: true,

  excludeByGlobPattern: EXCLUDED_PATTERNS,
}

// https://vitepress.dev/reference/site-config
export default defineConfig(withSidebar(vitePressOptions, vitePressSideBarOptions));
