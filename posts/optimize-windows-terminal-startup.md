---
title: 언젠가부터 느려진 윈도우 터미널(PowerShell) 초기 로드 시간 개선하기
date: 2026-06-10T06:25+09:00
description: 윈도우 터미널(PowerShell) 기동 시 3초 이상 지연되는 현상을 Profiler 모듈로 분석하고, 지연 로딩 및 oh-my-posh 캐싱을 적용해 400ms로 최적화한 가이드입니다.
tags:
  - PowerShell
  - Terminal
  - Optimization
  - Windows
---

# 언젠가부터 느려진 윈도우 터미널(PowerShell) 초기 로드 시간 개선하기

윈도우 터미널을 열 때마다 기동 시간이 서서히 늘어나는 현상이 발생했어요. 처음에는 가벼운 환경이라 생각했으나, 터미널이 완전히 켜질 때마다 아래와 같이 경고 문구가 뜨며 무려 3초(3276ms)가 소요되는 지점에 이르렀어요.

```text
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

새로운 기능 및 개선 사항에 대 한 최신 PowerShell을 설치 하세요! https://aka.ms/PSWindows

개인 및 시스템 프로필을 로드하는 데 3276ms가 걸렸습니다.
```

작업 흐름을 크게 방해하는 이 병목의 원인을 명확히 짚어내기 위해 AI 에이전트의 도움을 받았어요. 에이전트의 제안에 따라 PowerShell 프로파일링 모듈을 활용하여 병목 구간을 세밀하게 분석하고 400ms 내외로 최적화한 과정을 공유해요.

### 최적화 이전의 초기 프로필
문제가 된 초기 프로필 파일(`Microsoft.PowerShell_profile.ps1`)의 설정 상태는 다음과 같았어요. 여러 플러그인과 모듈들이 터미널 기동 시점에 동기적으로 로드되도록 구성되어 있었어요.

```powershell [Microsoft.PowerShell_profile.ps1]
Import-Module -Name PSReadLine
Import-Module -Name Terminal-Icons
Import-Module -Name Posh-Git
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH\pure.omp.json" | Invoke-Expression

if ($env:TERM_PROGRAM -eq "kiro") { . "$(kiro --locate-shell-integration-path pwsh)" }
```

## 1. Profiler 모듈로 병목 지점 찾기

혼자서 무거운 모듈 내부의 동작을 일일이 디버깅하기는 번거롭기 때문에, AI 코딩 에이전트의 추천에 따라 **Profiler** 라는 모듈을 설치하여 프로필 파일(`$PROFILE`)을 라인 단위로 추적했어요. 이 모듈은 각 명령어가 시작되는 시점부터 종료되는 시점까지의 누적 및 자체 소요 시간을 정밀하게 측정해 줘요.

우선 아래 명령어로 프로파일러 모듈을 설치했어요.

```powershell
Install-Module -Name Profiler -Scope CurrentUser -Force
```

설치한 뒤, 기존 프로필 스크립트 파일을 대상으로 추적을 진행하여 시간 점유율이 높은 상위 항목들을 조회해 보았어요.

```powershell
$trace = Trace-Script -ScriptBlock { . $PROFILE }
$trace.Top50SelfDuration | Format-Table -AutoSize
```

조회 결과, 프로필 로드 시간의 대부분을 모듈 임포트 구문이 차지하고 있었어요.

| 모듈 | 소요 시간 | 점유 비율 |
| :--- | :---: | :---: |
| **`Posh-Git`** | ~1.29초 | 68.6% |
| **`Terminal-Icons`** | ~0.47초 | 25.2% |
| **`oh-my-posh`** | ~0.12초 | 6.5% |


## 2. 지연 로딩(Lazy Loading)으로 모듈 로드 늦추기

첫 프롬프트가 표시되는 시점에는 파일 아이콘이나 Git 자동완성 기능이 즉시 필요하지 않아요. 이에 AI 에이전트의 제안에 따라, 실제로 관련 명령어를 실행하는 시점(`ls`나 `git`)에 모듈을 가져오도록 지연 로딩(Lazy Loading)을 적용했어요.

### Terminal-Icons 지연 로딩 프록시
기존 `Get-ChildItem` 함수를 지연 로딩용 코드로 대체했어요.

```powershell [Microsoft.PowerShell_profile.ps1]
function Get-ChildItem {
    [CmdletBinding(DefaultParameterSetName='Items')]
    param(
        [Parameter(Position=0, ValueFromPipeline=$true, ValueFromPipelineByPropertyName=$true)]
        [string[]]$Path,
        [Parameter(Position=1, ValueFromPipelineByPropertyName=$true)]
        [string]$Filter,
        [string[]]$Include,
        [string[]]$Exclude,
        [switch]$Recurse,
        [switch]$Force,
        [switch]$Name,
        [switch]$Verbose,
        [switch]$Debug,
        [switch]$ErrorAction,
        [switch]$WarningAction,
        [switch]$InformationAction,
        [switch]$OutVariable,
        [switch]$OutBuffer,
        [switch]$PipelineVariable
    )
    # 지연 로딩 함수를 제거하고 원래 모듈을 로드
    Remove-Item Function:\Get-ChildItem -ErrorAction SilentlyContinue
    Import-Module -Name Terminal-Icons -ErrorAction SilentlyContinue
    Microsoft.PowerShell.Management\Get-ChildItem @PSBoundParameters
}
```

### Posh-Git 지연 로딩 프록시
터미널을 실행할 때마다 매번 git 명령을 사용하는 것이 아니므로, `git` 명령어를 처음 입력하는 시점에 모듈이 로드되도록 처리했어요.

```powershell [Microsoft.PowerShell_profile.ps1]
$global:_poshGitLoaded = $false
function git {
    if (!$global:_poshGitLoaded) {
        Import-Module -Name Posh-Git -ErrorAction SilentlyContinue
        $global:_poshGitLoaded = $true
    }
    & (Get-Command git -CommandType Application) @args
}
```

## 3. oh-my-posh 초기화 스크립트 캐싱

테마 설정이 변경된 게 아니라면 굳이 터미널을 켤 때마다 새로 불러와 쉘을 그릴 필요가 없어요. 이를 해결하기 위해 실행 결과를 임시 파일로 저장(캐싱)해 두고, 터미널 구동 시에는 저장본을 바로 실행하도록 바꿨어요. 테마 파일이 수정되었을 때만 자동으로 캐시를 갱신해요.

```powershell [Microsoft.PowerShell_profile.ps1]
$ompCache = "$env:TEMP\oh-my-posh-cache.ps1"
$themePath = "$env:POSH_THEMES_PATH\pure.omp.json"

# 캐시 파일이 없거나 테마 파일의 수정 날짜가 더 최신인 경우 캐시 파일 재생성
if (!(Test-Path $ompCache) -or ((Test-Path $themePath) -and ((Get-Item $ompCache).LastWriteTime -lt (Get-Item $themePath).LastWriteTime))) {
    oh-my-posh init pwsh --config $themePath | Out-File -FilePath $ompCache -Encoding utf8
}
. $ompCache
```

## 4. 최종 개선 효과

프로필 로드 시 모듈 지연 로딩과 캐시 처리를 적용한 뒤, 완전히 깨끗한 새 터미널 프로세스를 구동하여 총 시간을 측정해 보았어요.

*   **최적화 전**: **3276ms (3초 초과)**
*   **최적화 후**: **약 400ms 내외** (약 87%의 속도 체감 단축)

굼뜨던 터미널이 AI 에이전트의 도움으로 아주 빠릿해졌어요. 터미널 로딩 속도로 답답함을 느끼고 있다면 이와 같이 지연 로딩과 캐싱을 적용해 보세요.
