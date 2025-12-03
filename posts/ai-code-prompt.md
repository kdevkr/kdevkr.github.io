---
title: AI 코딩 에이전트를 위한 프롬프트 관리
date: 2025-11-30T12:00+09:00
tags:
- GEMINI.md
- CLAUD.md
- AGENTS.md
- .aiassitant
---

# AI 코딩 에이전트를 위한 프롬프트 관리

## Gemini CLI

```json [.gemini/settings.json]
{
  "contextFileName":["AGENTS.md", "GEMINI.md"]
}
```

저는 개인적으로 구독중인 유료 AI 가 별도로 없기 때문에 개인 구글 계정을 사용해서 무료 할당량을 제공해주는 Gemini CLI 을 이용할 수 있어요. Gemini CLI 는 기본적으로 GEMINI.md 파일을 바라보지만 [.gemini/settings.json](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/configuration.md#available-settings-in-settingsjson) 설정 파일에서 [AGENTS.md](https://developers.openai.com/codex/guides/agents-md) 파일을 참조하도록 변경할 수 있어요.

## Claude Code

```md [CLAUDE.md]
@AGENTS.md
```

Claude Code는 많은 개발자들이 선호하고 있는 코딩 에이전트로 알고 있지만 저는 활용하고 있지 않아요. Claude Code는 에이전트 지침을 위해 AGENTS.md 파일이 아닌 CLAUDE.md 를 바라보고 있어요. 그리고 Gemini CLI 와 같이 시스템 프롬프트를 위한 [설정](https://code.claude.com/docs/ko/settings)은 없습니다. 그러나 다행히도, [Feature Request: Support AGENTS.md 이슈](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3217884068)를 참고하면 ==CLAUDE.md 파일에서 AGENTS.md 파일을 참조==하도록 트릭을 이용할 수 있다는 걸 확인했어요.

## IntelliJ AI Assistant

```md [.aiassistant/rules/agents.md]
@AGENTS.md
```

회사에서는 IntelliJ AI Assistant 를 사용하고 있어요. IntelliJ AI Assistant 에서는 프로젝트를 위한 가이드라인으로 .aiassistant/rules 폴더 아래의 파일들을 규칙으로 참조하고 있어요. 도구 > AI Assistant > 규칙 메뉴에서 추가할 수 있는데 생성하는 파일에 AGENTS.md 를 적어두면 됩니다.

> Junie 코딩 에이전트는 [.junie/guidelines.md](https://blog.jetbrains.com/idea/2025/05/coding-guidelines-for-your-ai-agents/) 파일을 참조합니다.

## Google Antigravity

```md [.agent/rules/agents.md]
See `AGENTS.md` in project root directory
```

[Google Antigravity](https://antigravity.google/)는 구글에서 만들기 시작해서 개인 프리뷰 단계로 공개된 코딩 에이전트가 포함된 AI 에디터에요. 안티그래비티에서는 규칙(Rules)와 워크플로우(Workflow)로 프롬프트를 커스터마이징할 수 있게 지원해요. 다만, 아직은 파일 참조를 변경할 순 없나봐요. 

## 마지막으로

[AGENTS.md](https://agents.md/)는 코딩 에이전트를 위한 README 를 제공하기 위한 목적으로 OpenAI에 의해 도입되었는데 사실 상 표준으로 자리잡히고 있는 것 같아요. AI 코딩 에이전트 도구마다 참조하는 지침 파일들이 다르기 때문에 생각보다 복잡한 것 같이 느껴집니다.