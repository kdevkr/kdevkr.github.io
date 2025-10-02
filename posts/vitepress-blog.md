---
title: VitePress 기반 블로그
date: 2025-10-01T23:00+09:00
tags:
- VitePress
- Blog
---

# VitePress 기반 블로그

Hexo 기반으로 구성했던 기존 블로그를 ==VitePress 기반으로== 변경하게 되었습니다. 업데이트 관리가 느리며 커스터마이징이 어려운 부분으로 인해 오랫동안 사용해왔던 기존 구성을 과감하게 버리는 선택을 했습니다. 새롭게 VitePress 를 사용하여 블로그를 구성하게 된 것으로 커스터마이징에 대한 확장성이 좋아지게 된 것은 아닙니다.

### Pretendard

VitePress는 기본 폰트로 [Inter](https://rsms.me/inter/)를 사용해요. VitePress 공식 문서의 [다른 폰트 사용하기](https://vitepress.dev/ko/guide/extending-default-theme#using-different-fonts)를 참고하면 아래와 같이 vp-font-famaily 로 시작하는 [CSS 변수](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)로 정의되어 있음을 볼 수 있어요. 그래서 프리텐다드 패키지를 추가해서 쉽게 설정할 수 있었어요.

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

최근 실무 프로젝트에서는 TailwindCSS 를 추가해서 사용하고 있어요. VitePress 테마를 커스텀하는 경우에도 TailwindCSS 를 도입하면 프론트엔드 실무 역량을 키우는데 조금은 도움이 되지 않을까 생각합니다.

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

### 끝마치며

VitePress 로 과감하게 변경했지만 현재 글 제목이 표시되지 않거나 댓글창이 사라져버린 점이 있어서 앞으로 하나씩 복구해가도록 해야합니다. 솔직하게 어떤 기능이 사라졌고 필요한지는 기억나지 않아요. 😁

