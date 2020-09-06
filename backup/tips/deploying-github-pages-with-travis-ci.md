---
title: Travis CI로 Github Pages 배포하기
description: 블로그 자동 빌드 및 배포 환경 구성
---

## 👨‍💻 들어가며
Hexo 기반으로 만들어지는 정적 사이트를 깃허브에 배포하기 위해서는 [Git Deployer](https://github.com/hexojs/hexo-deployer-git)이라는 배포 플러그인을 사용해야합니다. 이 글에서는 Git Deployer와 [Travis CI](https://travis-ci.org/)를 연계하여 `Github Pages`를 자동으로 배포하는 환경을 구성해봅니다.

## Github Pages 배포
Travis CI를 통해 Github Pages를 배포하기 위해서는 Github Apps를 이용하여 Travis CI를 사용하고 Travis CI에서 빌드 시 참고하는 `.travis.yml` 파일을 구성해야합니다.

### Install Travis CI for Github Apps
가장 먼저 [travis-ci](https://github.com/apps/travis-ci) 앱 페이지에서 Travis CI를 설치합니다.

#### 1. Install 버튼을 통해 Github Apps에 Travis CI 설치를 시작합니다.

![github-pages-travis-ci-01](/images/etc/github-pages-travis-ci-01.png)  

#### 2. Travis CI에 리포지토리를 추가합니다.

![github-pages-travis-ci-02](/images/etc/github-pages-travis-ci-02.png)  

#### 3. Install 버튼을 통해 설치를 완료합니다.

![github-pages-travis-ci-03](/images/etc/github-pages-travis-ci-03.png)  

#### 4. Travis CI 앱이 깃허브 계정에 접근할 수 있도록 권한 승인을 합니다.

![github-pages-travis-ci-04](/images/etc/github-pages-travis-ci-04.png)  

#### 5. 잠시 후 Travis CI로 이동되며 앞서 추가한 리포지토리를 확인합니다.

![github-pages-travis-ci-05](/images/etc/github-pages-travis-ci-05.png)  

### Setting the GitHub token
Travis CI 앱에서 리파지토리를 접근할 때 사용할 액세스 토큰을 발행해야합니다.

#### 1. Github Account > Settings > Developer settings로 들어갑니다.

![github-pages-access-token-01](/images/etc/github-pages-access-token-01.png)  

#### 2. Personal access tokens 메뉴를 통해 새 토큰을 발행합니다.

![github-pages-access-token-02](/images/etc/github-pages-access-token-02.png)  

#### 3. 스코프는 public_repo 또는 repo를 선택합니다.

![github-pages-access-token-03](/images/etc/github-pages-access-token-03.png)  

#### 4. Travis CI의 리포지토리 설정에 들어갑니다.

![github-pages-access-token-04](/images/etc/github-pages-access-token-04.png)  

#### 5. 발행한 액세스 토큰을 Travis CI의 환경 변수에 추가합니다.

![github-pages-access-token-05](/images/etc/github-pages-access-token-05.png)  

### Travis CI Build Script
Travis CI에서 리파지토리 접근을 위한 액세스 토큰을 설정하였으므로 이제 빌드 스크립트를 작성해야합니다.

```yml .travis.yml
language: node_js

node_js:
  - "lts/*" # 사용하고 싶은 node.js 버전을 지정합니다.  

branches:
  only:
  - local # 소스 파일이 존재하는 브랜치입니다. 참고 문서에서는 source이지만 저는 local를 사용해왔습니다.

before_install:
- npm install -g hexo-cli

install:
- npm install

before_script:
- git config --global user.name kdevkr
- git config --global user.email kdevkr@gmail.com
- sed -i "s/__GITHUB_TOKEN__/${__GITHUB_TOKEN__}/" _config.yml

script:
- git submodule init
- git submodule update
- npm run b # 저는 자체 테마를 gitsubmodule로 등록되어 있기에 테마 파일을 빌드 해주었습니다.
- npm run p # hexo clean && hexo depoly -g
```

#### Git Deployer Plugin
이제 Hexo에서 배포시 사용할 Git Deployer 플러그인에 대한 설정을 진행합니다.

```yml _config.yml
deploy:
  type: git
  repo: https://__GITHUB_TOKEN__@github.com/kdevkr/kdevkr.github.io.git
  branch: master
```

Git Deployer에서 배포할 URL은 `https://<TOKEN>@github.com/<user>/<repo>`입니다. `__GITHUB_TOKEN__` 부분은 Travis CI 빌드 스크립트에서 sed 명령을 통해 환경 변수값으로 대체될 것입니다.

이제 리파지토리 원격 저장소의 로컬 브랜치가 변경되면 Travis CI가 자동으로 정적 사이트를 빌드하게 되어 정상적으로 통과됬다면 다음과 같이 표시가 되고 `master` 브랜치에 배포되었을 것입니다.  

![github-pages-travis-ci-06](/images/etc/github-pages-travis-ci-06.png)  

## 참고

- [GitHub Pages Deployment](https://docs.travis-ci.com/user/deployment/pages/)  
- [Travis CI를 이용한 Github Pages + Hexo 블로그 자동 배포하기](https://medium.com/@changjoopark/travis-ci%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-github-pages-hexo-%EB%B8%94%EB%A1%9C%EA%B7%B8-%EC%9E%90%EB%8F%99-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0-6a222a2013e6)  
- [travis ci를 이용한 hexo 자동 배포 구현하기](https://rkaehdaos.github.io/2018/10/07/autodeploy-hexo-github/)  
- [Auto Deploy Hexo.io to Github Pages With Travis CI](http://kflu.github.io/2017/01/03/2017-01-03-hexo-travis/)
