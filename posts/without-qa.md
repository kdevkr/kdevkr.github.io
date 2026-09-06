---
title: QA 없이 테스트하고 자동화하기
date: 2026-09-06T16:00+09:00
description: QA 가 없어진 조직에서 AI 를 활용한 테스트 자동화에 대해 고민합니다.
tags:
    - QA
    - AI 에이전트
    - 테스트 자동화
    - E2E 테스트
---

# QA 없이 테스트하고 자동화하기

AI로 인해 개발 생산성이 높아지고 있지만, 회사의 성장이 정체되고 규모가 축소되면서 QA 엔지니어 인력이 모두 사라졌습니다. 자연스럽게 =='프로덕트 엔지니어'==로의 전환과 성장을 고민하게 되었습니다.

이제는 제품 품질이나 테스트를 전문적으로 수행하는 인력이 없습니다. 그렇다 보니 개발자가 직접 제품에 대해 고민하고 주도적으로 품질을 개선해야 하는 상황을 마주하게 됩니다. 사실 회사의 요구와 관계없이 스스로 더 나은 제품을 만들려는 노력은 이전과 다름없습니다.

## QA 역할을 가진 AI가 해결할 수 있을까?

사업팀에서는 QA가 없으니 **"개발자가 알아서 해줘야죠"** 라고 쉽게 이야기합니다.

개발자로서 요구사항에 대한 기본적인 동작 검증은 늘 해왔습니다. 하지만 고객이 마주할 수 있는 예외 케이스나 잠재적인 결함을 꼼꼼히 찾아내는 데는 분명 한계가 있습니다. 테스트 과정 자체가 반복적이고 피로도가 높아, 개발자 스스로도 '완벽하게 검증했다'고 자신 있게 말하기는 어렵습니다.

AI에게 요구사항이 담긴 GitHub 이슈 링크를 전달하고 간단히 요청해 보기도 했습니다. 하지만 ==전문 QA 엔지니어가 AI를 활용할 때만큼의 깊이 있는 결과물은 나오지 않았습니다.== 맥락이 빠진 지극히 일반적인 케이스만 다루었기 때문입니다.

## 너는 QA 에이전트야

그나마 다행인 점은 과거 QA 엔지니어들이 남겨둔 테스트 관련 자산과 히스토리가 사내에 부분적으로 남아있다는 사실입니다. 이러한 정보들을 모아 AI에게 현재 요구사항의 배경과 맥락을 학습시킨다면, QA 엔지니어 못지않은 품질의 결과물을 얻을 수 있을지도 모릅니다.

최근 AI 에이전트는 눈부시게 발전하여 이제는 [스스로 브라우저를 실행하고 조작하면서](https://code.claude.com/docs/en/chrome) 다양한 테스트를 직접 수행할 수 있습니다. 여기에 [playwright-cli](https://github.com/microsoft/playwright-cli)나 [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) 같은 도구를 연동하면, 에이전트가 브라우저 환경을 훨씬 정밀하게 제어할 수 있습니다. 물론 도구가 갖춰져도 여전히 사람의 개입과 확인이 필요한 순간은 존재합니다.

### 에이전트별 브라우저 도구

- Antigravity: `chrome-devtools-mcp` 기본 내장 지원
- Claude Code: `playwright-cli` 또는 `agent-browser` 설치 후 활용

Claude Code 환경에서도 `chrome-devtools-mcp`를 구성한 뒤 [addyosmani/browser-testing-with-devtools](https://www.skills.sh/addyosmani/agent-skills/browser-testing-with-devtools) 스킬을 등록하면 MCP 도구를 적극적으로 활용하도록 유도할 수 있습니다. 여기에 [mattpocock/qa](https://www.skills.sh/mattpocock/skills/qa)나 [wshobson/e2e-testing-patterns](https://www.skills.sh/wshobson/agents/e2e-testing-patterns) 같은 전문 QA 스킬을 결합한다면 테스트 시나리오를 훨씬 탄탄하게 구축하는 데 큰 도움이 됩니다.

## 테스트 자동화

결국 저에게는 프로덕트 엔지니어 관점에서 =='AI를 활용한 테스트 자동화'==라는 미션이 주어졌습니다. 요구사항이 분석된 이슈를 토대로 AI 를 활용해 작업을 수행하고 **테스트 케이스**를 작성하며 E2E 테스트를 자동화하고 **테스트 결과서**를 만들어야 합니다.
