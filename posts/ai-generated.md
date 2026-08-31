---
title: 이 메시지는 AI 가 만들었어요.
date: 2026-09-01T07:00+09:00
description: 클로드스러운 문체에 대해서 생각해봅니다.
tags:
    - AI
    - 글쓰기
    - 문체
---

# 이 메시지는 AI 가 만들었어요.

얼마전에 GeekNews에 공유된 [나는 AI가 쓴 글을 자동으로 무시하기 시작했다](https://news.hada.io/topic?id=32760)라는 걸 회사에 공유했어요. 개편된 회사 홈페이지가 AI 가 만들어내는 티가 나는 그대로 였기 때문에 잠재 고객들에게도 이러한 인식으로 받아들이지 않을까 하는 마음에요.

## AI Slop 을 줄이기 위한 노력들...

- [AI 글쓰기에서 피해야 할 상투적 패턴 모음](https://news.hada.io/topic?id=27321)
- [단순히 X가 아니라, Y다](https://news.hada.io/topic?id=30090)
- [아직도 커밋 메시지를 직접 작성하는 이유](https://news.hada.io/topic?id=32689)
- [AI가 쓴 티나는 문장, 패턴으로 잡아서 고쳐주는 도구를 만들었습니다](https://news.hada.io/topic?id=30099)
- [fluent-korean - Claude Code가 명료한 한국어로 답하게 만드는 Output Style](https://news.hada.io/topic?id=32613)

GeekNews 사이트에 공유되는 위 포스트들이 공통적으로 말하는 건 ==클로드스럽다== 라는 건데요. 클로드 모델만의 문제는 아니지만 성능이 좋아질수록 클로드스러운 문체도 진해진다는 느낌을 애초에 영어를 사용하는 사람들이 더 느끼고 있다는 게 중요한 부분입니다.

AI 가 영어로 생각한 답변을 한국어로 번역해서 답변하기 때문에 영어권에서 느끼는 문제점에 번역투 문제가 더해져서 더 심해보인다는 거에요.

## AI Slop 문장 패턴

> 앤트로픽에서 [클로드가 워터마크를 남긴다](https://zdnet.co.kr/view/?no=20260818100220)와 같은 기술을 굳이 만들어야 할까요?

우리는 [stop-slop](https://github.com/hardikpandya/stop-slop), [no-ai-slop](https://github.com/petergyang/no-ai-slop), [humanizer](https://github.com/blader/humanizer) 저장소에서 말하는 AI Slop 처럼 느끼게 하는 문장에 대한 패턴이 정의되어있는 걸 볼 수 있어요. 특히나, Em Dash(—)는 일반적인 한국어 글에서는 보이지 않던 강조 방식이죠.

예를 들어, 저는 **"핵심은 여기에 있다, 조용히 삼키고 있었다, 첫 판 이다, ~로 못 박는다"** 라는 등의 표현을 자주 보고 있어요. 그리고 이러한 문장들이 포함되면 ==아! 이거는 AI 가 만든 메시지구나== 라는 것을 인지하게 됩니다.

## 클로드스러운 문체

[클로드 같은 문체](https://news.hada.io/topic?id=32970)의 빈도가 많아졌습니다. 심지어 [/debuzz](https://news.hada.io/topic?id=32767)와 같이 클로드 모델의 답변을 Antigravity CLI 로 평범한 영어 스타일로 바꾸는 스킬도 등장했어요. 결국 일상적인 대화보다는 학술 논문이나 기술 문서에서 나타나는 표현을 학습했다는 말이죠. 거기다가 한국어로 답변할 때에는 번역도 해야하니 번역투에 대한 문제가 더 들어가버리니까 머리가 아파지는거라고 해요.

> [앤트로픽 직원조차 사내에서 ELI5 스킬을 만들어 쓴다고 공유](https://github.com/anthropics/claude-plugins-community/tree/main/eli5) 했어요.

## 가드레일 훅의 한계

깃허브 이슈나 댓글 그리고 메시지를 전달하려고 할 때 가드레일 훅을 사용해서 내용이나 메시지를 구성하는 방식에서 Slop 형태가 최대한 포함되지 않도록 방어를 해봤는데요. 어느정도 효과가 있어보였으나 가끔은 여러번 개선을 시도해도 막혀버리니 저한테 ==이번에는 우회해서 등록할까요?== 라는 선택지를 물어보더라구요.

## 작업 참고 (에이전트용)

```md
<details><summary>작업 참고 (에이전트용)</summary>
...
</details>
```

깃허브 이슈나 댓글을 작성할 때 AI 에이전트가 참고하면 될 장황한 내용은 [Details 태그로 접어서](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections) 포함하도록 에이전트 규칙으로 추가해서 사용하고 있어요. 사람은 펼쳐서 볼 필요가 없고 에이전트는 이슈에 대한 내용을 전부 읽을 수 있으니 알아서 참조해요.

## Generated with...

> **🤖 Generated with Claude Code · Claude Fable 5**

결국은 완전히 해결이 안되는 문제라고 판단되어, 회사에서 저는 깃허브 이슈나 메시지를 보낼때 위와 같은 서명을 포함하고 있습니다.
