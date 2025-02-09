---
title: 그래들 프로젝트의 멀티 모듈 충돌 이슈
date: 2025-01-21T23:00+09:00
tags:
- Gradle
- Submodule
---

```powershell Terminal
# https://github.com/kdevkr/multi-module-demo
multi-module-demo
├─backend
│  ├─build.gradle
│  └─settings.gradle
└─module-common
```

위와 같이  <u>깃 서브 모듈로 관리되는 공통 모듈</u>을 상위 폴더로 바라보는 백엔드 모듈이 존재하는 프로젝트 구성일 때 인텔리제이로 프로젝트를 여는 경우 아래와 같이  <u>Gradle 빌드 스크립트를 찾았습니다</u> 팝업 메시지가 제공되고 로드 버튼을 선택하면  <u>backend 과 module-common 이 별도의 루트 모듈로 개별 등록</u>됩니다. 

![Gradle build script found](/images/posts/gradle-multi-module-issue/01.png)

그래들 프로젝트로 전환되었지만  <u>backend 모듈에서 module-common 모듈의 패키지를 찾을 수 없는 문제를 해결하기 위해서</u> 프로젝트 구조 설정을 변경하려는 경우 아래와 같이  <u>module-common 에 대한 충돌로 인해 변경된 설정을 적용할 수 없는 증상</u>이 생기게 됩니다. 이 문제를 해결하기 위해서 .idea 폴더 아래에 존재하는 modules.xml 파일을 수정해보았지만 프로젝트 구조에는 그대로 유지되었습니다. 따라서, .idea 폴더를 삭제하고 새롭게 프로젝트를 열어야 합니다.

![](/images/posts/gradle-multi-module-issue/02.png)

인텔리제이를 종료한 후  <u>프로젝트 폴더에 존재하는 .idea 폴더를 삭제</u>하고 인텔리제이로 프로젝트 폴더를 여는 경우 Gradle 빌드 스크립트를 찾았습니다 메시지를 무시하고 다음과 같이 build.gradle 파일을 찾아  <u>Gradle 프로젝트 연결</u>을 선택하여 그래들 프로젝트로 전환하는 것이 좋습니다.

![build.gradle - Gradle 프로젝트 연결](/images/posts/gradle-multi-module-issue/03.png)

![설정 - 프로젝트 구조 - 모듈](/images/posts/gradle-multi-module-issue/04.png)

이제 그래들 프로젝트로 전환된 상태의 module-common은 루트 모듈이 아닌 backend 모듈의 settings.gradle로 인해 자동으로 등록되므로 backend 하위에만 위치하는 것을 확인할 수 있습니다. 이와 같이  <u>프로젝트의 두 모듈은 동일한 콘텐츠 루트를 공유할 수 없습니다.</u> 를 경험하는 분들이 있다면 해결에 도움이 되기를 바랍니다.