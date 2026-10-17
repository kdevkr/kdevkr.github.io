---
title: 텍스트 대신 아티팩트로 공유하자
date: 2026-10-17T23:00+09:00
description: 회사 동료에게 AI 에이전트의 답변을 쉽게 전달하기 위해 아티팩트 문서를 만들어 링크로 공유하는 방식
tags:
    - AI
    - Artifact
    - 공유하기
---

# 텍스트 대신 아티팩트로 공유하자

회사에서 GitHub 이슈나 Google Chat 스페이스 채널에 메시지를 남기고 나면 동료들이 이해하지 못해 되묻거나 자리로 직접 찾아오는 일이 많지 않은가? 나도 그런 상황을 자주 겪는다. 에이전트가 만들어낸 문장들은 내가 읽어도 바로 이해하기 어려울 때가 많다.

그래서 요즘은 에이전트에게 **"아티팩트로 만들어줘"** 라고 요청해 시각화된 문서나 이미지를 함께 공유한다. 상황과 분석 결과를 이미 검토했던 나조차 시각화된 화면을 보고 나면 추가로 짚어야 할 부분이나 애매한 점이 눈에 들어오기도 한다. 내가 먼저 확인하고 같이 볼 수 있는 링크를 넘기는 편이 텍스트만 전달하던 때보다 훨씬 낫다.

에이전트 도구마다 만들어내는 결과물과 공유하는 방식이 조금씩 다르다.

## Claude Code의 Claude 아티팩트

Claude Code에서 쓰는 [Claude 아티팩트](https://claude.com/ko/features/artifacts)는 대화창 옆에 전용 화면을 열어 결과물을 따로 보여준다. 문서와 다이어그램은 물론이고 React 컴포넌트나 HTML 대시보드도 그 자리에서 바로 실행해 볼 수 있다. 내용을 검토한 뒤 게시 버튼만 누르면 공유 링크가 만들어진다. 아티팩트 문서를 만들고 동료에게 공유하는 과정은 Claude가 가장 편리하다.

이 글도 Claude Code에게 아티팩트로 만들어 달라고 요청해 봤다.

![이 글을 Claude 아티팩트로 만든 화면](/images/posts/artifacts/001.png)

::: info 주로 Claude 아티팩트로 공유하는 이유
혼자 에이전트와 대화할 때는 긴 텍스트 답변도 그럭저럭 읽고 넘기지만 동료에게 공유할 때는 상대방이 읽기 편한지부터 챙기게 돼요. 그래서 동료들에게 작업 결과나 문서를 전달할 때는 접근 권한만 열어 바로 볼 수 있는 Claude 아티팩트를 주로 쓰고 있어요.
:::

## Codex의 ChatGPT Space

Codex에게 아티팩트 문서를 만들어 달라고 요청하면 먼저 로컬에 파일을 만든다. 이어서 외부에 공유하고 싶다고 말하면 [ChatGPT Space](https://chatgpt.com/ko-KR/features/space/)의 **Sites** 로 게시해 주고 공유할 수 있는 웹 링크를 바로 복사할 수 있게 제공한다.

다만 기본 결과물의 시각적인 완성도는 차이가 있다. Claude Code는 디자인 스킬이 기본 내장되어 있지만, Codex는 [web-artifacts-builder](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md) 같은 스킬을 따로 설치해 사용하게 된다.

이 글도 Codex에게 아티팩트로 만들어 달라고 요청해 봤다.

![이 글을 Codex 아티팩트로 만든 화면](/images/posts/artifacts/002.png)

::: info Codex로 아티팩트를 만들어보니
Codex에게 아티팩트 생성을 요청했을 때, 동료에게 바로 공유하기에는 시각화 품질이 아쉬워 여러 번 프롬프트를 고치며 대화를 이어가야 했어요.
:::

## Antigravity의 인터랙티브 생성형 UI

Google Antigravity는 외부 공유보다 로컬 검토에 초점이 맞춰져 있다. 마크다운 리포트 외에도 시각적인 조작 화면이 필요할 때는 [인터랙티브 생성형 UI(Generative UI)](https://news.hada.io/topic?id=32960) 기반의 HTML 아티팩트를 만든다.

아티팩트 문서를 만들어 달라고 요청하면 단일 HTML 파일을 생성해 앱 사이드 패널이나 채팅 안에서 슬라이더와 탭을 조작해 볼 수 있는 화면을 띄워준다. 아티팩트 뷰어의 Export Artifact 기능으로 독립 실행형 HTML 파일을 내보낼 수도 있다.

하지만 Claude 아티팩트나 ChatGPT Space처럼 웹 페이지로 바로 배포해 동료에게 전달할 수 있는 외부 웹 링크를 제공하지 않는다.

이 글도 Antigravity에게 아티팩트로 만들어 달라고 요청해 봤다.

![이 글을 Antigravity 아티팩트로 만든 화면](/images/posts/artifacts/003.png)

::: info Antigravity 아티팩트를 잘 활용하지 않는 이유
아티팩트 자체의 품질은 뛰어나지만, 웹 링크 없이 파일 자체를 전달해야 해서 동료에게 공유하기가 너무 불편해요. 그래서 실제 협업에서는 거의 활용하지 않고 있어요.
:::

## 참고 자료

- [Claude 아티팩트](https://claude.com/ko/features/artifacts)
- [ChatGPT Space](https://chatgpt.com/ko-KR/features/space/)
- [Antigravity를 활용한 시각화](https://antigravity.google/blog/visualizing-with-the-help-of-antigravity)

