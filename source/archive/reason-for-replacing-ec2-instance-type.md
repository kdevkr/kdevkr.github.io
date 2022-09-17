---
title: EC2 인스턴스 유형을 교체하는 이유
date: 2022-02-20
tags:
- EC2
- AWS Graviton2
---

서비스의 규모 그리고 서비스를 운영하는 조직의 규모가 크건 작건 서비스를 유지하기 위해 들어가는 클라우드 인프라 환경에 대한 비용은 생각보다 중요한 부분입니다. 작은 조직에서 비용에 대해 예민할지는 몰라도 오히려 인프라 팀이 별도로 존재하는 조직이라면 더 효율적으로 인프라 환경을 구성할 수 밖에 없어보입니다. 그래서 많은 조직에서는 서비스 인프라 비용을 줄이기 위해 [몇가지 트래픽을 줄일 수 있는 노력](https://gameanalytics.com/product-updates/reduce-costs-https-api-aws/)을 한다거나 [일정 기간동안 사용할 수 있는 자원을 구매해서 사용](https://aws.amazon.com/ko/blogs/korea/cost-optimization-cases-ridibooks-reserved-instance/)하고 [인프라 자원의 성능을 비교해서 동일한 성능 대비 가격이 작은 것을 선택](https://www.grumatic.com/ko/aws-ebs-gp3-cost-saving/)하기도 합니다.

## EC2 인스턴스 유형
아마존 웹 서비스에서는 다양한 목적에 맞는 [인스턴스 유형](https://aws.amazon.com/ko/ec2/instance-types/)을 제공하고 있습니다. 여러가지 인스턴스 유형 중 [ARM 기반의 AWS Graviton](https://aws.amazon.com/ko/ec2/graviton/) 프로세서를 사용하는 인스턴스가 동일한 성능 대비 더 절약된 요금으로 서버를 구성할 수 있습니다. Graviton 프로세서에 대해 자세하게 알고 싶다면 [Python x ARM: Graviton2 실전 도입기](https://engineering.ab180.co/stories/migrating-python-application-to-arm)를 참고하시면 될 것 같습니다.

아래는 [EC 인스턴스 유형별 요금 비교](https://ec2.shop/?region=ap-northeast-2&filter=t2,t3,t3a,t4g) 중 일반적으로 사용될만한 CPU와 메모리 구성을 가진 인스턴스만을 필터한 결과입니다.

![ec2.shop/?region=ap-northeast-2&filter=t2,t3,t3a,t4g](/images/posts/reason-for-replacing-ec2-instance-type/ec2-instance-type-compare-pricing.png)  

각 인스턴스별로 일부 스펙에 의한 성능 차이는 있겠지만 T2 인스턴스보다는 [Nitro System](https://aws.amazon.com/ko/ec2/nitro/)으로 확장된 **T3 인스턴스**가 더 작은 요금이 할당됩니다. 그리고 인텔 프로세서 기반의 T3 인스턴스 보다는 AMD 프로세서 기반의 **T3a 인스턴스**가 더 작은 요금이 듭니다. 그리고 AWS Graviton 프로세서를 사용하는 ARM 아키텍처 기반의 **T4g 인스턴스**가 더 요금이 적게 듭니다.

### 아키텍처 변경 제한
특정 아키텍처 기반의 AMI로 시작된 인스턴스 유형은 다른 아키텍처를 사용하는 인스턴스 유형으로 교체할 수 없습니다. 이는 아키텍처간 호환성이 없기 때문이므로 x86 아키텍처 기반의 기존 인스턴스 유형을 ARM 아키텍처 기반으로 변경하기 위해서는 ARM 기반의 AMI로 인스턴스를 시작하고 기존 인스턴스로부터 마이그레이션을 수행해야만합니다.

> 현재 조직에서도 예약 인스턴스를 구매하여 사용중인 것은 만료된 이후 Graviton 인스턴스로 변경하려고 예정하고 있고 아키텍처 전환 문제로 인하여 Graviton으로 변경할 수 없는 일부 인스턴스들은 AMD 프로세서 기반의 인스턴스로 일부 변경하였습니다.

감사합니다.