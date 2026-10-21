---
title: 클로드 모션
date: 2026-10-22T06:00+09:00
description: 팀 계정에 있는 클로드 모션(베타)를 사용해보았어요
tags:
    - AI
    - Claude
    - 클로드 모션
    - 영상 제작
---

# 클로드 모션

회사에서 공유받은 팀 플랜 계정에서 아티팩트의 [클로드 모션(Claude Motion)](https://claude.com/ko/features/artifacts) 기능을 베타로 지원하는 걸 보았다. 최근 유튜브 영상에서도 AI 도구 트렌드를 모션 그래픽으로 소개하는 경우가 많아졌는데, 마침 회사 제품에 새로운 기능이 추가되어 이를 소개하는 모션 영상을 직접 만들어 보았다.

서비스에 로그인한 뒤 메뉴명만 전달하니 AI 에이전트가 화면을 살펴보고 알아서 모션 그래픽을 만들어 주었다. 아티팩트로 만들어진 모션을 확인하고 MP4나 GIF로 바로 추출할 수 있었다.

## 음성 나레이션 추가

아쉬운 점은 클로드 모션이 ==음성 나레이션을 지원하지 않는다== 는 것이다. 모션 그래픽과 배경음악(또는 효과음)만으로는 허전해서, 유튜브 영상처럼 음성 설명이 나오도록 [AWS Polly](https://aws.amazon.com/ko/polly/)로 나레이션 음성을 따로 만들었다.

클로드 모션에서 추출한 MP4 영상과 AWS Polly로 만든 음성 파일을 합치는 작업도 에이전트에게 맡겼다. 복잡한 [FFmpeg](https://ffmpeg.org/) 명령어를 다룰 줄 몰라도 영상과 음성을 합쳐달라고 요청하니 알아서 옵션을 조합해 적절하게 싱크를 맞춘 영상을 보여줬다.

::: info 어색하고 아쉬운 결과물
일하다가 재미 삼아 만들어봤는데 실제 상업적으로 활용하기엔 어려워요.

완성된 영상을 구글 스페이스 채널에 공유하니 동료들이 "별걸 다 만드는 남자"라고 했어요.
:::

## 클로드 모션이 없어도

팀 플랜의 클로드 모션이 없어도 아쉬워할 필요는 없다. 개인 계정이나 Codex 같은 환경에서도 에이전트에게 요청하면 [HyperFrames](https://hyperframes.dev/)(또는 [Remotion](https://www.remotion.dev/))와 TTS 모델을 사용해 **더빙이 들어간 모션 그래픽** 을 알아서 만들어 준다.

실제로 유튜브에 올라오는 영상들도 클로드 모션이 아니라 코드로 모션 그래픽을 렌더링하고, [ElevenLabs](https://elevenlabs.io/)나 [VoiceStudio](https://github.com/debpalash/voicestudio)([CosyVoice](https://github.com/QwenAudio/CosyVoice)) 같은 도구로 자연스러운 더빙 음성을 입혀 더 나은 품질로 만드는 것 같다.

## 여전히 전문 인력이 필요한 이유

AI로 영상과 음성을 만든다고 하면 한 번에 마법처럼 완성될 것 같지만, 막상 해보면 결코 **'딸깍'** 으로 끝나지 않는다. 결과물을 보면 사소하게 어색한 부분들이 눈에 밟히는데, 정작 ==어떻게 지적해서 고쳐달라고 해야 할지== 잘 떠오르지 않았다. 제대로 된 영상으로 완성하려면 다듬는 과정에 시간을 많이 쏟거나, 결국 **마케팅이나 영상 디자이너 같은 전문 인력** 이 필요할 수밖에 없겠다는 생각이 든다.

## 참고 자료

- [Claude 아티팩트](https://claude.com/ko/features/artifacts)
- [VoiceStudio](https://github.com/debpalash/voicestudio)
- [FFmpeg](https://ffmpeg.org/)
- [HyperFrames](https://hyperframes.dev/)
