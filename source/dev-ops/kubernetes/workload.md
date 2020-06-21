---
    title: 쿠버네티스 워크로드
    description: 
    comments: false
---

# 워크로드  

## 파드
파드는 하나 이상의 컨테이너를 가지는 그룹이다. 이 그룹은 스토리지나 네트워크를 공유하고 컨테이너들의 구동 방식에 대한 명세(Spec)을 갖는다. 파드는 컨테이너를 가지는 단위이기 때문에 쿠버네티스에서 배포할 수 있는 최소 단위라고 할 수 있다. 

파드 안의 컨테이너들은 네트워크를 공유하는데 서로를 `localhost`를 통해 찾을 수 있으며 컨테이너는 주로 서로의 IP 주소를 통해 소통한다.

![](https://d33wubrfki0l68.cloudfront.net/aecab1f649bc640ebef1f05581bfcc91a48038c4/728d6/images/docs/pod.svg#wrap)

- 컨텐츠 관리 시스템, 파일과 데이터 로더, 로컬 캐시 관리 등.
- 로그와 백업 체크포인트, 압축, 로테이션, 스냅샷 등.
- 데이터 변동 감시자, 로그 추적자, 로깅 및 모니터링 어댑터, 이벤트 관리 등.
- 프록시, 브릿지, 어댑터
- 컨트롤러, 매니저, 설정, 업데이트

파드는 쿠버네티스 REST API에서 최상위 리소스이다.

### 파드와 컨테이너의 상태
컨테이너의 상태를 체크하려면 `kubectl describe pod [POD_NAME]` 명령을 사용한다.

- Waiting : 기본 상태로 이미지를 내려받는 등의 필요한 오퍼레이션이 수행중인 상태
- Running : 컨테이너가 이슈 없이 구동
- Terminated : 컨테이너가 성공적으로 작업을 완료했거나 어떤 이유에서 실패했을 경우

### API 오브젝트
> https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#pod-v1-core

파드 오브젝트는 다음과 같이 구성한다.

- apiVersion
- kind
- metadata
- spec
- status

```yaml redis-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: redis-master
  labels:
    app: redis
spec:
  containers:
    - name: master
      image: redis
      env:
        - name: MASTER
          value: "true"
      ports:
        - containerPort: 6379
```

## 컨트롤러

### 레플리카셋
레플리카셋은 파드 집합의 실행을 항상 안정적으로 유지하는 것을 목적으로 한다. 보통 명시된 파드 개수에 대한 가용성을 보증하는데 사용한다.

- 파드 셀렉터
- 레플리카 수
- 파드 템플릿

### 디플로이먼트
디플로이먼트는 레플리카셋의 대안으로써 파드와 레플리카셋에 대한 선언적 업데이트를 제공한다. 디플로이먼트에서 의도하는 상태를 설명하면 디플로이먼트 컨트롤러는 현재 상태에서 의도하는 상태로 비율을 조정하며 변경한다.

```yaml nginx-deployment.yaml
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
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```

#### 디플로이먼트 생성
```sh
# 디플로이먼트 생성
kubectl apply -f https://k8s.io/examples/controllers/nginx-deployment.yaml

# 디플로이먼트 확인
kubectl get deployments

# 디플로이먼트의 롤아웃 상태
kubectl rollout status deployment.v1.apps/nginx-deployment

# 디플로이먼트의 레플리카셋 확인
kubectl get rs

# 디플로이먼트의 파드 확인
kubectl get pods --show-labels
```

#### 디플로이먼트 업데이트
디플로이먼트의 파드 템플릿이 변경된 경우에만 롤아웃이 트리거된다. 따라서 다음 단계에 따라 디플로이먼트를 업데이트할 수 있다.

```sh
# 파드 템플릿의 이미지 업데이트
kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1 --record

# 디플로이먼트 롤아웃 상태
kubectl rollout status deployment.v1.apps/nginx-deployment
```

#### 디플로이먼트 롤백
디플로이먼트의 롤아웃은 기본적으로 시스템에 기록되어 남아있어 지속적인 충돌로 인해 안정적이지 않은 경우 언제든지 롤백이 가능하다.

```sh
# 디플로이먼트 롤아웃 기록 확인
kubectl rollout history deployment.v1.apps/nginx-deployment

# 현재 롤아웃의 실행 취소
kubectl rollout undo deployment.v1.apps/nginx-deployment
```

#### 디플로이먼트 스케일링
```sh
# 디플로이먼트 스케일
kubectl scale deployment.v1.apps/nginx-deployment --replicas=10

# 디플로이먼트 오토스케일
kubectl autoscale deployment.v1.apps/nginx-deployment --min=10 --max=15 --cpu-percent=80
```