---
title: AGY IDE 의 내장 커밋 메시지 생성 문제
date: 2026-05-25T16:15+09:00
description: Antigravity IDE의 커밋 메시지 생성 한계와 에이전트를 통한 대안을 알아봅니다.
tags:
    - git
    - antigravity
    - commit-message
---

# AGY IDE 의 내장 커밋 메시지 생성 문제

현재 우리 조직은 커밋 메시지 컨벤션이 없지만, 다른 회사들은 일관된 히스토리 이력 관리를 위해서 [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) 규칙을 도입했을 거에요. 요즘엔 AI 에이전트를 사용해서 커밋 메시지를 직접 작성하는 경우는 드물 텐데요, AGY IDE에 있는 소스 제어 탭의 **Generate commit message [beta]** 버튼을 눌러보면 커밋 메시지는 만들어지지만 내가 원하는 형태로는 안 나오는 걸 경험할 수 있어요. 프로젝트 폴더에 `GEMINI.md` 파일이나 `.gemini` 또는 `.agents` 폴더에 규칙에 대한 설정들이 있는데도 불구하고, 실제로 만들어지는 커밋 메시지 형태는 전혀 바뀌지 않더라고요.

결론부터 말씀드리면, 알아본 결과 이 내장 기능을 통해 프로젝트 규칙에 맞는 커밋 메시지를 만드는 건 불가능했어요. 그러므로 현재로서는 에이전트에게 채팅으로 직접 요청할 수 있게 `commit` 워크플로우를 미리 만들어두는 것이 유일한 대안이에요. 이번 글에서는 소스 제어 UI 버튼에서 커스텀 규칙이 무시될 수밖에 없는 구조적인 원인이 무엇인지 가볍게 짚어보고, 유일한 해결책인 에이전트 워크플로우를 어떻게 작성하고 활용하는지 소개해 드릴게요.

## 프로젝트 규칙이 무시되는 이유

일반 VS Code 에디터로 프로젝트를 열어보면 `.vscode/settings.json` 설정을 통해 커밋 메시지에 대한 규칙을 지정할 수 있어요. 하지만 AGY IDE는 VS Code 기반임에도 그 설정이 동작하지 않고, 에디터 상에서 `Unknown Configuration Setting` 경고가 표시되더라고요. 왜 설정이 무시되는지 그 원인을 크게 두 가지로 정리해 봤어요.

1. **설정 네임스페이스 미지원**
   `github.copilot.chat.*` 설정은 GitHub Copilot Chat 확장의 전용 스펙이에요. Google DeepMind의 AI-native 플랫폼 설명([antigravity.google](https://antigravity.google))에서 볼 수 있듯이, AGY IDE는 내부적으로 Gemini 모델 제품군을 기반으로 구동돼요. 즉, Copilot 전용 설정을 해석하는 로직이 아예 없기 때문에 해당 설정을 입력해도 그냥 무시돼요.
2. **독립된 백그라운드 프로세스 동작 및 도구 격리**
   프로젝트 내의 `.gemini/settings.json` 파일은 [Gemini CLI 설정 문서](https://geminicli.com/docs/reference/configuration/)에서 규정하는 설정이에요. 이 설정이 무시된다는 것은 소스 제어 UI의 자동 생성 기능이 Gemini CLI의 설정 메커니즘을 따르지 않는다는 걸 의미해요. 최근 추가된 Antigravity CLI 기반으로 동작하는지는 확실하지 않지만, 소스 제어 UI 버튼은 대화형 에이전트 환경과 격리된 독립 프로세스로 실행되어 해당 프로젝트 내의 설정을 전혀 읽어오지 못해요.

## 해결 방법: 에이전트 워크플로우 활용하기

UI 버튼을 통해서 규칙을 강제하는 건 불가능하지만, 대안으로 AI 에이전트에게 직접 커밋을 요청하는 **워크플로우**를 구성해서 해결할 수 있어요. 우선 프로젝트 루트에 `.agents/workflows/commit.md` 파일을 생성하고 아래와 같이 에이전트가 준수해야 할 커밋 규칙을 명시해 주세요.

```markdown [.agents/workflows/commit.md]
# Commit Workflow

이 워크플로우는 변경 사항을 분석하고 적절한 Conventional Commits 기반의 한국어 커밋 메시지를 생성하여 Git 커밋을 진행합니다.

## 실행 단계

1. **변경 사항 분석**
   - 스테이징된 변경 사항을 확인합니다 (`git diff --staged`).
   - 만약 스테이징된 파일이 없다면 스테이징되지 않은 변경 사항을 확인합니다 (`git diff`).

2. **커밋 메시지 생성**
   - 아래 규칙을 준수하여 커밋 메시지를 자동 생성합니다.
     - **언어**: 반드시 한국어(한글)로 작성하십시오.
     - **형식**: Conventional Commits 명세에 따릅니다 (예: `feat: ...`, `fix: ...`).
     - **길이**: 제목(Subject line)은 50자 이내로 제한합니다.
     - **이모지**: 커밋 메시지에 이모지를 사용하지 마십시오.
     - **에이전트 정보**: 본문 하단에 에이전트 이름과 사용 모델 정보를 기재합니다.

3. **커밋 실행**
   - 생성한 커밋 메시지를 사용하여 커밋을 수행합니다.
```

## 조직에 커밋 컨벤션이 없는 경우

만약 조직 내에 자체적인 커밋 컨벤션 규칙이 마련되어 있지 않다면, 워크플로우를 직접 정의해서 관리하는 대신 이미 공개되어 널리 사용되는 아래의 스킬들을 바로 활용하는 것도 좋은 방법이에요.

- [git-commit](https://www.skills.sh/github/awesome-copilot/git-commit)
- [conventional-commit](https://www.skills.sh/github/awesome-copilot/conventional-commit)
- [caveman-commit](https://www.skills.sh/juliusbrussee/caveman/caveman-commit)
