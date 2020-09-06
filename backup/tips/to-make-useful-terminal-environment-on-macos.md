---
title: MacOS에서 유용한 터미널 환경 만들기
description: 
---

MacOS의 기본 터미널인 Terminal.app은 사용하다보면 이쁘지도 않고 생각보다 편리하지 않습니다. 그래서 MacOS에서 기본 터미널을 유용한 터미널 환경으로 만들어보도록 하겠습니다.

## 터미널 개선을 위한 사전작업

### Homebrew
MacOS용 패키지 관리자 Homebrew를 설치합니다.

```bash Bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew --version
Homebrew 2.4.8
Homebrew/homebrew-core (git revision 9232b; last commit 2020-07-24)
```

### Powerline Fonts
[Powerline fonts](https://github.com/powerline/fonts)에서 Powerline 문자가 포함된 폰트를 다운받아 설치합니다.

```sh Bash
git clone https://github.com/powerline/fonts.git --depth=1
cd fonts
./install.sh
cd ..
rm -rf fonts
```

## 기본 쉘 변경하기
`macOS Catalina` 부터는 `Zsh`을 기본 쉘로 사용합니다. 
Catalina 이전 버전의 사용자 또는 최신버전을 설치하고 싶은 경우 Homebrew을 이용하여 Zsh를 설치하십시오.

```bash Bash
brew update
brew install zsh
zsh --version
zsh 5.8 (x86_64-apple-darwin18.7.0)

chsh -s $(which zsh)
chsh: /usr/local/bin/zsh: non-standard shell
```

### Oh My Zsh 프레임워크 설치
[Oh My Zsh](https://github.com/ohmyzsh/ohmyzsh)은 Zsh를 관리하기 위한 프레임워크로 Zsh를 사용자라면 대부분 설치합니다.

```zsh Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

#### Zsh 플러그인 설치
Zsh 활용에 도움이 되는 플러그인을 설치합니다. `$ZSH` 또는 `$ZSH_CUSTOM` 환경변수 경로에 플러그인을 추가할 수 있습니다.

보다 더 많은 Zsh 플러그인을 찾고 싶다면 [Oh My Zsh - Plugins](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins) 또는 [awesome-zsh-plugins](https://github.com/unixorn/awesome-zsh-plugins)를 참고해보십시오.

```zsh Zsh
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions $ZSH_CUSTOM/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-completions $ZSH_CUSTOM/plugins/zsh-completions


vi ~/.zshrc
plugins=( git osx zsh-syntax-highlighting zsh-autosuggestions zsh-completions )

# (optional)
brew install bat fd fzf
vi ~/.zshrc
plugins=(... bat fd fzf )
```

만약, `zsh-autosuggestions`가 동작하지 않는다면 터미널의 [색상과 관련된 문제](https://github.com/zsh-users/zsh-autosuggestions/issues/416#issuecomment-486516333)일 수 있습니다.

#### Zsh 테마 설치
Oh My Zsh의 [기본 테마](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)와 [커스텀 테마](https://github.com/ohmyzsh/ohmyzsh/wiki/External-themes)를 다운받아 사용할 수 있습니다.

![](https://raw.githubusercontent.com/romkatv/powerlevel10k/master/powerlevel10k.png)

```zsh Zsh
# Agnoster
git clone https://gist.github.com/3712874.git
mv 3712874/agnoster.zsh-theme $ZSH_CUSTOM/themes/
rm -rf 3712874

# bullet-train
wget https://raw.githubusercontent.com/caiogondim/bullet-train.zsh/master/bullet-train.zsh-theme -P $ZSH_CUSTOM/themes/

# powerlevel10k
git clone https://github.com/romkatv/powerlevel10k.git $ZSH_CUSTOM/themes/powerlevel10k

vi ~/.zshrc
ZSH_THEME="random"
#ZSH_THEME="agnoster"
#ZSH_THEME="powerlevel10k/powerlevel10k"
#ZSH_THEME="bullet-train"

# 만약, 여러가지 테마를 랜덤으로 사용하고 싶다면 "$ZSH/themes" 하위 경로에 테마가 위치하여야 합니다.
cp $ZSH_CUSTOM/themes/agnoster.zsh-theme $ZSH/themes/agnoster.zsh-theme
cp $ZSH_CUSTOM/themes/bullet-train.zsh-theme $ZSH/themes/bullet-train.zsh-theme
cp $ZSH_CUSTOM/themes/powerlevel10k $ZSH/themes/powerlevel10k
ZSH_THEME_RANDOM_CANDIDATES=( "agnoster" "powerlevel10k/powerlevel10k" "bullet-train" )
```

### 기본 터미널 프로파일 변경
Powerline 문자를 사용하는 Oh My Zsh 테마의 경우 터미널이 제대로 표시되지 않거나 글자가 깨지는 문제가 있을 수 있습니다. 사전 작업에서 설치하였던 Powerline 폰트를 `기본 터미널(Terminal.app)`에서 사용하도록 프로파일을 변경합니다.

![](/tips/images/macos-terminal-app-default.png)

#### 컬러 프리셋 
[macos-terminal-themes](https://github.com/lysyi3m/macos-terminal-themes)에서 원하는 컬러 프리셋을 터미널 > 환경설정 > 프로파일에 추가합니다.

#### Powerline 폰트
터미널 > 환경설정 > 프로파일에서 폰트를 `Roboto Mono for Powerline`으로 변경합니다.

![](/tips/images/macos-terminal-app-profile.png)

## 기본 터미널 앱 변경하기
`iTerm2`는 기본 `Terminal.app`을 대체할 수 있는 터미널 에뮬레이터입니다. 이미 많은 사용자들이 Oh My Zsh과 함께 iTerm2를 터미널로 이용합니다.

### iTerm2 설치
[iTerm2](https://www.iterm2.com/) 홈페이지에서 `iTerm.app`을 다운받아 설치합니다.

### 컬러 스키마 변경
[iTerm Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes)에서 원하는 컬러 스키마를 Preferences > Profiles > Colors > Color Presets...에서 추가합니다.

#### 텍스트 설정
Preferences > Profiles > Text 메뉴에서 다음과 같이 설정합니다.
- Text Rendering > Use built-in Powerline glyphs
- Unicode > Unicode normalization form : NFC [한글깨짐 방지]
- Font > Roboto Mono for Powerline

![](/tips/images/macos-iterm2-terminal.png)

## 트러블슈팅
- [터미널 글씨가 깨져보여요](https://github.com/ohmyzsh/ohmyzsh/issues/1906#issuecomment-275733922)
- [iTerm2에서 한글이 정상적으로 표현되지 않아요](https://kldp.org/comment/634981#comment-634981)

## 참고  
- [Oh My Zsh - Installing ZSH](https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH)
- [Powerline Fonts](https://github.com/powerline/fonts)
- [Oh My Zsh - Plugins](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)
- [Awesome Zsh Plugins](https://github.com/unixorn/awesome-zsh-plugins#plugins)