---
    title: 쿠버네티스 로드 밸런싱
    description: 
    comments: false
---

# 로드 밸런싱

## 서비스
서비스는 파드에서 실행중인 프로세스를 위한 신원을 제공한다. 따라서, 쿠버네티스는 파드에게 고유한 IP 주소와 파드 집합에 대한 단일 DNS 명을 부여하고 파드 간의 로드-밸런스를 수행할 수 있다.

### 서비스 오브젝트 정의
```yaml service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
```

### 서비스 퍼블리싱
서비스를 클러스터 밖에 있는 외부 IP 주소에 노출하고 싶은 경우 `ServiceTypes`로 원하는 서비스 종류를 지정할 수 있다.

- ClusterIP : 기본값으로 서비스를 클러스터 내부 IP에 노출시킨다.
- NodePort : 고정 포트로 각 노드의 IP에 서비스를 노출시킨다.

## 인그레스
클러스터 내의 서비스에 대한 외부 접근을 관리하는 API 오브젝트로 HTTP를 관리한다.

### 인그레스 오브젝트 정의

### 인그레스 컨트롤러
인그레스 리소스가 작동하기 위해서 클러스터는 실행중인 인그레스 컨트롤러가 반드시 필요하다. 쿠버네티스는 현재 [GCE](https://git.k8s.io/ingress-gce/README.md) 와 [nginx](https://git.k8s.io/ingress-nginx/README.md) 컨트롤러를 지원하고 유지한다.  

- [Ambassador](https://www.getambassador.io/) API 게이트웨이
- [HAProxy Ingress](https://haproxy-ingress.github.io/)
- [Traefik](https://github.com/containous/traefik)

## 네트워크 정책
네트워크 정책은 파드 그룹이 서로 간 또는 다른 네트워크 엔드포인트와 통신할 수 있도록 허용하는 방법에 대한 명세이다. 선택한 파드에 허용되는 트래픽을 지정하는 규칙을 정의한다.

```yaml network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      role: db
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - ipBlock:
        cidr: 172.17.0.0/16
        except:
        - 172.17.1.0/24
    - namespaceSelector:
        matchLabels:
          project: myproject
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 6379
  egress:
  - to:
    - ipBlock:
        cidr: 10.0.0.0/24
    ports:
    - protocol: TCP
      port: 5978
```
