---
title: 여러가지 AI 모델을 사용하려고 할 때
date: 2025-11-28T23:00+09:00
tags:
- GPT
- Claude
- Gemini
---

# 여러가지 AI 모델을 사용하려고 할 때

OpenAI, Claude, Gemini 에서 제공하는 API를 통해서 AI 분석 요청을 하는 코드를 보고 오래된 모델 이외에 최신 모델들을 추가해보고 있어요. 대부분 하위 호환성을 지원하지 않고 사용하고자 하는 모델마다 요청 시 전달해야하는 파라미터 옵션이 달라지기 때문에 사용할 수 없는 파라미터가 포함되는 요청은 오류가 발생할 수 있으므로 주의해야해요. 

## Model ID

모델 ID는 대부분 별칭으로 정의한 Stable 과 날짜를 포함한 Snapshot 버전이 있는데 제미나이의 경우에는 정식 버전과 프리뷰 버전으로 나누어져 있어요.

- gpt-5.1: [gpt-5.1-2025-11-13](https://platform.openai.com/docs/models/gpt-5.1)
- claude-opus-4-5: [claude-opus-4-5-20251101](https://platform.claude.com/docs/en/about-claude/models/overview#latest-models-comparison)
- [gemini-3-pro-preview](https://ai.google.dev/gemini-api/docs/models#gemini-3-pro)

그리고 Gemini API 는 Model ID를 `model` 파라미터가 아닌 [API URL에 포함](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash)하고 있어요.

## API Key

API 인증을 위한 키는 커스텀 헤더 또는 Authorization 헤더로 전달해야해요.

- OpenAI: `Authorization` Header (Bearer Token)
- Claude: `X-Api-Key` Header
- Gemini: `x-goog-api-key` Header

## System Instruction

시스템 안내사항을 전달하여 AI 모델의 역할이나 답변 스타일 등을 정의할 수 있어요. 다만, 이 시스템 안내사항을 전달할 수 있는 방법은 AI 마다 다릅니다.

- OpenAI : [Message roles and instruction following](https://platform.openai.com/docs/guides/prompt-engineering#message-roles-and-instruction-following)
- Claude : [Giving Claude a role with a system prompt](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/system-prompts)
- Gemini : [System instructions and other configurations](https://ai.google.dev/gemini-api/docs/text-generation#system-instructions)

시스템 프롬프트(지침)를 사용하면 전체 토큰 수가 늘어나지만 서비스에 맞는 AI 에이전트를 만들어서 제공할 수 있어요.

## temperature

> For Gemini 3, we strongly recommend keeping the temperature parameter at its default value of 1.0.

Gemini 3 모델들은 추론 능력이 기본적으로 최적화 되어있는 상태라 temperature 파라미터를 설정하는 것을 권장하지 않는다고 하니까 파라미터를 사용하지 않거나 1.0 으로 고정하는게 좋습니다.

## max_tokens → max_completion_tokens

OpenAI는 원래 [max_tokens](https://platform.openai.com/docs/api-reference/chat/create#chat_create-max_tokens) 파라미터를 사용해서 응답에서 생성할 수 있는 토큰의 최대 길이를 제한할 수 있었어요. max_tokens 파라미터는 Deprecated 되어있는 상태로 GPT-5 모델들을 사용하고자 하는경우 ==max_completion_tokens== 를 사용해야 오류가 발생하지 않아요.

- OpenAI: max_tokens or max_completion_tokens
- Claude: max_tokens
- Gemini: GenerationConfig.max_output_tokens

## Official SDK

회사 프로젝트에는 REST API 를 직접 사용하는 것으로 코드가 구현되어있는데 각 Claude, Gemini, OpenAI 에서 공식적으로 제공하는 SDK 를 사용하는 것이 좋아보여요.

- OpenAI: [openai/openai-java](https://github.com/openai/openai-java)
- Gemini: [googleapis/java-genai](https://github.com/googleapis/java-genai)
- Claude: [anthropics/anthropic-sdk-java](https://github.com/anthropics/anthropic-sdk-java)
