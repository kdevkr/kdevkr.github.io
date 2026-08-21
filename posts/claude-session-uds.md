---
title: 클로드 세션 간 대화
date: 2026-08-21T09:00+09:00
description: 클로드 세션 간 Unix Domain Socket(UDS)을 활용한 로컬 프로세스 통신과 세션 탐색 방법을 알아봅니다.
tags:
    - Claude
    - Linux
    - macOS
    - IPC
---

# 클로드 세션 간 대화

"다른 세션과 대화해서 코드 충돌이 안 되도록 작업해줘"

이제 [클로드 세션끼리 대화하기 위해서](https://code.claude.com/docs/en/cross-session-messaging) ==유닉스 도메인 소켓== (Unix Domain Socket, UDS)을 사용합니다.

```sh
❯ claude -v
2.1.216 (Claude Code)

❯ claude update
Current version: 2.1.216
Checking for updates to latest version...
Updating to 2.1.233...
Successfully updated from 2.1.216 to version 2.1.233
```

**Claude Code v2.1.224** 이상 버전을 사용 중인지 확인하고, `claude update` 로 최신 버전으로 업데이트하면 됩니다.

## 클로드 세션 간 대화 도구

클로드 세션은 기본적으로 UUID 기반 이름을 부여받으며, 각 세션은 다음 도구를 호출해 서로 통신합니다.

다만 클로드 세션이 스스로 이름을 변경할 수는 없어서 사용자가 ==/rename== 명령어로 세션 이름을 직접 지정해야 합니다.

- **`ListAgents`** : 현재 실행 중인 다른 세션 검색
- **`SendMessage`** : 특정 이름을 가진 세션으로 메시지 전달

> 참고로 클로드 코드 확장 대화창에 보이는 것은 세션 이름이 아니라 **대화를 요약한 제목** 입니다.

## 세션끼리 대화하면서 얻게 되는 장점

기존에는 여러 세션에 이슈를 각각 할당해 수동으로 작업을 요청해야 했습니다. 이제는 세션끼리 메시지를 주고받을 수 있어 **역할을 나누어 협업** 할 수 있습니다. 예를 들어 이슈를 분석하고 작업을 분할하는 세션, 분할된 작업을 구현하는 세션, 작업 결과물을 브라우저로 검증하는 세션으로 나누어 진행할 수 있습니다.

따라서 ==복잡한 하네스 엔지니어링== 을 별도로 구축하지 않아도, 세션 간 대화만으로 여러 이슈를 동시에 안전하게 해결할 수 있습니다.
