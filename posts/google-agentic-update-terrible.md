---
title: 구글 에이전틱의 미래로 보는 업데이트 사용자 경험
date: 2026-05-21T23:03+09:00
description: Antigravity 2.0 전환으로 인한 업데이트 경험에 대해서 이야기합니다.
tags:
  - Antigravity
  - Update Experience
---

# 구글 에이전틱의 미래로 보는 업데이트 사용자 경험

2025년 9월 [카카오톡 대규모 업데이트](https://www.youtube.com/watch?v=4ih1n5yImT8)로 인해 많은 사용자들이 불편함을 토로했었습니다. 그리고 2026년 5월 20일 구글은 [Google I/O 2026](https://io.google/2026/)에서 Antigravity 를 포함한 대규모 업데이트와 함께 에이전틱에 대한 미래를 이야기했습니다. 하지만 구글이 말하는 희망적인 에이전틱 미래와 다르게 **Antigravity 를 사용하던 개발자들의 사용자 경험은 최악**이 되었습니다.

## Gemini 3.5 Flash in Antigravity

구글이 [Gemini 3.5 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/) 를 공개하면서 Antigravity 에서 제공하던 Gemini 2.5 Flash 를 없애버리고 [Gemini 3.5 Flash 로 대체](https://www.antigravity.google/blog/gemini-3-5-flash-in-google-antigravity)해버리면서 많은 개발자들이 혼란을 야기하고 있습니다. [Gemini 3.5 "Flash"는 사실 Pro의 리브랜딩이다](https://news.hada.io/topic?id=29707)는 의견처럼 실제로 나은 성능을 보여줄 순 있겠지만 토큰 사용량이 상대적으로 많이 소모될 수 밖에 없는 구조가 되었어요.

## Changes to Antigravity Plans

> **Shared Quota Across Gemini Models**  
> Until now, users have had separate rate limits for Gemini Flash and Gemini Pro models. **Now, we are combining these into a single rate limit**, drawn down as per API pricing, **allowing you to get more of whichever model you prefer.** So, for example, if Gemini Flash is 8x cheaper than Gemini Pro as per API pricing, you will be able to use X tokens on Gemini Pro, 8X tokens on Gemini Flash (provided the same ratio of input, output, and cache read tokens), or any linear combination in between. Previously, we essentially forced a particular linear combination by setting independent rate limits, but now it is one shared pool.   
> Google has made the decision to simplify subscriptions by removing AI credits as part of the base Google AI plans. Accordingly, we have adjusted the base plan entitlements upwards for Gemini models on Antigravity. 

구글이 [새로운 Google AI Ultra 티어](https://blog.google/intl/ko-kr/company-news/technology/google-ai-subscriptions-kr/)를 소개하면서 [제미나이 모델 간 사용량 공유](https://antigravity.google/blog/changes-to-antigravity-plans)한다는 소식을 공지하면서 모델을 더 사용해보라고 제공하던 월 AI 크레딧도 없애버렸습니다. 문제는 [Gemini 3.5 Flash의 가격](https://ai.google.dev/gemini-api/docs/pricing?hl=ko#gemini-3.5-flash)이 Pro 대비 그리 싸진 않다는 겁니다.
 그리고 오늘 주간 사용량 제한을 경험하는 사용자가 많아서인지 ==사용량 한도를 초기화했다==는 팝업이 표시되었습니다.

![Gemini 쿼터 증가 알림](/images/posts/google-agentic-update-terrible/003.png)

## Introducing Google Antigravity 2.0

대표적인 개발자 경험은 [Antigravity 2.0](https://antigravity.google/blog/introducing-google-antigravity-2-0)으로 자동으로 ==업그레이드==되면서 발생했습니다. `Restart to Update` 버튼으로 기존 VSCode 기반의 Antigravity 를 Antigravity IDE 가 아닌 독립 데스크톱 애플리케이션으로 강제 전환해버렸습니다. 구글은 제품 업데이트 과정에서 다음을 고려하지 않았어요.

- Antigravity 2.0 전환에 대한 사전 고지가 없었음
- Antigravtiy IDE 로 유지하는 선택지를 제공하지 않음
- Antigravity 업그레이드 시 발생하는 문제점을 해결하는 방안을 공식적으로 안내하지 않음

[AGY 2.0 Bug Fixes](https://antigravity.google/changelog)로 구글이 Antigravity 2.0 을 출시하자마자 급하게 패치를 진행했지만 이미 많은 개발자들은 잘못된 업데이트로 개발 환경을 잃어버렸죠. 제가 본것은 워크스페이스에서 진행한 대화마다 개별 프로젝트로 만들어졌고 이를 정리하려면 하나씩 삭제해야했어요. 결국은 Antigravity 2.0 업데이트로 인한 문제를 해결하는 방법을 공식적으로 안내하지 않았고 [Google AI 개발자 포럼](https://discuss.ai.google.dev/c/antigravity/64) 을 통해 개발자들 스스로 방법을 찾아 공유했습니다.

## The Antigravity IDE

> Although Antigravity 2.0 is the future, we won’t disrupt your workflows right away. **For now, both the Antigravity IDE application itself and the Agent Manager in the Antigravity IDE will remain available.** In an upcoming release, we will remove the Agent Manager from the Antigravity IDE, turning the IDE into a purely agent-powered IDE.

당분간 Antigravity IDE 를 유지할 계획이었다면 Antigravity 2.0 데스크톱 앱으로의 전환을 강제하면 안되었어요. 업데이트 시 Antigravity 2.0 전환을 권장한다는 팝업만 띄웠어도 이런 혼란은 막을 수 있었을 겁니다.

## 나는 무엇을 경험했는가?

![업데이트가 없는데도 Restart to Update가 표시되는 Antigravity IDE](/images/posts/google-agentic-update-terrible/001.png)

사무실에 도착해서 `Restart Update` 버튼을 누르자마자 Antigravity 2.0 의 새로운 로딩창이 보였고 Antigravity 2.0 전환으로 인해 인증을 다시 해야했습니다. 프로젝트 파일을 함께 볼 수 있는 화면은 없었고 하나의 워크스페이스 ==대화마다 개별 프로젝트로 만들어져서 프로젝트를 하나씩 지워야== 한다는 걸 알았어요.

_(긴급 패치로 해결된 문제이지만 이미 돌이킬 수 없는...)_

이리저리 시도해서 기존 릴리즈 버전으로 복구하고나서 Antigravity 2.0 을 별도로 설치한 후 대화를 시도했는데 응답 결과가 길어져서 스크롤 하면 결과가 아예 사라지고 안보이는 증상을 경험했었습니다. 이 증상은 [AGY 2.0 Bug Fixes](https://antigravity.google/changelog)로 같이 해결이 된 것 같습니다. 그리고 Antigravity IDE 설치 시 기존 설정을 가져올 수 없었습니다.

더구나, 최신버전을 설치한 Antigravity IDE 에서 **업데이트가 없는데도 불구하고 Restart to Update 가** 지금도 표시되며 누르면 다음과 같이 업데이트가 실패합니다.

![Antigravity IDE 업데이트 설치 실패 오류](/images/posts/google-agentic-update-terrible/002.png)

## 제품 안정화에 대하여

현재 작은 조직이 아닌 구글에서 조차도 **제품 릴리즈 시 충분한 테스트가 이루어지지 않았음**을 보고 놀랬습니다. 구글이 에이전틱 미래를 그리는 것과 별개로 Antigravity 팀은 안정화된 제품을 제공하는걸 목표로 하는게 급해보입니다. 실무에서 개발하고 있는 서비스에서도 ==쉽게 바꾸고 있는 조직의 결정도 구글과 별반 다르지 않다==는 생각을 하게 됩니다. 결국 우리도 똑같이 사용자에게 불편한 업데이트 경험을 제공하고 있지 않을까요?

감사합니다.