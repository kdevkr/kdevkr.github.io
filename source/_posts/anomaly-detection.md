---
title: 개발자 알아보는 이상 감지
date: 2025-03-16T21:00+09:00
tags:
- Anomaly Detection
- Outlier Deteciton
---

#### 설비 결함과 이상 감지

전력 설비에서 발생하는 결함에는 지락(누전), 과부하, 과열 등의 오류와 경고 상태를 포함하고 있습니다. 전력 설비 모니터링 시스템에서의 이상 감지는 각 설비 디바이스로부터 수집되는 폴트 데이터 이외에 시계열 데이터를 분석하여 정상적인 데이터 범주에 속하지 않는 이상치를 판별하고 전력 설비 결함 또는 예상 징후를 예측하는데 활용됩니다. 이미 `이상 감지(Anomaly Detection)`를 통해서 스마트 팩토리에서는 [설비 불량을 검출](https://www.youtube.com/watch?v=ItAMGE2vLvk)하고 금융 분야에서는 [이상거래 탐지(Fraud Detection)](https://tech.kakaobank.com/posts/2310-applying-ai-into-fds-system/)하는 다양하게 활용되고 있습니다. 

#### 이상치 데이터를 감지하는 방법

이상치(Anomaly) 데이터를 감지하는 방법은 `통계학적 근거에 의한 판별`부터 `AI 머신 러닝의 학습 및 예측 모델` 기반의 방법으로 발전되어 사용되고 있는 것으로 보입니다. 다음의 영상들에서도 비정상 데이터를 감지하는 방법에 대해서 다루고 있는 걸 확인할 수 있었습니다.

- [시계열 데이터 속에 숨어있는 이상 징후를 찾는 딥 러닝 기술](https://www.youtube.com/watch?v=bg2e60IZ40Q)
- [몬스터 때려잡는 매크로 때려잡기](https://www.youtube.com/watch?v=xyog_y8gheA)
- [카카오톡 메시징 지표 이상감지 시스템의 개선사례](https://www.youtube.com/watch?v=j5xsDv35Nd4)

■ Z-Score based Anomaly Detection

먼저, [Z-Score를 통한 이상 감지](https://medium.com/@akashsri306/detecting-anomalies-with-z-scores-a-practical-approach-2f9a0f27458d)는 통계학적으로 정상적인 데이터가 3표준편차 범위에 속한다는 [3시그마 규칙(3-sigma Rule)](https://ko.wikipedia.org/wiki/68-95-99.7_%EA%B7%9C%EC%B9%99)에 의한 `경험적인 추정을 근거로` 이상치 데이터를 판별하는 방식입니다. 또 다른 통계학적 방식에는 자기회귀(Auto Regressive)와 이동 평균(Moving Average)으로 추론된 예측된 값을 기반으로 이상치를 확인하는 [ARIMA 시계열 예측 모델 기반 이상 탐지](https://medium.com/aimonks/anomaly-detection-for-time-series-analysis-eeecd6282f53)가 있습니다.

■ Ensemble based Anomaly Detection

[앙상블 기반 이상 탐지](https://scikit-learn.org/stable/api/sklearn.ensemble.html)는 여러가지 `의사결정 트리(Decision Tree)`를 통해 이상치를 판별하는 방식으로 대표적으로 [IF(Isolation Forest)](https://www.youtube.com/watch?v=puVdwi5PjVA)가 있으며 데이터 밀도에 의한 트리를 통해서 비상적인 데이터는 루트 노드와 근접하면서 경로 길이가 작은 데이터가 됨을 근거로하여 이상치로 결정하게 됩니다.

■ Distance based Anomaly Detection

`유사도를 측정하는 거리(Distance) 공식`으로 이상치 데이터를 판별하는 방법에는 k-NN(K-Nearest Neighbor), LOF(Local outlier factors), 마할라노비스 거리 (Mahalanobis Distance) 기반의 이상 탐지가 있습니다. 유클리드 거리 공식 이외에 마할라노비스 거리는 처음 들어보는데  [공분산 행렬](https://ko.wikipedia.org/wiki/%EA%B3%B5%EB%B6%84%EC%82%B0_%ED%96%89%EB%A0%AC)이 추가된 것이라고 합니다.

■ Clustering based Anomaly Detection

클러스터링 기반 이상 탐지는 `정상적인 데이터의 군집을 분석`하고 정상적인 패턴으로 파악된 군집에서 사전 정의된 임계치(Threshold)를 얼마나 벗어나는가로 이상치 데이터를 판별합니다. 군집화 알고리즘은 여러가지가 있지만 대표적으로 K-Means, GMM(Gaussian Mixture Model), DBSCAN이 활용되는 것 같습니다.

■ Kernal based Anomaly Detection

[OCSVM(One-class Support Vector Machine)](https://www.youtube.com/watch?v=CjvMZmMTmQc)와 Deep SVDD(Support Vector Data Description)은 `정상적인 데이터에 대한 반지도 학습이 필요`한 커널 기반 이상 탐지 기법입니다. OCSVM(1-SVM)은 가장 많이 사용되는 커널 기반 이상 탐지라고 하며 Deep SVDD는 DNN(Deep Neural Network)으로 확장한 모델이라고 합니다.

■ Reconstruction error based Anomaly Detection

[AE(AutoEncoder)](https://www.youtube.com/watch?v=v8dzXskvF6c)와 [PCA(Principal Component Analysis)](https://www.youtube.com/watch?v=TXESAGRF1Hc) 그리고 [GAN(Generative Adversarial Network)](https://www.youtube.com/watch?v=cd-kj1ysqOc)은 압축된 데이터를 `원본 데이터로 재구성할 때 발생하는 오차`를 통해 이상치를 판별하는 이상 탐지 기법입니다.

■ Transformer based Anomaly Detection

[Anomaly Transformer](https://www.youtube.com/watch?v=BFVyLL2HXGQ)는 시계열 데이터에 Transformer를 접목한 모델로 `Self Attention에 의한 연관성 학습`으로 다변량 시계열 데이터에 대해 개선된 이상 탐지가 가능하다고하니 여러가지 IoT 디바이스의 시계열 데이터에 대한 이상 탐지에 유용할 것으로 보입니다.

#### 이상 탐지를 직접 해보아야

이상 탐지에 대한 정보를 살펴보다보니 대부분의 글이 잘 이해되지 않는 판교어처럼 보이게 되어버리는 것 같습니다. 파이썬을 배워보는 시간을 가지면서 [사이킷 런(scikit-learn)](https://scikit-learn.org/stable/) 라이브러리로 시계열 데이터에 대한 [이상 감지를 직접 해보아야](https://medium.com/mlthinkbox/anomaly-detection-with-isolation-forest-in-scikit-learn-99417dcc3971) 이해가 될 것으로 생각됩니다.