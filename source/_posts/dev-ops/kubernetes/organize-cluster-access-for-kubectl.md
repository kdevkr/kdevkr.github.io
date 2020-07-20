---
  date: 2020-07-19
  title: K8S - 쿠버네티스 큐브컨트롤 액세스 구성하기
  categories:
    - Kubernetes
  tags:
    - Cluster Access
---

![](/images/logo/kubernetes.jpg)

## 들어가며
쿠버네티스 클러스터에 내장되어 제공되는 `큐브컨트롤(kubectl)`은 자체적으로 클러스터에 액세스할 수 있도록 인증 정보를 포함하고 있습니다. 쿠버네티스 클러스터가 설치되어있는 호스트가 아닌 외부에서 클러스터에 접근하기 위해서는 직접 큐브컨트롤을 설치하고 클러스터 인증 정보를 설정해야 합니다.

이번 글에서는 큐브컨트롤을 통해 다중 클러스터에 접근할 수 있는 구성하는 것을 시도해보기 위하여 로컬 리눅스 호스트에 `Minikube`와 `MicroK8s`으로 클러스터 환경을 실행하였다고 가정합니다.


## 쿠버네티스 액세스 구성하기
쿠버네티스는 `kubeconfig`라는 YAML 형식의 파일을 사용하여 큐브컨트롤이 참조할 수 있는 클러스터, 사용자, 네임스페이스 및 인증 정보를 관리합니다. 큐브컨트롤은 이 kubeconfig 파일을 사용하여 클러스터를 선택하고 클러스터 API 서버와의 통신 정보를 찾습니다.

기본적으로 큐브컨트롤은 `$HOME/.kube/config` 파일을 kubeconfig 으로써 찾습니다. 또한, 큐브컨트롤 명령어를 수행할 때 --kubeconfig 플래그를 지정해서 별도의 kubeconfig 파일을 지정하여 사용할 수도 있습니다.

### Minikube.kubeconfig
미니큐브로 쿠버네티스 클러스터를 시작하면 `$HOME/.kube/config` 파일에 클러스터 정보를 병합하여 제공합니다.

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

위 명령은 미니큐브에 내장되어있는 큐브컨트롤을 이용하였지만 직접 설치한 큐브컨트롤을 사용해도 동일한 컨텍스트 정보를 확인할 수 있습니다.

### MicroK8s.kubeconfig
Minikube 와는 다르게 MicroK8s는 클러스터 정보를 `$HOME/.kube/config`에 병합하지 않습니다. MicroK8s에 내장된 큐브컨트롤이 참조하는 kubeconfig 파일은 `/var/snap/microk8s/current/client.config` 입니다.

따라서, 큐브컨트롤에서 MicroK8s 클러스터 정보를 참조하고 싶다면 다음의 명령을 수행하기도 합니다.
```zsh
$ sudo microk8s kubectl config view --raw > $HOME/.kube/config
```

### 다중 클러스터 액세스 구성
우리의 목적은 큐브컨트롤이 단일 클러스터 정보를 참조하는 것이 아닌 다수의 클러스터에 접근할 수 있도록 하는 것입니다. 큐브컨트롤은 `KUBECONFIG` 환경변수에 나열된 kubeconfig 파일들을 병합하여 사용합니다.

다음과 같이 Minikube에 대한 클러스터 정보는 `$HOME/.kube/config`에 있으므로 Microk8s에 대한 클러스터 정보를 별도의 kubeconfig 파일로 저장하여 KUBECONFIG 환경변수에 설정합니다.
```zsh
$ sudo microk8s kubectl config view --raw > $HOME/.kube/microk8s-config
$ export KUBECONFIG=$HOME/.kube/config:$HOME/.kube/microk8s-config
```

이제 큐브컨트롤이 참조하는 클러스터 정보를 확인하면 다음과 같이 병합된 것을 확인할 수 있습니다.
```zsh
$ kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://127.0.0.1:16443
  name: microk8s-cluster
- cluster:
    certificate-authority: /home/mambo/.minikube/ca.crt
    server: https://172.17.0.5:8443
  name: minikube
contexts:
- context:
    cluster: microk8s-cluster
    user: admin
  name: microk8s
- context:
    cluster: minikube
    user: minikube
  name: minikube
current-context: minikube
kind: Config
preferences: {}
users:
- name: admin
  user:
    token: VURZdXJtMHZOaVY4RngweXJCbDIxcVc1OHJLWTdpQUQwTjJic3lEdWJzZz0K
- name: minikube
  user:
    client-certificate: /home/mambo/.minikube/profiles/minikube/client.crt
    client-key: /home/mambo/.minikube/profiles/minikube/client.key
```

#### 현재 클러스터 변경하기
큐브컨트롤은 current-context로 설정된 클러스터를 기본으로 사용합니다. 만약, 현재 클러스터를 변경하고 싶은 경우 `kubectl config use-context` 명령을 수행하면 됩니다.

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

이제 우리는 큐브컨트롤으로 다수의 클러스터에 접근할 수 있도록 구성할 수 있게 되었습니다. 짝짝짝!

## 참고
- [kubectl의 클러스터 액세스 구성](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl?hl=ko)
- [다중 클러스터 접근 구성](https://kubernetes.io/ko/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)
- [kubeconfig 파일을 사용하여 클러스터 접근 구성하기](https://kubernetes.io/ko/docs/concepts/configuration/organize-cluster-access-kubeconfig/)
