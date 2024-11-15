---
title: Amazon ECS 스케줄링
date: 2024-11-16T01:00+09:00
tags:
- Amazon ECS
- Amazon EC2 Auto Scaling
- Amazon EventBridge Scheduler
---

Amazon ECS 클러스터로 운용되는 서비스를 평일 업무 시간에만 실행하고 일과 이외의 시간이나 주말에는 종료하고 싶다. 기존에 EC2 인스턴스로 직접 구성한 스테이징 환경에 대해서는 [AWS Instance Scheduler 솔루션](https://www.youtube.com/watch?v=amL-kQOV0Go)에 따라 CloudFormation 으로 시작하고 종료하도록 만들어둔 것 같다. Amazon ECS 클러스터로 구성되는 오토스케일링 그룹의 EC2 인스턴스와 서비스는 어떻게 조정할 수 있을까?

#### 오토스케일링 그룹의 예약된 작업

![](/images/posts/aws-ecs-scheduling/01.png)
![](/images/posts/aws-ecs-scheduling/02.png)

EC2 용량 공급자로 사용중인 오토스케일링 그룹의 자동 확장 기능으로 [예약된 작업을 정의](https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/ec2-auto-scaling-scheduled-scaling.html)하면 크론 표현식에 의해 평일 업무 시간을 위한 서비스 환경을 실행할 수 있다. 스테이징 또는 테스트 환경은 개발자 또는 테스트 엔지니어가 필요하지 않은 시간에는 종료하여 잉여 시간에 대한 요금을 줄여갈 수 있다.

> 오토스케일링 그룹의 예약된 작업으로 EC2 인스턴스를 종료하기 위해 용량 업데이트를 수행하는 경우 ECS 클러스터에 의해 실행되고 있는 서비스의 컨테이너가 있다면, 수명 주기 후크의 ecs-managed-draining-termination-hook 로 인해 서비스가 중지될 때까지 해당 EC2 인스턴스를 종료하지 않고 기다립니다. 히트비트 제한 시간을 적당히 줄이도록 합시다.

다만, 오토스케일링 그룹 콘솔에서 제공하는 예약된 작업으로 만들어지는 스케줄은 일시적으로 비활성화하지 못하는 단점이 있다. 그래서 일시적으로 스케줄을 비활성화 해야하는 경우가 있다면 Amazon EventBridge Scheduler를 통해 AWS 서비스로의 예약 일정을 정의하는 것이 좋아보인다.

#### Amazon EventBridge Scheduler 일정 관리

![](/images/posts/aws-ecs-scheduling/03.png)

ECS 클러스터에서 서비스는 일정 기반의 조정을 제공해주지 않고 있으므로 [Amazon EventBridge Scheduler](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/tasks-scheduled-eventbridge-scheduler.html)에서 AWS ECS 서비스 대상으로 UpdateService를 호출하여 특정 클러스터에 존재하는 서비스에 대해 DesiredCount를 설정할 수 있다. 이때, 일정에서 설정하는 크론 표현식(0 9 ? * MON-FRI *)은 오토스케일링 그룹의 예약된 작업과 다르다는 것을 주의해야한다.

```json
{ "Cluster": "mambo-ecs-cluster", "Service": "app-service", "DesiredCount": 0 }
```

#### Amazon EventBridge Scheduler 이벤트 로그

![](/images/posts/aws-ecs-scheduling/04.png)

Amazon EventBridge Scheduler의 일정에 의해 ECS 와 EC2 서비스로 보내는 요청에 대한 이벤트를 확인하고자 하는 경우 [CloudTrail의 이벤트 기록에서 확인](https://docs.aws.amazon.com/scheduler/latest/UserGuide/logging-using-cloudtrail.html)해야한다. 아래와 같이 오토스케일링 그룹에 대한 이벤트 대상을 ECS 클러스터 이름으로 잘못 지정해서 ValidationException이 발생한 예시를 볼 수 있다.

```json
{
    "eventVersion": "1.08",
    "userIdentity": {
        "type": "AssumedRole",
        "principalId": "xxxxx:xxxxx",
        "arn": "arn:aws:sts::xxxxx:assumed-role/ecsEventsRole/xxxxx",
        "accountId": "xxxxx",
        "accessKeyId": "xxxxx",
        "sessionContext": {
            "sessionIssuer": {
                "type": "Role",
                "principalId": "xxxxx",
                "arn": "arn:aws:iam::xxxxx:role/ecsEventsRole",
                "accountId": "xxxxx",
                "userName": "ecsEventsRole"
            },
            "webIdFederationData": {},
            "attributes": {
                "creationDate": "2024-11-15T15:57:59Z",
                "mfaAuthenticated": "false"
            }
        }
    },
    "eventTime": "2024-11-15T15:57:59Z",
    "eventSource": "autoscaling.amazonaws.com",
    "eventName": "SetDesiredCapacity",
    "awsRegion": "ap-northeast-2",
    "sourceIPAddress": "3.34.11.70",
    "userAgent": "AmazonEventBridgeScheduler aws-sdk-java/2.28.29 md/io#async md/http#NettyNio md/internal ua/2.0 os/Linux#5.10.226-214.880.amzn2.x86_64 lang/java#17.0.13 md/OpenJDK_64-Bit_Server_VM#17.0.13+11-LTS md/vendor#Amazon.com_Inc. md/en_US md/kotlin/1.6.21-release-334(1.6.21) exec-env/AWS_ECS_FARGATE cfg/retry-mode#legacy cfg/auth-source#stat",
    "errorCode": "ValidationException",
    "errorMessage": "AutoScalingGroup name not found - null",
    "requestParameters": {
        "autoScalingGroupName": "mambo-ecs-cluster",
        "desiredCapacity": 1
    },
    "responseElements": null,
    "requestID": "1d4e8568-2303-48ee-a6fa-2c3ca5be257d",
    "eventID": "99a3097c-96ce-43dd-8c97-1aa0985c701b",
    "readOnly": false,
    "eventType": "AwsApiCall",
    "managementEvent": true,
    "recipientAccountId": "xxxx",
    "eventCategory": "Management",
    "tlsDetails": {
        "tlsVersion": "TLSv1.3",
        "cipherSuite": "TLS_AES_128_GCM_SHA256",
        "clientProvidedHostHeader": "autoscaling.ap-northeast-2.amazonaws.com"
    }
}
```

#### Amazon EventBridge Scheduler IAM 역할

[Amazon ECS EventBridge IAM 역할](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/CWE_IAM_role.html)를 참고하여 Amazon EventBridge Scheduler 에서 Amazon ECS 와 EC2 Auto Scaling 에 대한 권한을 가지는 IAM 역할을 구성한 예시이다. 일정에 대한 이벤트 기록에서 권한 문제가 발생한다면 IAM 역할을 살펴보도록 하자.

##### 신뢰할 수 있는 엔티티

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "events.amazonaws.com",
                    "autoscaling.amazonaws.com",
                    "scheduler.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

##### 연결된 정책

- AmazonECS_FullAccess
- AmazonEventBridgeSchedulerFullAccess
- AutoScalingFullAccess

> 실제로 운영하는 목적이 아닌 개인적인 궁금증에 의해 진행해본 것으로 FullAccess 정책을 활용했습니다. 또한, Amazon EventBridge Scheduler의 일정에 따라 원하는 상태로 조정이 가능하지만 클러스터와 서비스 수가 많아지는 경우 개별 등록해야만 하므로 생각보다 불편함이 있지 않을까 싶습니다.

#### 참고 링크

- [Amazon EC2 Auto Scaling을 위한 스케일링 예약](https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/ec2-auto-scaling-scheduled-scaling.html)
- [Amazon ECS 서비스 자동 조정](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/service-auto-scaling.html)
- [Amazon EventBridge Scheduler를 사용하여 Amazon ECS 태스크 예약](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/tasks-scheduled-eventbridge-scheduler.html)
- [Logging Amazon EventBridge Scheduler API calls using AWS CloudTrail](https://docs.aws.amazon.com/scheduler/latest/UserGuide/logging-using-cloudtrail.html)