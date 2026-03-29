// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PostDate from './components/PostDate.vue'
import 'virtual:group-icons.css'
import './tailwind.css'; // Import your Tailwind CSS file
import './style.css'
import './font.css'
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(PostDate)
    })
  },
  enhanceApp() {
  }
} satisfies Theme
