---
date: 2020-07-22
title: K8S - 쿠버네티스 도구 모음
categories:
  - Kubernetes
tags:
  - Awesome
---

![](/images/logo/kubernetes.jpg)

쿠버네티스는 컨테이너 오케스트레이션을 위한 솔루션으로 애플리케이션 배포 영역을 다루기 때문에 관련된 기술의 선택이 굉장히 많습니다. 쿠버네티스가 관리하는 영역별로 선택할 수 있는 기술이나 도구를 정리합니다.

## 클러스터 관리 도구

### 클러스터 구성
각 호스트 환경에서 구성할 수 있는 클러스터를 구분합니다.

#### Local
- [Minikube](https://minikube.sigs.k8s.io/)

#### Linux
- [MicroK8s](https://microk8s.io/)
- [Kubeadm](https://github.com/kubernetes/kubeadm)

#### AWS
- [Kops](https://kops.sigs.k8s.io/)
- [Kubespray](https://github.com/kubernetes-sigs/kubespray)

### 컨테이너 런타임(Container Runtime)  
쿠버네티스 클러스터에서는 컨테이너 런타임으로 다음 중 선택할 수 있습니다.

- [Docker](https://www.docker.com/)
- [Containerd](https://containerd.io/)
- [CRI-O](https://cri-o.io/)

### 클러스터 관리  
클러스터를 관리하는데 용이한 몇가지 도구를 정리합니다.

#### CLI
- [kube-shell](https://github.com/cloudnativelabs/kube-shell)
- [kubectx - Faster way to switch between clusters and namespaces in kubectl](https://github.com/ahmetb/kubectx/)
- [eksctl - The official CLI for Amazon EKS](https://eksctl.io/)
- [k9s - dog Kubernetes CLI To Manage Your Clusters In Style!](https://k9scli.io/)  

#### GUI
- [Kubernetes Dashboard](https://github.com/kubernetes/dashboard#kubernetes-dashboard)
- [Helm - Kubernetes Package Manager](https://helm.sh/ko/)
- [Kubeapps - Web UI based Cluster](https://kubeapps.com/)
- [kube-aws](https://github.com/kubernetes-incubator/kube-aws)
- [Lens - The Kubernetes IDE](https://k8slens.dev/)
- [Kube Forwarder - Easy to use Kubernetes port forwarding manager](http://kube-forwarder.pixelpoint.io/)

## 클러스터 네트워크


### 인그레스 컨트롤러(Ingress Controller)  
클러스터 외부에서 접근하는 것을 내부로 전파하기 위한 컨트롤러로 다음 중 선택할 수 있습니다.

- [Nginx Ingress - NGINX and NGINX Plus Ingress Controllers for Kubernetes](https://github.com/nginxinc/kubernetes-ingress)
- [Ambassador](https://www.getambassador.io/)
- [HAProxy Ingress](https://haproxy-ingress.github.io/)
- [Traefik](https://containo.us/traefik/)

### 네트워크 정책 공급자(Network Policy Provider)  
쿠버네티스에 일종의 방화벽 개념의 트래픽을 통제할 수 있는 네트워크 정책을 제공할 공급자를 선택할 수 있습니다.

#### 위브넷(Weave Net)
[위브넷(Weave Net)](https://www.weave.works/oss/net/)
```zsh
$ kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"

$ kubectl -n kube-system get pods
NAME                               READY   STATUS    RESTARTS   AGE
coredns-66bff467f8-ftnd4           1/1     Running   0          2m56s
etcd-minikube                      1/1     Running   0          2m58s
kube-apiserver-minikube            1/1     Running   0          2m58s
kube-controller-manager-minikube   1/1     Running   0          2m58s
kube-proxy-88772                   1/1     Running   0          2m56s
kube-scheduler-minikube            1/1     Running   0          2m58s
storage-provisioner                1/1     Running   0          2m44s
weave-net-2d7sz                    2/2     Running   0          60s

```

#### 캘리코(Calico)
[캘리코(Calico)](https://www.projectcalico.org/)

```zsh
$ sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF

$ sudo apt-get update
$ sudo apt-get install -y kubelet kubeadm kubectl
$ sudo apt-mark hold kubelet kubeadm kubectl

$ sudo swapoff -a
$ sudo kubeadm init --pod-network-cidr=192.168.0.0/16

$ sudo kubeadm join 192.168.0.11:6443 --token 0kctvt.sode0fhof0gw3q1f \
    --discovery-token-ca-cert-hash sha256:623aa1767a7bee4059336e0675ca419f665e93de0c67cd2c64db18e72c45c9d3

$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config

$ kubectl config current-context
kubernetes-admin@kubernetes

$ kubectl apply -f https://docs.projectcalico.org/v3.14/manifests/calico.yaml
$ kubectl -n kube-system get pods -o wide
```

#### 플라넬(Flannel)
[플라넬(Flannel)](https://github.com/coreos/flannel)

```zsh
$ kubeadm init --pod-network-cidr=10.244.0.0/16  
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/kubeadm-config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/kubeadm-config

$ export KUBECONFIG=$HOME/.kube/config:$HOME/.kube/kubeadm-config
$ kubectl config use-context kubernetes-admin@kubernetes
Switched to context "kubernetes-admin@kubernetes".

$ kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml  

$ kubectl -n kube-system get pods

```

#### 실리움(Cilium)
[실리움(Cilium)](https://cilium.io/) operates at Layer 3/4 to provide traditional networking and security services as well as Layer 7 to protect and secure use of modern application protocols such as HTTP

```zsh
# 네트워크 플러그인 활성화
$ minikube start --network-plugin=cni --memory=4096
😄  Ubuntu 20.04 위의 minikube v1.12.1
🏄  끝났습니다! 이제 kubectl 이 "minikube" 를 사용할 수 있도록 설정되었습니다

# 리눅스 BPF 파일시스템 마운트
$ minikube ssh -- sudo mount bpffs -t bpf /sys/fs/bpf

# 실리움 데몬셋 설치
$ kubectl create -f https://raw.githubusercontent.com/cilium/cilium/1.8.1/install/kubernetes/quick-install.yaml  
serviceaccount/cilium created
serviceaccount/cilium-operator created
configmap/cilium-config created
clusterrole.rbac.authorization.k8s.io/cilium created
clusterrole.rbac.authorization.k8s.io/cilium-operator created
clusterrolebinding.rbac.authorization.k8s.io/cilium created
clusterrolebinding.rbac.authorization.k8s.io/cilium-operator created
daemonset.apps/cilium created
deployment.apps/cilium-operator created

# 설치 확인
$ kubectl -n kube-system get pods --watch
NAME                               READY   STATUS              RESTARTS   AGE
cilium-operator-657978fb5b-jwl2r   1/1     Running             0          71s
cilium-xvpjq                       0/1     Running             0          71s
coredns-66bff467f8-w2m6t           0/1     ContainerCreating   0          5m48s
etcd-minikube                      1/1     Running             0          5m46s
kube-apiserver-minikube            1/1     Running             0          5m46s
kube-controller-manager-minikube   1/1     Running             0          5m46s
kube-proxy-2hnkd                   1/1     Running             0          5m48s
kube-scheduler-minikube            1/1     Running             0          5m46s
storage-provisioner                1/1     Running             0          5m30s
coredns-66bff467f8-w2m6t           0/1     Running             0          5m50s
coredns-66bff467f8-w2m6t           1/1     Running             0          5m52s
cilium-xvpjq                       1/1     Running             0          82s
```

### 서비스 디스커버리(Service Discovery)  
쿠버네티스가 지원하는 모든 환경에서 기본으로 활성화된 DNS 클러스터 애드온을 제공합니다. 쿠버네티스 1.11 이후부터는 `CoreDNS`가 권장됩니다.

- [Kubernetes DNS](https://github.com/kubernetes/dns)
- [CoreDNS](https://coredns.io/)

### 서비스 매쉬(Service Mesh)
- [Envoy](https://www.envoyproxy.io/)
- [Istio](https://istio.io/)
- [Linkerd](https://linkerd.io/)

## 쿠버네티스 관련 국내 포스트  
쿠버네티스를 사용하면서 읽어보면 좋을 국내 포스트를 기록합니다.

- [조대협, 쿠버네티스 시리즈](https://bcho.tistory.com/1255)
- [Subicura, 쿠버네티스 시작하기 - Kubernetes란 무엇인가?](https://subicura.com/2019/05/19/kubernetes-basic-1.html)
- [IBM, 컨테이너와 쿠버네티스를 쉽게 이해하기](https://developer.ibm.com/kr/cloud/2019/02/01/easy_container_kubernetes/)
- [우아한형제들, 쿠버네티스를 이용해 테스팅 환경 구현해보기](https://woowabros.github.io/experience/2018/03/13/k8s-test.html)  

## 참고
- [Ramitsurana - Awesome Kubernetes](https://ramitsurana.github.io/awesome-kubernetes/)  
