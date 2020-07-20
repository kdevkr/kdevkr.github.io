---
  date: 2020-07-19
  title: K8S - 쿠버네티스 큐브컨트롤 액세스 구성하기
  categories:
    - Kubernetes
  tags:
    - Cluster Access
---

## 들어가며
미니큐브와 같이 쿠버네티스 클러스터에 내장된 큐브컨트롤(kubectl)은 자체 쿠버네티스 클러스터에 접근하기 위한 구성을 기본적으로 제공합니다.

## 쿠버네티스 액세스 구성하기
쿠버네티스는 `kubeconfig`라는 YAML 형식의 파일을 사용하여 큐브컨트롤이 참조할 수 있는 클러스터, 사용자, 네임스페이스 및 인증 정보를 관리합니다. 큐브컨트롤은 이 파일을 사용하여 클러스터를 선택하고 클러스터 API 서버와의 통신 정보를 찾습니다.

기본적으로 큐브컨트롤은 `$HOME/.kube/config` 파일을 kubeconfig로  찾습니다. 큐브컨트롤 명령어를 수행할 때 --kubeconfig 플래그를 지정해서 별도의 kubeconfig 파일을 사용할 수 있습니다.

### Minikube.kubeconfig
미니큐브로 쿠버네티스 클러스터를 시작하면 `$HOME/.kube/config` 파일에 클러스터 정보를 병합합니다.

```zsh
$ minikube kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority: /home/mambo/.minikube/ca.crt
    server: https://172.17.0.5:8443
  name: minikube
contexts:
- context:
    cluster: minikube
    user: minikube
  name: minikube
current-context: minikube
kind: Config
preferences: {}
users:
- name: minikube
  user:
    client-certificate: /home/mambo/.minikube/profiles/minikube/client.crt
    client-key: /home/mambo/.minikube/profiles/minikube/client.key
```

### MicroK8s.kubeconfig
MicroK8s는 클러스터 정보를 `$HOME/.kube/config`에 병합하지 않습니다. MicroK8s에 내장된 큐브컨트롤이 참조하는 kubeconfig 파일은 `/var/snap/microk8s/current/client.config` 입니다.

따라서, 직접 설치한 큐브컨트롤에서 MicroK8s 클러스터를 참조하고 싶다면 다음의 명령을 수행합니다.
```zsh
$ sudo microk8s kubectl config view --raw > $HOME/.kube/config
```

### 다중 클러스터 구성
만약, 미니큐브와 MicroK8s의 클러스터를 하나의 큐브컨트롤에서 참조하고 싶다면 `KUBECONFIG` 환경변수로 `kubeconfig` 파일을 병합할 수 있습니다.

```zsh
$ export KUBECONFIG=$HOME/.kube/config:$HOME/.kube/microk8s-config
$ kubectl config view
```

#### 현재 클러스터 변경하기
`kubectl config use-context` 명령으로 빠르게 현재 컨텍스트를 변경할 수 있습니다.

```zsh
$ kubectl config current-context     
minikube

$ kubectl config use-context microk8s
Switched to context "microk8s".

$ kubectl config get-contexts
CURRENT   NAME       CLUSTER            AUTHINFO   NAMESPACE
*         microk8s   microk8s-cluster   admin      
          minikube   minikube           minikube
```


## 참고
- [kubectl의 클러스터 액세스 구성](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl?hl=ko)
- [다중 클러스터 접근 구성](https://kubernetes.io/ko/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)
- [kubeconfig 파일을 사용하여 클러스터 접근 구성하기](https://kubernetes.io/ko/docs/concepts/configuration/organize-cluster-access-kubeconfig/)
