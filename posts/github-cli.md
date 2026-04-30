---
title: 개인 PC에서 조직 깃허브 계정 활용하기
date: 2026-04-25T16:59+09:00
description: 개인 PC에서 개인과 조직 GitHub 계정을 동시에 쓰며 빠르게 전환할 수 있도록 `gh`의 다중 로그인과 프로젝트별 Git 환경 구성 방법을 정리합니다.
tags:
    - GitHub
    - CLI
    - Git
    - Development
---

# 개인 PC에서 조직 깃허브 계정 활용하기

GitHub CLI(`gh`)를 사용하여 개인 PC에 조직 계정에 대한 권한을 설정하고, 조직 리포지토리에 대한 작업을 즉시 수행할 수 있는 개발 환경을 구축하는 방법을 알아보겠습니다.

## 1. 시작하며

현대 개발 환경에서는 개인 깃허브 계정과 조직 계정을 병행해서 사용하는 경우가 많습니다. 특히 서비스를 운영 중이라면 재택근무나 긴급 장애 대응 상황에서 개인 PC로 급히 업무를 처리해야 할 때가 종종 발생하곤 하죠. 이때 개인 PC에 조직 리포지토리에 대한 개발 환경이 이미 구성되어 있다면, 인프라 접근을 위한 VPN 설정만으로 즉시 대응이 가능해집니다.

하지만 서비스에 문제가 발생한 긴박한 상황에서 뒤늦게 개발 환경을 설정하려다 보면, 생각보다 과정이 복잡하고 어려워 당혹스러운 경우가 많습니다. 저는 최근 코딩 에이전트를 위해 `gh`를 설치하고 사용하다 보니, 여러 계정에 로그인하고 간편하게 전환할 수 있는 기능이 있다는 점을 알게 되었습니다.

이번 포스트에서는 `gh`를 활용해 개인 PC에서 개인과 조직 계정을 스마트하게 관리하고, 프로젝트별 Git 환경을 최적화하는 방법을 정리해 보았습니다.

## 2. 다중 계정 설정

### 계정 추가하기

먼저, 관리하려는 모든 계정으로 각각 로그인을 수행합니다.

```bash
# 첫 번째 계정(예: 개인 계정) 로그인 (대화형)
gh auth login

# 두 번째 계정(예: 조직/업무 계정) 로그인 (PAT 사용)
echo "your-personal-access-token" | gh auth login --with-token
```

인증 과정에서 브라우저를 통한 로그인을 선택하거나, **PAT(Personal Access Token)**을 직접 입력하여 로그인할 수 있습니다. 어떤 방식을 선택하든 `gh`는 여러 계정의 세션을 안전하게 관리하며 언제든지 전환할 수 있도록 지원합니다.

> [!TIP]
> 보안상의 이유로 브라우저 인증을 권장하지만, 환경에 따라 PAT를 사용해야 하는 경우에도 `gh auth login --with-token` 명령어를 통해 인증 후 동일하게 계정 전환 기능을 사용할 수 있습니다.

> [!IMPORTANT]
> 만약 **Fine-grained PAT**를 사용하여 조직 계정에 로그인하려는 경우, 토큰 생성 시 **Resource owner**를 반드시 해당 조직(Organization)으로 지정해야 합니다. 만약 조직 정책 등으로 인해 해당 조직에 대한 Fine-grained 토큰을 생성할 수 없다면, **Tokens (classic)**을 생성하여 사용해야 합니다. 개인 계정 소유로 생성된 Fine-grained 토큰은 조직 리포지토리에 접근할 권한이 없을 수 있습니다.

### 현재 인증 상태 확인

현재 로그인된 계정들의 목록과 활성화된 계정을 확인하려면 다음 명령어를 사용합니다. 아래 예시와 같이 개인 계정과 조직 계정이 모두 로그인되어 있음을 확인할 수 있습니다.

```bash
❯ gh auth status
github.com
  ✓ Logged in to github.com account kdevkr (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: github_pat_...

  ✓ Logged in to github.com account your-org-user (keyring)
  - Active account: false
  - Git operations protocol: https
  - Token: github_pat_...
```

### 계정 전환하기

개인 계정에서 조직 계정으로 전환하고 싶을 때는 `switch` 명령어를 사용합니다.

```bash
# 대화형 전환
gh auth switch

# 특정 계정(조직 계정)으로 즉시 전환
gh auth switch --user your-org-user
```

> [!NOTE]
> `GH_TOKEN` 환경 변수를 설정하여 일시적으로 계정을 고정할 수도 있지만, 여러 계정을 빈번하게 오가는 환경에서는 `gh auth switch`를 통한 공식적인 계정 전환 방식을 사용하는 것이 훨씬 관리하기 쉽고 실수를 줄일 수 있어 권장됩니다.

## 3. GitHub CLI를 Git 자격 증명 헬퍼로 설정

GitHub CLI로 로그인을 했더라도, 실제 `git push`나 `git pull` 시에는 별도의 인증을 요구할 수 있습니다. 이를 해결하기 위해 `gh`를 Git의 자격 증명 헬퍼(Credential Helper)로 등록해야 합니다.

```bash
gh auth setup-git
```

이 명령어를 실행하면 내부적으로 `git config --global credential.helper` 설정을 업데이트하여, `git` 명령어가 실행될 때 현재 `gh`에 로그인된 **활성(Active) 계정 정보**를 자동으로 사용하게 됩니다.

> [!TIP]
> 만약 특정 프로젝트에서 다른 계정의 권한이 필요하다면, `gh auth switch`로 계정을 전환한 뒤 다시 한번 `gh auth setup-git`을 실행해 주세요. 이렇게 하면 Git이 현재 활성화된 계정의 토큰을 사용하여 작업을 수행하게 됩니다.

## 4. 프로젝트별 Git 사용자 설정 (Local Config)

GitHub 인증은 `gh`가 담당하지만, 커밋 로그에 기록되는 이름과 이메일은 Git 설정에 의존합니다. 전역(Global) 설정만 사용하면 회사 리포지토리에 개인 이메일로 커밋이 남는 실수를 할 수 있습니다.

이를 방지하기 위해 프로젝트 폴더별로 **로컬 설정**을 적용하는 것을 권장합니다.

```bash
# 프로젝트 디렉토리로 이동
cd my-org-project

# 현재 설정된 사용자 정보 확인 (전역 설정이 표시될 수 있음)
git config user.name
git config user.email

# 해당 리포지토리 전용 사용자 정보 설정
git config --local user.name "Work Name"
git config --local user.email "work-email@company.com"
```

이렇게 설정하면 해당 폴더 내에서는 전역 설정(`--global`)보다 로컬 설정(`--local`)이 우선순위를 가지므로, 계정에 맞는 올바른 정체성으로 커밋을 남길 수 있습니다.

> [!IMPORTANT]
> 계정을 전환(`gh auth switch`)한 후에는 해당 계정의 권한으로 Git 작업을 수행할 수 있게 됩니다. 하지만 커밋 메시지에 남는 작성자 정보는 **Git의 `user.email` 설정**을 따르므로, 인증 정보와 작성자 정보가 일치하도록 로컬 설정을 반드시 확인해야 합니다.

## 5. 조직 리포지토리에 작업해야 하는 경우

조직 리포지토리에서 작업할 때는 일반 개인 리포지토리와 달리 계정 전환과 클론 과정에 주의가 필요합니다.

### 조직 계정으로 전환 및 자격 증명 설정

조직 리포지토리를 클론하거나 작업하기 전, 반드시 해당 조직에 권한이 있는 계정이 활성화되어 있는지 확인하고 Git 자격 증명을 갱신해야 합니다.

```bash
# 1. 현재 계정 확인 및 필요 시 전환
gh auth status
gh auth switch --user your-org-user

# 2. 조직 리포지토리 클론 (특정 브랜치만 클론하는 경우)
gh repo clone your-org/your-repo -- -b main --single-branch
```

## 6. AI 코딩 에이전트와의 협업

AI 코딩 에이전트는 현재 환경에 로그인된 여러 계정 중 해당 프로젝트에서 어떤 계정을 사용해야 하는지 스스로 판단하기 어렵습니다. 따라서 에이전트가 올바른 권한으로 작업을 수행할 수 있도록 프로젝트별 명확한 지침을 제공하는 것이 좋습니다.

### 프로젝트 지침 추가

에이전트가 참고할 수 있도록 프로젝트 루트의 `AGENTS.md`나 지침 파일에 다음과 같은 내용을 추가해 보세요.

> **에이전트 지침 예시:**
> "이 프로젝트의 모든 작업은 `your-org-user` 계정을 사용해야 합니다. 작업 시작 전 `gh auth switch --user your-org-user` 명령어를 실행하여 계정에 대한 인증 상태를 확인하고 필요시 전환하세요."

이렇게 지침을 추가해 두면, 에이전트는 현재 인증 상태를 확인하고 필요에 따라 스스로 계정을 전환하여 조직의 정책에 맞는 작업을 수행할 수 있습니다.

## 7. 마치며

GitHub CLI가 반드시 필요한 것은 아니지만, 멀티 계정 관리라는 조금은 번거롭고 불편할 수 있는 과정을 아주 쉽고 매끄럽게 풀어낼 수 있도록 도와줍니다.

`gh auth switch`, `setup-git`, 그리고 `git config --local` 조합을 활용하여 인증 문제로 인한 스트레스 없이 개발에만 더욱 몰입할 수 있는 환경을 구축해 보시길 바랍니다! 여러분도 GH를 사용해서 개인 PC에 조직 개발 환경을 구성해 보세요.
