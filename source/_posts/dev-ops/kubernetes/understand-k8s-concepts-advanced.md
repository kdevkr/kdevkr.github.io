---
  date: 2020-07-21
  title: K8S - 쿠버네티스 고급 개념 이해하기
  categories:
    - Kubernetes
  tags:
    - Service
    - Network
    - Volume
---

![](/images/logo/kubernetes.jpg)

## 들어가며
이번 글에서는 쿠버네티스로 애플리케이션 배포와 운영을 관리할 때 알아야할 부분에 대해서 이해하고자 합니다. 웹 애플리케이션을 배포함에 있어서 인프라 영역은 중요한 부분 중 하나입니다. 특히나, 네트워크와 스토리지 관련된 부분은 일반 개발자가 제대로 이해하고 있기는 어렵다고 볼 수 있습니다. 쿠버네티스가 배포하고 관리하는 파드에 어떻게 접근하는지 살펴보면서 관련 부분을 이해해봅시다.

## 서비스 이해하기  
쿠버네티스는 서비스라는 네트워크 추상화 개념을 통해 파드에 대한 접근을 위한 주소를 노출합니다. 또한, 파드 집합에 동일한 단일 DNS 이름을 설정하고 파드에 대한 고유 주소를 할당하여 로드밸런싱이 가능하도록 합니다.

### 서비스 유형
쿠버네티스가 파드에 대한 접근을 위해 주소를 노출하는 방식의 유형은 다음과 같습니다.

- ClusterIP
- NodePort
- LoadBalancer
- ExternalName

기본 서비스 유형은 `ClusterIP`이며 클러스터 내부 IP로 할당되는 것이므로 오직 클러스터 내부에서만 접근할 수 있습니다. 이때, 사용자는 ClusterIP 유형의 서비스에 접근하기 위해서 프록시 채널 또는 포트포워딩을 사용할 수 있습니다.

#### NodePort  
`NodePort` 서비스 유형은 각 노드 IP의 정적 포트를 할당하여 서비스를 노출합니다. 따라서, 클러스터 외부에서 `<NodeIP>:<NodePort>`로 접근할 수 있습니다.

#### LoadBalancer  
`LoadBalancer` 유형은 클라우드 공급자의 로드 밸런서를 이용하여 서비스를 노출합니다. 이 경우 외부 로드 밸런서에 노출되기 위한 NodePort와 ClusterIP 서비스가 자동으로 생성됩니다.

## 네트워크 이해하기  


## 스토리지 이해하기  
쿠버네티스에서 스토리지 개념은 파드에서 사용할 저장 공간을 어떤 유형으로 제공할 것인가입니다.

- [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/)  
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

쿠버네티스는 볼륨과 퍼시스턴트 볼륨과 같은 스토리지 개념을 지원합니다.

### 볼륨
쿠버네티스는 볼륨이라는 추상화 개념으로 컨테이너 내의 데이터가 유실되거나 컨테이너 사이의 데이터를 공유하는 방법을 제공합니다. 쿠버네티스 볼륨은 도커 볼륨과는 다르게 파드와 같이 명시적인 수명을 가집니다. 또한, 굉장히 많은 유형의 볼륨을 지원하므로 이를 선택하여 사용할 수 있습니다.

주로 사용되는 볼륨 유형에는 다음과 같은 것들이 있습니다.
- **컨피그 맵(ConfigMap)** : 컨피그맵에 구성된 데이터를 파드에서 참조할 수 있습니다.
- **시크릿(Secret)** : `secret`은 tmpfs으로 지원하므로 비밀번호 같은 저장하기에는 민감한 정보를 파드에 전달하는데 사용합니다.
- **퍼시스턴트 볼륨 클레임(PersistentVolumeClaim)** : `persistentVolumeClaim`은 퍼시스턴트 볼륨을 파드에 마운트할 수 있도록 요청하는데 사용합니다.
- **네트워크 파일 시스템(NFS)** : `nfs` 볼륨은 파드가 제거될 때 마운트가 해제되지만 데이터는 유지됩니다.

예를 들어, 컨피그맵은 KDB+라는 데이터베이스를 실행하는 파드에서 실행 스크립트인 q.q를 구성하는데 사용할 수 있습니다.

```yaml q-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: q-configmap
data:
  q.q: |
    -1"Welcome to kdb+ 32bit edition\nFor support please see http://groups.google.com/d/forum/personal-kdbplus\nTutorials can be found at http://code.kx.com\nTo exit, type \\\\\nTo remove this startup msg, edit q.q";
```

### 퍼시스턴트 볼륨
`퍼시스턴트 볼륨(PV)`은 관리자가 프로비저닝하거나 스토리지 클래스를 사용하여 동적으로 프로비저닝한 클러스터의 스토리지입니다. 일반적인 볼륨과 다르게 퍼시스턴트 볼륨은 노드와 같은 클러스터 리소스입니다.

쿠버네티스는 퍼시스턴트 볼륨에도 많은 유형을 지원하며 일반적으로 많이 사용되는 것은 네트워크 파일 시스템(NFS)일 것입니다. NFS로 퍼시스턴트 볼륨의 용량을 할당해놓고 사용자가 원하는 볼륨의 크기를 요청하는데 앞서 볼륨 유형에서 확인한 `퍼시스턴트 볼륨 클레임(PVC)`을 사용합니다.

```yaml pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mambo-pv
  labels:
    name: mambo-pv
spec:
  capacity:
    storage: 1Ti
  accessModes:
  - ReadWriteMany
  nfs:
    server: 192.168.0.11
    path: /mambo
```

## 참고
- [Kubernetes Services, Load Balancing, Networking](https://kubernetes.io/docs/concepts/services-networking/)  
- [Kubernetes Storage](https://kubernetes.io/docs/concepts/storage/)
