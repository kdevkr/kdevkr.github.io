---
title: 탄력적 볼륨을 지원하지 않음
date: 2022-05-19
tags:
- AWS
- EBS
- R5b
- io2 Block Express
---

지난번에 공유한 [EC2 인스턴스 유형을 교체하는 이유](https://kdevkr.github.io/reason-for-replacing-ec2-instance-type/)를 통해 최신 인스턴스 유형을 사용하면 비슷한 성능이지만 더 적은 비용으로 사용할 수 있다는 것을 소개했습니다. 이에 따라 조직에서 사용중인 시계열 데이터베이스용 인스턴스를 [Amazon EC2 R5b](https://aws.amazon.com/ko/blogs/korea/new-amazon-ec2-r5b-instances-providing-3x-higher-ebs-performance/)로 변경하여 최신 인스턴스 유형으로 인한 비용 절감과 더 높은 EBS 성능을 제공받을 수 있었습니다.

그러나, 어떠한 사유로 인하여 더 높은 볼륨 처리 성능을 위해서 기존에 연결하였던 gp3 볼륨 대신에 io2 볼륨으로 대체하였고 확실이 프로비저닝된 볼륨의 처리 성능이 좋다는 것을 확인할 수 있었습니다. 다만, 이때는 알지 못했던 큰 제약사항이 최근에 발견되었으며 이에 대한 내용을 공유하고자 합니다.

## 탄력적 볼륨
[Amazon EBS 탄력적 볼륨](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/ebs-modify-volume.html)은 인스턴스가 사용중인 볼륨을 분리하지 않더라도 볼륨의 유형을 변경하거나 크기나 IOPS와 같은 성능을 조정할 수 있는 유용한 기능입니다. 일반적으로 사용되는 대부분의 인스턴스에서 탄력적 볼륨으로 인스턴스를 중지한다던가 볼륨을 분리하지 않아도 쉽게 볼륨의 크기 또는 성능을 확장할 수 있습니다. [모든 현재 세대 인스턴스에서 탄력적 볼륨을 지원한다](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/modify-volume-requirements.html)는 내용만 확인하고서는 최신 인스턴스 유형이라면 당연히 볼륨 수정이 가능할 것이라고 생각하게 되었습니다.

### Amazon EC2 R5b
Amazon EC2 R5b는 니트로 시스템 기반의 인스턴스로 연결되는 EBS 볼륨은 NVMe 스토리지 입니다. 인스턴스 유형을 변경했을 당시에 사용했던 볼륨은 gp3로 탄력적 볼륨으로 적재되는 데이터의 양이 많아지면서 디스크 용량이 부족해질때 인스턴스를 중지하지 않고서도 볼륨을 쉽게 확장할 수 있었습니다.

### io2 Block Express 볼륨
> R5b, X2idn 및 X2iedn 인스턴스에 연결된 io2 볼륨의 크기 또는 프로비저닝된 IOPS는 수정할 수 없습니다.

위 문장은 오늘의 핵심 내용입니다. Amazon EC2 R5b와 같은 일부 차세대 인스턴스 유형에서는 io2 볼륨을 사용하는 것에 주의해야합니다. R5b 인스턴스는 io2 볼륨을 사용하는 경우 더 좋은 성능을 충족하기 위해서 io2 Block Express라는 차세대 볼륨으로 연결되어 제공되기 때문입니다. [io2 Block Express 볼륨은 탄력적 볼륨 작업을 지원하지 않음](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/ebs-volume-types.html#io2-bx-considerations)

Amazon EC2 R5b와 같은 일부 차세대 인스턴스 유형에서는 io2 볼륨을 사용하는 것에 주의해야합니다. 니트로 시스템 기반의 인스턴스에서 더 좋은 성능을 충족하기 위해서 io2 Block Express라는 차세대 볼륨으로 연결되기 때문입니다. 현재 시점에서는 [io2 Block Express 볼륨은 탄력적 볼륨 작업을 지원하지 않음](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/ebs-volume-types.html#io2-bx-considerations)을 알아야합니다.

> 다른 서비스와 기능과 마찬가지로 언젠가는 io2 Block Express 볼륨도 탄력적 볼륨이 가능하도록 변경될 수 있습니다.

사용하고 있는 시계열 데이터베이스는 기본적으로는 메모리 엔진을 사용하지만 모든 데이터를 메모리에 유지할 수 없으므로 과거 데이터는 파일로 보관해두고 불러와서 사용하는 구조이기에 메모리와 디스크 성능이 모두 중요하다고 판단해서 더 좋은 성능의 io2 볼륨으로 교체한 것인데 탄력적 볼륨의 미지원에 대한 부분을 검토하지 않음으로 인하여 오히려 큰 제약이 발생하였습니다.

시스템에 등록되는 시계열 데이터를 계속 저장하고 유지하고 있어야하므로 디스크 볼륨의 크기를 확장할 수 없다는 점은 너무 비효율적이므로 io2 볼륨에서는 gp3 볼륨으로 전환이 가능하여 gp3 유형의 볼륨에 IOPS와 처리량을 높이는 정도로 사용하고자 변경했습니다.

감사합니다.