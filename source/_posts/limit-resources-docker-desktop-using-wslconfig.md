---
title: 도커 데스크탑이 사용하는 WSL 리소스 제한하기
date: 2021-08-13
tags:
- WSL
- Docker Desktop
---

안녕하세요 Mambo 입니다. 

오늘은 **윈도우 환경의 도커 데스크탑에서 사용하는 WSL 리소스를 제한하는 방법**에 대하여 공유하고자 합니다. 윈도우에서 도커 데스크탑을 사용할 때 컴퓨터가 느려진다는 느낌을 받았다면 이 방법을 사용해서 점유하는 리소스를 제한하도록 설정하셔야합니다.

## Docker Desktop WSL2

![](../images/posts/docker-desktop-wsl-config-01.png)

윈도우 10 환경의 도커 데스크탑은 WSL2 기반의 엔진으로 동작할 수 있도록 지원하고 있고 이로 인해서 윈도우의 CPU 또는 메모리등을 효율적으로 사용할 수 있게 되었습니다. 그런데 도커를 사용하여 여러개의 컨테이너를 실행하다보면 컴퓨터 성능이 점점 느려지는 것을 체감할 수 있었을텐데요. 이는 현재 WSL2가 점유하여 사용하고 있던 메모리와 같은 리소스를 제대로 반환하지 못해서 발생한 문제입니다.

[WSL 2 consumes massive amounts of RAM and doesn't return it](https://github.com/microsoft/WSL/issues/4166)

아직 해결되지 않은 문제이기는 하나 댓글 중 [WSL2 VM이 점유하는 리소스를 제한하는 방법](https://github.com/microsoft/WSL/issues/4166#issuecomment-526725261)을 소개하는 개발자가 있으며 이 방법을 사용하면 도커 데스크탑이 제한된 내에서 메모리를 사용할 수 있게 되어 느려지는 현상을 보완할 수 있습니다.

## WSL Configuration

![](../images/posts/docker-desktop-wsl-config-02.png)

이미 도커 데스크탑 설정에서는 WSL2를 사용하고 있는 경우 `.wslconfig` 파일을 사용하여 CPU 또는 메모리를 제한할 수 있다고 알려주고 있습니다. 

### .wslconfig 정의
먼저 윈도우 사용자 폴더 위치에서 .wslconfig 파일을 만들기 위해서 VSCode를 사용하여 열고 저장합니다.

![](../images/posts/docker-desktop-wsl-config-03.png)

위 명령을 통해 VSCode으로 열린 .wslconfig 파일에 다음과 같이 입력합니다.

```plain
[wsl2]
memory=4GB
processors=2
swap=0
```

그리고 이 설정을 적용하기 위해해서 도커 데스크탑을 종료하고 **PowerShell**을 관리자 권한으로 실행한 다음 **LxssManager**를 다시 실행합니다.

![](../images/posts/docker-desktop-wsl-config-04.png)

### 비교해보기
다음은 WSL2의 기본 설정인 경우와 .wslconfig을 정의해서 WSL2에서 사용할 리소스(메모리 2GB)를 제한했을경우를 비교한 것입니다.

![](../images/posts/docker-desktop-wsl-config-05.gif)

컨테이너를 실행할때마다 메모리가 올라가면서 4GB를 점유한 것을 보여주는데요.

![](../images/posts/docker-desktop-wsl-config-06.png)

위 화면처럼 도커 데스크탑의 이미지와 볼륨을 전부 삭제했음에도 불구하고 **WSL2에서 점유중인 메모리의 일부는 반환되지 않고 있음**을 보여줍니다. 결국 깃허브 이슈처럼 WSL2에서 메모리 반환이 원활하지 않다는 것을 보여줍니다. 

이제 WSL2에서 점유하여 사용하게 될 리소스를 설정하고 컨테이너를 실행해보았을 경우입니다.

![](../images/posts/docker-desktop-wsl-config-07.gif)

컨테이너를 실행하더라도 WSL2에서 할당하는 메모리는 2GB를 넘지않게 됨을 확인할 수 있습니다.

### WSL2 구성의 기본값 검토
.wslconfig 파일을 정의하지 않았을때 어떤 값을 WSL2에서 사용하게 되는지 알아보죠. 

![](../images/posts/docker-desktop-wsl-config-08.png)

기본적으로 프로세서는 전부 사용한다고 하며 메모리는 총 메모리의 절반 또는 8GB 중 작은쪽으로 설정됩니다. 저의 경우는 32GB의 메모리이므로 메모리의 절반보다 작은 8GB가 설정되게 됩니다. 만약, 16GB이라면 동일하게 8GB이므로 **무려 총 메모리의 절반이나 점유**할 수 있게 되고 컨테이너를 종료하더라도 일부의 메모리는 점유하고 있을 수 있다는 이야기입니다.

이상으로 윈도우 환경의 도커 데스크탑에서 사용하는 WSL 리소스를 제한하는 방법에 대해서 알아보았습니다.

감사합니다.