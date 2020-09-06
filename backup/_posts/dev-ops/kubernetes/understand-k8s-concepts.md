---
date: 2020-07-19
title: K8S - 쿠버네티스 개념 이해하기
categories:
  - Kubernetes
tags:
  - Concepts
---

![](/images/logo/kubernetes.jpg)  

## 들어가며
쿠버네티스는 컨테이너 오케스트레이션 시스템입니다. 그러나, 쿠버네티스에서 사용되는 용어는 대부분 낯설고 이해하는데 어려움이 많습니다. 단순히 용어만으로는 쿠버네티스를 이해하기가 힘들 수 있습니다.
따라서, 이번 글에서는 쿠버네티스에서 사용되는 `개념`에 대해서 이해해보고자 합니다.

## 쿠버네티스 개념 이해하기
쿠버네티스 사용자는 쿠버네티스 클러스터에 바라는 상태를 쿠버네티스 API 오브젝트로 기술하여 제공합니다. 그리고 기술되어진 상태는 쿠버네티스 마스터에 의해 각 쿠버네티스 노드를 관리하게 됩니다.

다음 그림은 클러스터 구조를 이해할 수 있는 쿠버네티스 클러스터 다이어그램 입니다.
![](https://d33wubrfki0l68.cloudfront.net/7016517375d10c702489167e704dcb99e570df85/7bb53/images/docs/components-of-kubernetes.png)

### 쿠버네티스 컨트롤 플레인
쿠버네티스 컨트롤 플레인의 다양한 구성요소는 쿠버네티스가 클러스터와 통신하는 방식을 관장하는 역할을 하게됩니다. 다시 말하면 쿠버네티스 컨트롤 플레인은 Pod Lifecycle Event Generator (PLEG)을 통하여 클러스터의 현재 상태를 바라는 상태와 일치시킵니다.

**쿠버네티스 마스터**
- kube-apiserver
- kube-controller-manager
- kube-scheduler

**워커 노드**
- kubelet
- kube-proxy

### 쿠버네티스 오브젝트
사용자는 쿠버네티스 마스터에게 `쿠버네티스 API 오브젝트`로 바라는 상태를 기술하게 됩니다. 쿠버네티스 API 오브젝트는 다음과 같은 것들이 있습니다.

**기초 오브젝트**
- 파드
- 서비스
- 볼륨
- 네임스페이스

**기초 오브젝트를 확장한 오브젝트**
- 디플로이먼트
- 데몬셋
- 스테이트풀셋
- 레플리카셋
- 잡

#### 파드
파드는 쿠버네티스에서 배포되는 애플리케이션의 기본 실행 단위입니다. 다시 말하면, 쿠버네티스 API 오브젝트에 의해 배포될 수 있는 가장 작은 단위입니다. 일반적인 경우 파드가 하나의 컨테이너를 담당하지만, 하나의 파드에 다수의 컨테이너가 포함될 수 있습니다. 따라서, 쿠버네티스 애플리케이션 인스턴스라고 할 수 있습니다.

하나의 파드에 속한 컨테이너들을 네트워크와 저장소라는 자원을 공유합니다. 이 말은 같은 파드에 속한 컨테이너는 `localhost`를 통해 다른 컨테이너와 통신할 수 있으며 같은 볼륨에 접근할 수 있다는 것입니다.

보통 쿠버네티스 사용자는 파드를 직접 기술할 수도 있겠지만 파드를 생성하고 관리하기 위한 워크로드 리소스를 사용합니다. 리소스 컨트롤러는 기술된 워크로드 리소스에 따라 파드에 대한 복제, 롤아웃, 복구를 처리합니다.

> 파드에 대한 더 자세한 내용은 [Kubernetes Docs - Pod](https://kubernetes.io/ko/docs/concepts/workloads/pods/pod/)를 참고하세요

#### 레플리카셋
파드를 생성하고 관리하기 위한 워크로드 리소스 중 하나인 `레플리카셋`은 파드에 대한 레플리카 개수를 안정적으로 유지하기 위한 목적으로 명시된 파드 개수에 대한 가용성을 보증하는데 사용됩니다.

```yaml controllers/frontend.yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: frontend
  labels:
    app: guestbook
    tier: frontend
spec:
  # 케이스에 따라 레플리카를 수정한다.
  replicas: 3
  selector:
    matchLabels:
      tier: frontend
  template:
    metadata:
      labels:
        tier: frontend
    spec:
      containers:
      - name: php-redis
        image: gcr.io/google_samples/gb-frontend:v3
```

파드처럼 레플리카셋도 직접 기술할 수 있으나 더 상위 개념의 워크로드 리소스인 디플로이먼트에 포함되어 사용되는 것을 권장합니다.

```zsh Zsh
$ kubectl apply -f https://kubernetes.io/examples/controllers/frontend.yaml
replicaset.apps/frontend created

$ kubectl get replicaset
NAME                        DESIRED   CURRENT   READY   AGE
frontend                    3         3         0       36s
```

#### 디플로이먼트
레플리카셋의 상위 개념인 디플로이먼트는 파드와 레플리카셋에 대한 선언적 업데이트를 제공하는 워크로드 리소스 입니다. 쿠버네티스 사용자는 디플로이먼트를 기술하여 바라는 상태를 제공하는 것을 권장합니다.

```yaml  controllers/nginx-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
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

다음과 같이 위 쿠버네티스 오브젝트 문서를 통해 디플로이먼트를 반영할 수 있습니다.
```zsh Zsh
$ kubectl apply -f https://k8s.io/examples/controllers/nginx-deployment.yaml
$ kubectl get deployments
$ kubectl get rs
```

다음 [쿠버네티스 고급 개념 이해하기](../understand-k8s-concepts-advanced)에서 이어집니다.

## 참고
- [Kubernetes Docs - Concepts](https://kubernetes.io/ko/docs/concepts/)
