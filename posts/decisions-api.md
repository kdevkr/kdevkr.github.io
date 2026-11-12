---
title: Decisions API
date: 2026-11-12T21:00+09:00
description: OpenAI·Gemini의 빠른 의사결정 API가 실무에 필요한지 짚어봅니다.
tags:
  - Decisions API
  - OpenAI
  - Gemini
  - Jev
---

# {{ $frontmatter.title }}

[TypeSafe AI](https://typesafe.ai)가 공개한 [Jev](https://news.hada.io/topic?id=33751)는 문장을 길게 생성하는 대신 정해진 선택지 중 답과 확률만 빠르게 돌려주는 모델이다. 이제는 Jev뿐만 아니라 OpenAI와 Google도 자체적인 빠른 의사결정을 위한 **Decisions API** 를 제공한다.

## OpenAI 와 Gemini

- **OpenAI** — `gpt-6-luna` 기반의 [Decisions API](https://developers.openai.com/api/docs/guides/decisions) 정식 출시(GA) (2026.10.22)
- **Gemini** — `gemini-decision-1` 기반의 [Gemini Decisions API](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/) 공개 (2026.11.11)

| 구분 | TypeSafe AI (Jev) | OpenAI Decisions API | Gemini Decisions API |
| :--- | :--- | :--- | :--- |
| **기반 모델** | `jev-1.14.0` | `gpt-6-luna` | `gemini-decision-1` |
| **입력 형식** | 텍스트, 이미지(실험) | 텍스트, 이미지(base64) | 텍스트, 이미지, 오디오, 영상, PDF |
| **질문 유형** | `noul`, `choice`, `box` 등 | `predicate`, `choice`, `score` | `noul`, `choice`, `score` |
| **과금 방식** | 요청·토큰 기반 | 입력 100만 토큰당 0.10달러 | 입력 100만 토큰당 0.10달러 |

## 웹 서비스에서 필요한가?

==일반적인 웹 서비스 기능으로 꼭 필요한지는 의문== 이다. 고객 문의 분류나 우선순위 채점처럼 단순 판단만 필요한 경우는 드물고, 결국 요약·추출을 위해 Structured Outputs로 생성 모델을 다시 부르게 된다. 차라리 `PreToolUse` 검사나 [AI 문체 판별](/posts/codex-review) 같은 **AI 에이전트 훅의 가드레일 용도** 로 Jev를 아직 잘 쓰고 있다.

하지만 OpenAI와 Gemini 모두 구독 플랜으로는 API를 지원하지 않아 별도 키 발급과 과금이 필요하므로, 이것마저도 별로라 따로 도입해 보진 않을 것 같다.
