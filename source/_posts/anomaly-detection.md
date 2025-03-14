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

먼저, `폴트(Fault)`는 설비 또는 시스템에서 발생한  <u>오류 또는 고장</u>을 말합니다. 일반적으로 폴트 항목에는 오류 또는 장애 이외의 항목이 포함되는데 일부 설비에서 시스템의 고장을 일으키는 상황을 보호하기 위해서 동작하는 차단기 또는 릴레이와 같은 장치가 동작한 상태를 `트립(Trip)`이라고 합니다. Trip은 설비에 따라서 과부하, 과열 센서 검출, 지락(누전) 등이 있습니다. 또한, 폴트에는 트립 이외에 경고(Warning) 상태인 경보(Alarm)도 포함하고 있습니다.

#### 이상 감지

`이상 감지(Anomaly Detection)`는 데이터를 분석하여 정상적인 범위에서 벗어난 `이상치(Outlier)` 데이터를 감지하여 검출한 것을 말합니다. 폴트가 시스템에서 발생할 수 있는 오류를 코드화한 것이라면 이상 감지(탐지)는 데이터 기반으로 추론 또는 예측되어 검출된 데이터를 말합니다. 이렇게 이상치 데이터로 분석된 것은 다양한 분야에서 활용되고 있습니다. IT 인프라 보안에서는 비정상적인 트래픽을 감지하고, 스마트 팩토리와 같은 제조 공정에서는 불량 제품을 검출하고, 의료 분야에서는 질병을 진단할 수 있는 정보, 그리고 금융 분야에서는 [이상거래 탐지(Fraud Detection)로  활용](https://tech.kakaobank.com/posts/2310-applying-ai-into-fds-system/)되고 있습니다. 

#### 이상치 데이터를 감지하는 방법

이상치 데이터를 감지하는 방법은 `통계학적 근거에 의한 판별`부터 `AI 머신 러닝의 학습 및 예측 모델` 기반의 방법으로 확장됩니다. [시계열 데이터 속에 숨어있는 이상 징후를 찾는 딥 러닝 기술](https://www.youtube.com/watch?v=bg2e60IZ40Q)에서 이상 탐지에 대한 부분을 소개해주고 있습니다.

■ Z-Score based Anomaly Detection

먼저, Z-Score는 통계학적으로 정상적인 데이터는 3표준편차 일정 범위에 속한다는 [3시그마 규칙(3-sigma Rule)](https://ko.wikipedia.org/wiki/68-95-99.7_%EA%B7%9C%EC%B9%99)에 의한 경험적인 추정을 근거로 이상치 데이터를 판별합니다. 그외 통계학적 방식에는 [ARIMA 시계열 예측 모델 기반 이상 탐지](https://medium.com/aimonks/anomaly-detection-for-time-series-analysis-eeecd6282f53)도 있는데 자기회귀(Auto Regressive)와 이동 평균(Moving Average)으로 추론된 예측된 값을 기반으로 이상치를 판별합니다.

■ IF based Anomaly Detection

[IF(Isolation Forest)](https://www.youtube.com/watch?v=puVdwi5PjVA) 기반 이상 탐지는 의사결정 트리(Decision Tree)를 통해 루트 노드와 근접하고 경로 길이가 작은 데이터를 이상치로 판별하게 됩니다. 이와 같은 이상 탐지를 [앙상블 기반 이상 탐지](https://scikit-learn.org/stable/api/sklearn.ensemble.html)라고도 하는 것 같습니다.

■ k-NN based Anomaly Detection

k-NN(K-Nearest Neighbor) 기반 이상 탐지는 이웃 데이터 간 거리(Distance)가 먼 데이터를 이상치로 판별하는 방법으로 다른 거리 기반 이상 탐지 방법에는 k-NN 거리와 함께 밀집도를 기반으로 하는 LOF(Local outlier factors) 이상 탐지도 있습니다.

■ Clustering based Anomaly Detection

클러스터링 기반 이상 탐지에는 K-means 및 DBScan 군집화 알고리즘이 활용됩니다. 

■ Kernal based Anomaly Detection

[OCSVM(One-class Support Vector Machine)](https://www.youtube.com/watch?v=CjvMZmMTmQc)와 Deep SVDD(Support Vector Data Description)은 정상적인 데이터에 대한 반지도 학습이 필요한 커널 기반 이상 탐지 기법입니다. OCSVM(1-SVM)은 정상적인 데이터를 통해 이상치를 예측할 때 많이 사용되는 모델이라고 합니다.

■ Reconstruction error based Anomaly Detection

[AE(AutoEncoder)](https://www.youtube.com/watch?v=v8dzXskvF6c)와 [PCA(Principal Component Analysis)](https://www.youtube.com/watch?v=TXESAGRF1Hc)는 압축된 데이터를 원본 데이터로 재구성할 때 발생하는 오차를 통해 이상치를 판별하는 이상 탐지 기법입니다. 또다른 재구성 오차 기반 이상 감지에는 가상의 데이터를 생성하는 [GAN(Generative Adversarial Network)](https://www.youtube.com/watch?v=cd-kj1ysqOc)이 있습니다. 

■ Transformer based Anomaly Detection

[Anomaly Transformer](https://www.youtube.com/watch?v=BFVyLL2HXGQ)는 시계열 데이터에 Transformer를 접목한 모델로 연관성 학습으로 다변량 시계열 데이터에 대해 개선된 이상 탐지가 가능합니다.

이상 탐지에 대한 정보를 살펴보다보니 대부분의 글이 판교어처럼 보이는 것 같습니다. 시간이 된다면 파이썬을 배워보면서 [사이킷 런(scikit-learn)](https://scikit-learn.org/stable/) 라이브러리로 [이상 감지를 해보는것](https://medium.com/mlthinkbox/anomaly-detection-with-isolation-forest-in-scikit-learn-99417dcc3971)도 좋을 것 같습니다.