---
title: 이상 감지
date: 2025-03-15T00:00+09:00
tags:
- Fault
- Anomaly
- Outlier
---

> 본 글은 데이터 사이언스트 또는 데이터 엔지니어는 아니지만 모니터링 시스템에서 폴트 와는 다르다고 하는 이상 감지에 대해서 알아봅니다.

#### 폴트와 트립

먼저, `폴트(Fault)`는 설비 또는 시스템에서 발생한  <u>오류 또는 고장</u>을 말합니다. 일반적으로 폴트 항목에는 오류 또는 장애 이외의 항목이 포함되는데 일부 설비에서 시스템의 고장을 일으키는 상황을 보호하기 위해서 동작하는 차단기 또는 릴레이와 같은 장치가 동작한 상태를 `트립(Trip)`이라고 합니다. 트립은 설비에 따라서 과부하, 과열 센서 검출, 지락(누전) 등이 있습니다. 또한, 폴트에는 트립 이외에 경고(Warning) 상태인 경보(Alarm)도 포함하고 있습니다.

#### 이상 감지

`이상 감지(Anomaly Detection)`는 데이터를 분석하여 정상적인 범위에서 벗어난 `이상치(Outlier)` 데이터를 감지하여 검출한 것을 말합니다. 폴트가 시스템에서 발생할 수 있는 오류를 코드화한 것이라면 이상 감지(탐지)는 데이터 기반으로 추론 또는 예측되어 검출된 데이터를 말합니다. 이렇게 이상치 데이터로 분석된 것은 다양한 분야에서 활용되고 있습니다. IT 인프라 보안에서는 비정상적인 트래픽을 감지하고, 스마트 팩토리와 같은 제조 공정에서는 불량 제품을 검출하고, 의료 분야에서는 질병을 진단할 수 있는 정보, 그리고 금융 분야에서는 [이상거래 탐지(Fraud Detection)로  활용](https://tech.kakaobank.com/posts/2310-applying-ai-into-fds-system/)되고 있습니다. 

#### 이상치 데이터를 감지하는 방법

이상치 데이터를 감지하는 방법은 `통계학적 근거에 의한 판별`부터 `AI 머신 러닝의 학습 및 예측 모델` 기반의 방법으로 확장됩니다. [시계열 데이터 속에 숨어있는 이상 징후를 찾는 딥 러닝 기술](https://www.youtube.com/watch?v=bg2e60IZ40Q)에서 이상 탐지에 대한 부분을 소개해주고 있습니다. 데이터 분석 및 데이터 마이닝에 대한 지식은 부족하므로 제대로 이해되진 않지만 다음의 방법들이 존재합니다.

■ Z-Score based Anomaly Detection

먼저, Z-Score는 통계학적으로 정상적인 데이터는 3표준편차 일정 범위에 속한다는 [3시그마 규칙(3-sigma Rule)](https://ko.wikipedia.org/wiki/68-95-99.7_%EA%B7%9C%EC%B9%99)에 의한 경험적인 추정을 근거로 이상치 데이터를 판별합니다. 그외 통계학적 방식에는 [ARIMA 시계열 예측 모델 기반 이상 탐지](https://medium.com/aimonks/anomaly-detection-for-time-series-analysis-eeecd6282f53)도 있는데 자기회귀(Auto Regressive)와 이동 평균(Moving Average)으로 추론된 예측된 값을 기반으로 이상치를 확인한다고 합니다.

■ IF based Anomaly Detection

의사결정 트리(Decision Tree) 또는 [앙상블 기반 이상 탐지](https://scikit-learn.org/stable/api/sklearn.ensemble.html)에 해당하는 [IF(Isolation Forest)](https://www.youtube.com/watch?v=puVdwi5PjVA) 이상탐지는 데이터 밀도에 의한 트리를 통해 비정상적인 데이터는 루트 노드와 근접하고 경로 길이가 작은 데이터임을 근거로하여 이상치로 판별하게 됩니다. 

■ Distance based Anomaly Detection

`유사도를 측정하는 거리(Distance) 공식`으로 이상치 데이터를 판별하는 방법에는 k-NN(K-Nearest Neighbor), LOF(Local outlier factors), 마할라노비스 거리 (Mahalanobis Distance) 기반의 이상 탐지가 있습니다. 유클리드 거리 공식 이외에 마할라노비스 거리는 처음 들어보는데  [공분산 행렬](https://ko.wikipedia.org/wiki/%EA%B3%B5%EB%B6%84%EC%82%B0_%ED%96%89%EB%A0%AC)이 추가된 것이라고 합니다.

■ Clustering based Anomaly Detection

클러스터링 기반 이상 탐지는 `정상적인 데이터의 군집을 분석`하고 정상적인 패턴으로 파악된 군집에서 사전 정의된 임계치(Threshold)를 얼마나 벗어나는가로 이상치 데이터를 판별합니다. 군집화 알고리즘은 여러가지가 있지만 대표적으로 K-Means, GMM(Gaussian Mixture Model), DBSCAN이 활용되는 것 같습니다.

■ Kernal based Anomaly Detection

[OCSVM(One-class Support Vector Machine)](https://www.youtube.com/watch?v=CjvMZmMTmQc)와 Deep SVDD(Support Vector Data Description)은 `정상적인 데이터에 대한 반지도 학습이 필요`한 커널 기반 이상 탐지 기법입니다. OCSVM(1-SVM)은 가장 많이 사용되는 커널 기반 이상 탐지라고 하며 Deep SVDD는 DNN(Deep Neural Network)으로 확장한 모델입니다.

■ Reconstruction error based Anomaly Detection

[AE(AutoEncoder)](https://www.youtube.com/watch?v=v8dzXskvF6c)와 [PCA(Principal Component Analysis)](https://www.youtube.com/watch?v=TXESAGRF1Hc) 그리고 [GAN(Generative Adversarial Network)](https://www.youtube.com/watch?v=cd-kj1ysqOc)은 압축된 데이터를 `원본 데이터로 재구성할 때 발생하는 오차`를 통해 이상치를 판별하는 이상 탐지 기법입니다.

■ Transformer based Anomaly Detection

[Anomaly Transformer](https://www.youtube.com/watch?v=BFVyLL2HXGQ)는 시계열 데이터에 Transformer를 접목한 모델로 `Self Attention에 의한 연관성 학습`으로 다변량 시계열 데이터에 대해 개선된 이상 탐지가 가능하다고하니 여러가지 IoT 디바이스의 시계열 데이터에 대한 이상 탐지에 유용할 것으로 보입니다.

#### 내가 선택해보는 이상 감지 기법

실제로는 데이터에 따라 직접 여러가지 방법으로 이상 감지를 수행해보고 결정해야하지만 Z-Score, DBSCAN, Anomaly Transformer를 선택할 가능성이 높다고 생각합니다. 현재 프로젝트에서 이상 감지 결과는 분석 팀에서 전달할 가능성이 높으므로 어떤 방법이 선택되었는지 살펴보아야할 것 같습니다. 끝으로, 이상 탐지에 대한 정보를 살펴보다보니 대부분의 글이 잘 이해되지 않는 판교어처럼 보이게 되어버리는 것 같습니다. 나중에 파이썬을 배워보는 시간을 가지면서 [사이킷 런(scikit-learn)](https://scikit-learn.org/stable/) 라이브러리로 시계열 데이터에 대한 [이상 감지를 직접 해보려고](https://medium.com/mlthinkbox/anomaly-detection-with-isolation-forest-in-scikit-learn-99417dcc3971) 합니다.