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

## 마지막으로

[AGENTS.md](https://agents.md/)는 코딩 에이전트를 위한 README 를 제공하기 위한 목적으로 OpenAI에 의해 도입되었는데 사실 상 표준으로 자리잡히고 있는 것 같아요. 사실은 아직까지도 애플리케이션 개발을 위해 AI 도구를 적극적으로 활용해서 ==바이브코딩==이란 것을 해본적이 없습니다. 최근에는 [Google AI Stuido](https://aistudio.google.com/) 와 [Google Antigravity](https://antigravity.google/)라는 AI 에디터도 떠오르는 것 같습니다. 이러한 에이전틱 도구들을 제대로 활용하기 위해서 지침을 잘 작성해두어야 하는데 이것도 쉽지만은 않은 과정 같습니다.