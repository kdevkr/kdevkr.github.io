import { defineConfig, type UserConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar';
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from "@tailwindcss/vite";
import { mark } from '@mdit/plugin-mark';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

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
      groupIconVitePlugin({
        customIcon: {
          'terminal': 'https://raw.githubusercontent.com/microsoft/terminal/refs/heads/main/res/terminal/Terminal.svg',
        }
      }),
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
  srcExclude: ['archive/**', '**/.agents/**', '**/.claude/**', 'CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md', 'README.md'],

  head: [
    ['link', { rel: 'icon', href: '/favicon/favicon.ico' }],
    ['script', { async: '', src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9304279418886145', crossorigin: 'anonymous' }],
    ["script", { async: '', src: "https://www.googletagmanager.com/gtag/js?id=G-V8LF04VMBF" }],
    ["script", {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-V8LF04VMBF');"],
  ]
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

  excludeByGlobPattern: ['README.md', 'CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md', 'archive/**', '**/.agents/**', '**/.claude/**'],
}

// https://vitepress.dev/reference/site-config
export default defineConfig(withSidebar(vitePressOptions, vitePressSideBarOptions));
