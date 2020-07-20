---
  date: 2020-07-19
  title: K8S - 쿠버네티스 모니터링 시스템 적용하기
  categories:
    - Kubernetes
  tags:
    - Monitoring
    - Dashboard
---

![](/images/logo/kubernetes.jpg)

## 들어가며
쿠버네티스 클러스터를 통해 컨테이너화된 애플리케이션을 배포하고 관리하는 것을 위임하였습니다. 그러나 쿠버네티스에 의해 관리되는 애플리케이션에 대한 상태를 큐브컨트롤을 이용하여 확인하기에는 어려움이 많습니다. 쿠버네티스는 컨테이너 CPU 및 메모리 사용량과 같은 지표를 제공하는 매트릭 API를 지원합니다.

쿠버네티스에서 메트릭 API를 이용하기 위해서는 [쿠버네티스 메트릭 서버](https://github.com/kubernetes-sigs/metrics-server)를 배포해야합니다.

## 쿠버네티스 모니터링
쿠버네티스에서 애플리케이션에 대한 모니터링은 특정 모니터링 솔루션에 의존하지 않습니다. 쿠버네티스는 애플리케이션 모니터링 파이프라인을 제공하므로 매트릭 서버의 `metrics.k8s.io` API 또는 `custom.metrics.k8s.io`와 `external.metrics.k8s.io` API를 구현한 어댑터에 의해 노출된 정보를 모니터링에 사용할 수 있습니다.

{% note info %}
#### 프로메테우스
쿠버네티스와 같은 CNCF 프로젝트 소속인 프로메테우스는 기본적으로 쿠버네티스와 노드, 프로메테우스 자체를 모니터링 할 수 있습니다.
{% endnote %}

### 쿠버네티스 대시보드
[쿠버네티스 대시보드](https://github.com/kubernetes/dashboard)는 쿠버네티스 클러스터를 위한 범용 목적의 웹 UI를 제공합니다.

#### 대시보드 배포하기
쿠버네티스 대시보드 깃허브에서 제공하는 디플로이먼트 YAML 파일을 통해 배포합니다.

```zsh
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/master/aio/deploy/recommended.yaml
namespace/kubernetes-dashboard created
...
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created
```

기본적으로 쿠버네티스 대시보드에 접근하기 위하여 `프록시 채널` 또는 `포트 포워딩`을 이용할 수 있습니다.

```zsh
$ kubectl proxy
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/.

$ kubectl port-forward -n kubernetes-dashboard service/kubernetes-dashboard 8080:443
https://localhost:8080
```

#### 대시보드 사용자 만들기
쿠버네티스 대시보드에 접근할 수 있는 사용자를 만듭니다.

```yaml dashboard-admin-user.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
```

다음의 명령어를 수행하면 `admin-user`의 액세스 토큰을 가져올 수 있습니다.
```sh
$ kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')

...
Data
====
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IklVaWw1Q1ByS01iZDRSNkJjVWxkVEZ3dkFKeHJaeHQ4a...
ca.crt:     1066 bytes
namespace:  20 bytes
```

이제 위 토큰을 사용하여 쿠버네티스 대시보드에 접속할 수 있습니다.

### 쿠버네티스 프로메테우스
[쿠버네티스 프로메테우스](https://github.com/coreos/kube-prometheus)는 [Prometheus Operator](https://github.com/coreos/prometheus-operator)를 사용하여 프로메테우스로 쉽게 쿠버네티스 클러스터 모니터링을 운영하도록 제공합니다.

**Minikube**
미니큐브를 쿠버네티스 클러스터로 사용하는 경우 다음의 명령을 수행하여 다시 시작해야 합니다.  
```zsh
$ minikube delete && minikube start --kubernetes-version=v1.18.1 --memory=6g --bootstrapper=kubeadm --extra-config=kubelet.authentication-token-webhook=true --extra-config=kubelet.authorization-mode=Webhook --extra-config=scheduler.address=0.0.0.0 --extra-config=controller-manager.address=0.0.0.0
$ minikube addons disable metrics-server
```

#### 매니페스트 모니터링 스택 생성
쿠버네티스 프로메테우스 소스코드를 통해 모니터링 스택 구성을 위한 `매니패스트`를 제공합니다.

```zsh
$ git clone https://github.com/coreos/kube-prometheus
$ cd kube-prometheus

$ kubectl create -f manifests/setup
$ kubectl create -f manifests/

$ kubectl get pods -n monitoring
NAME                                   READY   STATUS              RESTARTS   AGE
alertmanager-main-0                    0/2     ContainerCreating   0          82s
alertmanager-main-1                    0/2     ContainerCreating   0          82s
alertmanager-main-2                    0/2     ContainerCreating   0          82s
grafana-668c4878fd-54w25               0/1     Running             0          77s
kube-state-metrics-957fd6c75-8r667     3/3     Running             0          77s
node-exporter-pknpf                    2/2     Running             0          76s
prometheus-adapter-66b855f564-wjz5m    1/1     Running             0          74s
prometheus-k8s-0                       0/3     ContainerCreating   0          71s
prometheus-k8s-1                       0/3     ContainerCreating   0          71s
prometheus-operator-5b96bb5d85-f8zqf   2/2     Running             0          2m15s
```

#### 대시보드 접근하기
쿠버네티스 프로메테우스로 배포된 `모니터링 스택(Prometheus, Grafana, AlertManager)`에 접근할 수 있도록 포트포워딩 설정합니다.

```zsh
$ kubectl --namespace monitoring port-forward svc/prometheus-k8s 9090
Forwarding from 127.0.0.1:9090 -> 9090

$ kubectl --namespace monitoring port-forward svc/grafana 3000  
Forwarding from 127.0.0.1:3000 -> 3000

$ kubectl --namespace monitoring port-forward svc/alertmanager-main 9093
Forwarding from 127.0.0.1:9093 -> 9093
```

#### 모니터링 스택 제거하기
쿠버네티스 프로메테우스로 설치한 모니터링 스택을 제거하기 위해서 다음의 명령을 수행합니다.

```zsh
$ kubectl delete --ignore-not-found=true -f manifests/ -f manifests/setup
...
deployment.apps "prometheus-operator" deleted
service "prometheus-operator" deleted
serviceaccount "prometheus-operator" deleted
```

## 참고
- [Kubernetes Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [Kubernetes Dashboard](https://github.com/kubernetes/dashboard)
- [Kubernetes Prometheus](https://github.com/coreos/kube-prometheus#kube-prometheus)
