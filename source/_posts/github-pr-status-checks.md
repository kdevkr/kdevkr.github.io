---
title: 깃허브 풀 리퀘스트 상태 검사
date: 2023-01-10
---

현재 회사에서 새해 목표는 빠른 업무 처리를 위해서 간단한 방식을 취함에 따라서 지속적인 성장을 이루어냈으나 제품에 대한 신뢰성의 문제를 경험하고나서는 제품 품질을 강화하기 위한 코드 품질 또는 테스트 자동화에 대한 환경 구축의 필요성을 느끼고 많은 것들을 시도하고 있다. 깃허브 풀 리퀘스트를 수행하고 있었으나 코드 리뷰가 주요 테크 기업이나 스타트업처럼 개발 문화로 정착되어있지 않음으로 인해서 단위 테스트 코드를 작성하도록 요구한다거나 정적 분석 도구를 통해 코드 품질에 대해서 분석하고 리팩토링을 수행하는 과정이 없다보니 개발자들이 스스로 편한 방식을 사용해서 작업 요건에 대해서 처리해왔다.

페어 프로그래밍을 선호하는 시니어 개발자도 깃허브 코드리뷰에 대해서는 습관화 되어있지 않았기에 비록 브랜치 보호 기능을 통해 리뷰어 승인을 받도록 강제하더라도 상세하게 코드 변경사항을 검토하지 않고 승인만 해버리는 상황이 발생했었다. 그럼에도 브랜치 보호 기능으로 불편함을 강제함으로써 작업에 대해 브랜치를 만들어서 작업하고 풀 리퀘스트를 요청하는 방법에 대해서는 모든 개발자들이 익숙해졌다고 생각이 든다. 아무튼 깃허브 풀 리퀘스트를 활용함에도 제대로 된 코드 리뷰 문화가 이루어지지 않기 때문에 최소한 코드 품질에 대해서 개발자들이 인지할 수 있도록 깃허브 풀 리퀘스트 시 상태 검사를 통해 리뷰 이외에도 상태 검사가 통과되어야만 원하는 브랜치에 머지할 수 있도록 강제하고자 한다. 

> 풀 리퀘스트에 대해 제대로 리뷰해야한다고 말했으나 당장 업무를 처리하는데 불편함이 있으므로 받아들여지지 않았다.

데브옵스에 이어 GitOps가 떠오르던 시기에 확인했던 것은 풀 리퀘스트에 대해 상태 체크를 수행할 수 있도록 설정할 수 있다는 것이었다. 실제로 다음과 같이 대부분의 오픈소스에서는 풀 리퀘스트로 변경되는 부분에 대해서 상태 체크를 수행하도록 깃허브 액션을 통해 워크플로우를 구성해놓은 것을 확인할 수 있다.

![](/images/posts/github-pr-status-check/01.png)

풀 리퀘스트 시 코드 상태 검사를 수행하는 것에 대한 이점은 무엇이 있을까? 현재 조직의 기준에서는 제대로 된 코드 리뷰 문화가 갖추어져 있지 않기 때문에 기본적인 코드 품질에 대해서는 Checkstyle 또는 ESLint를 수행하여 정적 분석을 수행하고 자동으로 컨벤션을 맞추도록 강제할 수 있다는 것에 있다. 자신만의 코딩 컨벤션이 갖추어지지 않은 신입 개발자들에게는 시니어 개발자들이 리뷰하지 않더라도 컨벤션에 대한 중요성을 인지시키고 가이드할 수 있기 때문이다.

#### 깃허브 액션
풀 리퀘스트 시 상태 검사를 수행할 수 있도록 깃허브 액션을 통해 워크플로우를 작성할 수 있다. 많은 개발자들이 공유하여 사용하는 액션들 중에서 상태 검사를 위해 [reviewdog](https://github.com/reviewdog/reviewdog)를 기반으로 수행하는 아래의 두가지 워크플로우를 적용해보기로 하였다. 조직 내에서 결정한 자바 코딩 컨벤션이 없어도 기본적인 구글 자바 스타일을 통해서 상태 검사를 수행할 수 있으며 프론트엔드 코드에 대해서도 ESLint를 수행하도록 되어있으므로 위 두가지 워크플로우만 수행하더라도 충분히 코드 품질을 향상시키고 유지할 수 있을 것이라 생각된다.

- [Run java checkstyle](https://github.com/marketplace/actions/run-java-checkstyle)
- [Run eslint with reviewdog](https://github.com/marketplace/actions/run-eslint-with-reviewdog)

> 깃허브 액션 워크플로우 파일 : [.github/workflows/pr-checks.xml](https://github.com/kdevkr/mambo-box/blob/main/.github/workflows/pr-checks.yml)

```yml
name: PR Checks

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main
    paths:
      - '**.java'
      - '**.js'
      - '**.vue'
jobs:
  checks:
    name: Checks
    runs-on: ubuntu-latest # ubuntu-22.04

    strategy:
      matrix:
        java: [11]
        node: [12]

    steps:
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            java:
              - '**.java'
            vuejs:
              - '**.vue'
              - '**.js'
      - uses: actions/checkout@v2

      ###########################################
      ## Java Checkstyle
      ###########################################
      - if: steps.changes.outputs.java == 'true'
        name: Set up JDK ${{ matrix.Java }}
        uses: actions/setup-java@v3
        with:
          distribution: corretto
          java-version: ${{ matrix.java }}
          cache: 'gradle'
      - if: steps.changes.outputs.java == 'true'
        name: Run checkstyle
        uses: nikitasavinov/checkstyle-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          reporter: github-pr-check
          tool_name: 'checkstyle'
          checkstyle_version: 10.3
          checkstyle_config: checkstyle.xml

      ###########################################
      ## Node ESLint
      ###########################################
      - if: steps.changes.outputs.vuejs == 'true'
        name: Setup Node.js ${{ matrix.node }}
        uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
          cache-dependency-path: npm-shrinkwrap.json
      - if: steps.changes.outputs.vuejs == 'true'
        name: Cache Dependencies
        id: npm-cache
        uses: actions/cache@v3
        with:
          path: '**/node_modules'
          key: ${{ runner.os }}-node-${{ hashFiles('**/npm-shrinkwrap.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - if: steps.changes.outputs.vuejs == 'true' && steps.npm-cache.outputs.cache-hit != 'true'
        name: Install Dependencies
        run: npm ci
      - if: steps.changes.outputs.vuejs == 'true'
        name: Run eslint
        uses: reviewdog/action-eslint@v1
        with:
          reporter: github-pr-check
          eslint_flags: '--ext .js,.vue ./src/main/resources/static/js'
```

처음에는 간단하게 풀 리퀘스트가 생성되고 커밋이 푸시되었을때 **체크스타일**과 **ESLint**가 동작하도록 작성하였으나 백엔드 작업시에도 불필요하게 ESLint를 수행하고 프론트엔드 작업시에도 불필요하게 자바 파일에 대한 체크스타일을 수행하는 비효율적인 동작을 수행하는 구조였다. 추가적인 개선을 통해 풀 리퀘스트 시 [paths](https://docs.github.com/ko/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore) 문법을 활용해서 .java, .js, .vue 파일에 대한 변경사항이 있을때만 상태 검사에 대한 워크플로우가 실행될 수 있도록 변경했으며 [dorny/paths-filter](https://github.com/dorny/paths-filter)를 통해서 자바 파일에 대한 변경사항이 있다면 체크스타일을 수행하고 프론트 파일에 대한 변경사항이 있다면 ESLint가 개별적으로 수행할 수 있도록 하였다.

> 구글 체크스타일은 회사 코드에 적합하지 않다고 판단되어 가장 간단한 규칙으로 수행할 수 있도록 커스터마이징 된 체크스타일 파일을 추가했습니다.