---
title: 컨테이너 오케스트레이션 이해하기
date: 2020-10-08
categories:
  - DevOps
tags:
  - Container Orchestration
  - Kubernetes
---

## Overview
현재 개발자들은 애플리케이션을 개발할 때 [`Docker`](https://www.docker.com/)와 같은 컨테이너를 활용합니다. 컨테이너 기반의 환경으로 인하여 특정 운영체제(리눅스 또는 윈도우)에 구애받지 않고도 애플리케이션을 실행할 수 있습니다. 그리고 개발된 애플리케이션은 컨테이너 오케스트레이션 도구인 쿠버네티스를 활용하여 배포 및 운영을 하기도 합니다. 저는 이 글을 통해 컨테이너와 컨테이너 오케스트레이션에 대해서 개념을 바로 잡고자 합니다.

## Docker
![](https://subicura.com/assets/article_images/2017-01-19-docker-guide-for-beginners-1/docker-logo.png#compact)

[왜 굳이 도커(컨테이너)를 써야 하나요?](https://www.44bits.io/ko/post/why-should-i-use-docker-container)라는 글을 통해 컨테이너를 써야하는 이유에 대해서 알 수 있습니다. 하나의 애플리케이션을 운영하는 경우 실행되는 운영체제 환경에 애플리케이션에서 의존하고 있는 라이브러리 또는 애플리케이션을 구성해야 합니다. 예를 들어, 자바 애플리케이션에서 사용하는 JDK를 설치해야 하는데 같은 리눅스라 하더라도 CentOS와 같은 레드햇 계열과 Ubuntu와 같은 데비안 계열의 리눅스에서 사용되는 패키지 관리자 도구가 다릅니다. 도커와 같은 컨테이너 기술을 이용하면 특정 리눅스 계열의 명령어를 수행하도록 이미지화할 수 있고 `컨테이너 런타임`이 실행되는 환경이라면 이미지화한 컨테이너를 구동할 수 있게 됩니다. 이것은 이미지화한 리눅스 컨테이너를 MacOS에서 구동할 수 있게 된다는 말과 같습니다.

[PWD](https://labs.play-with-docker.com/)를 통해 도커 환경에 대해 학습할 수 있습니다.

![](https://www.docker.com/sites/default/files/d8/styles/large/public/2018-11/Docker-Website-2018-Diagrams-071918-V5_a-Docker-Engine-page-first-panel.png?itok=TFiL1wtt#compact)

위 그림은 도커에서 사용되는 기술을 설명합니다. 그 중에서 Containerd 라는 것에 대해 눈길이 갑니다. 도커는 [Containerd](https://containerd.io/)라는 컨테이너 런타임을 내장하고 있습니다. 컨테이너 런타임은 컨테이너 이미지를 실행하고 관리하는 도구입니다. Containerd는 `CNCF:Cloud Native Computing Foundation`에서 Kubernetes, Prometheus, CoreDNS와 함께 관리되는 프로젝트 중 하나로 CRI 구현체입니다. 나중에 알아볼 쿠버네티스는 CRI(Container Runtime Interface)를 통해 컨테이너 런타임을 구성할 수 있습니다.   따라서, 도커 뿐만 아니라 Containerd를 독립적으로 구성할 수도 있으며 [CRI-O](https://cri-o.io/)을 컨테이너 런타임으로 사용할 수 있습니다.

PWD를 통해 생성되는 인스턴스에서 `docker version` 명령을 수행하면 도커 엔진에 대한 정보가 다음과 같이 출력됩니다.
```bash
$ docker version
Client: Docker Engine - Community
 Version:           19.03.11
 API version:       1.40
 Go version:        go1.13.10
 Git commit:        42e35e61f3
 Built:             Mon Jun  1 09:09:53 2020
 OS/Arch:           linux/amd64
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          19.03.11
  API version:      1.40 (minimum version 1.12)
  Go version:       go1.13.10
  Git commit:       42e35e61f3
  Built:            Mon Jun  1 09:16:24 2020
  OS/Arch:          linux/amd64
  Experimental:     true
 containerd:
  Version:          v1.2.13
  GitCommit:        7ad184331fa3e55e52b890ea95e65ba581ae3429
 runc:
  Version:          1.0.0-rc10
  GitCommit:        dc9208a3303feef5b3839f4323d9beb36df0a9dd
 docker-init:
  Version:          0.18.0
  GitCommit:        fec3683
```

위 정보에 따르면 도커는 컨테이너를 실행하고 관리하기 위하여 Containerd 뿐만 아니라 `runC`라는 [`OCI:Open Container Initiative`](https://opencontainers.org/) 표준의 도구도 같이 사용하는 것을 알 수 있습니다. 이제 우리는 컨테이너를 실행하고 관리하기 위하여 컨테이너 런타임이 필요하다는 것을 알게 되었습니다. 또한, 컨테이너 오케스트레이션 도구인 쿠버네티스를 구성할 때 컨테이너 런타임을 결정하는 것이 왜 필요한 지도 이해할 수 있게 되었습니다.

## Docker Compose

![](https://res.cloudinary.com/practicaldev/image/fetch/s--jqkSxP2w--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://code.scottshipp.com/wp-content/uploads/2019/06/docker-compose-logo.png#compact)  

애플리케이션을 도커 컨테이너 기반의 환경에서 실행함에 따라 애플리케이션에서 필요한 다른 애플리케이션을 컨테이너로 실행하면서 하나의 환경에서 실행되어야하는 컨테이너가 많아집니다. 도커에서는 [`Docker Compose`](https://docs.docker.com/compose/)를 통해 서로 의존성이 있는 다수의 컨테이너를 실행하고 관리될 수 있도록 지원합니다. `docker-compose.yaml`에 다수의 컨테이너 구성 정보를 기술함으로써 도커 컴포즈가 기술된 순서대로 컨테이너를 실행하고 관리합니다.

dockersamples에서 제공하는 [샘플 애플리케이션](https://github.com/dockersamples/example-voting-app)은 다음과 같은 컴포즈 기술 문서가 포함되어있습니다.
```yaml docker-compose.yml
version: "3.8"
services:

  redis:
    image: redis:alpine
    ports:
      - "6379"
    networks:
      - frontend
    deploy:
      replicas: 2
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure

  db:
    image: postgres:9.4
    environment:
      POSTGRES_USER: "postgres"
      POSTGRES_PASSWORD: "postgres"
      POSTGRES_HOST_AUTH_METHOD: "trust"
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend
    deploy:
      placement:
        max_replicas_per_node: 1
        constraints:
          - "node.role==manager"

  vote:
    image: dockersamples/examplevotingapp_vote:before
    ports:
      - "5000:80"
    networks:
      - frontend
    depends_on:
      - redis
    deploy:
      replicas: 2
      update_config:
        parallelism: 2
      restart_policy:
        condition: on-failure

  result:
    image: dockersamples/examplevotingapp_result:before
    ports:
      - "5001:80"
    networks:
      - backend
    depends_on:
      - db
    deploy:
      replicas: 1
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure

  worker:
    image: dockersamples/examplevotingapp_worker
    networks:
      - frontend
      - backend
    deploy:
      mode: replicated
      replicas: 1
      labels: [APP=VOTING]
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
        window: 120s
      placement:
        constraints:
          - "node.role==manager"

  visualizer:
    image: dockersamples/visualizer:stable
    ports:
      - "8080:8080"
    stop_grace_period: 1m30s
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    deploy:
      placement:
        constraints:
          - "node.role==manager"

networks:
  frontend:
  backend:

volumes:
  db-data:
```

위 컴포즈 문서를 도커 컴포즈 CLI를 통해 다수의 컨테이너를 실행할 수 있습니다.
```bash
$ docker-compose up
```

## Kubernetes
![](https://i0.wp.com/www.opennaru.com/wp-content/uploads/2019/07/kubernetes-horizontal-color.png?resize=300%2C73g#compact)

도커 컴포즈를 통해 다수의 컨테이너를 함께 관리할 수 있습니다. 그러나 실제 운영환경에서는 사용량이 증가하거나 감소함에 따라 자동으로 컨테이너를 확장하고 축소하는 기능이 필요해집니다. 복잡한 컨테이너 환경을 관리하기 위하여 컨테이너 오케스트레이션이 등장합니다. [`쿠버네티스`](https://kubernetes.io/)는 [도커 스웜](https://docs.docker.com/engine/swarm/)과 같은 컨테이너 오케스트레이션 도구 중 하나로 많은 서버 관리자가 사용하고 있습니다.

단, 쿠버네티스는 컨테이너 오케스트레이션에서 사용되는 개념에 대해 먼저 알아야하므로 [`초보를 위한 쿠버네티스 안내서`](https://www.youtube.com/watch?v=Ia8IfowgU7s)를 통해 컨테이너 오케스트레이션에 대해 배우는 것을 추천드립니다.

### Clusters
쿠버네티스 클러스터를 구성할 수 있는 도구에는 여러가지가 존재합니다. 

- Minikube
- MicroK8s
- Kops
- K3s
- kubeadm

쿠버네티스 학습 단계에서는 [Minikube](https://minikube.sigs.k8s.io/docs/)를 통해 학습 목적의 단일 노드 쿠버네티스 클러스터를 구성할 수 있습니다.

[Hello Minikube](https://kubernetes.io/ko/docs/tutorials/hello-minikube/)에서 Minikube에 의해 구성된 쿠버네티스에서 샘플 애플리케이션을 배포해볼 수 있습니다.

### Setup Kubernetes Cluster
쿠버네티스 클러스터를 구성하기 위해서는 kubeadm과 같은 쿠버네티스 클러스터 도구를 사용합니다. 이제 쿠버네티스 클러스터를 구성하는데 필요한 항목에 대해서 알아봅니다.

#### 1. Requirement
kubeadm는 다음의 기본 요구사항을 충족해야합니다.

- 2GB+ RAM
- 2+ CPUs
- Full network connectivity between all machines in the cluster
- Unique hostname, MAC address, and product_uuid for every node
- Certain ports are open on your machines
- Swap disabled. You MUST disable swap in order for the kubelet to work properly

위 요구사항을 종합하면 특정 이상의 호스트 자원이 필요하며 모든 클러스터 노드는 [유일한 주소 또는 이름](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#verify-mac-address)을 가져야하며 클러스터에서 사용되는 [특정 포트](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#check-required-ports)들을 사용할 수 있도록 오픈되어 있어야합니다. 쿠버네티스 구조 상 스왑 메모리는 사용하면 안됩니다. 

#### 2. Installing runtime
쿠버네티스는 기본적으로 CRI:Container Runtime Interface를 컨테이너 런타임으로 사용합니다. 그리고 특정한 컨테이너 런타임을 지정하지 않는다면 유닉스 도메인 소켓에서 컨테이너 런타임을 찾습니다.

- Docker : /var/run/docker.sock
- containerd : /run/containerd/containerd.sock
- CRI-O : /var/run/crio/crio.sock

만약, Docker와 containerd가 같이 발견될 경우 Docker를 우선적으로 사용하게 됩니다. 다만, 이외에 런타임이 동시에 발견된다면 쿠버네티스에서 오류가 발생합니다.

> kubeadm는 기본적으로 Docker를 컨테이너 런타임으로 사용합니다.

#### 3.Installing kubeadm, kubelet and kubectl

```sh
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

#### 4. Installing a Pod network add-on
쿠버네티스 클러스터내에서 관리되는 Pod들이 서로 통신할 수 있도록 CNI 기반의 네트워크 애드온을 설치해야합니다. 예를 들어, CoreOS의 [Flannel](https://github.com/coreos/flannel)은 호스트에서 사용하는 네트워크 주소와 겹치지 않도록 `10.244.0.0/16`을 네트워크 대역으로 사용하는 것을 권장합니다.

```sh
kubeadm init --apiserver-advertise-address=192.168.0.47 --pod-network-cidr=10.244.0.0/16
...
[addons] Applied essential addon: CoreDNS
...
You should now deploy a Pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  /docs/concepts/cluster-administration/addons/

# For Kubernetes v1.17+
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
podsecuritypolicy.policy/psp.flannel.unprivileged created
clusterrole.rbac.authorization.k8s.io/flannel created
clusterrolebinding.rbac.authorization.k8s.io/flannel created
serviceaccount/flannel created
configmap/kube-flannel-cfg created
daemonset.apps/kube-flannel-ds created

# kubectl get pods --all-namespaces
kubectl get po -A
NAMESPACE     NAME                              READY   STATUS              RESTARTS   AGE
kube-system   coredns-f9fd979d6-5smjr           0/1     ContainerCreating   0          22m
kube-system   coredns-f9fd979d6-t5nqq           0/1     ContainerCreating   0          22m
kube-system   etcd-desktop                      1/1     Running             0          22m
kube-system   kube-apiserver-desktop            1/1     Running             0          22m
kube-system   kube-controller-manager-desktop   1/1     Running             0          22m
kube-system   kube-flannel-ds-96psc             1/1     Running             0          28s
kube-system   kube-proxy-n54c9                  1/1     Running             0          22m
kube-system   kube-scheduler-desktop            1/1     Running             0          22m
```

> kubeadm을 통해 쿠버네티스 클러스터를 구성할 경우 CoreDNS를 서비스 디스커버리 애드온으로 사용합니다. 다만, 네트워크 애드온이 설치되기까지 실행되지 않습니다.

#### 5. Joining workers
쿠버네티스 클러스터는 컨테이너 또는 파드와 같은 워크로드를 실행할 노드를 추가할 수 있습니다. 이를 통해 다른 호스트 머신을 클러스터에 연결할 수 있습니다.

```sh
kubeadm join 192.168.0.47:6443 --token ypgbf7.6ta30q0x41tu3u71 --discovery-token-ca-cert-hash sha256:03f205f6264f85d2a6a7de36a0c75a31bd633d462000f551c3cb7440f2e07099
```

#### 6. Install Dashboard UI
```sh
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml
namespace/kubernetes-dashboard created
serviceaccount/kubernetes-dashboard created
service/kubernetes-dashboard created
secret/kubernetes-dashboard-certs created
secret/kubernetes-dashboard-csrf created
secret/kubernetes-dashboard-key-holder created
configmap/kubernetes-dashboard-settings created
role.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrole.rbac.authorization.k8s.io/kubernetes-dashboard created
rolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created

vi kubernetes-dashboard-admin-user.yml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dashboard-admin
  namespace: kube-system

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: dashboard-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: dashboard-admin
  namespace: kube-system

kubectl apply -f kubernetes-dashboard-admin-user.yml
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep dashboard-admin | awk '{print $1}')
```

```sh
kubectl create deployment kubernetes-bootcamp --image=gcr.io/google-samples/kubernetes-bootcamp:v1
```