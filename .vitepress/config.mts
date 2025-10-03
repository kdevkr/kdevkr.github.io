import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar';

import tailwindcss from "@tailwindcss/vite";
import mark from 'markdown-it-mark';

const vitePressOptions = {
  vite: {
    plugins: [tailwindcss()],
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
    },
    languageAlias: {
      // 'q': 'plaintext'
    }
  },

  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['archive/**'],

  head: [
    ['link', { rel: 'icon', href: '/favicon/favicon.ico' }],
    ['script', { async: true, src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9304279418886145', crossorigin: 'anonymous' }],
    ["script", { async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-V8LF04VMBF" }],
    ["script", {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-V8LF04VMBF');"],
  ]
}

const vitePressSideBarOptions = {
  // sidebar options
  documentRootPath: '/',
  collapsed: true,
  capitalizeFirst: true,

  scanStartPath: '/posts',
  resolvePath: '/posts',

  useTitleFromFrontmatter: true,
  sortMenusByFrontmatterDate: true,
  sortMenusOrderByDescending: true,

  excludeByGlobPattern: ['README.md', 'archive/**'],
}

// https://vitepress.dev/reference/site-config
export default defineConfig(withSidebar(vitePressOptions, vitePressSideBarOptions));
