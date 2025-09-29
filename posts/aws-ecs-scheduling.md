---
title: Amazon ECS 스케줄링
date: 2024-11-18T15:00+09:00
tags:
- Amazon ECS
- Amazon EC2 Auto Scaling
- Amazon EventBridge Scheduler
---

Amazon EventBrdige 스케줄러를 사용하여 Amazon ECS 클러스터로 운용되는 서비스와 EC2 인스턴스의 규모를 조정할 수 있다. 예를 들어, [AWS Instance Scheduler 솔루션](https://www.youtube.com/watch?v=amL-kQOV0Go)로 스테이징이나 테스트 환경에 대한 EC2 인스턴스들을 평일 업무 시간에만 실행되도록 시작, 종료 스케줄링을 수행할 수 있다. Amazon ECS의 [예약된 작업](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/tasks-scheduled-eventbridge-scheduler.html)으로는 특정 태스크를 일정 시간에 시작할 순 있으나 종료할 순 없다. 이러한 경우 [Application Auto Scaling](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/service-auto-scaling.html)을 활용해야하고 AWS CLI를 대신하여 일정 기반으로 실행하기 위한 방법이 바로 Amazon EventBridge 스케줄러 이다.

#### 오토스케일링 그룹의 예약된 작업

Amazon EventBridge 스케줄러로 오토스케일링 그룹의 EC2 인스턴스 용량을 조정할 수 있다. 그전에 오토스케일링 그룹에 대한 콘솔에서 자체적으로 제공하는 예약된 작업에 대해서 알아보자. EC2 용량 공급자로 사용중인 오토스케일링 그룹의 자동 확장 기능으로 [예약된 작업을 정의](https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/ec2-auto-scaling-scheduled-scaling.html)하면 크론 표현식에 의해 평일 업무 시간을 위한 서비스 환경을 실행할 수 있다. 스테이징 또는 테스트 환경은 개발자 또는 테스트 엔지니어가 필요하지 않은 시간에는 종료하여 잉여 시간에 대한 요금을 줄여갈 수 있다.

![](/images/posts/aws-ecs-scheduling/01.png)

다만, 오토스케일링 그룹 콘솔에서 제공하는 예약된 작업으로 만들어지는 스케줄은 일시적으로 비활성화하지 못하는 단점이 있고, ECS 클러스터에서 EC2 인스턴스에 실행되고 있는 서비스가 있는 경우 ecs-managed-draining-termination-hook 수명 주기 후크의 제한 시간(기본값 3,600초)으로 인해 오토스케일링 그룹의 예약된 작업에 의해 종료되지 않고 기다릴 수 있다. 

##### 🔥 TaskFailedToStart: EMPTY CAPACITY PROVIDER

오토스케일링 그룹의 예약된 작업으로 EC2 인스턴스가 강제로 종료된 경우 서비스로 실행되는 태스크는 새롭게 만들어지며 지속적으로 프로비저닝을 수행할 수 있다. 

#### Amazon EventBridge 스케줄러로 오토스케일링 그룹 조정

![](/images/posts/aws-ecs-scheduling/02.png)

Amazon EventBridge 스케줄러에서 [EC2 Auto Scaling 서비스의 SetDesiredCapacity](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/autoscaling/set-desired-capacity.html) 를 사용하여 오토스케일링 그룹에 대해 원하는 용량을 설정할 수 있다. 만약, EC2 인스턴스를 종료한 상태로 유지하고 싶다면 아래와 같이 원하는 용량이 0 이 되도록 페이로드를 작성하면 된다.

```json
{
  "AutoScalingGroupName": "mambo-ecs-cluster-asg",
  "DesiredCapacity": 0
}
```

#### Amazon EventBridge 스케줄러에 대한 이벤트 로그

![](/images/posts/aws-ecs-scheduling/04.png)

만약, 앞선 Amazon EventBridge 스케줄러에 의해 EC2 Auto Scaling 서비스로 오토스케일링 그룹의 용량을 줄이고자 하는데 이벤트가 동작하는지를 알기 어려운 경우 [CloudTrail의 이벤트 기록에서 확인](https://docs.aws.amazon.com/scheduler/latest/UserGuide/logging-using-cloudtrail.html)해야 한다. 예를 들어, 아래와 같이 오토스케일링 그룹에 대한 이벤트 대상을 ECS 클러스터 이름으로 잘못 지정해서 `ValidationException` 이 발생한 결과를 볼 수 있다.

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

> 아무래도 Amazon ECS 에서 Amazon ECR에 대한 링크를 제공하는 것처럼 Amazon EventBridge 스케줄러 콘솔에서도 Amazon CloudTrail 에 대한 링크를 제공해주면 좋을 것 같습니다.

#### Amazon EventBridge 스케줄러로 서비스 규모 조정

![](/images/posts/aws-ecs-scheduling/03.png)

```json
{
  "Cluster": "mambo-ecs-cluster",
  "Service": "app-service",
  "DesiredCount": 0
}
```

EC2 인스턴스의 시작과 종료에 대한 일정을 구성했다면 이제 [Amazon EventBridge 스케줄러](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/tasks-scheduled-eventbridge-scheduler.html)에서 Amazon ECS 서비스 대상으로 UpdateService를 호출하여 특정 클러스터에 존재하는 서비스에 대해 DesiredCount를 설정하여 서비스에 대한 규모를 조정해보도록 하자.

##### Application Auto Scaling 로 서비스 규모 조정

Amazon ECS 서비스가 아닌 Application Auto Scaling 서비스의 [register-scalable-target](https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/cli_application-auto-scaling_code_examples.html)를 호출하여 동일한 동작을 수행할 수 있다.

```json
{
  "ResourceId": "service/mambo-ecs-cluster/app-service",
  "ScalableDimension": "ecs:service:DesiredCount",
  "ServiceNamespace": "ecs",
  "MinCapacity": 0,
  "MaxCapacity": 0
}
```

#### Amazon EventBridge Scheduler IAM 역할

[Amazon ECS EventBridge IAM 역할](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/CWE_IAM_role.html)를 참고하여 Amazon EventBridge 스케줄러에서 Amazon ECS 와 EC2 Auto Scaling 에 대한 권한을 가지는 IAM 역할인 `ecsEventsRole` 을 구성한 예시이다. 일정에 대한 이벤트 기록에서 권한 문제가 발생한다면 IAM 역할의 신뢰 관계와 연결된 정책을 살펴보도록 하자.

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

#### 참고 링크

- [Amazon EC2 Auto Scaling을 위한 스케일링 예약](https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/ec2-auto-scaling-scheduled-scaling.html)
- [Amazon ECS 서비스 자동 조정](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/service-auto-scaling.html)
- [Amazon EventBridge Scheduler를 사용하여 Amazon ECS 태스크 예약](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/tasks-scheduled-eventbridge-scheduler.html)
- [Logging Amazon EventBridge Scheduler API calls using AWS CloudTrail](https://docs.aws.amazon.com/scheduler/latest/UserGuide/logging-using-cloudtrail.html)