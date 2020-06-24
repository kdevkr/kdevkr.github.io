---
    title: 쿠버네티스 학습하기
    description: 
    comments: false
---

# 쿠버네티스 학습

## 학습환경 구성하기
쿠버네티스를 배우기 위해서 쿠버네티스 커뮤니티에서 지원하는 도구나 도커 기반의 솔루션을 이용할 수 있다.

- [미니큐브(Minikube)](https://kubernetes.io/ko/docs/setup/learning-environment/minikube/)
- KIND(Kubernetes IN Docker)
  - Docker Desktop
  - k3s

예를 들어, [Docker Desktop](https://www.docker.com/products/docker-desktop)을 설치하면 쉽게 쿠버네티스 클러스트를 활성화할 수 있는 기능이 포함되어있다.

> 미니큐브를 이용하고 싶다면 [Minikube 설치](https://kubernetes.io/ko/docs/tasks/tools/install-minikube/)를 참고하자.

## 기초 학습
쿠버네티스 [튜토리얼](https://kubernetes.io/ko/docs/tutorials/kubernetes-basics/)을 통해 쿠버네티스 기초를 학습해보자.

### 큐브컨트롤(kubectl)
`kubectl`은 클러스터에 대한 동작을 관리할 수 있도록 제공되는 커맨드라인 인터페이스이다. 

```sh
kubectl [command] [type] [name] [flags]
```

#### 디플로이먼트를 이용해 컨테이너 실행하기
큐브컨트롤을 사용하여 Nginx 컨테이너를 디플로이먼트를 이용해 실행해보자.

```sh
kubectl run nginx-app --image nginx --port 80

# print
kubectl run --generator=deployment/apps.v1 is DEPRECATED and will be removed in a future version. Use kubectl run --generator=run-pod/v1 or kubectl create instead.
deployment.apps/nginx-app created
```

또는 권장되는 디플로이먼트 오브젝트 템플릿을 사용해보자.

```yaml nginx-deployment.yaml
apiVersion: apps/v1 # for versions before 1.9.0 use apps/v1beta2
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2 # tells deployment to run 2 pods matching the template
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

```sh
kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deployment created
```

#### 서비스를 사용해 클러스터 외부에서 클러스터에 접근하기
기본적으로 클러스터 내부에서 사용하는 네트워크는 외부와 단절되어있기 때문에 쿠버네티스 내부에서 실행되는 컨테이너에 접근하기 위해서 `서비스(Service)` 오브젝트를 사용해야한다.

```sh
# 디플로이먼트 확인
kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           26s

# 서비스로 디플로이먼트 노출
kubectl expose deployment nginx-deployment --type=NodePort
service/nginx-deployment exposed

# 연결된 서비스 확인
kubectl get service
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
nginx-deployment   NodePort    10.96.180.184   <none>        80:30045/TCP   8s
```

이제 localhost:30045로 클러스터 내부의 Nginx로 접근할 수 있다.

### API 오브젝트 템플릿
쿠버네티스 RESTAPI의 템플릿을 학습하자.

```yaml
apiVersion: v1
kind: Pod
metadata:
spec:
```

## 운영 환경 구성하기
kubeadm을 사용하여 쿠버네티스 클러스터를 직접 구성하자.

쿠버네티스 클러스터 구성을 위한 순서는 간단하게 다음과 같다.

1. kubeadm init 명령을 통해 마스터(컨트롤-플레인) 노드를 부트스트랩
2. 클러스터 환경을 위한 여러가지 옵션을 설정하거나 비활성화
3. kubeadm join 명령을 통해 슬레이브 노드를 부트스트랩

### 컨테이너 런타임 설치
> https://kubernetes.io/ko/docs/setup/production-environment/container-runtimes/#docker

쿠버네티스에서 사용할 컨테이너 런타임으로 `Docker`를 설치한다.

```sh Ubuntu 16.04+
# Update package index and install packages
sudo apt-get update

sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
    
# Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
   
# install docker engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

sudo docker version

```

### 클러스터 구성
쿠버네티스 클러스터를 구성할 수 있는 도구로는 `kubeadm`, `kubespray`, `kops`등이 있다.

- kubeadm
- [kubespray](https://github.com/kubernetes-sigs/kubespray)
- [kops](https://github.com/kubernetes/kops)

#### kubeadm 설치

```sh Installing kubeadm, kubelet and kubectl
# https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl

# Ubuntu, Debian or HypriotOS
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

> When using Docker, kubeadm will automatically detect the cgroup driver for the kubelet and set it in the /var/lib/kubelet/kubeadm-flags.env file during runtime.

#### 노드 초기화
클러스터 구성을 위한 마스터 노드와 슬레이브 노드들을 초기화한다.

> --pod-network-cidr의 값은 파드 네트워크 플러그인에 따라 IP 대역이 다르다.

```sh Initialize master and slave nodes
# Initializing master node
kubeadm init --pod-network-cidr=192.168.0.0/16

...

You can now join any number of machines by running the following on each node
as root:

  kubeadm join <control-plane-host>:<control-plane-port> --token <token> --discovery-token-ca-cert-hash sha256:<hash>

# Joining slave nodes
kubeadm join --token <token> <control-plane-host>:<control-plane-port> --discovery-token-ca-cert-hash sha256:<hash>
```

#### 방화벽 설정
클러스터를 구성하는 노드 컴포넌트들의 포트에 대한 방화벽을 설정한다.
> Certain ports are open on your machines.

- [Control plain nodes](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#control-plane-node-s)

- [Worker nodes](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#worker-node-s)

```sh
# master node
firewall-cmd --permanent --zone=public --add-port=6443/tcp
firewall-cmd --permanent --zone=public --add-port=2379-2380/tcp
firewall-cmd --permanent --zone=public --add-port=10250/tcp
firewall-cmd --permanent --zone=public --add-port=10251/tcp
firewall-cmd --permanent --zone=public --add-port=10252/tcp
firewall-cmd --reload

# worker nodes
firewall-cmd --permanent --zone=public --add-port=10250/tcp
firewall-cmd --permanent --zone=public --add-port=30000-32767/tcp
firewall-cmd --reload

# Network add-on
# https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy
```


또는 모든 방화벽을 해제하고 보안 커널을 임시적으로 해제한다.

```sh Disable firewall and selinux
setenforce 0
sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

systemctl stop firewalld
systemctl disable firewalld
```

#### 미지원 기능 비활성화
쿠버네티스 클러스터는 메모리 스왑 모드를 지원하지 않으므로 메모리 스왑을 해제한다.

> Swap disabled. You MUST disable swap in order for the kubelet to work properly.

```sh
swapoff -a 
```

#### iptable 제어 설정
컨테이너 네트워크 패킷이 호스트의 iptables 설정에 따라 제어되도록 `net.bridge.bridge-no-call-iptables`를 변경한다.

> The iptables proxy obviously depends on iptables, and the plugin may need to ensure that container traffic is made available to iptables. For example, if the plugin connects containers to a Linux bridge, the plugin must set the net/bridge/bridge-nf-call-iptables sysctl to 1 to ensure that the iptables proxy functions correctly. If the plugin does not use a Linux bridge (but instead something like Open vSwitch or some other mechanism) it should ensure container traffic is appropriately routed for the proxy.
>
> By default if no kubelet network plugin is specified, the noop plugin is used, which sets net/bridge/bridge-nf-call-iptables=1 to ensure simple configurations (like Docker with a bridge) work correctly with the iptables proxy.

```sh
cat <<EOF > /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system
```

#### 파드 네트워크 애드온 설치
```sh
# Calico
kubectl apply -f https://docs.projectcalico.org/v3.11/manifests/calico.yaml

# Weave Net
kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```

#### 일반 사용자를 위한 클러스터 접근 설정
일반 사용자가 kubectl를 통하여 클러스터에 접근하는 것을 허용하고 싶다면 다음의 명령어를 수행한다.

```sh
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

AWS와 같은 클라우드 환경에서는 `kops` 또는 `kubespray`를 활용하여 구성하자.

## 클러스터 환경 구성시 도움이 되는 글

- [GRU : Install Kubernetes on CentOS/RHEL](https://gruuuuu.github.io/cloud/k8s-install/#)