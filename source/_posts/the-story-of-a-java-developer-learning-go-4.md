---
title: 자바 개발자가 Go를 배우는 이야기 4탄
date: 2021-02-15
---

자바 개발자가 Go를 배우는 이야기 4탄에서는 조금 쉬어가는 차원으로 Go에 대해서 좀더 알아봅시다.


## Go로 만들어진 프로젝트
깃허브에서 Go 언어를 기반의 리파지토리를 찾아보면 다음과 같은 프로젝트를 찾을 수 있습니다.

- [Docker](https://github.com/docker/docker-ce)
- [Kubernetes](https://github.com/kubernetes/kubernetes)
- [etcd](https://github.com/etcd-io/etcd)
- [Istio](https://github.com/istio/community)
- [Traefik](https://github.com/traefik/traefik)
- [Flannel](https://github.com/coreos/flannel)
- [Github CLI](https://github.com/cli/cli)
- [Grafana](https://github.com/grafana/grafana)
- [fzf](https://github.com/junegunn/fzf)
- [Go Ethereum](https://github.com/ethereum/go-ethereum)
- [Influxdb](https://github.com/influxdata/influxdb)
- [Vault](https://github.com/hashicorp/vault)
- [Node Version Manager for Windows](https://github.com/coreybutler/nvm-windows)

> `fzf`가 Go로 만들어졌었네요?

## Go 특별한 함수
Go 언어에는 두개의 특별한 함수가 있습니다. 바로 `main`과 `init` 인데요. 먼저, main 패키지에 선언된 main 함수는 실행 가능한 프로그램의 진입점이 되는 함수로 사용됩니다. Go 언어로 만들어지는 실행 프로그램은 하나의 main 패키지가 있어야하고 그 패키지에는 main 함수가 작성되어야합니다. 그러면 Go 런타임은 프로그램을 실행할 때 자동으로 main 함수를 호출하게 됩니다.

두번째로 init 함수는 모든 패키지에 선언될 수 있으며 패키지를 초기화하는 함수가 됩니다. 패키지가 포함될 때 자동으로 init 함수가 호출되므로 main 함수처럼 명시적으로 호출하지 않습니다.

## Go 모듈
[Go 모듈(Modules)](https://blog.golang.org/using-go-modules)은 의존성 라이브러리들을 관리하기 위한 기능입니다. 모듈은 프로젝트 루트 경로에 위치하는 `go.mod` 파일에 저장된 패키지 모음이며 패키지 경로와 함께 버전을 작성하여 의존성 요구사항을 정의할 수 있습니다.

> Go 1.13부터는 모듈 모드가 기본값입니다.

### Go 모듈 파일 생성
go.mod 파일을 생성하기 위해서는 `go mod init` 명령어를 사용합니다. 이때 모듈의 이름을 github.com/username/repo로 만들면 깃허브 리파지토리에 저장된 소스코드를 `go get` 명령어로 패키지를 다운로드 받을 수 있습니다.

예를 들어, gin이라는 Go로 작성된 웹 프레임워크 패키지를 다운로드 받고자 하면 다음과 같이 수행합니다.

```sh
go get -u github.com/gin-gonic/gin
```

모듈 모드를 사용하더라도 실제로 패키지가 다운로드되는 경로는 GOPATH 입니다.

### Vendor 폴더
Go 모듈 명령어 중 `go mod vendor`가 있습니다. 이 명령어는 현재 프로젝트 폴더에 있는 `go.mod`에 정의된 의존성에 따라 GOPATH에 다운로드 되어있는 패키지를 프로젝트 폴더의 vendor 폴더로 복사하는 기능입니다.

> [Kubernetes](https://github.com/kubernetes/kubernetes)에서도 vendor 폴더를 사용합니다.

### 사용하지 않는 의존성 제거
`go mod tidy` 명령어는 프로젝트에서 사용하지 않는 패키지에 대하여 go.mod에 정의된 부분을 없애는 기능을 제공합니다. 


## Go 가비지 컬렉션
고 언어는 자바와 같은 `가비지 컬렉션(Garbage Collection)` 기능을 포함하고 있습니다. 그래서 C 언어와는 다르게 메모리를 할당하고 해제하는 과정에서 벗어날 수 있게 됩니다. 그럼 자바의 GC와 동일하게 수행할까요? 찾아보았습니다.

자바는 [Java Garbage Collection | Naver D2](https://d2.naver.com/helloworld/1329) 글에서 확인할 수 있듯이 여러 방식의 GC를 설정할 수 있도록 옵션을 지원하지만, Go는 [Go 언어의 GC에 대해 | Line Engineering](https://engineering.linecorp.com/ko/blog/go-gc/)에서 설명하는 것처럼 빠르게 GC를 수행하기 위하여 Concurrent Mark & Sweep 방식만 지원한다고 하네요.

[Go GC: Prioritizing low latency and simplicity | The Go Blog](https://blog.golang.org/go15gc)
[Go GC: Solving the Latency Problem | GopherCon 2015](https://www.youtube.com/watch?v=aiv1JOfMjm0)

> Go에서 GC에 대한 관점은 GC로 인한 지연 시간이 길면 안된다는 것 같습니다.

### GOGC 환경변수
GO의 환경변수 GOGC는 가비지 컬렉터가 GC를 수행하는 기준을 설정합니다. 기본값은 100이며 현재 힙 메모리가 지난 실행 시점보다 2배가 되면 GC가 동작합니다.

> 당장은 GOGC 환경변수를 설정할 이유가 없지만 언젠가는 설정해보는 날이 오기를...

자바 개발자가 Go를 배우는 이야기 4탄에서는 Go에 대해서 좀더 알아보는 시간을 가졌습니다. 여기까지 글을 작성하고나서 보니 1탄부터 4탄까지 글의 앞뒤가 없는 것 같습니다. 다시 정리해야할듯...?

감사합니다.