---
title: E2E 테스트 자동화
date: 2026-10-25T16:00+09:00
description: 에이전트 기반 검증을 계기로 e2e 프레임워크와 의사 결정 모델을 살펴보며 사용자 흐름 중심의 테스트 자동화를 고민해본다.
tags:
  - E2E
  - 테스트
  - AI
  - Playwright
---

# {{ $frontmatter.title }}

얼마 전 긱뉴스에 올라온 [에이전트 기반 검증](https://news.hada.io/topic?id=35443) 글을 읽다가, 조직의 오래된 숙제인 E2E 테스트 자동화가 떠올랐다. 함께 일하던 QA 엔지니어가 퇴사한 뒤로는 다들 바쁘다는 이유로 기억에서 잊혀 있었다.

QA 엔지니어가 테스트 자동화를 어렵게 고민하던 당시와 비교하면, 지금은 [tester-army/e2e](https://github.com/tester-army/e2e)가 등장할 만큼 에이전트의 활용도가 높아졌다. 빠른 판단을 돕는 Jev 같은 의사 결정 모델도 함께 소개되었다.

글에서 이야기하듯 E2E 테스트는 당장 빠른 결과를 얻기 위함이 아니라, 실제 사용자 흐름을 기준으로 가치가 높은 테스트를 유지하는 데 목적이 있다. 과연 나는 테스트 자동화를 쉽게 도입해볼 수 있을까?

## e2e 기반의 테스트 흐름

[e2e](https://github.com/tester-army/e2e) 프레임워크를 중심으로 기능 검증부터 접근성 점검, 부하 테스트까지 하나의 흐름으로 엮을 수 있다.

![E2E 테스트 흐름](/images/posts/e2e-testing/001.svg)

- **기능 및 시나리오**: `e2e`가 자연어로 목표를 탐색하고, 내장된 [Playwright](https://playwright.dev/) 엔진이 로케이터를 조작하며 사용자 흐름을 검증한다.
- **웹 접근성 감사**: 브라우저 렌더링 과정에서 [axe-core](https://github.com/dequelabs/axe-core)를 연계해 a11y 표준 규격을 점검한다.
- **부하 및 성능 테스트**: 프레임워크가 직접 지원하지 않는 대규모 트래픽 부하는 [k6](https://k6.io/)로 보완한다.

## 무엇을 알아야 하나

`e2e`의 [핵심 개념](https://e2e.tester.army/docs/core-concepts)을 보면 목표 수행(Goals)과 상태 검증(Assertions)은 에이전트가 맡고, 요소 탐색(Locators)은 내장된 Playwright 엔진이 담당한다.

- **[모델 지원](https://e2e.tester.army/docs/subscriptions)**: ChatGPT는 구독 로그인을 지원하고, Claude와 Gemini는 API 키 방식으로 호출한다. 빠른 판단이 필요한 단계에는 OpenAI의 [Decisions API](https://openai.com/ko-KR/index/decisions-api/) 같은 [결정 모델](https://e2e.tester.army/docs/decision-models)을 연결해 쓸 수 있다.
- **[Explore](https://e2e.tester.army/docs/explore)**: 미리 작성된 테스트 코드가 없어도 자연어 목표만으로 에이전트가 화면을 둘러보며 초기 케이스 작성을 돕는다.
- **[MCP 서버](https://e2e.tester.army/docs/mcp-server)**: 코드만으로는 알 수 없는 동적 런타임 상태를 에이전트가 화면으로 직접 확인하고 판단한다.

## 에이전트 스킬

에이전트가 E2E 테스트와 함께 활용하기 좋은 스킬로 추천해 준 목록이다.

```bash [터미널]
# 에이전트 기반 E2E 테스트 실행 및 버그 탐색
npx skills add https://github.com/tester-army/e2e --skill e2e

# 웹 접근성(WCAG) 검증 및 품질 감사
npx skills add https://github.com/addyosmani/web-quality-skills --skill accessibility

# k6 부하 및 성능 테스트 스크립트 작성과 검증
npx skills add https://github.com/grafana/skills --skill k6

# 브라우저 인터랙션 및 Playwright 테스트 제어
npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli
```

## 참고 자료

- [AI 에이전트를 위한 Playwright E2E 테스트 하네스 구축하기](https://www.youtube.com/watch?v=wo0Rsh9hlTo)
- [에이전틱 테스팅: E2E 테스트 스택에서 에이전트의 역할](https://news.hada.io/topic?id=30744)
- [에이전트 기반 검증: AI가 쓴 코드를 스스로 검사하게 만들기](https://news.hada.io/topic?id=35443)
- [AI로 E2E 회귀 테스트 자동화하기: ‘딸깍’을 파이프라인으로 바꾸기까지](https://techblog.lycorp.co.jp/ko/ai-e2e-test-automation)
