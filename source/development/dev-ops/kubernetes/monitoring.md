---
    title: 쿠버네티스 모니터링
    description: 
    comments: false
---

쿠버네티스는 [웹 UI 대시보드](https://kubernetes.io/ko/docs/tasks/access-application-cluster/web-ui-dashboard/) 또는 여러가지 모니터링 아키텍처를 활용하여 쿠버네티스 클러스터를 모니터링할 수 있도록 지원한다.

# 모니터링

## 쿠버네티스 대시보드
[쿠버네티스 대시보드](https://github.com/kubernetes/dashboard)는 쿠버네티스 클러스터를 위한 웹 기반의 UI를 제공한다.

## 프로메테우스
쿠버네티스의 [모니터링 메트릭 파이프라인](https://kubernetes.io/ko/docs/tasks/debug-application-cluster/resource-usage-monitoring/#%EC%99%84%EC%A0%84%ED%95%9C-%EB%A9%94%ED%8A%B8%EB%A6%AD-%ED%8C%8C%EC%9D%B4%ED%94%84%EB%9D%BC%EC%9D%B8)은 kubelet에서 메트릭을 가져와서 노출할 수 있다. 프로메테우스는 메트릭을 수집할 수 있는 주요 서드 파티 중 하나이다.

> 기존에 사용하던 모니터링 도구인 Heapster가 Deprecated 되었다.

쿠버네티스에 `custom.metrics.k8s.io`와 `external.metrics.k8s.io`를 구현한 어댑터를 통해 프로메테우스로 노출할 수 있다.

> [k8s-prometheus-adaptor](https://github.com/DirectXMan12/k8s-prometheus-adapter)


