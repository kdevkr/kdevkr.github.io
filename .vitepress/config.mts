import { defineConfig } from 'vitepress'
import tailwindcss from "@tailwindcss/vite";
import mark from 'markdown-it-mark'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  title: "Mambo",
  description: "Today I Learned 🔥",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Posts', link: '/posts' },
      { text: 'About', link: 'https://kdev.ing/about/' }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kdevkr' }
    ],

  },

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
    ['script', { async: true, src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9304279418886145', crossorigin: 'anonymous' }]
  ]
})
