---
title: RTK 가 내 글로벌 지침을 없애버렸다
date: 2026-06-27T10:55+09:00
description: RTK 도입 후 글로벌 지침(GEMINI.md) 덮어쓰기와 파일 삭제로 겪은 AX 경험 훼손을 공유합니다.
tags:
    - RTK
    - Gemini
    - AX
---

# RTK 가 내 글로벌 지침을 없애버렸다

긱뉴스(GeekNews)에 공유된 [RTK - Rust Token Killer](https://news.hada.io/topic?id=28245) 글을 보고 흥미가 생겨 설치해 보았습니다. 토큰 소모를 줄여 개발 비용을 아껴준다는 기대감을 안고 rtk를 써오던 중, 생각보다 명령어가 실패해서 AI 에이전트가 재시도하는 경우가 ==상당히 많았어요== . 오히려 생산성이 저하되는 느낌을 받아 결국 도입을 철회하고 삭제하기로 결심했습니다.

하지만 삭제 명령어를 실행한 결과는 끔찍했습니다. rtk가 클로드 코드(Claude Code)에 대해서는 나름대로 정상적인 훅 정리와 지원을 제공하는 듯 보였으나, 안티그래비티(Antigravity)를 사용하며 Gemini CLI 환경을 활용하고 있던 저에게는 생각보다 훨씬 심각한 파멸적 상황을 초래했습니다. 클로드와 다르게 제미나이에 대한 글로벌 설정은 **`GEMINI.md`** 파일의 내용을 ==완전히 대체== 하고, 삭제 시 아예 ==파일 자체를 지워버리는== 참사가 일어났습니다.

## rtk 를 설치한 이유

제가 굳이 [rtk](https://www.rtk-ai.app/)를 설치하게 된 원인은 안티그래비티 2.0(Antigravity 2.0)으로 업그레이드되고 **Gemini 3.5 Flash** 모델을 제공하기 시작하면서부터 토큰 사용량이 많아져 빨리 제한되었기 때문이에요. 그래서 명령어 결과를 압축하여 입력 토큰을 줄인다는 막연한 기대감으로 설치해보기로 했어요.

```powershell [Windows Terminal]
❯ rtk init -g --gemini
[rtk] /!\ No hook installed — run `rtk init -g` for automatic token savings

Gemini CLI hook installed (global).

  Hook: C:\Users\Mambo\.gemini\hooks\rtk-hook-gemini.sh
  GEMINI.md: C:\Users\Mambo\.gemini\GEMINI.md
  Restart Gemini CLI. Test with: git status
```

## 내 GEMINI.md 를 바꿔버렸는데요.

```powershell [Windows Terminal]
❯ cat C:\Users\Mambo\.gemini\GEMINI.md

# RTK - Rust Token Killer
...
Refer to CLAUDE.md for full command reference.
```

rtk 적용 후 에이전트의 답변 상태가 이상해서 확인해보니, 클로드 코드에 대한 설정과 다르게 `RTK.md` 가 참조되도록 만들어지지 않고 **`GEMINI.md`** 를 ==대체해 버렸어요== . 그리고 지침 내용에는 존재하지도 않는 `CLAUDE.md` 에 대한 참조도 들어 있었어요. 그래서 저는 클로드 코드 전역 설정 후 파일들을 직접 복사해 왔어요.

```powershell [Windows Terminal]
❯ rtk init -g
RTK hook registered (global).

  Command:   rtk hook claude
  RTK.md:    C:\Users\Mambo\.claude\RTK.md (10 lines)
  CLAUDE.md: @RTK.md reference added

cp C:\Users\Mambo\.claude\CLAUDE.md C:\Users\Mambo\.gemini\GEMINI.md
cp C:\Users\Mambo\.claude\RTK.md C:\Users\Mambo\.gemini\RTK.md
```

## 과감하게 GEMINI.md 를 없애버린다.

AI 에이전트가 rtk 명령어를 먼저 시도하지만, 생각보다 [명령어의 출력 결과를 오류로 인식해서](https://news.hada.io/topic?id=30660) 에이전트가 순수 명령어로 재시도하는 경우가 ==상당히 많아요== . 그래서 rtk 설정을 없애려고 삭제 명령어를 실행했어요.

```powershell [Windows Terminal]
❯ rtk init -g --uninstall --gemini
RTK uninstalled (Gemini):
  - Gemini hook: C:\Users\Mambo\.gemini\hooks\rtk-hook-gemini.sh
  - GEMINI.md: C:\Users\Mambo\.gemini\GEMINI.md
  - Gemini settings.json: removed RTK hook entry

Restart Gemini CLI to apply changes.
```

위 결과처럼 rtk는 삭제 과정에서 설치 시 직접 올바르게 복사해 둔 **`GEMINI.md`** 파일을 ==그냥 삭제해 버려요== . 이로 인해 제미나이(안티그래비티)에 대한 ==하네스 지침이 완전히 사라지는 거예요== . 만약 클로드 코드를 공통으로 사용하며 백업해 두지 않았다면 ==복구가 불가능하다는== 심각한 문제가 있어요.
