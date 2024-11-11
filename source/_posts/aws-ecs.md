---
title: Amazon ECS 초심자가 알아야할 것들
date: 2024-11-11T23:00+09:00
tags:
- Amazon ECS
---

Amazon ECS로 컨테이너 운용을 위한 환경을 구축해보니 생각보다 러닝커브가 높습니다. Amazon ECS 경험이 부족한 초심자로써 알아야할 것들에 대해서 공유해보고자 한다. 

##### 오토스케일링 그룹 과 Amazon ECS 최적화 Linux AMI

Amazon ECS는 EC2 인스턴스 기반 구성을 위해서는 시작 템플릿으로 정의된 오토스케일링 그룹(ASG)을 용량 공급자로 추가하고 오토스케일링 정의에 따라 실행된 ECS 인스턴스 내에 ECS 에이전트와 통신하여 태스크를 컨테이너로 실행한다. 오토스케일링 그룹으로 실행되는 인스턴스는 [Amazon ECS 최적화 Linux AMI](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/ecs-optimized_AMI.html)로 구성되어야 한다.

> Amazon ECS 최적화 Linux AMI를 사용해야하는 이유는 Amazon ECS 컨테이너 에이전트(ecs-agent)가 포함되어있기 때문입니다. ECS 클러스터가 태스크로 실행되는 컨테이너를 관리하기 위해서는 ecs-agent 컨테이너와 통신해야 합니다.

ECS 클러스터 생성 시 EC2 용량 공급자를 생성하지 않은 경우 별도로 오토스케일링 그룹을 만들고 추가해야한다. 이때 오토스케일링 그룹의 시작 템플릿에 사용자 데이터 항목으로 [Amazon ECS 컨테이너 에이전트 구성(ECS_CLUSTER)](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/bootstrap_container_instance.html)을 지정해야한다.

```sh UserData
#!/bin/bash
echo "ECS_CLUSTER=$CLUSTER_NAME" >> /etc/ecs/ecs.config
```

#### 애플리케이션 속성을 위한 S3 환경 변수 파일 권한

태스크 실행 역할(Task Execution Role)에는 [환경 변수 파일](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/use-environment-file.html)이 저장된 S3 버킷에 대한 권한을 포함하고 있어야한다. 처음 ECS 클러스터를 구성하는 경우 AmazonS3ReadOnlyAccess 정책을 포함하여 테스트해도 된다. 더 나아가 외부 시스템에 대한 토큰이나 데이터베이스 비밀번호와 같은 민감한 정보들은 환경 변수 파일 대신에 Secrets Manager 또는 AWS Systems Manager Parameter Store 에서 가져오는 걸 권장한다.

#### Amazon ECS 로그를 CloudWatch로 전송

Amazon ECS 컨테이너에서 발생하는 로그를 CloudWatch로 전송하여 확인하고자 한다면 태스크 정의 시 [awslogs 로그 드라이버를 설정해야](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/using_awslogs.html)한다. 또한, Amazon ECS 컨테이너 인스턴스 역할(AmazonEC2ContainerServiceforEC2Role 정책을 가진 ecsInstanceRole)에 CloudWatch로 로그를 전송하기 위한 권한이 포함되어있는지 확인해야한다.

#### ECS 태스크 컨테이너 헬스 체크

태스크 정의 시 [컨테이너 상태 확인 옵션을 구성](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/healthcheck.html)할 수 있는데 이 상태 확인은 __컨테이너 내부__에서 실행된다. 그래서 일반적인 예시는 아래와 같이 로컬호스트로 설명하는데 직접 만드는 애플리케이션 이미지의 경우 애플리케이션이 실행되어 사용하는 포트를 명확히 지정할 필요가 있다.

```sh
CMD-SHELL, curl -f http://localhost:5000/ || exit 1
```

#### Amazon ECS Service Connect 컨테이너로 인한 배포 이슈

Amazon ECS 에서 Fargate 또는 EC2 인스턴스에 태스크 컨테이너를 배포하는 경우 ECS 에이전트에 대한 컨테이너와 서비스 옵션에 따라 [서비스 연결을 위해](https://youtu.be/QA3tnyLvj2A?t=408) 사이드카로 Envoy 기반의 컨테이너가 함께 구동될 수 있다. 이 말은 하나의 서버 내에 애플리케이션에 대한 컨테이너 뿐만 아니라 나머지 컨테이너가 사용하는 CPU와 메모리를 고려하여 인스턴스 사양을 고려해야한다는 것이다.

> 처음에는 ECS 클러스터의 서버 사양을 최대한 낮추어 만들게 된 상태에서 서비스 연결을 위한 Instance Connect 컨테이너가 구동되면서 CPU 사용량이 100프로를 넘어서면서 배포가 원활하지 않은 상황을 경험했습니다.

#### Amazon ECS에 대한 Fargate 컨테이너 이미지 최적화 고려

Fargate 서버에서 실행되는 태스크 컨테이너는 이미지 정보를 캐싱하지 않는다. 따라서, Fargate 태스크를 시작하는데 걸리는 시간에는 이미지를 가져오는 시간이 포함되어있다. EC2 용량 공급자가 아닌 Fargate로 운용하는 서비스의 경우에는 아래의 항목을 고려해볼 필요가 있다.

- [Amazon ECR 인터페이스 VPC 엔드포인트(AWS PrivateLink)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html)
- [Amazon Linux 2023 최소 컨테이너 이미지](https://docs.aws.amazon.com/ko_kr/linux/al2023/ug/minimal-container.html)
- [zstd 압축 컨테이너 이미지를 사용](https://aws.amazon.com/ko/blogs/containers/reducing-aws-fargate-startup-times-with-zstd-compressed-container-images/)

## 참고 링크

- [Amazon ECS에 관한 자습서](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/ecs-tutorials.html)
- [Amazon ECS Workshop](https://ecsworkshop.com/)
- [AWS에서 Container 시작하기](https://youtu.be/wxyyUrWVBZA?si=9b6PR9gt8KHCDVgf&t=1079)
- [Amazon ECS를 통한 도커 기반 컨테이너 서비스 구축하기](https://www.youtube.com/watch?v=_wyndTR95fU)
- [Amazon ECS Service Connect 사용하기](https://www.youtube.com/watch?v=QA3tnyLvj2A&t=408s)
- [Amazon ECS를 위한 솔루션 설계](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/ecs-configuration.html)
