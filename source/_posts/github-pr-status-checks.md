---
title: 깃허브 풀 리퀘스트 상태 검사
date: 2022-12-30
---

현재 회사에서 필요성에 의해 여러가지를 도입하더라도 제대로 활용하지는 않는 결과를 자주 경험했지만 이번에 새롭게 적용하고자하는 것은 풀 리퀘스트에 대한 리뷰 이외에도 코드 변경사항에 대한 상태 검사를 통해서 코드 품질을 유지하고자 하는 것에 있다. 기존에 개발 조직 자체적으로 결정한 코딩 컨벤션 가이드가 존재하지 않았고 단위 테스트 코드를 작성하도록 요구한다거나 정적 분석 도구를 통해서 코드 품질에 대해서 분석하고 리팩토링 하는 과정이 없다보니 개발자 스스로 편한 방식을 사용해서 요건에 의해 소스코드를 추가하거나 수정해왔다.

페어 프로그래밍을 선호하는 시니어 개발자도 깃허브 코드리뷰에 대해서는 습관화 되어있지 않으므로 브랜치 보호 기능을 통해 리뷰어 승인을 받도록 강제하더라도 상세하게 코드 변경사항을 검토하지 않고 승인만 해버리는 상황이 발생하였다. 사실은 브랜치 보호 기능을 설정한 이유는 긴급하게 동시에 진행되는 여러가지 프로젝트 일정으로 인해 반영되어야하지 않을 항목에 포함됨에 따라 예상하지 못한 결함을 내재한 채로 배포되고 전혀 상관없는 환경에서 문제가 발생하였기 때문이다. 그러나, 브랜치 보호 기능을 통해 리뷰를 하도록 가이드하였으나 바쁜 일정으로 인하여 깃허브 풀 리퀘스트에 대해 리뷰 버튼을 누르고 승인(Approve) 상태로 만들고 머지만 하는 상황이 만들어지곤 했다.

> 풀 리퀘스트에 대해 제대로 리뷰해야한다고 말했으나 당장 업무를 처리하는데 불편함이 있으므로 받아들여지지 않은게  현재 조직에 대해 지속되는 아쉬움 중 하나이다.

데브옵스에 이어 GitOps가 떠오르던 시기에 확인했던 것은 풀 리퀘스트에 대해 상태 체크를 수행할 수 있도록 설정할 수 있다는 것이었다. 실제로 다음과 같이 대부분의 오픈소스에서는 풀 리퀘스트로 변경되는 부분에 대해서 상태 체크를 수행하도록 깃허브 액션을 통해 워크플로우를 구성해놓은 것을 확인할 수 있다.

![](/images/posts/github-pr-status-check/01.png)

풀 리퀘스트 시 코드 상태 검사를 수행하는 것에 대한 이점은 무엇이 있을까? 현재 조직의 기준에서는 제대로 된 코드 리뷰 문화가 갖추어져있지 않기 때문에 기본적인 코드 품질에 대해서는 Checkstyle 또는 ESLint를 수행하여 정적 분석을 수행하고 자동으로 컨벤션을 맞추도록 강제할 수 있다는 것에 있다. 자신만의 코딩 컨벤션이 갖추어지지 않은 신입 개발자들에게는 시니어 개발자들이 리뷰하지 않더라도 컨벤션에 대한 중요성을 인지시키고 가이드할 수 있기 때문이다.

#### 깃허브 액션
풀 리퀘스트 시 상태 검사를 수행할 수 있도록 깃허브 액션을 통해 워크플로우를 작성할 수 있다. 많은 개발자들이 공유하여 사용하는 액션들 중에서 상태 검사를 위해 [reviewdog](https://github.com/reviewdog/reviewdog)를 기반으로 수행하는 아래의 두가지 워크플로우를 적용해보기로 하였다.

- [Run java checkstyle](https://github.com/marketplace/actions/run-java-checkstyle)
- [Run eslint with reviewdog](https://github.com/marketplace/actions/run-eslint-with-reviewdog)

조직 내에서 결정한 자바 코딩 컨벤션이 없어도 기본적인 구글 자바 스타일을 통해서 상태 검사를 수행할 수 있으며 프론트엔드 코드에 대해서도 ESLint를 수행하도록 되어있으므로 위 두가지 워크플로우만 수행하더라도 충분히 코드 품질을 향상시키고 유지할 수 있을 것이라 생각된다.

```yml
name: PR Checks

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main
jobs:
  checks:
    name: Checks
    runs-on: ubuntu-latest # ubuntu-22.04

    strategy:
      matrix:
        java: [11]
        node: [12]

    steps:
      - uses: actions/checkout@v2

      ###########################################
      ## Java Checkstyle
      ###########################################
      - name: Set up JDK ${{ matrix.Java }}
        uses: actions/setup-java@v3
        with:
          distribution: corretto
          java-version: ${{ matrix.java }}
      - name: Run checkstyle
        uses: nikitasavinov/checkstyle-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          reporter: github-pr-check
          tool_name: 'reviewdog'

      ###########################################
      ## Node ESLint
      ###########################################
      - name: Setup Node.js ${{ matrix.node }}
        uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node }}
      - run: npm install
      - name: Run eslint
        uses: reviewdog/action-eslint@v1
        with:
          reporter: github-check
          eslint_flags: '--ext .js,.vue ./src/main/resources/static/js'
```

감사합니다.
