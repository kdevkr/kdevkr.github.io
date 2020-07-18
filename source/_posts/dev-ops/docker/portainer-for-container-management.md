---
  title: Docker - 컨테이너 관리를 위한 Portainer
  date: 2020-07-18
  categories:
    - Docker
  tags:
    - Docker Management
    - Portatiner
---

## 들어가며
기본적으로 도커 컨테이너를 관리하기 위해서는 터미널 환경에서 도커 CLI를 이용해야 합니다. 그러나 도커 CLI로 모든 컨테이너와 볼륨, 네트워크등을 관리하기에는 불편한 부분이 많습니다. 그래서 도커 컨테이너를 쉽게 관리할 수 있는 솔루션이 필요해보입니다.

도커 컨테이너 관리를 위한 솔루션에는 다음과 같은 것들이 있습니다.

- [Kitematic](https://github.com/docker/kitematic)  
- [Dockstation](https://dockstation.io/)  
- [Portainer.io](https://www.portainer.io/)  

`Kitematic`과 `Dockstation`는 데스크탑 환경의 도커 관리 도구입니다. 윈도우와 MacOS에서는 kitematic 보다 더 나은 `Docker Desktop`을 제공합니다.

## Portainer
`Portainer`는 데스크탑 환경이 아닌 웹 기반의 도커 관리 애플리케이션입니다. 리눅스와 같은 서버 환경에서는 데스크탑 애플리케이션을 이용할 수 없으므로 웹 기반의 포테이너를 이용해봅시다.

```sh
$ docker volume create poratiner_data
$ docker run -d --name=portainer -p 9999:9000 -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer
```

### 포테이너 웹
포테이너에 접근할 수 있는 사용자를 생성하고 팀 단위로 관리할 수 있는 호스트 앤드포인트 및 컨테이너, 볼륨 등에 대한 권한을 설정할 수 있습니다.

먼저, 포테이너 웹 주소에 접근하여 초기 관리자 비밀번호를 설정합니다.

![](/dev-ops/images/portainer-init.png)

관리하고 싶은 유형 중 `Local`을 선택하여 로컬호스트 도커 환경으로 연결합니다.

![](/dev-ops/images/portainer-init-local.png)

#### 포테이너 사용자 추가
기본적으로 제공하는 관리자 계정 대신하여 포테이너 웹을 이용할 수 있도록 일반 사용자를 추가하겠습니다. 물론 사용자를 추가하면서 관리자 권한을 부여할 수 있습니다.

![](/dev-ops/images/portainer-new-user.png)

#### 포테이너 팀 구성
포테이너는 팀이라는 사용자 그룹 기능을 제공합니다. 팀을 만들어 다수의 사용자를 추가하여 공통적으로 관리할 수 있도록 제공합니다.

![](/dev-ops/images/portainer-new-team.png)

그리고 로컬 앤드포인트에 대해서 public 팀이 접근할 수 있는 권한을 부여합니다.

![](/dev-ops/images/portainer-create-access-to-endpoint.png)

이제 mambo 사용자로 접속하여 Local 환경에 접근합니다.

![](/dev-ops/images/portainer-home.png)

Local 환경에 대한 정보로는 컨테이너와 볼륨이 존재하는 걸 확인할 수 있습니다. 그러나 아래와 같이 컨테이너 또는 볼륨에 대한 정보를 확인하기 위하여 메뉴로 진입하면 존재하지 않습니다.

![](/dev-ops/images/portainer-empty-containers.png)

컨테이너와 볼륨 같이 몇가지 항목에 대해서는 별도의 권한을 설정해야 합니다. 기존 컨테이너에 대한 권한을 부여하고 싶은 경우 관리자 계정을 통해 컨테이너의 Ownership을 설정하시기 바랍니다.

### 컨테이너 관리
포테이너는 도커 환경을 모니터링할 수 있는 기능 뿐만 아니라 도커 호스트에 접근하지 않고 컨테이너를 생성하고 삭제하기까지의 컨테이너 관리 기능을 제공합니다.

예를 들어, Redis 컨테이너를 생성하고 싶다면 다음과 같이 Redis 이미지를 설정하고 도커 환경에서 노출할 포트를 입력합니다.

![](/dev-ops/images/portainer-create-container.png)

컨테이너 생성 시 입력한 것은 결국 다음과 같이 도커 CLI 명령어를 수행한 것과 같습니다.

```zsh
$ docker -d --name redis -p 6379:6379 redis:alpine
```

생성한 Redis 컨테이너에 대한 정보를 확인해보도록 하겠습니다.

![](/dev-ops/images/portainer-container.png)

이제 Portainer를 통해 컨테이너를 생성부터 삭제까지 라이프사이클을 관리할 수 있게 되었습니다.

> 포테이너는 몇가지 추가적인 익스텐션 기능을 라이센스 비용을 지불하고 추가할 수 있습니다. 예를 들어, 역할 기반의 접근 제어를 부여하고 싶거나 도커 레지스트리 서버를 관리하고 싶은 경우 해당 익스텐션을 구매하면 됩니다.
> https://www.portainer.io/product-category/portainer-extensions/

## 참고
- [Portainer.io](https://www.portainer.io/)
