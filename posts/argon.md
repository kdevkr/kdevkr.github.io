---
title: Gemini 4 Argon
date: 2026-10-18T09:00+09:00
description: Gemini 4 Argon으로 글을 다듬어 보며 글쓰기 품질과 사용량을 고민했다.
tags:
    - Antigravity
    - 글쓰기
    - 사용량
---

# Gemini 4 Argon

> Gemini 4 Argon is now available to paid Pro plan subscribers.  
> As part of Pro, we've rolled out a separate weekly-only Argon quota on top of your existing Gemini quota for 3.8 Flash.
>
> (Antigravity IDE 안내 팝업)

2026년 9월 30일에 발표된 [Gemini 4 Argon](https://blog.google/intl/ko-kr/products/introducing-gemini-4-argon-kr/)이 10월 13일 정식 출시되었다.

[Antigravity](https://blog.google/intl/ko-kr/products/gemini-4-argon-in-google-antigravity-kr/)에서는 처음에 [Ultra 구독자에게만 제공](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-4-argon/)했지만, 10월 16일부터는 Pro 사용자도 Argon 모델을 선택해 쓸 수 있다.

::: warning Antigravity IDE 지원 여부는 아직 미지수예요
구독자 공지와 달리 Antigravity IDE에서도 선택지를 제공할지는 아직 알 수 없어요.

Antigravity [모델 페이지](https://antigravity.google/docs/models)에는 "Antigravity App, Antigravity CLI 및 IDE 확장 프로그램에서 사용할 수 있습니다"라고만 적혀 있어요.
:::

## 글쓰기 품질

구글은 Argon을 [가장 어려운 문제를 풀기 위한 모델](https://deepmind.google/models/gemini/)로 소개한다.

하지만 [유튜브 인터뷰 형식의 소개 영상](https://youtu.be/Jh6mgf9M06M?si=v9pU7CwwCD_MvoXt&t=340)을 보니 오히려 글쓰기 품질에 신경 쓴 부분이 눈에 띄었다. 사람이 글을 읽을 때 느끼는 피로감을 줄이고 부자연스러운 문체를 다듬는 데 꽤 공을 들였다고 한다. 평소 Antigravity에서 Gemini Flash 모델로 블로그 글을 다듬어 올리다 보니, 실제로 글쓰기 품질이 얼마나 자연스러워졌을지 궁금해졌다.

::: info Argon이 다듬은 글을 Claude에게 분석시켜 봤어요
이 글도 Argon에게 다듬어 달라고 맡겨 봤어요. Claude는 한국어가 자연스럽고 원문의 말투를 잘 지켰다고 평가했어요.

다만 문장은 매끄러워보이지만 앞뒤가 무엇을 가리키는지 분명하지 않은 표현이 있다고 지적해주네요.
:::

## 주간 사용량 한도

Argon 모델에는 주간 할당량이 따로 생겼다.

그런데 [일부 사용자들](https://arca.live/b/alpaca/185865307)은 이 한도가 너무 적다고 느끼는 것 같다. 구글이 새로운 Gemini 모델을 공개할 때마다 반복되는 반응이긴 하다. 나도 작성한 글을 분석하고 다듬어 달라고 요청해 봤는데 주간 사용량이 1% 차감되었다. 이 정도면 코딩 작업에는 빠듯하지만, 평일에 초안을 쓰고 주말에만 최종적으로 다듬어 게시하는 블로그 글에는 괜찮을 것 같다.

::: tip nobuzz 스킬에만 Argon 쓰기
회사에서는 Claude Code를 주로 쓰면서, 답변에 어색함이 있을 때는 Antigravity CLI로 문장을 다듬어 주는 [nobuzz](https://news.hada.io/topic?id=32767)를 활용하고 있어요. Argon은 기본 모델로 설정하기보다는 nobuzz 스킬을 실행할 때만 쓰도록 Claude Code 지침에 넣어두려고 해요.
:::

## 참고 자료

- [Gemini 4 Argon: our next era of frontier intelligence](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)
- [Gemini 4 Argon in Google Antigravity](https://antigravity.google/blog/gemini-4-argon-in-google-antigravity)
- [Choose a model | Google Antigravity Docs](https://antigravity.google/docs/models)
