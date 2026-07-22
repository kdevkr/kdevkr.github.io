---
title: Gradle - GitHub Dependency Submission
date: 2026-07-22T22:00+09:00
description: Gradle 프로젝트에 대한 Dependabot 취약점 경고를 활성화 해보았어요.
tags:
    - Gradle
    - GitHub Actions
    - Dependabot
    - Security
---

# Gradle - GitHub Dependency Submission

개인 퍼블릭 저장소의 단순한 `build.gradle`이나 `build.gradle.kts` 파일은 별다른 설정 없이도 GitHub 정적 분석을 통해 의존성이 알아서 포함되고 Dependabot alerts에 잘 뜨곤 해요. 하지만 회사 실무 프로젝트는 무슨 이유인지 프로젝트 저장소 설정에서 ==Dependency graph==, ==Automatic dependency submission==, 그리고 ==Dependabot alerts== 옵션을 모두 활성화했음에도 불구하고, Gradle 의존성 취약점에 대한 정보가 Dependabot 경고 목록에 제대로 포함되지 않았어요.

그래서 찾아보니, Gradle 프로젝트에 대해서 자동으로 추가되지 않으면 ==[Dependency Submission](https://github.com/gradle/actions/blob/main/docs/dependency-submission.md)== 을 사용해서 목록에 추가할 수 있더라구요.

## Dependency Submission API

Gradle 공식 블로그의 [Avoid Supply Chain Disasters with GitHub and Gradle](https://blog.gradle.org/avoid-supply-chain-disaster-with-github-gradle)에 Gradle 프로젝트에 대한 의존성 정보를 깃허브에 등록하는 과정이 소개되어있어요. 깃허브의 **Dependency Submission API** 를 사용하면 의존성 그래프 정보가 깃허브에 등록되면서 매칭되는 취약점들을 [Dependabot vulnerability alerts](https://docs.github.com/ko/code-security/concepts/supply-chain-security/dependabot-alerts) 목록에 보여주는 방식으로 동작해요.

![Gradle Dependency Submission Flow](/images/posts/github-dependency-submission-gradle/001.svg)

## Dependency Submission 워크플로우

```yaml [.github/workflows/dependency-submission.yml]
name: Gradle Dependency Submission

on:
    push:
        paths:
            - "backend/build.gradle"
            - "backend/settings.gradle"
            - "backend/gradle/**"
            - ".github/workflows/dependency-submission.yml"
    workflow_dispatch:

permissions:
    contents: write

jobs:
    dependency-submission:
        runs-on: ubuntu-latest
        if: github.ref_name == github.event.repository.default_branch
        env:
            APP_PRIVATE_KEY: ${{ secrets.APP_PRIVATE_KEY }}
            SUBMODULE_TOKEN: ${{ secrets.SUBMODULE_TOKEN }}
        steps:
            - name: Preflight - submodule 자격증명 확인
              run: |
                  if [ -z "$APP_PRIVATE_KEY" ] && [ -z "$SUBMODULE_TOKEN" ]; then
                    echo "::error::APP_PRIVATE_KEY(App) 또는 SUBMODULE_TOKEN(PAT) 중 하나는 등록해야 합니다."
                    exit 1
                  fi

            - name: Generate GitHub App token
              id: app-token
              if: env.APP_PRIVATE_KEY != ''
              uses: actions/create-github-app-token@v3
              with:
                  client-id: ${{ vars.APP_CLIENT_ID }}
                  private-key: ${{ secrets.APP_PRIVATE_KEY }}
                  owner: ${{ github.repository_owner }}
                  repositories: |
                      my-main-repo
                      my-private-submodule

            - name: Checkout (submodule 포함)
              uses: actions/checkout@v5
              with:
                  submodules: recursive
                  token: ${{ steps.app-token.outputs.token || secrets.SUBMODULE_TOKEN }}

            - name: Set up JDK 17
              uses: actions/setup-java@v5
              with:
                  distribution: corretto
                  java-version: "17"

            - name: Generate and submit dependency graph
              uses: gradle/actions/dependency-submission@v5
              with:
                  build-root-directory: backend
```

[Gradle Actions의 dependency-submission Guide](https://github.com/gradle/actions/blob/main/docs/dependency-submission.md)에 따라 `dependency-submission`을 수행하는 워크플로우를 만들면돼요. 저는 실무 프로젝트에 대해 다음과 같이 워크플로우를 작성하고 테스트 해보았어요. 이 워크플로우에서 중요한 부분은 서브 모듈에 대한 자격 증명 획득을 위해 ==GitHub App== 을 활용한다는 거에요. 기본으로 제공해주는 `GITHUB_TOKEN` 은 해당 레포에 대한 권한은 제공하지만 **서브 모듈은 포함하지 않는다** 는 치명적인 단점이 있어요. 그래서 GitHub App 만들고 임시 토큰을 발급해서 사용하는 방식으로 작성한거에요.

## Security and quality - Dependabot alerts

워크플로우가 동작했다면, 프로젝트 저장소의 **Insights > Dependency graph** 에 의존성 정보가 포함되고 **Security and quality > Dependabot alerts** 에서 의존성 취약점 정보가 보일거에요. 참고로 Dependency Submission 은 의존성 그래프 제출 및 보안 취약점 경고(Alerts)를 감지하기 위한 역할이에요. 의존성 취약점에 대해 버전 업데이트를 지원받고 싶다면, 프로젝트에 `.github/dependabot.yml` 설정 파일을 별도로 추가하고 Gradle 패키지 생태계(`package-ecosystem: "gradle"`)를 구성해야 해요.

실제로 백엔드에 대한 의존성 업데이트를 위해서는 스프링 부트 버전 업그레이드가 필요하기 때문에 의존성 취약점 해결이 쉽지 않다는 건 이미 알고 있어요. 이렇게 의존성 취약점 목록이 나오도록 성공한 것으로 만족할게요.
