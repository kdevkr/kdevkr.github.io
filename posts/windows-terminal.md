---
title: 윈도우 터미널을 꾸며보아요
date: 2025-09-28T09:00+09:00
tags:
- Windows Terminal
- PowerShell
- Oh My Posh
---

회사에서 사용중인 맥 환경에서는 Oh My Zsh 를 설치해서 사용중입니다. 이와 다르게 개인 홈 PC 에서는 기본적인 윈도우 터미널을 사용하고 있었습니다. 곧 [윈도우 10에 대한 업데이트 지원이 종료](https://www.microsoft.com/ko-kr/windows/end-of-support?r=1)되는 ==2025년 10월 14일==이 다가오고 있다는 거 아시나요? 현재 사용중인 윈도우 10은 윈도우 11에 대한 전환을 지원하지 않는 버전이기 때문에 아무래도 클린 설치를 해야해서 현재 사용중인 개발 환경 구성을 새로 해야하는 귀찮은 상태가 될 수 있습니다. 그래서 사용중인 윈도우 터미널에 Oh My Posh 와 도움이 되는 모듈을 설치해서 윈도우 터미널을 꾸며보도록 할게요.

일단 파워쉘(PowerShell)은 Windows PowerShell 과 오픈소스로 새로 만들어진 [PowerShell(pwsh)](https://learn.microsoft.com/ko-kr/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.5)로 나누어지는데 저는 $PSVersionTable 값을 확인해보니 Windows PowerShell 5.1 을 사용하고 있어요. 아무튼, 윈도우 터미널에서 명령 프롬프트나 파워쉘을 프로파일로 선택하여 사용할 수 있고 윈도우 터미널을 꾸민다는건 사용중인 프로파일 설정을 변경한다는 이야기 입니다.

#### 관리자 권한으로 실행하세요

윈도우 터미널을 꾸미는 과정에서 실행하는 명령어에는 일부 관리자 권한을 필요로 하는 것들이 있기 때문에 설정 과정 상에는 관리자 권한으로 실행하는 것을 권장합니다. 윈도우 터미널을 관리자 권한으로 실행하려면 다음의 방법을 이용할 수 있어요.

> - 설정 → 새 프로필 추가 → 이 프로필을 관리자 권한으로 실행
> - 작업표시줄 → Windows Terminal 오른쪽 마우스 클릭 → 관리자 권한으로 실행 ⭐
> - Window + R 로 실행창 열기 → wt 입력 → Ctrl + Shift + Enter

#### Oh My Posh 설치

[Oh My Posh](https://ohmyposh.dev/)는 파워쉘 스크립트(ps1)를 제공하기 때문에 윈도우 터미널에서 쉽게 설치할 수 있습니다. 윈도우 터미널에서 사용중인 Microsoft.PowerShell_profile.ps1 파일을 열고 윈도우 터미널을 시작할 때 실행할 스크립트를 적어두는 방식으로 설정하게 됩니다. 그래서 아래와 같이 메모장으로 프로파일 설정 파일을 열고나서 마지막 라인에 oh-my-posh init pwsh 명령어를 추가하면 Oh My Posh 가 자동으로 초기화 되도록 실행하게 됩니다.

```ps Windows Terminal
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
Set-ExecutionPolicy Bypass -Scope Process -Force; Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://ohmyposh.dev/install.ps1'))

$PROFILE
C:\Users\Mambo\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
```

```ps1 Microsoft.PowerShell_profile.ps1 (notepad $PROFILE)
oh-my-posh init pwsh | Invoke-Expression
```

```ps Windows Terminal
# 터미널을 다시 시작하지 않고 변경사항 반영하기
. $PROFILE
```

#### 심플한 테마로 변경하기

```ps1 Microsoft.PowerShell_profile.ps1 (notepad $PROFILE)
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH\pure.omp.json" | Invoke-Expression
```

Oh My Posh 는 jandedobbeleer 테마를 기본으로 사용하고 [내장된 테마](https://ohmyposh.dev/docs/themes) 중에서 사용하고 싶은 테마를 설정하면 됩니다. Microsoft.PowerShell_profile.ps1 파일을 열고나서 마지막 라인에 추가했던 init pwsh 명령어에 config 옵션을 사용도록 위와 같이 변경합니다. 개인적으로 powerlevel10k 과 같은 이쁘장한 것보다는 심플한게 좋은 것 같아 위 예시에서는 pure 테마를 선택했습니다.

![pure 테마](/images/posts/windows-terminal/03.png)

#### 아이콘 표시를 위한 Nerd Font

반드시 필요한 건 아니지만 Oh My Posh 에서 아이콘을 표시하는 테마를 사용하고자 하는 경우에는 [Nerd Font를 설치하고 설정해야](https://ohmyposh.dev/docs/installation/fonts)합니다. 그래서 에디터에서 주로 사용되는 폰트에 글리프 아이콘을 포함해놓은 폰트인 [Nerd Font](https://www.nerdfonts.com/) 설치를 기본으로 진행하게 됩니다. Nerd Font 를 설치했다면 윈도우 터미널 설정에 들어가서 사용중인 프로파일의 추가 설정 → 모양 메뉴에서 글꼴을 ==MesloLGM Nerd Font== 로 변경합니다. 이제 윈도우 터미널을 다시 열면 알수없는 문자로 깨지던 글리프 아이콘이 정상적으로 표시될 겁니다.

```ps Windows Terminal
oh-my-posh font install meslo
```

|                      설정 열기 단축키 : Ctrl + comma                       |                      프로파일 글꼴 설정                      |
| :------------------------------------------------------------------------: | :----------------------------------------------------------: |
| ![윈도우 터미널의 설정 열기 단축키](/images/posts/windows-terminal/01.png) | ![프로파일 글꼴 설정](/images/posts/windows-terminal/02.png) |

#### 도움이 되는 게 또 있어요

Oh My Posh 스크립트를 추가했던 것처럼 파워셀에서는 [PSGallery](https://www.powershellgallery.com/) 에 등록된 모듈이나 스크립트를 가져와서 설치하고 실행할 수 있습니다. 윈도우 터미널을 관리자 권한으로 실행하고나서 Install-Module 명령어를 사용하면 모듈을 설치할 수 있게 되고, 파워쉘에서 참조하는 Microsoft.PowerShell_profile.ps1 파일에서 Import-Module 명령어를 사용해서 포함시킬 수 있어요.

```ps Windows Terminal
Install-Module -Name PSReadLine -Repository PSGallery
Install-Module -Name Terminal-Icons -Repository PSGallery
Install-Module -Name Posh-Git -Repository PSGallery
```

```ps1 Microsoft.PowerShell_profile.ps1 (notepad $PROFILE)
Import-Module -Name PSReadLine
Import-Module -Name Terminal-Icons
Import-Module -Name Posh-Git
```

- PSReadLine: [인텔리센스 기반 자동완성](https://learn.microsoft.com/ko-kr/powershell/scripting/learn/shell/tab-completion?view=powershell-7.5#predictive-intellisense-in-psreadline) 지원
- Terminal-Icons: [파일 아이콘 표시](https://github.com/devblackops/Terminal-Icons) 지원
- Posh-Git: [Git 명령어 자동완성](https://github.com/dahlbyk/posh-git) 지원

