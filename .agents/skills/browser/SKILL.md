---
name: browser
description: Automate browser tasks such as navigation, form filling, screenshots, extraction, login, and UI testing. Use agent-browser first and playwright-cli only when agent-browser is unavailable.
---

# Browser

브라우저 작업은 다음 순서로 실행합니다.

1. `agent-browser -V`로 설치 여부를 확인합니다.
2. 사용할 수 있으면 `agent-browser`를 작업 전체에 사용합니다.
3. 사용할 수 없으면 `playwright-cli -v`로 설치 여부를 확인하고 `playwright-cli`를 사용합니다.
4. 둘 다 없으면 작업을 중단하고 설치 방법을 안내합니다.

처음 사용하는 CLI의 명령어는 `--help`나 내장 문서로 확인합니다. 두 CLI의 명령어를 추측하거나 섞어 쓰지 않습니다.

## 개별 스킬

`agent-browser`를 사용할 때는 먼저 `agent-browser skills get core --full`을 읽습니다. 작업에 맞는 스킬은 `agent-browser skills list`로 확인한 뒤 `skills get <name>`으로 로드합니다.

- 일반 브라우저 작업: `core`
- 탐색적 테스트: `dogfood`
- Electron 앱: `electron`
- 내부 API 분석: `derive-client`
- Vercel Sandbox: `vercel-sandbox`
- AWS AgentCore: `agentcore`
- Slack 자동화: `slack`

`playwright-cli`를 사용할 때는 `playwright-cli install --skills`로 개별 스킬을 설치합니다. 설치된 스킬에서 필요한 작업 지침을 읽고, 명령어는 `playwright-cli --help`로 확인합니다. 주요 스킬 범위는 테스트 실행·디버깅, 요청 모킹, Playwright 코드 실행, 세션·인증 상태, 테스트 생성, 트레이싱, 동영상 녹화입니다.

## 작업 원칙

- 조작 전에 페이지 상태를 확인하고, 조작 후 결과를 다시 확인합니다.
- 가능한 경우 접근성 스냅샷·DOM·안정적인 요소 참조를 사용합니다.
- 좌표 클릭과 임의의 긴 대기는 피합니다.
- 요소를 찾지 못하면 최신 상태를 다시 확인한 뒤 한 번만 재시도합니다.
- 로그인 정보, 토큰, 쿠키 등 민감한 값을 출력하거나 저장하지 않습니다.
- 결제·삭제·메시지 전송 등 외부 상태 변경은 사용자 승인 없이 실행하지 않습니다.
- CAPTCHA, 권한 오류, 인증 만료는 우회하지 말고 사용자에게 알립니다.

결과를 보고할 때 사용한 CLI와 성공 여부를 간단히 명시합니다.



