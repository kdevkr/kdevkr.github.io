---
title: 브라우저 PDF 생성 시 텍스트 밀림 현상
date: 2026-02-19T12:00+09:00
description: jsPDF와 html2canvas로 PDF를 만들 때 Tailwind CSS Preflight 충돌로 텍스트 행간이 밀리는 현상의 원인과 해결 방법을 정리합니다.
tags:
- jspdf
- html2canvas
- tailwindcss
---

# 브라우저 PDF 생성 시 텍스트 밀림 현상

신규 프로젝트에 구현된 PDF 다운로드 기능에서 일부 텍스트가 밀리는 현상을 해결했어요. 

해당 기능은 `jspdf`와 함께 `html2canvas`를 사용해서 브라우저에서 만드는 방식인데 jspdf 와 함께 사용된 html2canvas 는 ==HTML 코드를 이미지로 변환해서 PDF에 추가하는 과정==을 수행해요. 이 과정에서 브라우저 렌더링 시에는 깔끔해보였던 텍스트들이 PDF로 변환되면서 ==텍스트의 행간(Line-Height)가 밀리는 현상==이 발생했어요.

## Tailwind CSS Preflight

Tailwind CSS 의 Preflight(CSS Reset + Normalize) 에는 이미지 태그에 대해 block 스타일을 적용하는게 포함되어있어요. 그래서 html2canvas 에서 이미지로 변환할 때 ==display 속성값이 충돌되는 문제==가 있어요.

## [html2canvas#2775](https://github.com/niklasvh/html2canvas/issues/2775#issuecomment-1204988157)

조직 내 시니어 개발자들이 해결하지 못하던 이 문제는 [Texts are shifted down #2775](https://github.com/niklasvh/html2canvas/issues/2775#issuecomment-1204988157) 이슈에서 카카오뱅크 개발자인 성현님이 제시한 코드로 해결할 수 있었어요. 해당 댓글에 따르면 위와 같이 TailwindCSS 에서 적용된 `Preflight` 를 오버라이드 하면 해결된다고 해요.

```scss
@tailwind base;
@layer base {
  img {
    @apply inline-block;
  }
}
@tailwind components;
@tailwind utilities;
```

해당 코드를 적용하고 PDF 렌더링 시 개별로 적용된 `Line-Height` 를 일부 제거하니 텍스트 밀림 현상이 해결되었네요. 위와 같이 특수한 케이스의 이슈들은 아직은 AI 에이전트로 해결하기 어려운 것 같습니다.