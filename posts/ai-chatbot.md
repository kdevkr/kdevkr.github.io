---
title: AI 챗봇?
date: 2026-08-21T09:00+09:00
description: 깃허브에 등록된 빈 이슈를 보고 AI 챗봇에 대한 요구사항을 추정해봅니다.
tags:
    - AI
    - Chatbot
    - Documentation
    - Issue
---

# AI 챗봇?

깃허브 이슈들을 정리하다가 아무도 신경쓰지 않고 내용이 비어있는 채로 남아있던 "AI 챗봇" 이라는 이슈를 발견했습니다. 그 이슈는 작년에 등록되었으나 지금까지 아무도 그것에 대해 물어보지 않기 때문에 저는 `계획 없음` 사유로 닫으려고 합니다.

하지만 이 이슈에 대해 개인적으로는 고민해보면 좋을 것 같습니다.

## AI 챗봇이 왜 필요한가?

이슈에 구체적인 설명은 없었지만, [LG전자 AI 어시스턴트](https://www.lge.co.kr/ai-commerce/aiAssistant)나 [삼성전자서비스 챗봇](https://www.samsungsvc.co.kr/chat)처럼 '원하는 건 무엇이든 물어보세요'라며 사용자가 서비스 이용 중 궁금한 점을 편하게 묻고 즉시 안내받는 일종의 ==대화형 서비스 매뉴얼== 을 떠올렸던 것 같습니다.

기존에 도움말이나 FAQ 화면으로 제공하던 정보를 자연어로 질문하고 쉽게 찾도록 돕는 기능이죠. 서비스 안에 고정된 도움말이나 FAQ 화면을 두는 방식도 있지만, 한국어 외에 영어와 일본어까지 번역해 제공하려면 화면 유지관리 비용이 많이 들어요.

반면에 AI 챗봇은 한국어 문서를 기반으로 작성해 두더라도 AI가 사용자의 언어(영어, 일본어 등)에 맞춰 자연스럽게 번역해 답변해 줄 수 있게 됩니다. 일부 Lite 모델에서 여러 언어를 섞어 응답하는 경우가 있긴 하지만 충분히 유용합니다.

## 먼저 사용자 매뉴얼부터 준비해야

AI 챗봇을 도입하더라도 가장 먼저 준비되어야 하는 것은 **사용자 매뉴얼 문서**입니다.

그런데, 이 프로젝트는 이슈가 등록된 시점부터 지금까지 제대로 된 사용자 매뉴얼은 작성된 게 없다는 게 중요합니다.

따라서, AI가 스스로 [`playwright-cli`](https://playwright.dev/agent-cli/introduction) 도구를 사용해서 서비스를 직접 살펴보고 사용자 흐름에 맞게 매뉴얼 초안을 만들어달라고 해야 합니다.

## 매뉴얼은 검색 증강 생성(RAG)에서 검색

![RAG 기반 AI 챗봇 서비스 흐름 구성도](/images/posts/ai-chatbot/001.svg)

사실 우리는 [Gen AI SDK](/posts/gemini-chatbot-function-calling-file-search) 포스트에서 Gemini API를 활용하면 RAG를 손쉽게 도입할 수 있다는 점을 알고 있습니다.

검색 증강 생성(RAG) 파이프라인 자체는 간단하게 구성할 수 있으므로, 서비스 매뉴얼 문서만 확실하게 준비해 두면 됩니다.

그다음에는 [Gemini API의 Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview?hl=ko)를 호출할 때 도구(`tools`) 목록에 `file_search`와 준비한 스토어 이름을 넘겨주면 끝이죠.

- [Gemini API — File Search](https://ai.google.dev/gemini-api/docs/file-search?hl=ko)
- [Gemini API — File Search Stores](https://ai.google.dev/api/file-search/file-search-stores?hl=ko)

## AI 챗봇은 정답만을 말하지 않는다.

=="AI Chat can make mistakes."==

우리가 AI를 사용할 때 하단에 흔히 배치되는 면책 문구입니다. 사용자는 생성형 AI가 항상 정답만을 말하지 않는다는 걸 알아도 이 답변이 진실이라고 가정하게 됩니다. 그런데 알고 보니, [AI 면책 문구로 보장되지 않는 사례](https://www.chosun.com/economy/tech_it/2026/08/03/I4VISSDQEJFM5DVVED2B2XFRJ4/)가 있습니다. 그러므로, 신뢰할 수 있는 공식 도움말과 FAQ 화면으로 빠르게 진입할 수 있도록 AI 챗봇에서 지원하는 게 좋습니다.

**사용자 매뉴얼에는 도움말 또는 FAQ 링크를 포함하세요.**
