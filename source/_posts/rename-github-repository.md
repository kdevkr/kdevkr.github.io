---
title: 깃허브 리포지토리 이름 변경해보기
date: 2025-01-22T23:00+09:00
tags:
- Git
- Github
- Submodule
---

#### 루트 프로젝트의 리포지토리 이름 바꾸기

[리포지토리 이름 바꾸기](https://docs.github.com/ko/repositories/creating-and-managing-repositories/renaming-a-repository)는 깃허브 리포지토리 설정에서 간단하게 변경할 수 있습니다. 깃허브의 리포지토리 이름을 바꾸더라도  <u>기존 주소에 대한 요청은 새로운 리포지토리 주소로 리디렉션되도록 지원</u>하므로 로컬에 존재하는 리포지토리의 URL은 변경하지 않아도 정상적으로 동작합니다. 그러나, 로컬에 존재하는  <u>프로젝트의 리포지토리 URL을 새로운 주소로 변경하는게 권장</u>되므로  <u>인텔리제이의 Git - 원격 관리</u> 또는  <u>터미널에서 아래의 명령어를 통해</u> 로컬에서 바라보는 URL을 다시 설정할 수 있습니다.

```sh Terminal
git remote set-url origin NEW_URL
```

#### 깃 서브모듈 이름 바꾸기

깃 서브모듈로 등록된 리파지토리의 이름이 변경되더라도  <u>다른 루트 프로젝트에서 관리되는 정보는 수동으로 다시 설정해야</u>하므로 조금 더 복잡한 과정이 필요합니다. 먼저, 기존에 등록된 서브 모듈의 폴더 이름을 변경하기보다  <u>등록된 서브 모듈을 제외하고 새로운 리포지토리 주소를 가지도록 서브 모듈을 다시 등록하는 과정을 수행</u>하는 걸 권장합니다.

```sh Terminal
# 기존 주소와 이름의 서브 모듈 제거
git rm -f [sub-module]
rm -rf .git/modules/[sub-module]
git config -f .git/config --remove-section "submodule.[sub-module]"

# 새로운 서브 모듈 이름과 주소로 추가
git submodule add [NEW_URL] [new-sub-module]
git submodule update --init [new-sub-module]
```

젠킨스와 같은 CI/CD 도구에서 루트 프로젝트를 통해 서브 모듈 프로젝트의 빌드 및 배포를 수행하는 경우 서브 모듈에 대한 경로와 관련된 명령어가 빌드 파이프라인에 포함될 수 있으므로 서브 모듈에 대한 깃허브 리포지토리 이름을 변경하는 경우에는 많이 신경써야할 수 있습니다.
