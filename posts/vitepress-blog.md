---
title: VitePress 기반 블로그
date: 2025-10-01T23:00+09:00
tags:
- VitePress
- Blog
---

# VitePress 기반 블로그

Hexo 기반으로 구성해서 오랫동안 사용해오던 블로그를 ==VitePress 기반으로== 변경하게 되었습니다.

### Pretendard

VitePress는 [Inter](https://rsms.me/inter/)를 기본 폰트로 사용한다고해요. VitePress 공식 문서의 [다른 폰트 사용하기](https://vitepress.dev/ko/guide/extending-default-theme#using-different-fonts)를 참고하면 아래와 같이 ==vp-font-famaily== 로 시작하는 [CSS 변수](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)로 정의되어 있음을 볼 수 있어요. 그래서 프리텐다드 패키지를 추가해서 쉽게 설정할 수 있었어요.

::: code-group
```css [.vitepress/theme/font.css]
:root {
  --vp-font-family-base: "Pretendard Variable", "Pretendard" /* 일반 텍스트 폰트 */
  --vp-font-family-mono: 'Noto Sans Mono Variable' /* 코드 폰트 */
}
```

```sh [Windows Terminal]
pnpm add @fontsource/pretendard
pnpm add @fontsource-variable/noto-sans-mono
```
:::

### TailwindCSS 4

모던 프론트엔드 프로젝트에서는 TailwindCSS 를 추가해서 사용하는 것 같아요. VitePress 테마를 커스텀하는 경우에도 TailwindCSS 를 도입하면 프론트엔드 실무 역량을 키우는데 조금이나마 도움이 되지 않을까 생각합니다.

::: code-group
```sh [Windows Terminal]
pnpm add tailwindcss@4 @tailwindcss/postcss;
```

```css [.vitepress/theme/tailwind.css]
@import "tailwindcss";
```

```js [tailwind.config.js]
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./.vitepress/**/*.{js,ts,vue,html}", // Include VitePress config and theme files
    "./**/*.md", // Include all Markdown files
    "./**/*.vue", // Include any Vue components you might use
  ],
  theme: {
    extend: {},
  },
  plugins: ['@tailwindcss/postcss'],
}
```
:::

### 코드 블록 타이틀과 아이콘 표시

기존 블로그 구성에서 코드 블록에 타이틀이 표시되는 기능이 있었습니다. VitePress 는 기본적으로 제공하지 않는 기능인데 [Vite-PWA](https://vite-pwa-org.netlify.app/) 와 [Vitest](https://main.vitest.dev/) 사이트의 코드 블록을 보면 제목과 함께 아이콘이 표시되는 것을 볼 수 있는데요. 바로 [Vitepress Plugin Group Icons](https://vp.yuy1n.io/) 플러그인을 추가하면 똑같이 코드 블록에 타이틀과 함께 아이콘을 표시할 수 있습니다. 

```js [vite.config.js]
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
})
```

예를 들어, ==Windows Terminal== 에 대한 아이콘은 기본적으로 정의된 아이콘에 포함되어있지 않아요. 학습을 위한 개인 PC 에서는 윈도우 터미널을 사용하기 때문에 [Iconify](https://icon-sets.iconify.design/)에 있는 터미널 아이콘을 찾아서 추가하거나 아래처럼 Windows Terminal 에 대한 SVG 아이콘을 설정할 수 있었습니다.

```js [.vitepress/config.mts]
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'

const vitePressOptions = {
  vite: {
    plugins: [
      groupIconVitePlugin({
        customIcon: {
          'terminal': 'https://raw.githubusercontent.com/microsoft/terminal/refs/heads/main/res/terminal/Terminal.svg',
        }
      }),
    ],
  },

  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin)
    },
  },
}
```

### 끝마치며

기존 블로그 구성에서 업데이트 관리와 테마 커스터마이징의 어려움으로 VitePress 로 과감하게 변경했으나 VitePress를 사용함으로써 커스터마이징에 대한 확장성이 좋아진 건 아니라는 생각이 듭니다. 그리고 ==현재 글 제목과 댓글창이 사라진 부분==이 눈에 보입니다. 앞으로 하나 둘씩 복구해나가야 할텐데 전체적으로 어떤 기능이 사라졌는지는 기억나지 않아요. 😁