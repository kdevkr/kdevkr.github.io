---
title: 쿠버네티스 클러스터 구성하기
date: 2021-07-27
tags:
- Kubernetes
---

안녕하세요 Mambo 입니다.

이번 글의 주제는 **쿠버네티스 클러스터 구성하기**입니다. IT 인프라에 대한 전문 인력이 아닌 일반 개발자가 컨테이너 환경을 위한 쿠버네티스 클러스터를 이해하고 구성하기까지는 생각보다 많은 시간이 소요되는 것 같습니다. 단순히 도커를 사용하여 컨테이너를 실행하는 것은 어렵지 않아서 도커 컴포즈 문서를 정의해서 여러가지 인스턴스를 별다른 설정없이 간단하게 실행해왔습니다. 하지만, 애플리케이션을 배포하고 운영하기 위하여 컨테이너 인프라 환경을 쿠버네티스 클러스터로 구성하는 것은 IT 인프라에 대한 전문 지식이 필요합니다.

현재 다니고 있는 회사의 소속팀에서는 애플리케이션을 아마존 웹 서비스의 빈스톡(Beanstalk)을 사용하여 배포하고 운영하기 때문에 컨테이너 환경의 쿠버네티스 클러스터에 대한 학습이 필요하진 않았습니다.

> 물론, 쿠버네티스 클러스터 도입을 시도하긴 했습니다만... 현재 애플리케이션 규모 상 배보다 배꼽이 더 크다는 결과를 가진다고 판단하여 도입을 취소했습니다.

그러나 2021년 클라우드 플래그십 프로젝트 중 에너지 분야에 참여함으로써 현재 운영중인 애플리케이션을 클라우드 환경에서 컨테이너 환경으로 배포하고 운영하기 위하여 모놀리식 아키텍처로 개발된 애플리케이션의 일정 부분을 마이크로서비스 아키텍처로 변경하여 기능적으로 분리하는 작업을 진행중입니다. 이렇게 마이크로서비스 아키텍처로 분리되는 애플리케이션들은 나무기술의 **칵테일 클라우드**라고하는 PaaS를 통해 배포되고 운영될 예정입니다.

쿠버네티스 클러스터를 직접 구성하여 운영 및 관리를 수행하는 것은 아니지만 쿠버네티스 클러스터 기반의 컨테이너 인프라 환경을 이해하기 위해 쿠버네티스 클러스터를 직접 구성해보고 간단한 애플리케이션을 배포해보는 것을 학습하고 이 글을 통해 공유하고자합니다.

## 쿠버네티스 클러스터
쿠버네티스는 분산형 코디네이터인 주키퍼처럼 다수의 호스트가 서로 통신하여 클러스터를 구성하게되며 컨트롤 플레인 노드의 API 서버가 동작하게 되는 마스터 노드와 컨테이너를 실행하는 환경이 되는 워커 노드로 구분됩니다. 우리는 워커 노드와는 통신할 필요가 없으며 마스터 노드의 API 서버와 통신하여 클러스터를 제어하고 애플리케이션을 배포하게됩니다.

### 클러스터 구성의 어려움
쿠버네티스 클러스터를 구성하는게 어려운 이유는 IT 인프라 지식 뿐만 아니라 클러스터 구성을 위해 여러가지 오픈소스 기술이 사용된다는 점입니다. 쿠버네티스 클러스터 구성에 대한 서비스를 PaaS로 제공하는 [파스-타(PaaS-TA)](https://paas-ta.kr/intro/guideInstall) 또는 [칵테일 클라우드](https://www.cocktailcloud.io/main.do)도 **kubespray, istio** 등 여러가지 오픈소스를 결합한 솔루션을 만들어 제공하는 것입니다. 또한, 쿠버네티스 클러스터 운영 관리의 어려움으로 인하여 쿠버네티스 클러스터를 쉽게 구성하고 관리할 수 있는 AWS의 [Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html) 또는 구글 클라우드 플랫폼의 GKE와 같이 클라우드 서비스에서 쉽게 쿠버네티스 클러스터를 구성할 수 있는 서비스를 제공하는 이유이기도 합니다.

### 쿠버네티스 클러스터 배포 도구
쿠버네티스 클러스터를 구성할 수 있는 도구는 **kubeadm, kops, kubespray** 뿐만 아니라 IoT를 목적으로 경량화된 클러스터 구성을 목적으로하는 [k3s](https://k3s.io/), [MicroK8s](https://microk8s.io/)등 여러가지 오픈소스가 존재합니다. 저는 쿠버네티스 공식 문서에서도 가이드를 제공하고 온-프레미스 환경에서 일반적으로 많이 사용될 수 있는 기본적인 배포 도구인 `kubeadm`을 사용하여 쿠버네티스 클러스터를 구성하겠습니다.

> 본 글에서는 쿠버네티스 클러스터를 데비안 계열의 배포판인 우분투 리눅스를 사용합니다.

```sh 우분투 kubeadm 패키지 설치
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl

sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

위 명령어에 의해 설치된 패키지는 다음의 역할을 수행하게 되며 클러스터를 구성하는 모든 호스트에 설치해야합니다.

|패키지|용도|
|---|---|
|kubeadm|쿠버네티스 클러스터 배포|
|kubelet|컨트롤 플레인 노드와 통신하여 컨테이너가 파드에 실행될 수 있도록 도와주는 에이전트|
|kubectl|쿠버네티스 클러스터에 명령을 내리기 위해 사용하는 CLI|

> 본 글에서는 최신 버전의 **쿠버네티스 클러스터 1.21+** 를 사용합니다.
> 쿠버네티스 클러스터를 안정적으로 유지하기 위하여 주기적으로 쿠버네티스 클러스터의 버전을 업그레이드하는 것을 권장한다고 합니다.

### 컨테이너 인프라 환경의 가용성
쿠버네티스 클러스터 구성 가이드에 따르면 클러스터를 구성하게 되는 모든 호스트가 컨테이너 인프라 환경을 구성할 수 있는지 가용성을 확인해야합니다. 따라서, 이미 사용하고 있는 호스트 보다는 쿠버네티스 클러스터를 구성을 위한 별도의 호스트를 사용하는게 좋습니다.

#### 메모리 스왑 기능 비활성화
[Node swap support](https://github.com/kubernetes/enhancements/issues/2400)와 같이 쿠버네티스 클러스터에서 스왑 기능을 활성화하기 위한 작업을 진행중이지만 현재로선 **kubelet**이 정상적으로 동작하기 위해서는 반드시 우분투 리눅스의 메모리 스왑 기능을 비활성화 해야합니다.

```sh 우분투 메모리 스왑 비활성화
sudo swapoff -a && sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
```

#### 클러스터 노드의 고유 주소 확인
쿠버네티스 클러스터를 구성하는 호스트들이 서로 통신할 수 있도록 네트워크 환경에서 고유한 주소를 가지고 있는지 확인해야합니다. 쿠버네티스 클러스터에서는 각 노드를 **호스트의 MAC 주소** 및 **product_uuid**를 기준으로 구분한다고 합니다.

```sh MAC 주소 및 product_uuid 조회
sudo apt install net-tools
sudo ifconfig -a
sudo cat /sys/class/dmi/id/product_uuid
```

그리고 쿠버네티스 클러스터를 구성하는 호스트의 역할에 맞게 사용해야될 포트를 점유하고 있는지 확인해야합니다.

![](/images/posts/setup-kubernetes-cluster/setup-kubernetes-cluster-01.png)

#### 컨테이너 런타임 선택하기
쿠버네티스 클러스터에서 파드 안에 컨테이너를 실행하기 위해 사용하게 될 컨테이너 런타임을 선택하고 설치해야합니다. 쿠버네티스 클러스터를 구성하는 많은 글에서 도커를 컨테이너 런타임으로 사용하는 것으로 소개하고있지만 앞으로 최신 쿠버네티스 클러스터 버전에서는 [컨테이너 런타임 인터페이스를 준수하지 않는 도커](https://kubernetes.io/blog/2020/12/02/dont-panic-kubernetes-and-docker/)를 컨테이너 런타임으로 지원하지 않을 예정입니다. 따라서, 저는 [CRI-O](https://cri-o.io/)를 컨테이너 런타임으로 선택하고 설치하겠습니다.

CRI-O를 설치하기 전에 우분투의 iptables가 브릿지된 트래픽을 바라보도록 설정해야합니다.

```sh 오버레이 네트워크 및 iptables 브릿지 트래픽 활성화
cat <<EOF | sudo tee /etc/modules-load.d/crio.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system
```

위 작업이 완료되었다면 다음의 명령어로 CRI-O 관련 패키지를 설치합니다.

```sh CRI-O 관련 패키지 설치
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_20.04/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
echo "deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/1.21/xUbuntu_20.04/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable:cri-o:1.21.list

curl -L https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable:cri-o:1.21/xUbuntu_20.04/Release.key | sudo apt-key add -
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_20.04/Release.key | sudo apt-key add -

sudo apt-get update
sudo apt-get install -y cri-o cri-o-runc
sudo apt-mark hold cri-o cri-o-runc
sudo systemctl daemon-reload
sudo systemctl enable crio --now
```

#### 파드 네트워크 플러그인 결정하기
쿠버네티스 클러스터에 실행되는 파드에서 컨테이너 간 통신을 위해서 [컨테이너 네트워크 인터페이스(CNI)](https://github.com/containernetworking/cni)를 사용하게 됩니다. 다양한 CNI 오픈소스 중에서 파드 네트워크 플러그인을 선택해야하며 파드 네트워크 플러그인에 따라 쿠버네티스 클러스터를 시작할 때 CIDR 블록을 지정해야할 수 있습니다. 

예를 들어, [플라넬(Flannel)](https://github.com/flannel-io/flannel)을 CNI로 사용하는 경우 쿠버네티스 클러스터 시작 시 **10.244.0.0/16**를 파드 네트워크 CIDR 블록으로 지정해야합니다.

```sh 플라넬을 파드 네트워크 플러그인으로 사용하는 클러스터 시작 예시
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
sudo kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

#### 네트워크 정책 플러그인
파드 네트워크 플러그인으로 결정한 **플라넬**이라는 CNI는 네트워크 정책 기능을 포함하고 있지 않는 순수하게 네트워크 통신을 목적으로 만들어진 오픈소스입니다. 만약, 우리의 쿠버네티스 클러스터의 파드에 대한 트래픽 제어를 위해서 인그레스 또는 이그레스와 같은 기능을 적용해야한다면 **네트워크 정책** 기능이 포함된 플러그인을 파드 네트워크 플러그인으로 사용해야합니다.

일반적으로 구현 방식의 차이가 있지만 다음과 같은 네트워크 정책을 포함하는 플러그인을 사용합니다.

- [Antrea](https://github.com/antrea-io/antrea)
- [Calico](https://github.com/projectcalico/calico)
- [Weave Net](https://github.com/weaveworks/weave)
- [Canal](https://docs.projectcalico.org/getting-started/kubernetes/flannel/flannel)

예를 들어, 플라넬을 CNI로 사용하고 싶다면 캘리코(Calico)를 네트워크 정책 공급자로 사용할 수 있는 **카날(Canal)** 을 선택하면 됩니다.

```sh 카날을 사용하는 클러스터 시작 예시
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
sudo kubectl apply -f https://docs.projectcalico.org/manifests/canal.yaml
```

> 카날은 플라넬을 CNI로 사용하므로 플라넬의 파드 네트워크 CIDR 블록을 지정합니다.

### 쿠버네티스 클러스터 DNS 서버
쿠버네티스 클러스터에 서비스 디스커버리를 적용하기 위하여 DNS 서버를 설치해야합니다. 쿠버네티스 클러스터 1.11+ 부터는 [kube-dns](https://github.com/kubernetes/dns) 보다는 [CoreDNS](https://coredns.io/)을 권장하고 우리가 클러스터 시작 시 사용하게 될 kubeadm은 기본적으로 **CoreDNS**를 포함하고 있습니다. 기본적으로 포함되는 CoreDNS는 **대기 상태**에 있다가 우리가 쿠버네티스 클러스터에 파드 네트워크 플러그인을 설치하면 자동으로 실행됩니다.

## 쿠버네티스 클러스터 시작하기
쿠버네티스 클러스터 구성을 위해 확인해야할 몇가지 항목에 대해서 알아보았습니다. 이제 저와 함께 쿠버네티스 클러스터를 구성할 호스트를 준비하고 쿠버네티스 배포 도구인 **kubeadm**을 사용하여 쿠버네티스 클러스터를 시작해보겠습니다.

먼저, 아마존 웹 서비스의 EC2 인스턴스를 **우분투 20.04 LTS** 로 시작하겠습니다.

![](/images/posts/setup-kubernetes-cluster/setup-kubernetes-cluster-02.png)

그리고 kubeadm는 클러스터 시작을 위해 **CPU 2코어 이상, 메모리 2GB 이상** 을 요구하므로 t2.medium 인스턴스를 선택했습니다.

![](/images/posts/setup-kubernetes-cluster/setup-kubernetes-cluster-03.png)

쿠버네티스 클러스터 구성을 위한 학습을 목적으로 하므로 **마스터 노드와 함께 1개 이상의 워커 노드를 구성**하기 위하여 **최소 2개의 우분투 인스턴스**를 준비합니다.

### 클러스터 구성 호스트에 대한 사전 작업
우리가 준비한 우분투 인스턴스에 쿠버네티스 인프라 환경을 구성하기 위한 사전작업을 수행합니다.

```sh 메모리 스왑 기능 비활성화
sudo swapoff -a && sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

cat <<EOF | sudo tee /etc/modules-load.d/crio.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system
```

```sh CRI-O 컨테이너 런타임 설치하기
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_20.04/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
echo "deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/1.21/xUbuntu_20.04/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable:cri-o:1.21.list

curl -L https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable:cri-o:1.21/xUbuntu_20.04/Release.key | sudo apt-key add -
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_20.04/Release.key | sudo apt-key add -

sudo apt-get update
sudo apt-get install -y cri-o cri-o-runc
sudo apt-mark hold cri-o cri-o-runc
sudo systemctl daemon-reload
sudo systemctl enable crio --now
```

### 컨트롤 플레인 노드 초기화
이제 쿠버네티스 클러스터를 시작하기 위해서 **kubeadm init** 명령어를 사용하여 **컨트롤 플레인 노드를 초기화** 합니다. 컨트롤 플레인 노드가 형성된 호스트를 **마스터 노드**라고 부르게 됩니다.

쿠버네티스 클러스터에서 파드 네트워크 플러그인을 플라넬을 사용할 예정이므로 컨트롤 플레인 노드 시작 시 **파드 네트워크 CIDR 블록**을 `10.244.0.0/16`으로 지정해야합니다.

```sh 컨트롤 플레인 노드를 초기화하여 클러스터 시작
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

...
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 172.31.11.193:6443 --token oov7g6.bi85jo3kv15oeryf \
--discovery-token-ca-cert-hash sha256:08874017445a8ddf06dde3e9e7be79097c470883f0384c046290e207ec3342bd
```

컨트롤 플레인 노드가 성공적으로 초기화되었으니 파드 네트워크 플러그인으로 플라넬을 설치해야합니다. 플라넬을 설치하기 위해서는 쿠버네티스 클러스터를 제어하는데 사용하는 **큐브컨트롤(kubectl)** 에 클러스터 접근을 위한 설정을 진행해야합니다. 컨트롤 플레인 노드 초기화 시 출력된 다음의 명령어를 실행합니다.

```sh 큐브컨트롤에 클러스터 접근 설정
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

위 명령어를 수행하고 나면 큐브컨트롤이 **$HOME/.kube** 경로에 있는 클러스터 접근 구성파일이라고 하는 `kubeconfig`를 참조하여 클러스터에 접근하여 명령을 수행합니다. 클러스터 접근 구성파일에 대해서는 자세히 알아볼 필요가 없으므로 넘어가겠습니다.

쿠버네티스 클러스터에 실행된 모든 파드를 조회하기 위하여 다음의 명령어를 실행합니다.

```sh 클러스터의 모든 네임스페이스에 대한 파드 조회
kubectl get pods --all-namespaces
...
NAMESPACE     NAME                                       READY   STATUS    RESTARTS   AGE
kube-system   coredns-558bd4d5db-b9t9v                   0/1     Pending   0          106s
kube-system   coredns-558bd4d5db-bkhc4                   0/1     Pending   0          106s
kube-system   etcd-ip-172-31-11-193                      1/1     Running   0          117s
kube-system   kube-apiserver-ip-172-31-11-193            1/1     Running   0          117s
kube-system   kube-controller-manager-ip-172-31-11-193   1/1     Running   0          2m4s
kube-system   kube-proxy-gm8tr                           1/1     Running   0          106s
kube-system   kube-scheduler-ip-172-31-11-193            1/1     Running   0          2m5s
```

앞서 쿠버네티스 클러스터 DNS 서버 관련해서 CoreDNS는 파드 네트워크 플러그인이 설치되기까지 대기 상태에 있다고 하였습니다. 플라넬을 파드 네트워크 플러그인으로 설치하고나서 CoreDNS가 실행되는지 확인해보겠습니다.

### 네트워크 플러그인 설치
파드 네트워크 플러그인으로 플라넬을 사용하면서 네트워크 정책 기능을 추가하기 위해 네트워크 정책 플러그인으로 캘리코를 사용하는 카날(Canal)을 쿠버네티스 클러스터에 설치하겠습니다.

```sh 카날 네트워크 플러그인 설치
kubectl apply -f https://docs.projectcalico.org/manifests/canal.yaml
...

kubectl get pods -A
...
NAMESPACE     NAME                                       READY   STATUS    RESTARTS   AGE
kube-system   calico-kube-controllers-78d6f96c7b-ltz89   1/1     Running   0          22s
kube-system   canal-2mmz5                                2/2     Running   0          23s
kube-system   coredns-558bd4d5db-t4w4s                   1/1     Running   0          94s
kube-system   coredns-558bd4d5db-wg7zg                   1/1     Running   0          94s
kube-system   etcd-ip-172-31-11-193                      1/1     Running   0          102s
kube-system   kube-apiserver-ip-172-31-11-193            1/1     Running   0          109s
kube-system   kube-controller-manager-ip-172-31-11-193   1/1     Running   0          102s
kube-system   kube-proxy-gmp4q                           1/1     Running   0          93s
kube-system   kube-scheduler-ip-172-31-11-193            1/1     Running   0          102s
```

카날을 설치하고나서 파드 조회 명령어를 실행하니 대기중이었던 **CoreDNS**가 실행되었음을 확인할 수 있습니다.

> 눈치채신 분들도 계시겠지만 큐브컨트롤로 모든 네임스페이스에 대해서 조회하기 위해서 사용하는 **--all-namespaces** 옵션 대신에 **-A**를 대신 사용할 수 있습니다.
> 이렇게 큐브컨트롤을 사용할 때 긴 이름을 대신할 수 있는 축약어를 지원하니 여러가지 축약 형태를 찾아보세요.

### 쿠버네티스 클러스터 워커 노드 추가
앞선 작업까지 수행하면 쿠버네티스 클러스터 시작이 완료되었다고 볼 수 있습니다. 이제 쿠버네티스 클러스터 구성을 완료하기 위하여 클러스터가 파드에 컨테이너를 실행하는 환경이 되는 워커 노드를 참여시켜야합니다. 쿠버네티스 클러스터에 다른 호스트를 워커 노드로 참여시키기 위해서는 컨트롤 플레인 노드를 초기화하고 나서 출력되는 다음의 명령어를 워커 노드가 될 호스트에서 실행해야합니다.

> 클러스터를 구성하는 모든 호스트에 kubectl, kubelet을 설치하는 것이 이러한 이유입니다.

```sh 쿠버네티스 클러스터에 워커 노드 참여
kubeadm join 172.31.11.193:6443 --token oov7g6.bi85jo3kv15oeryf \
--discovery-token-ca-cert-hash sha256:08874017445a8ddf06dde3e9e7be79097c470883f0384c046290e207ec3342bd 
...
This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

마지막 문장에 따라 컨트롤 플레인 노드가 있는 마스터 노드에서 **kubectl get nodes** 명령어를 실행해봅니다.

```sh 쿠버네티스 클러스터의 노드 조회
# kubectl get [nodes/node/no]
kubectl get no
...
NAME               STATUS   ROLES                  AGE     VERSION
ip-172-31-11-193   Ready    control-plane,master   3m18s   v1.21.3
ip-172-31-41-106   Ready    <none>                 42s     v1.21.3
```

저는 클러스터를 구성하는 노드를 조회하는 명령어를 축약 형태로 실행했습니다. 이렇게 큐브컨트롤로 명령어를 실행할 때 쿠버네티스 리소스를 **복수형, 단수형, 축약형**을 모두 사용할 수 있습니다. 이렇게 쿠버네티스 배포 도구로 클러스터를 시작하고 워커 노드를 참여시켜 쿠버네티스 클러스터 구성을 완료했습니다.

> 위 명령어 수행결과에서 워커 노드에 ROLES가 없는 것이 문제가 안되지만 정확한 구분을 위해 worker를 추가하고 싶다면 다음의 명령어를 실행하시면 됩니다.

```sh 워커 노드에 worker ROLE 레이블 추가
kubectl label node ip-172-31-41-106 node-role.kubernetes.io/worker=worker
```

## 쿠버네티스 클러스터 제어하기
쿠버네티스 클러스터를 제어하기 위해서는 마스터 노드인 호스트에 접속하여 큐브컨트롤으로 명령어를 실행해야합니다. 그러나, 반드시 쿠버네티스 클러스터 제어를 위해서 마스터 노드에서 수행할 필요는 없습니다. 그 이유는 **큐브컨트롤(kubectl)** 이 쿠버네티스 클러스터 접근을 위해서 **클러스터 접근 구성 파일(kubeconfig)** 을 참조해서 클러스터에 접근하기 때문입니다. 

쿠버네티스 클러스터의 마스터 노드가 아닌 **로컬 컴퓨터(외부 호스트)** 에서 큐브컨트롤을 사용하여 쿠버네티스 클러스터에 명령어를 실행하기 위해서 [클러스터 접근 구성 파일을 정의](https://kubernetes.io/ko/docs/concepts/configuration/organize-cluster-access-kubeconfig)하고 [쿠버네티스 클러스터에서 사용중인 인증서를 갱신](https://kubernetes.io/ko/docs/tasks/administer-cluster/kubeadm/kubeadm-certs)하는 작업을 수행해야합니다.

### 외부 호스트를 위한 클러스터 접근 구성 파일 정의
먼저, 마스터 노드에서 사용중인 클러스터 접근 구성파일을 외부 호스트인 로컬 컴퓨터에 복사하여 로컬 컴퓨터에 설치된 큐브컨트롤로 쿠버네티스 클러스터에 접근할 수 있는지 확인합니다.

> 마스터 노드인 호스트의 외부 아이피는 54.180.137.161 입니다.

```ps 외부 호스트에서 클러스터 접근 구성파일 복사
mkdir .kube
scp -i .\keypair\mambo.pem ubuntu@54.180.137.161:.kube/config .kube/config
```

로컬 컴퓨터에서 큐브컨트롤이 참조하는 클러스터 접근 구성정보를 조회해보면 마스터 노드에서 사용하던 클러스터 접근 구성 파일이기 때문에 클러스터의 주소가 마스터 노드의 내부 아이피인 것을 확인할 수 있습니다.

![클러스터 주소가 마스터 노드의 내부 아이피](/images/posts/setup-kubernetes-cluster/control-kubernetes-cluster-03.png)

클러스터 주소를 외부 아이피로 변경하기 위해서 다음의 명령어를 수행합니다.

```ps 클러스터 접근 구성 파일의 클러스터 주소 변경
kubectl config --kubeconfig=config set-cluster kubernetes --server=https://54.180.137.161:6443 
```

다시 큐브컨트롤이 참조하는 클러스터 접근 구성 정보를 조회해보면 다음과 같이 클러스터 주소가 외부 아이피로 변경된 것을 확인할 수 있습니다.

![외부 아이피로 변경된 클러스터 주소](/images/posts/setup-kubernetes-cluster/control-kubernetes-cluster-04.png)

이제 로컬 컴퓨터에서 큐브컨트롤이 클러스터에 접근할 수 있게 접근 구성 파일을 정의했습니다. (수정이지만...?) 큐브컨트롤로 클러스터의 모든 네임스페이스에 대한 파드를 조회해봅니다.

```ps 외부 호스트에서 클러스터의 모든 네임스페이스에 대한 파드 조회
kubectl get po -A
...
Unable to connect to the server: x509: certificate is valid for 10.96.0.1, 172.31.6.192, not 54.180.137.16
```

위와 같이 X509 인증서 관련 오류가 발생한 이유는 우리가 입력한 쿠버네티스 클러스터 주소인 54.180.137.161이 접근 구성 파일에 있는 인증서 정보에 포함되어있지 않기 때문입니다. 기본적으로 쿠버네티스 클러스터 시작 시 컨트롤 플레인 노드를 초기화할 때 API 서버에서 사용할 인증서를 생성하는 과정에서 내부 아이피만을 인증서에 포함시키기 때문입니다. 

마스터 노드로 돌아가서 쿠버네티스 클러스터 시작 시 인증서에 외부아이피를 포함시키기 위해서 힘들게 구성하였던 클러스터를 초기화시키겠습니다.

```sh 쿠버네티스 클러스터 초기화
sudo kubeadm reset
rm $HOME/.kube/config
```

쿠버네티스 클러스터 시작 시 외부 아이피를 API 서버에 대한 인증서에 포함하도록 **\--apiserver-cert-extra-sans** 파라미터 옵션을 추가합니다.

![](/images/posts/setup-kubernetes-cluster/control-kubernetes-cluster-05.png)

위와 같이 쿠버네티스 클러스터 시작 시 출력되는 정보를 통해 우리가 파라미터로 입력한 **외부 아이피(54.180.137.161)가 인증서에 포함됨** 을 확인할 수 있었습니다. 쿠버네티스 클러스터를 시작하여 컨트롤 플레인 노드가 초기화되었으면 kubeconfig 파일을 로컬 컴퓨터로 복사하고 큐브컨트롤으로 파드 조회를 시도해봅니다.

![](/images/posts/setup-kubernetes-cluster/control-kubernetes-cluster-06.png)

쿠버네티스 클러스터에서 인증서에 포함된 외부 아이피를 확인하여 클러스터 접근을 허용하여 모든 네임스페이스에 대한 파드가 조회되었습니다.

### 외부 호스트를 위한 사용자 및 인증서 발행
앞서 확인한 내용은 클러스터 접근 구성파일을 통해 외부 호스트에서 클러스터에 접근할 수 있는 것입니다. 그런데 우리가 마스터 노드에서 사용하던 클러스터 접근 구성파일에는 쿠버네티스 클러스터를 제어하기 위한 kubernetes-admin 사용자의 인증정보가 포함되어있습니다. 쿠버네티스 클러스터 관리 담당자는 클러스터에 대한 모든 권한을 가지는 접근 구성파일을 내보내지않고 클러스터에 접근할 수 있으며 특정 네임스페이스 권한이 부여된 사용자를 만들고 쿠버네티스 클러스터의 루트 CA 인증서를 기반으로 사용자의 인증서를 발행하여 클러스터 접근 구성 파일을 정의할 수 있게 지원하는 게 좋습니다.

쿠버네티스 클러스터에는 사용자라는 오브젝트는 없지만 인증서에 포함되는 주체를 통해 그룹과 사용자 개념을 사용해서 인증을 수행합니다. 따라서, 우리는 쿠버네티스 클러스터의 루트 CA 인증서를 기반으로 하위 인증서 발행하고 하위 인증서에 포함된 주체에 대한 RBAC 기반의 Role을 쿠버네티스 클러스터에 생성해야합니다.

먼저, 루트 CA 인증서를 기반으로 하위 인증서를 발행하기 위하여 클라우드플레어에서 만든 cfssl 설치합니다.

```sh 마스터 노드에 cfssl 패키지 설치
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.5.0/cfssl_1.5.0_linux_amd64 -o cfssl
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.5.0/cfssljson_1.5.0_linux_amd64 -o cfssljson
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.5.0/cfssl-certinfo_1.5.0_linux_amd64 -o cfssl-certinfo

chmod +x cfssl* 
sudo mv cfssl* /usr/bin/
```

cfssl이 설치되었으면 사용자 인증서가 발행될 폴더를 만들고나서 쿠버네티스 클러스터가 사용중인 루트 CA 인증서 파일을 복사합니다. 루트 CA 인증서 파일은 일반적으로 **/etc/kubernetes/pki** 폴더에 있습니다.

인증서 발행을 위해 다음의 명령어를 차례대로 실행합니다.

```sh 인증서 발행 폴더 이동 및 쿠버네티스 클러스터 루트 CA 인증서 복사
mkdir cert && cd cert
sudo cp /etc/kubernetes/pki/ca* ./
```

```sh 하위 인증서 발행 정보 및 서명 요청 정의
cat <<EOF | tee mambo-config.json
{
  "signing": {
    "default": {
      "expiry": "8760h"
    },
    "profiles": {
      "mambo": {
        "usages": [
          "signing",
          "key encipherment",
          "server auth",
          "client auth"
        ],
        "expiry": "8760h"
      }
    }
  }
}
EOF

cat <<EOF | tee mambo-csr.json
{
  "CN": "mambo",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names":[
    {
      "O": "system:masters"
    }
  ]
}
EOF
```

```sh 사용자 인증서 발행
sudo cfssl gencert -ca=ca.crt -ca-key=ca.key -config=mambo-config.json -profile=mambo mambo-csr.json | cfssljson -bare mambo

ll
-rw-r--r-- 1 mambo mambo 1066 Jul 28 15:04 ca.crt
-rw------- 1 root  root  1679 Jul 28 15:04 ca.key
-rw-rw-r-- 1 mambo mambo  277 Jul 28 15:02 mambo-config.json
-rw-r--r-- 1 mambo mambo  920 Jul 28 15:08 mambo.csr
-rw-rw-r-- 1 mambo mambo  129 Jul 28 15:02 mambo-csr.json
-rw------- 1 mambo mambo 1675 Jul 28 15:08 mambo-key.pem
-rw-rw-r-- 1 mambo mambo 1204 Jul 28 15:08 mambo.pem
```

이렇게 만들어진 인증서를 기반으로 큐브컨트롤을 사용하여 클러스터 접근 구성 파일(kubeconfig)를 정의합니다.

```sh 사용자 클러스터 접근 구성 파일 정의
kubectl config --kubeconfig=mambo-config set-cluster kubernetes --server=https://54.180.137.161:6443 --certificate-authority=ca.crt
kubectl config --kubeconfig=mambo-config set-credentials mambo --client-certificate=mambo.pem --client-key=mambo-key.pem
kubectl config --kubeconfig=mambo-config set-context kubernetes-master --cluster=kubernetes --user=mambo
kubectl config --kubeconfig=mambo-config use-context kubernetes-master
```

만들어진 클러스터 접근 구성 정보를 조회하고 파드를 조회합니다.

```sh 클러스터 접근 구성 정보 조회
kubectl config view --kubeconfig=mambo-config
apiVersion: v1
clusters:
- cluster:
    certificate-authority: ca.crt
    server: https://54.180.137.161:6443
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: mambo
  name: kubernetes-master
current-context: kubernetes-master
kind: Config
preferences: {}
users:
- name: mambo
  user:
    client-certificate: mambo.pem
    client-key: mambo-key.pem
```

우리는 mambo 사용자에 대한 Role을 쿠버네티스 클러스터에 생성하지 않았지만 파드가 조회가 가능한 이유는 인증서 발행 시 **system:masters** 라고 지정하였기 때문입니다. 쿠버네티스 클러스터에는 미리 정의된 [Role](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles)이 존재하는데 그 중에서 `system:masters`는 모든 권한을 가지는 사용자 그룹(cluster-admin)을 가리키게되어 mambo라는 사용자는 모든 권한을 보유한 것으로 처리된 것입니다.

> 결국 mambo 라는 사용자는 모든 권한을 가지는 사용자 kubernetes-admin과 같습니다.

우리는 모든 권한을 가지는 사용자가 아니라 특정 권한을 가지는 사용자를 만들고 인증해야하므로 기존에 만들었던 인증서를 삭제하고 특정 권한을 가지는 인증서를 다시 발행해야합니다. 

```sh 인증서 서명 요청 파일 수정 및 인증서 재발행
cat <<EOF | tee mambo-csr.json
{
  "CN": "mambo",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names":[
    {
      "O": "admin:mambo"
    }
  ]
}
EOF

sudo cfssl gencert -ca=ca.crt -ca-key=ca.key -config=mambo-config.json -profile=mambo mambo-csr.json | cfssljson -bare mambo
```

이제 다시 큐브컨트롤을 사용하여 클러스터의 파드를 조회합니다.

```sh 클러스터 파드 조회
kubectl get po -n kube-system --kubeconfig=config
Error from server (Forbidden): pods is forbidden: User "mambo" cannot list resource "pods" in API group "" in the namespace "kube-system"
```

**system:masters**을 지정했던것과 다르게 mambo 사용자는 kube-system 네임스페이스에 대한 파드 조회를 수행할 수 없게되었습니다. 이것은 우리가 아직 쿠버네티스 클러스터에 mambo 사용자에 대한 Role을 생성하지 않았기 때문입니다. 이제 다음과 같이 쿠버네티스 클러스터에 Mambo 사용자가 파드 조회를 위한 권한을 가지도록 Role을 생성합니다. 

```sh 사용자 Role 및 Rolebinding 생성
cat <<EOF | tee mambo-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: kube-system
  name: mambo-rbac-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  namespace: kube-system
  name: mambo-rbac-rolebinding
subjects:
- kind: User
  name: mambo
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: mambo-rbac-role
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl create -f mambo-rbac.yaml
role.rbac.authorization.k8s.io/mambo-rbac-role created
rolebinding.rbac.authorization.k8s.io/mambo-rbac-rolebinding created
```

```sh 클러스터 파드 조회
kubectl get po -n kube-system --kubeconfig=mambo-config
...
NAME                                      READY   STATUS    RESTARTS   AGE
coredns-558bd4d5db-kvfhl                  1/1     Running   0          4h33m
coredns-558bd4d5db-z7kf7                  1/1     Running   0          4h33m
etcd-ip-172-31-6-192                      1/1     Running   0          3h54m
kube-apiserver-ip-172-31-6-192            1/1     Running   0          3h54m
kube-controller-manager-ip-172-31-6-192   1/1     Running   0          3h54m
kube-flannel-ds-dh2xp                     1/1     Running   0          4h23m
kube-proxy-tbm76                          1/1     Running   0          4h33m
kube-scheduler-ip-172-31-6-192            1/1     Running   0          3h54m
```

신규 사용자에 대한 인증서를 발행하고 Role을 만들어 사용자에게 바인딩함으로써 쿠버네티스 클러스터에 동작중인 파드를 조회할 수 있게 되었습니다.

## 쿠버네티스 클러스터 관리하기
쿠버네티스 클러스터 시작 시 발행되는 인증서는 기본적으로 1년동안 사용할 수 있게 만료일자가 설정됩니다. 따라서, 쿠버네티스 클러스터가 시작된 지 1년이 지나게되면 쿠버네티스 클러스터 동작이 정상적이지 않을 수 있습니다. 그래서 우리는 쿠버네티스 클러스터에서 사용중인 인증서가 만료되기전에 인증서를 갱신할 수 있어야합니다.

### 클러스터 인증서 갱신하기
앞서 우리는 클러스터 외부 호스트에서 접근할 수 있도록 쿠버네티스 클러스터 시작 시 외부 아이피를 파라미터 옵션으로 추가했습니다. 하지만, 쿠버네티스 클러스터를 운영하고 있는 도중에는 클러스터를 초기화하고 다시 시작할 수 없습니다. 그래서 쿠버네티스 클러스터에서 사용중인 인증서를 다시 발행하기 위해서는 [kubeadm init phase certs](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-init-phase/#cmd-phase-certs) 명령어를 사용해야합니다. 

```sh Terminal
cd /etc/kubernetes/pki
# 기존 인증서 삭제 또는 백업
sudo cp apiserver.crt apiserver.crt.old
sudo cp apiserver.key apiserver.key.old
sudo rm apiserver.crt apiserver.key

sudo kubeadm init phase certs apiserver --apiserver-advertise-address=172.31.6.192 --apiserver-cert-extra-sans=54.180.137.161
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [ip-172-31-6-192 kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 172.31.6.192 54.180.137.161]

sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
```

쿠버네티스 시작 시 수행하는 과정 중 일부를 수행하여 API 서버에 대한 인증서를 발행하면서 외부 아이피가 포함된 것을 확인할 수 있습니다.

![](/images/posts/setup-kubernetes-cluster/control-kubernetes-cluster-07.png)

위와 같이 외부 호스트인 로컬 컴퓨터에서도 클러스터에 접근할 수 있게 됩니다.

### 클러스터 인증서 만료일자 조회하기
쿠버네티스 클러스터에서 사용중인 인증서를 발행할 수 있는 방법을 알았지만 인증서가 언제 만료되는지도 알아야합니다. **kubeadm certs check-expiration** 명령어를 사용하면 쿠버네티스 클러스터에서 사용중인 인증서의 만료일자를 조회할 수 있습니다. 

```sh 클러스터 인증서 만료일자 조회
sudo kubeadm certs check-expiration
[check-expiration] Reading configuration from the cluster...
[check-expiration] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'

CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
admin.conf                 Jul 28, 2022 11:17 UTC   364d                                    no
apiserver                  Jul 28, 2022 11:17 UTC   364d            ca                      no
apiserver-etcd-client      Jul 28, 2022 11:17 UTC   364d            etcd-ca                 no
apiserver-kubelet-client   Jul 28, 2022 11:17 UTC   364d            ca                      no
controller-manager.conf    Jul 28, 2022 11:17 UTC   364d                                    no
etcd-healthcheck-client    Jul 28, 2022 11:17 UTC   364d            etcd-ca                 no
etcd-peer                  Jul 28, 2022 11:17 UTC   364d            etcd-ca                 no
etcd-server                Jul 28, 2022 11:17 UTC   364d            etcd-ca                 no
front-proxy-client         Jul 28, 2022 11:17 UTC   364d            front-proxy-ca          no
scheduler.conf             Jul 28, 2022 11:17 UTC   364d                                    no

CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
ca                      Jul 26, 2031 11:17 UTC   9y              no
etcd-ca                 Jul 26, 2031 11:17 UTC   9y              no
front-proxy-ca          Jul 26, 2031 11:17 UTC   9y              no
```

### 클러스터 인증서 수동 갱신
쿠버네티스 클러스터에서 사용중인 인증서를 갱신하는 방법에는 쿠버네티스 클러스터 버전을 업그레이드하여 자동으로 갱신되게하거나 사용중인 인증서를 수동으로 갱신하는 명령어를 실행해야합니다. **kubeadm certs renew all** 명령어를 실행하면 쿠버네티스 클러스터에서 사용중인 인증서를 수동으로 갱신할 수 있습니다.

```sh Terminal
sudo kubeadm certs renew all
[renew] Reading configuration from the cluster...
[renew] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'

certificate embedded in the kubeconfig file for the admin to use and for kubeadm itself renewed
certificate for serving the Kubernetes API renewed
certificate the apiserver uses to access etcd renewed
certificate for the API server to connect to kubelet renewed
certificate embedded in the kubeconfig file for the controller manager to use renewed
certificate for liveness probes to healthcheck etcd renewed
certificate for etcd nodes to communicate with each other renewed
certificate for serving etcd renewed
certificate for the front proxy client renewed
certificate embedded in the kubeconfig file for the scheduler manager to use renewed

Done renewing certificates. You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd, so that they can use the new certificates.
```

마지막에 출력된 정보에 따라 갱신된 인증서를 사용할 수 있도록 kube-apiserver, kube-controller-manager, kube-scheduler, etcd 파드를 다시 실행해야하므로 큐브컨트롤을 사용하여 파드 삭제 명령을 실행하면 쿠버네티스 클러스터는 파드를 제거한 뒤 다시 실행하게 됩니다. 

```sh 인증서를 갱신한 파드를 삭제하여 재실행
# 삭제할 파드 조회
kubectl get po -n kube-system
NAME                                   READY   STATUS    RESTARTS   AGE
coredns-558bd4d5db-6fqm2               1/1     Running   0          33m
coredns-558bd4d5db-kgdfs               1/1     Running   0          33m
etcd-mambo-master                      1/1     Running   0          33m
kube-apiserver-mambo-master            1/1     Running   0          33m
kube-controller-manager-mambo-master   1/1     Running   0          33m
kube-flannel-ds-g59bl                  1/1     Running   0          23m
kube-flannel-ds-nf4xt                  1/1     Running   0          23m
kube-flannel-ds-q5hkb                  1/1     Running   0          32m
kube-proxy-7j5b6                       1/1     Running   0          33m
kube-proxy-8f47j                       1/1     Running   0          23m
kube-proxy-rflgf                       1/1     Running   0          23m
kube-scheduler-mambo-master            1/1     Running   0          33m

# 인증서가 갱신된 파드를 삭제
kubectl delete po kube-apiserver-mambo-master kube-controller-manager-mambo-master kube-scheduler-mambo-master etcd-mambo-master -n kube-system
pod "kube-apiserver-mambo-master" deleted
pod "kube-controller-manager-mambo-master" deleted
pod "kube-scheduler-mambo-master" deleted
pod "etcd-mambo-master" deleted

# 삭제한 파드가 다시 실행되었는지 조회
kubectl get po -n kube-system
NAME                                   READY   STATUS    RESTARTS   AGE
coredns-558bd4d5db-6fqm2               1/1     Running   0          38m
coredns-558bd4d5db-kgdfs               1/1     Running   0          38m
etcd-mambo-master                      1/1     Running   0          11s
kube-apiserver-mambo-master            1/1     Running   0          11s
kube-controller-manager-mambo-master   1/1     Running   0          11s
kube-flannel-ds-g59bl                  1/1     Running   0          29m
kube-flannel-ds-nf4xt                  1/1     Running   0          29m
kube-flannel-ds-q5hkb                  1/1     Running   0          38m
kube-proxy-7j5b6                       1/1     Running   0          38m
kube-proxy-8f47j                       1/1     Running   0          29m
kube-proxy-rflgf                       1/1     Running   0          29m
kube-scheduler-mambo-master            1/1     Running   0          11s
```

쿠버네티스 클러스터에서 사용중인 인증서에 대한 만료일자를 다시 조회합니다.

```sh Terminal
sudo kubeadm certs check-expiration
[check-expiration] Reading configuration from the cluster...
[check-expiration] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'

CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
admin.conf                 Jul 28, 2022 11:45 UTC   364d                                    no
apiserver                  Jul 28, 2022 11:45 UTC   364d            ca                      no
apiserver-etcd-client      Jul 28, 2022 11:45 UTC   364d            etcd-ca                 no
apiserver-kubelet-client   Jul 28, 2022 11:45 UTC   364d            ca                      no
controller-manager.conf    Jul 28, 2022 11:45 UTC   364d                                    no
etcd-healthcheck-client    Jul 28, 2022 11:45 UTC   364d            etcd-ca                 no
etcd-peer                  Jul 28, 2022 11:45 UTC   364d            etcd-ca                 no
etcd-server                Jul 28, 2022 11:45 UTC   364d            etcd-ca                 no
front-proxy-client         Jul 28, 2022 11:45 UTC   364d            front-proxy-ca          no
scheduler.conf             Jul 28, 2022 11:45 UTC   364d                                    no

CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
ca                      Jul 26, 2031 11:17 UTC   9y              no
etcd-ca                 Jul 26, 2031 11:17 UTC   9y              no
front-proxy-ca          Jul 26, 2031 11:17 UTC   9y              no
```

쿠버네티스 클러스터의 만료일자가 갱신되었음을 확인할 수 있습니다.

## 쿠버네티스 대시보드 설치하기
쿠버네티스 대시보드 애드온은 쿠버네티스 클러스터를 웹 UI 기반으로 제어하고 클러스터에 대한 정보를 조회하고 모니터링할 수 있는 기능을 제공합니다. 쿠버네티스 대시보드를 클러스터에 추가하기 위하여 다음의 명령어를 실행합니다.

```sh 쿠버네티스 대시보드 애드온 설치
kubectl create -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.3.1/aio/deploy/recommended.yaml
---
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

kubectl get deploy -n kubernetes-dashboard
---
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
dashboard-metrics-scraper   1/1     1            1           24s
kubernetes-dashboard        1/1     1            1           24s
```

쿠버네티스 대시보드를 설치했지만 서비스를 조회해보면 다음과 같이 **ClusterIP** 유형인 것을 확인할 수 있습니다.

```sh 쿠버네티스 대시보드 서비스 조회
kubectl get svc -n kubernetes-dashboard
NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
dashboard-metrics-scraper   ClusterIP   10.108.18.117   <none>        8000/TCP   74s
kubernetes-dashboard        ClusterIP   10.100.36.145   <none>        443/TCP    74s
```

쿠버네티스 대시보드에 대한 서비스는 기본적으로 ClusterIP 유형으로 되어있으므로 쿠버네티스 클러스터 환경에서만 접근할 수 있습니다. 마스터 노드에서 큐브컨트롤로 쿠버네티스 클러스터에 프록시를 활성화하고나서 로컬 컴퓨터에서 마스터 노드에 대해서 SSH 터널링을 통해 쿠버네티스 대시보드에 접근할 수 있습니다.

```sh 쿠버네티스 클러스터 프록시 및 SSH 터널링
kubectl cluster-info
Kubernetes control plane is running at https://192.168.0.5:6443
CoreDNS is running at https://192.168.0.5:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

kubectl proxy
Starting to serve on 127.0.0.1:8001
# http://127.0.0.1:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

ssh -L 8001:localhost:8001 mambo@192.168.0.5
```

이제 로컬 컴퓨터에서 http://127.0.0.1:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/로 접속하면 쿠버네티스 대시보드 로그인 화면이 표시됩니다.

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-02.png)


하지만, 이렇게 SSH 터널링으로 쿠버네티스 대시보드로 접근하는 방식은 불편한점이 있기 때문에 쿠버네티스 대시보드를 외부에서 직접 접근할 수 있으면 좋겠습니다. 외부에서 접근하기 위해서는 쿠버네티스 대시보드를 외부로 노출할 수 있도록 쿠버네티스 대시보드 서비스의 유형을 ClusterIP 에서 **NodePort**로 변경해야합니다.

### 쿠버네티스 대시보드 서비스 유형 변경하기

```sh 쿠버네티스 대시보드 서비스 변경
kubectl edit svc kubernetes-dashboard -n kubernetes-dashboard

apiVersion: v1
kind: Service
metadata:
  creationTimestamp: "2021-07-30T10:47:00Z"
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
  resourceVersion: "240375"
  uid: ae974cb2-d0af-46be-8036-4a9d33c9afbd
spec:
  clusterIP: 10.100.36.145
  clusterIPs:
  - 10.100.36.145
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - port: 443
    protocol: TCP
    targetPort: 8443
  selector:
    k8s-app: kubernetes-dashboard
  sessionAffinity: None
  type: NodePort
status:
  loadBalancer: {}

# kubectl get service kubernetes-dashboard -n kubernetes-dashboard -o jsonpath="{.spec.ports[0].nodePort}" | awk '{print $1}'
kubectl get svc kubernetes-dashboard -n kubernetes-dashboard
NAME                   TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
kubernetes-dashboard   NodePort   10.100.36.145   <none>        443:31532/TCP   21m
```

쿠버네티스 대시보드가 31532 포트로 노출되었으니 **https://192.168.0.5:31532**으로 접속합니다.

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-01.png)

쿠버네티스 클러스터에서 사용하는 루트 CA 인증서가 현재 브라우저에 신뢰할 수 있는 CA 인증서로 등록되어있지 않기 때문에 **안전하지 않음으로 이동**을 눌러 쿠버네티스 대시보드로 들어갑니다.

### 쿠버네티스 대시보드 로그인하기

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-02.png)

쿠버네티스 대시보드 서비스 어카운트의 토큰으로 쿠버네티스 대시보드에 로그인할 수 있습니다. 큐브컨트롤로 다음의 명령어를 실행하여 쿠버네티스 대시보드 사용자의 토큰을 조회합니다.

```sh 쿠버네티스 대시보드 사용자 토큰 조회
# kubectl get secret -n kubernetes-dashboard $(kubectl get sa kubernetes-dashboard -n kubernetes-dashboard -o jsonpath="{.secrets[0].name}") -o jsonpath="{.data.token}" | base64 --decode | awk '{print $1}'

kubectl describe secret $(kubectl get secret -n kubernetes-dashboard | grep kubernetes-dashboard-token | awk '{print $1}') -n kubernetes-dashboard

Name:         kubernetes-dashboard-token-4qs2r
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: kubernetes-dashboard
              kubernetes.io/service-account.uid: 52ab8346-d0ce-465a-b170-1a240cbcbf83

Type:  kubernetes.io/service-account-token

Data
====
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6InhrcWdOeEV2RFh2ajZES0Z1b0lLb3F2TmtuSUVnLVdFbktadk9SWjNYXzQifQ....
ca.crt:     1066 bytes
```

쿠버네티스 대시보드 사용자의 토큰을 복사해서 쿠버네티스 대시보드에 로그인합니다.

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-03.png)

토큰을 사용하여 로그인되었지만 이 서비스 어카운트는 쿠버네티스 클러스터에 대한 권한을 가지고 있지 않아서 어떠한 정보도 표시되지 않습니다.

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-04.png)

우리는 쿠버네티스 클러스터에 대한 권한을 쿠버네티스 대시보드 사용자에게 부여해야합니다.

```sh Terminal
kubectl delete clusterrole kubernetes-dashboard -n kubernetes-dashboard
kubectl delete clusterrolebinding kubernetes-dashboard -n kubernetes-dashboard

cat <<EOF | tee dashboard-admin.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: kubernetes-dashboard
    namespace: kubernetes-dashboard
EOF

kubectl create -f dashboard-admin.yaml
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
```

쿠버네티스 대시보드 사용자에게 모든 권한을 부여하는 **ClusterRole**과 **ClusterRoleBinding**을 다시 만들었으니 쿠버네티스 대시보드에 다시 로그인해보겠습니다.

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-05.png)

쿠버네티스 대시보드의 서비스 어카운트가 클러스터 권한을 가지게 되었으므로 대시보드에 **모든 네임스페이스**에 대한 워크로드 상태를 조회할 수 있습니다.

### 쿠버네티스 대시보드에서 매트릭 서버 설치하기
쿠버네티스 대시보드에서 클러스터 제어가 가능한지 검증하기 위해서 대시보드를 통해 클러스터에 매트릭 서버(metrics-server)를 설치해보도록 하겠습니다. 

https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

위 YAML 파일을 다운받아서 아래 화면과 같이 **kubelet-insecure-tls** 옵션을 추가하여 업로드 버튼을 선택합니다.

![](/images/posts/setup-kubernetes-cluster/access-kubernetes-dashboard-06.png)

매트릭 서버가 설치되었으므로 큐브컨트롤으로 매트릭을 조회할 수 있는지 확인합니다.

```sh Terminal
kubectl top no --use-protocol-buffers

NAME              CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
mambo-master      136m         13%    1275Mi          67%
mambo-worker-01   22m          2%     710Mi           37%
mambo-worker-02   33m          3%     815Mi           43%
```

이렇게 쿠버네티스 대시보드를 통해서도 클러스터를 제어할 수 있음을 확인했습니다. 그러나, 쿠버네티스 대시보드는 클러스터 외부에 노출되어있으므로 사용자의 토큰이 유출되지 않도록 잘 관리해야합니다. 저는 학습 목적으로 기본으로 제공하는 쿠버네티스 대시보드 사용자가 모든 권한을 가지게 하였지만 클러스터에 대한 모든 권한을 가지는게 아니라 쿠버네티스 대시보드에 로그인할 사용자를 별도로 만들어서 특정 네임스페이스와 리소스에 대한 권한을 개별적으로 지정하는게 좋습니다.

이상으로 쿠버네티스 클러스터에 대한 학습을 마칩니다.