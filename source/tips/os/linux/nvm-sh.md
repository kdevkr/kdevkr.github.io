---
  title: NVM-SH
  description: Node Version Manager
---

> https://github.com/nvm-sh/nvm

프로젝트마다 Node.js 버전에 대한 호환성이 다를 수 있다. 이때, 노드 버전 관리 도구를 사용하면 쉽게 사용하려는 노드 버전을 변경할 수 있다.

## 설치  
NVM을 설치하기 위하여 curl 또는 wget을 통하여 설치용 쉘 스크립트를 다운로드하자.

```sh
# install nvm sciprt.
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

설치된 NVM을 환경변수로 등록하자.
```sh
# add source snippet in ~/.zshrc.
vi ~/.zshrc

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

NVM 설치 여부를 확인하고 NVM을 사용하여 노드 버전을 지정한다.
```sh
nvm --version
node -v

# v10.21.0
```
