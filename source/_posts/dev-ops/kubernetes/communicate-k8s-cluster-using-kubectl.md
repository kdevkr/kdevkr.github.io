---
  date: 2020-07-19
  title: K8S - 큐브컨트롤을 이용하여 클러스터와 통신하기
  categories:
    - Kubernetes
  tags:
    - Kubectl
---

## 들어가며
지난번 우리는 미니큐브를 설치하여 쿠버네티스 클러스터를 시작하였습니다. 쿠버네티스가 관리해주기 바라는 애플리케이션의 상태를 직접 조작하는 것이 아닌 쿠버네티스 클러스터에게 원하는 상태를 알려주어야 합니다. 클러스터로 원하는 상태를 알려주기 위해서는 `쿠버네티스 API`를 사용해야 합니다.

## 큐브컨트롤 사용하기
일반적으로 클러스터와 통신하기 위하여 `큐브컨트롤(kubectl)`이라고 하는 커맨드 라인 인터페이스를 사용합니다. 미니큐브와 `microk8s`와 같은 쿠버네티스 클러스터 구현체는 큐브컨트롤을 내장하고 있습니다.

### 큐브컨트롤 설치
쿠버네티스 클러스터 구현체가 내장하고 있는 큐브컨트롤을 이용하거나 직접 큐브컨트롤을 설치할 수 있습니다.  

{% tabs Unique name %}
<!-- tab Snap -->
`snap` 패키지를 지원하는 리눅스라면 쉽게 `kubectl`을 설치할 수 있습니다.
만약, snap 패키지를 지원하지 않는 환경이라면 [kubectl를 설치 및 설정](https://kubernetes.io/ko/docs/tasks/tools/install-kubectl/)을 참고하시기 바랍니다.

```zsh Zsh
$ snap install kubectl --classic
kubectl 1.18.6 from Canonical✓ installed

$ kubectl verison --client
```
<!-- endtab -->
<!-- tab Minikube -->
```zsh Zsh
$ alias kubectl="minikube kubectl --"
$ kubectl version --client
```
<!-- endtab -->
{% endtabs %}

### 큐브컨트롤 확장
큐브컨트롤은 명령어에 대한 `자동 완성`을 지원하므로 이를 활성화 할 수 있습니다.
만약, zsh을 이용하고 있다면 `kubectl completion zsh`으로 쉽게 활성화 할 수 있습니다.

```zsh Zsh
$ source <(kubectl completion zsh)
$ echo "[[ $commands[kubectl] ]] && source <(kubectl completion zsh)" >> ~/.zshrc
$ echo 'alias k=kubectl' >>~/.zshrc
$ echo 'complete -F __start_kubectl k' >>~/.zshrc

$ kubectl cluster-info          
Kubernetes master is running at https://172.17.0.4:8443
```

### 큐브컨트롤 활용
큐브컨트롤을 이용할 수 있다면 쿠버네티스 클러스터에 접근할 수 있습니다. 아직은 쿠버네티스에 대해 자세히 알지 못하므로 간단한 예제를 통해 큐브컨트롤을 이용하는 것을 살펴보겠습니다.

먼저, 간단하게 구글에서 제공하는 에코서버 이미지를 통해 애플리케이션을 쿠버네티스를 통해 배포해봅니다.

#### 디플로이먼트 만들기
디플로이먼트는 쿠버네티스에서 배포되는 하나의 단위라고 할 수 있습니다. 다음과 같이 큐브컨트롤을 이용하여 디플로이먼트를 생성하면 애플리케이션을 배포하는 것과 같습니다.

```zsh
$ kubectl create deployment hello-minikube --image=k8s.gcr.io/echoserver:1.4
$ kubectl get deployments
$ kubectl get pods --namespace default
NAME                              READY   STATUS    RESTARTS   AGE
hello-minikube-5655c9d946-zzgsf   1/1     Running   0          26m
```

#### 서비스 만들기
서비스는 쿠버네티스 가상 네트워크 외부에서 접근하기 위한 단위라고 할 수 있습니다. 앞서 디플로이먼트를 만듬으로 배포된 애플리케이션에 접근하기 위해서는 쿠버네티스의 가상 네트워크 외부에서 접근할 수 있는 포트를 노출시켜야 합니다.

```zsh
$ kubectl expose deployment hello-minikube --type=NodePort --port=8080
```

#### 에코서버 접근해보기
배포된 애플리케이션이 정상적으로 동작하는지 확인하기 위하여 쿠버네티스 서비스로 노출된 에코서버 애플리케이션에 접근해보고 싶습니다.

앞서 서비스를 통하여 접근할 수 있는 주소를 노출하였기 때문에 해당 서비스에 대한 정보를 확인해야 합니다.
```zsh
$ kubectl get service hello-minikube --output='jsonpath="{.spec.ports[0].nodePort}"'
"31882"%
$ kubectl cluster-info
Kubernetes master is running at https://172.17.0.5:8443
```

#### 에코서버 정리하기
에코서버 애플리케이션을 배포하기 위하여 생성한 디플로이먼트와 서비스를 삭제하여 쿠버네티스 자원을 정리합니다.

```zsh
$ kubectl delete service hello-minikube
$ kubectl delete deployment hello-minikube
```

이로써 우리는 큐브컨트롤을 이용하여 간단하게 에코서버 애플리케이션을 배포하고 정리해보았습니다. 쿠버네티스를 제대로 이해하기 위해서는 쿠버네티스에서 사용하는 개념을 알아야 합니다.

[쿠버네티스 개념 이해하기](../understand-k8s-concepts)에서 쿠버네티스에서 사용되는 개념에 대해 알아봅니다.

## 참고
- [Kubernetes Tutorial - Hello Minikube](https://kubernetes.io/ko/docs/tutorials/hello-minikube/)
- [Minikube - Deploying apps](https://minikube.sigs.k8s.io/docs/handbook/deploying/)
- [Kubernetes Docs - kubectl Cheatsheet](https://kubernetes.io/ko/docs/reference/kubectl/cheatsheet/)
