---
title: GitHub Actions Node.js 20 지원 종료 대응
date: 2026-05-01T09:00+09:00
description: GitHub Actions 러너의 Node.js 20 지원이 2026-06-02부터 강제 종료됩니다. 블로그 워크플로우의 액션과 런타임을 정비하며 알게 된 점들을 정리합니다.
tags:
    - GitHub Actions
    - CI/CD
    - Node.js
---

# GitHub Actions Node.js 20 지원 종료 대응

최근 블로그 배포 워크플로우에서 ==빌드 실패가 발생==해 GitHub Actions 실행 페이지를 들여다보다가 다음과 같은 ==애너테이션==을 발견했어요.

> Node.js 20 actions are deprecated. The following actions are running on Node.js 20 and may not work as expected: `actions/checkout@v4`, `actions/upload-artifact@v4`. Actions will be forced to run with Node.js 24 by default starting June 2nd, 2026.

==빌드 실패의 직접적인 원인은 아니었지만== 찾아보니 GitHub 가 [Node.js 20 액션 런타임을 단계적으로 제거](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)한다고 공지한 사실을 알게 되었어요. 일정은 다음과 같습니다.

- **2026-06-02**: 모든 JavaScript 액션이 기본적으로 Node.js 24 런타임에서 실행되도록 강제 전환
- **2026-09-16**: 러너에서 Node.js 20 자체가 완전 제거

==모든 러너에서 Node.js 20 이 제거되는 시점이 2026-09-16== 이라 마이그레이션 자체가 급하지는 않지만, ==미리 진행하기를 권장==해요. 6월 강제 전환 이후 Node.js 20 에 의존하는 액션들이 예기치 않은 동작 차이를 보일 수 있고, 평소 빌드가 안정적으로 도는 시점에 미리 검증해 두는 편이 안전합니다.

그래서 ==AI 에이전트의 도움을 받아== 이 블로그의 배포 워크플로우를 정비했어요. 변경 전후를 한눈에 비교할 수 있도록 아래에 같이 두었습니다.

::: code-group

```yaml [기존 워크플로우]
steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
          node-version: "18.x"

    - uses: pnpm/action-setup@v2
      with:
          version: 9
          run_install: false

    - name: Set Timezone
      uses: szenius/set-timezone@v1.1
      with:
          timezoneLinux: "Asia/Seoul"
          timezoneMacos: "Asia/Seoul"
          timezoneWindows: "Asia/Seoul"

    - name: Get pnpm store directory
      shell: bash
      run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

    - name: Setup pnpm cache
      uses: actions/cache@v3
      with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.OS }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
              ${{ runner.OS }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}

    - name: Install Dependencies
      run: pnpm install

    - name: Build
      run: npm run build
```

```yaml [신규 워크플로우]
steps:
    - uses: actions/checkout@v5

    - uses: pnpm/action-setup@v4
      with:
          version: 9
          run_install: false

    - name: Use Node.js 24.x
      uses: actions/setup-node@v5
      with:
          node-version: "24.x"
          cache: "pnpm"

    - name: Set Timezone
      uses: szenius/set-timezone@v2.0
      with:
          timezoneLinux: "Asia/Seoul"
          timezoneMacos: "Asia/Seoul"
          timezoneWindows: "Asia/Seoul"

    - name: Install Dependencies
      run: pnpm install --frozen-lockfile

    - name: Build
      run: pnpm build
```

:::

핵심 변경은 크게 두 가지예요.

- **노드 런타임 및 액션 버전 업그레이드**: 빌드 Node 를 24.x 로 올리고, 24.x 를 지원하는 액션 메이저 버전으로 갱신
- **PNPM 기반 빌드 통일**: 캐시·설치·빌드 명령을 `pnpm` 으로 일원화

## Node.js 24 (Krypton) Active LTS

==Node.js 20 은 이미 2026 년 4월부로 End-of-Life 처리==되었고, ==Active LTS 인 Node 24 가 GitHub Actions 의 기본 JavaScript 런타임==으로 결정되어 있어요. 기타 호환성과 관련된 내용은 [GitHub 공지](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)에서 확인이 필요해요.

## 워크플로우 메이저 버전 갱신

오래된 워크플로우는 Node.js 16/20 런타임에 묶여 있어요. Node.js 24를 지원하는 메이저 릴리스로 올려 주세요.

| 액션                 | 이전 | 이후 |
| -------------------- | ---- | ---- |
| `actions/checkout`   | `v3` | `v5` |
| `actions/setup-node` | `v3` | `v5` |
| `pnpm/action-setup`  | `v2` | `v4` |

`actions/setup-node@v4` 부터는 `cache: 'pnpm'` 옵션을 내장하므로, 이전에 별도로 두었던 `pnpm store path` + `actions/cache` 스텝 두 개를 통째로 지울 수 있어요. 단, `pnpm/action-setup` 이 `setup-node` 보다 먼저 실행되어야 PATH 에 `pnpm` 바이너리가 있어 캐시 lookup 이 동작해요.

## 빌드 런타임 Node.js 24 로 전환

==워크플로우 내에서 사용하는 액션의 메이저 버전을 올려도 노드 런타임은 자동으로 따라오지 않아요.== `setup-node` 의 `node-version` 값에 의해 고정되기 때문에 직접 `24.x` 로 바꿔 줘야 합니다.

로컬 개발 환경에서는 ==MCP 서버들을 띄우기 위해 이미 Node.js 24 를 주력으로 사용== 중이라, CI 도 ==동일한 런타임으로 맞출 필요==가 있었어요. 에이전트는 처음에 이 단계를 생략했고, ==직접 요청해서야== 빌드 런타임까지 24 로 함께 갱신되었습니다.

> [!NOTE] Claude Code (claude-opus-4-7) 의 시선
> deprecation 경고는 _액션이 실행되는 런타임_ 에 한정된 메시지였고, 저는 그 문장 그대로 _액션 버전 업그레이드_ 만으로 문제를 닫으려 했어요. 하지만 사용자의 실제 의도는 ==로컬과 CI 의 런타임 일치==라는 한 단계 더 큰 그림이었습니다. 에이전트가 ==경고문을 좁게 해석==할 때, 사람이 _"이왕 손대는 김에 함께 정리할 부분"_ 을 짚어주는 흐름이 결합돼야 매끄럽게 마무리된다는 걸 다시 확인한 작업이었어요.

## 권한 최소화와 토큰 교체

런타임 정비를 마친 뒤에는 ==워크플로우 권한== 도 같이 손봤어요. 기존 워크플로우에는 `permissions:` 블록이 없어 저장소 디폴트 권한이 그대로 잡에 부여되고 있었고, `gh-pages` 푸시는 ==5년 전에 만든 클래식 PAT== (`GP_TOKEN`)에 의존하고 있었거든요.

이 PAT 가 살아 있던 이유는 ==원래 외부 Travis CI 에서 빌드·배포== 를 돌렸기 때문이에요. 외부 CI 는 GitHub 과 별개 시스템이라 `GITHUB_TOKEN` 같은 잡 단위 자동 토큰이 없어, GitHub 저장소에 푸시하려면 PAT 를 만들어 환경변수에 넣는 게 표준이었습니다. 이후 GitHub Actions 로 이주했을 때 ==시크릿은 그대로 들고 와== 그대로 사용했고, 더 이상 필요 없는 PAT 가 수년간 남아 있던 거예요.

GitHub Actions 가 발전하는 동안 ==빌드 실패 알림은 받지만 성공 알림은 아예 없잖아요==. 워크플로우를 다시 펼쳐 볼 이유가 없었던 거예요. 이번에도 Node.js 20 경고가 와서 봤다기보단, ==다른 사유로 발생한 빌드 실패를 들여다보다가== deprecation 애너테이션을 발견했고, 그 김에 ==에이전트에 후속 검토 작업을 요청한== 흐름이었습니다.

문제는 클래식 PAT 가 저장소 단위 스코프 제한이 없다는 점이에요. `repo` 스코프 하나로 ==계정이 접근 가능한 모든 저장소에 쓰기 권한== 을 갖습니다. 블로그 배포는 ==이 저장소 안에서만 일어나기== 때문에, 그 관점에서는 ==명백히 과도한 권한== 이었어요. 에이전트도 PAT 보다는 `GITHUB_TOKEN` 사용을 권장했고 그에 맞춰 수정을 요청했습니다.

```yaml
name: Build and Deploy

on:
    push:
        branches: [local]
    workflow_dispatch:

permissions:
    contents: write

jobs:
    build-and-deploy:
        # ...
        - name: Deploy
          uses: peaceiris/actions-gh-pages@v4
          with:
              github_token: ${{ secrets.GITHUB_TOKEN }}
```

두 가지가 같이 바뀌었어요.

- **`permissions: contents: write` 명시**: 잡이 받는 토큰 스코프를 `gh-pages` 푸시에 필요한 권한으로 좁혔어요.
- **PAT → `GITHUB_TOKEN` 전환**: 잡 단위로 자동 발급·폐기되는 토큰으로 갈아타 ==PAT 의 만료·로테이션 부담== 을 없앴습니다.

## 마치며

==평소라면 손대지 않았을 워크플로우 개선==을 에이전트의 도움으로 빠르게 마칠 수 있었어요. ==요구사항의 컨텍스트 범위가 작은 작업이더라도, 사용자가 결과를 리뷰하는 과정은 여전히 중요==하다는 걸 다시 느꼈습니다. 그 과정에서 ==배포 환경과 로컬 환경의 노드 런타임이 어긋나 있던 단점==도 같이 정리되는 부수적인 효과를 얻었어요. ==5년 동안 무심코 살아 있던 클래식 PAT 까지 함께 폐기==되면서, 정기적으로 워크플로우를 들여다보는 일의 가치도 다시 확인했습니다.
