---
  title: K8S - 쿠버네티스 클러스터 설치하기
  date: 2020-07-18
  categories:
    - Kubernetes
  tags:
    - Cluster
---

![](/images/logo/kubernetes.jpg)

## 들어가며
도커와 같은 컨테이너 기반의 환경은 애플리케이션을 배포하는 것에 대한 편리한 장점이 있으나 다수의 컨테이너를 관리하는데에는 어려움이 많습니다. 쿠버네티스(k8s)는 다수의 컨테이너로 구성된 애플리케이션을 자동으로 배포, 스케일링 및 관리해주는 오픈소스 시스템입니다. 쿠버네티스에 대한 학습을 시작하기 위해 로컬 환경에 쿠버네티스 클러스터를 설치해보려고 합니다.

## 쿠버네티스 클러스터
쿠버네티스 클러스터(Kubernetes Cluster)는 컨테이너화된 애플리케이션을 실행할 수 있는 환경입니다. 쿠버네티스 클러스터를 구현한 프로젝트에는 다음과 같은 것들이 있습니다.

**로컬 환경을 위한 경량화 클러스터**
- [Minikube](https://minikube.sigs.k8s.io/docs/)
- [k3s](https://github.com/rancher/k3s)
- [MicroK8s](https://github.com/ubuntu/microk8s)

**프로덕션 환경을 위한 클러스터**
- [kops](https://kops.sigs.k8s.io/)
- [kubeadm](https://github.com/kubernetes/kubeadm)
- [kubespray](https://github.com/kubernetes-sigs/kubespray)

### 학습을 위한 클러스터 설치
로컬 환경에서는 사용할 수 있는 자원이 제한적이므로 경량화 쿠버네티스 클러스터를 설치하는 것이 좋습니다. 윈도우 또는 Mac 환경이라면 `Docker Desktop`에서 단일 쿠버네티스 클러스터를 지원합니다.


리눅스에서는 다음의 경량화 쿠버네티스 클러스터를 설치하는 것을 추천합니다.

#### Minikube
미니큐브(Minikube)는 쿠버네티스 그룹에서 쿠버네티스 학습을 위해 지원하는 로컬 쿠버네티스 클러스터입니다.

```zsh
$ curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
$ sudo install minikube-linux-amd64 /usr/local/bin/minikube
$ minikube version
minikube version: v1.12.1

$ minikube start
😄  Ubuntu 20.04 위의 minikube v1.12.1
✨  자동적으로 docker 드라이버가 선택되었습니다
👍  Starting control plane node minikube in cluster minikube
🚜  Pulling base image ...
💾  Downloading Kubernetes v1.18.3 preload ...
    > preloaded-images-k8s-v4-v1.18.3-docker-overlay2-amd64.tar.lz4: 526.27 MiB
🔥  Creating docker container (CPUs=2, Memory=2200MB) ...
🐳  쿠버네티스 v1.18.3 을 Docker 19.03.2 런타임으로 설치하는 중
🔎  Verifying Kubernetes components...
🌟  Enabled addons: default-storageclass, storage-provisioner
🏄  끝났습니다! 이제 kubectl 이 "minikube" 를 사용할 수 있도록 설정되었습니다
💗  Kubectl not found in your path
👉  You can use kubectl inside minikube. For more information, visit https://minikube.sigs.k8s.io/docs/handbook/kubectl/
💡  For best results, install kubectl: https://kubernetes.io/docs/tasks/tools/install-kubectl/

$ minikube status
```

#### Microk8s
MicroK8s는 우분투 리눅스 환경에서 snap 패키지를 사용하여 쉽게 설치할 수 있습니다.

```zsh
$ snap install microk8s --classic
$ sudo microk8s start
```

### 쿠버네티스 클러스터 정리하기
더이상 학습을 하지 않을 예정이라면 사용했던 클러스터에 대한 정보를 정리합니다.


#### Minikube
```zsh
$ minikube stop                  
✋  Stopping "minikube" in docker ...
🛑  Powering off "minikube" via SSH ...
🛑  Node "minikube" stopped.

$ minikube delete
🔥  docker 의 "minikube" 를 삭제하는 중 ...
🔥  Deleting container "minikube" ...
🔥  Removing /home/mambo/.minikube/machines/minikube ...
💀  "minikube" 클러스터 관련 정보가 모두 삭제되었습니다
```

#### Microk8s
```zsh
$ sudo microk8s stop
Stopped.
```

이번 글에서는 쿠버네티스를 배우기 위하여 쿠버네티스 클러스터를 시작해보았습니다. 이제 실행되어있는 쿠버네티스 클러스터와 어떻게 커뮤니케이션을 하여 클러스터 상태를 정의하는지 알아보아야 합니다.

다음 내용은 [큐브컨트롤을 이용하여 클러스터와 통신하기](../communicate-k8s-cluster-using-kubectl)에서 이어집니다.

## 참고
- [Kubernetes Docs](https://kubernetes.io/ko/docs)
