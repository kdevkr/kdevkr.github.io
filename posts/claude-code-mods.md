---
title: Claude Code Mods
date: 2026-10-21T07:00+09:00
description: Claude Code의 UI를 변경할 수 있는 모드에 대해서 알아봅니다.
tags:
  - Claude Code
  - Mod
  - 플러그인
---

# Claude Code Mods

Claude Code에 일부 UI를 변경할 수 있는 [모드(Mods)](https://code.claude.com/docs/ko/plugins/mods/overview) 기능이 추가되었다.

[긱뉴스에 소개](https://news.hada.io/topic?id=34796)되고 2주나 지났지만, 솔직히 아직까지는 딱히 유용해 보이는 모드가 눈에 띄지 않는다. 모드는 터미널과 클로드 데스크톱 앱에서 지원한다.

## Token Weather

공개된 샘플 모드들 중에서는 그나마 [Token Weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather) 정도가 써볼 만하다.

프롬프트 바로 위에 현재 컨텍스트 사용량과 최근 턴의 토큰 증감을 작은 차트와 날씨 아이콘으로 보여주어, 세션 정리나 압축 타이밍을 직관적으로 파악하기 좋다.

## You should know

Claude Code의 [내장 모드 목록](https://code.claude.com/docs/ko/plugins/mods/overview#mods-built-into-claude-code)을 보면 기본적으로 비활성화되어 있는 숨겨진 모드가 있다. 바로 `cc-plugin-you-should-know`다.

보조 에이전트가 백그라운드에서 대화 맥락을 읽다가 사용자가 놓쳤을 수 있는 중요한 내용을 발견하면 프롬프트 위에 짧은 알림을 띄워주는 기능이다. 필요하다면 프롬프트에서 직접 켜서 사용할 수 있다.

```bash
/plugin enable cc-plugin-you-should-know@builtin
```

## 나의 모드 만들기

본인만의 아이디어가 있다면 [대화창에서 Claude에게 모드를 만들어달라고 설명](https://code.claude.com/docs/ko/plugins/mods/create#ask-claude-for-a-mod)하면 된다.

이때 `cc-plugin-plugin-authoring`을 사용해서 모드를 만들기 위한 스킬을 설치한다. 먼저 세션에서 바로 동작할 수 있게 핫 리로드 방식으로 보여주며, 마음에 들면 플러그인 방식으로 설치할 수 있다.

나는 딱히 아이디어가 떠오르지 않아서 아무래도 사용하지 않을 것 같다.
