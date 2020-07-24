---
title: 우분투에서 유용한 터미널 환경 만들기
description:
---

![](/tips/images/ubuntu-terminal-neofetch.png)

회사에서는 MacOS를 사용하지만 집에서는 우분투를 설치하여 사용하고 있습니다. 그러므로 우분투에서 유용한 터미널 환경을 구성해보기로 합니다.

## 터미널 개선을 위한 사전작업

### apt-get
우분투와 같은 데비안(Debian) 계열의 리눅스는 패키지 관리 도구로 `apt-get`을 사용합니다.

```bash Bash
sudo apt-get update
sudo apt-get install build-essential curl file git
```

### Powerline Fonts
[Powerline fonts](https://github.com/powerline/fonts)에서 Powerline 문자가 포함된 폰트를 다운받아 설치합니다.

```sh Bash
sudo apt-get install fonts-powerline
```

## 기본 쉘 변경하기
최신 버전의 Zsh을 설치합니다. 앞서 사전 작업에서 설치한 Homebrew를 `.zshrc`에 추가합니다.

```bash Bash
sudo apt-get install zsh
echo 'export PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"' >>~/.zshrc
echo 'export MANPATH="/home/linuxbrew/.linuxbrew/share/man:$MANPATH"' >>~/.zshrc
echo 'export INFOPATH="/home/linuxbrew/.linuxbrew/share/info:$INFOPATH"' >>~/.zshrc
chsh -s $(which zsh)

# please restart terminal
$ echo $SHELL  
/usr/bin/zsh
```

### Oh My Zsh 프레임워크 설치
Zsh를 좀 더 효율적으로 사용하기 위해 [Oh My Zsh](https://github.com/ohmyzsh/ohmyzsh) 프레임워크를 설치합니다.

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
sudo apt-get install bat fd-find fzf
vi ~/.zshrc
plugins=(... bat fd fzf )
```

#### Zsh 테마 설치
Oh My Zsh의 [기본 테마](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)와 [커스텀 테마](https://github.com/ohmyzsh/ohmyzsh/wiki/External-themes)중에서 Agnoster와 Powerlevel10k 테마를 설치합니다.

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

# 만약, 여러가지 테마를 랜덤으로 사용하고 싶다면 "$ZSH/themes" 하위 경로에 테마가 위치하여야 합니다.
cp $ZSH_CUSTOM/themes/agnoster.zsh-theme $ZSH/themes/agnoster.zsh-theme
cp -r $ZSH_CUSTOM/themes/powerlevel10k $ZSH/themes/powerlevel10k
ZSH_THEME_RANDOM_CANDIDATES=( "agnoster" "powerlevel10k/powerlevel10k" )
```

### 기본 터미널 프로파일 변경

#### 컬러 프리셋
터미널 > 기본 설정 > 프로파일 > 색에서 시스템 테마 색 사용을 해제하고 `솔러라이즈 어두움`을 선택합니다.

[Gogh](https://github.com/Mayccoll/Gogh)에서 Solarized Dark를 선택하여 팔레트로 설정합니다.
```zsh Zsh
sudo apt-get install dconf-cli uuid-runtime
bash -c  "$(wget -qO- https://git.io/vQgMr)"
Enter OPTION(S) : 154

Theme: Solarized Dark
•••••••• ••••••••
```

#### Powerline 폰트
터미널 > 기본 설정 > 프로파일 > 텍스트에서 사용자 정의 글꼴 `Noto Mono for Powerline`으로 변경합니다.

![](/tips/images/ubuntu-terminal-profile.png)

## 참고  
- [Oh My Zsh - Installing ZSH](https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH)
- [Powerline Fonts](https://github.com/powerline/fonts)
- [Oh My Zsh - Plugins](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)
- [Awesome Zsh Plugins](https://github.com/unixorn/awesome-zsh-plugins#plugins)
