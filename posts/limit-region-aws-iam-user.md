---
title: AWS IAM 사용자 리전 제한하기
date: 2021-10-03
---

안녕하세요 Mambo 입니다.

회사에 있던 책들 중 **탄력적 개발로 이끄는 AWS 실천 기술**이라는 책을 읽어보고 관련된 정보를 찾으면서 AWS 활용 방안에 대해 공부하고 있습니다.

AWS 프리 티어 또는 AWS 서비스를 학습하는 사람이라면 모든 권한을 가지고 있는 루트 사용자 계정을 사용하는 경우가 많을겁니다. 실무 환경에서는 회사의 루트 사용자 계정이 아닌 IAM을 통해 직무 또는 특정 권한을 가지는 사용자를 만들어서 사용하도록 구성하겠죠. 보안 등급이 높거나 체계적인 회사라면 AWS 리소스에 대한 정책을 검토하고 부여하겠지만 제가 다니고 있는 회사의 팀에서도 모든 권한을 부여한 사용자를 만들어서 사용하고 있는 것을 보았고 직원마다 권한을 부여할 수 있도록 사용자를 발급해달라고 요청하여 사용하고는 있습니다.

> 루트 사용자 계정을 사용하지 않는다고 해도 권한 정책을 검토하고 부여하는 것이 귀찮은 건 맞습니다. 결국 사용자에게 모든 권한을 가지는 정책을 연결하여 사용할 수도 있습니다.

AWS와 같은 클라우드 서비스는 다양한 지역에 존재하는 데이터 센터에 자원을 생성하고 사용할 수 있도록 지원하기 때문에 사용자 계정 정보가 유출된다면 주로 사용하는 리전이 아닌 곳에 AWS 리소스가 생성되고 요금이 발생하는 문제가 생길 수 있습니다. 일부 요금 폭탄 문제가 생기는 분들도 주로 사용하는 서울 리전에 대한 리소스만 체크한 상태로 있다가 전혀 사용하지 않고 있는 리전에 실행된 AWS 리소스로 인하여 발생하는 요금으로 당황하는 경우도 많은 것 같습니다. 

이 글에서는 IAM 사용자의 계정 정보가 유출되더라도 주로 사용하는 리전만 접근할 수 있도록 제한하여 불필요한 리전에 AWS 리소스가 나도 모르게 생성되지 않도록 방지하는 대책을 설정할 수 있는 방법을 알려드립니다.

## AWS IAM
IAM(Identity and Access Management)은 사용자의 신원을 확인하거나 리소스에 대한 액세스 권한을 통합적으로 관리하는 기능을 말합니다. AWS IAM도 마찬가지로 조직을 구성하거나 장기 또는 임시적으로 AWS 리소스 권한을 부여하는 기능을 제공합니다.

### IAM 사용자
AWS IAM의 사용자는 AWS 리소스에 대한 장기적인 권한을 가지도록 구성하는 장기 자격 증명입니다. 

먼저, 테스트를 위한 IAM 사용자인 pika를 만들겠습니다. pika는 **모든 권한을 가지는 직무 정책인 AdminisratorAccess**를 가진다고 가정하겠습니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-01.png)

pika는 AWS에서 기본적으로 제공하는 관리형 정책인 AdministratorAccess와 IAMUserChangePassword을 가지게 되었습니다.

그러면 pika 사용자의 비밀번호가 유출되어 누군가가 AWS 콘솔에 접속할 수 있게 된다면 수 많은 리전에 VPC를 생성하거나 EC2 인스턴스를 실행할 수 있는 상태가 됩니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-02.png)

### IAM 사용자 리전 제한
만약 pika라는 사용자가 애플리케이션을 운영하기 위한 구성을 서울(ap-northeast-2) 리전에서만 사용한다고 가정해본다면 다른 리전에 대한 권한을 불필요하게 주고 있는 상태가 됩니다. 

#### aws:RequestedRegion
IAM 정책을 정의할 때 aws:RequestedRegion는 글로벌 조건 키를 사용하면 특정 리전에 대해서만 권한을 가지도록 제한할 수 있습니다.

만약, 서울 리전만 권한을 부여하고 싶다면 다음과 같이 조건절을 정의하면 됩니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "*",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": [
                        "ap-northeast-2"
                    ]
                }
            }
        }
    ]
}
```

기존에 연결하였던 AdministratorAccess라는 직무 정책을 해제하고 AdministratorAccessOnlySeoul이라는 정책을 만들어서 연결하겠습니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-03.png)

### 리전 제한 확인
pika 사용자는 서울 리전에 대한 권한만 가지도록 제한되었기 때문에 정말로 그러한 상태가 되는지 확인해보겠습니다.

연결되지 않은 탄력적 IP는 요금을 지불해야하므로 탄력적 IP를 생성하려고 시도했지만 불가능합니다. 

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-04.png)

EC2 인스턴스를 생성하기 위해서 서울 리전에서 사용가능한 AMI 유형을 조회할 수 없기 때문에 진행할 수 없습니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-05.png)

도쿄 리전에 대한 페이지는 접속할 수 있지만 AWS 리소스를 생성하는 것은 동일하게 AWS API를 사용하기 때문에 서울 리전외에는 권한 오류가 발생하게 됩니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-06.png)

심지어는 글로벌 리전 서비스인 S3에서도 권한 오류가 발생합니다. 이는 S3 서비스로 이동할 때 현재 리전 파라미터를 전달하기 때문인데 서울 리전으로 변경하거나 제거하시면 됩니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-07.png)

### 경계 설정으로 리전 제한
앞서 pika 사용자는 AdministratorAccess라는 직무 정책과 동일하게 모든 권한을 가지는 AdministratorAccessOnlySeoul이라는 정책을 만들어서 연결하여 제한하였습니다. 그러나 사용자마다 부여된 권한이 다를 수 있기 때문에 매번 리전을 제한하는 정책을 만들어서 연결하기에는 불편함이 있습니다. 이 경우에는 정책을 권한 경계(Permissions boundary)로 설정하면 모든 사용자마다 부여된 정책에 대하여 리전을 제한할 수 있습니다.

#### 특정 서비스에 대한 권한을 가진 사용자
제가 사용하는 mambo라는 사용자는 VPC, EC2, S3에 대한 모든 권한을 가지도록 정책을 연결하였습니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-08.png)

#### 서울 리전을 경계로 제한
이전과 동일하게 서울 리전만을 사용할 수 있도록 제한하기 위해 정책을 만들어서 권한 경계로 설정하겠습니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-09.png)

mambo 사용자는 RDS에 대한 권한이 없기 때문에 서울 리전에서도 RDS를 사용하여 데이터베이스를 생성할 수 없습니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-10.png)

EC2 서비스에 대한 권한을 가지고 있지만 경계 설정으로 인하여 서울 리전이 아니면 권한이 없게 됩니다.

![](/images/posts/limit-region-aws-iam-user/aws-iam-user-11.png)

#### 글로벌 서비스 리전
CloudFront, Route53, IAM과 같은 글로벌 서비스는 미국 동부 (us-east-1) 리전의 엔드포인트를 사용하기 때문에 이에 대한 권한을 별도로 설정하여야합니다.

```json
{
    "Effect": "Allow",
    "Action": [
        "cloudfront:*",
        "route53:*",
        "iam:*",
        "support:*"
    ],
    "Resource": "*",
    "Condition": {
        "StringEquals": {
            "aws:RequestedRegion": [
                "us-east-1"
            ]
        }
    }
}
```

## 끝마치며
IAM 사용자가 사용할 수 있는 리전을 제한함으로써 비록 계정 정보가 유출되더라도 서울 리전에서만 AWS 리소스를 마음대로 생성할 수 있도록 방지할 수 있게 되었습니다. 이 방법을 적용하더라도 IAM 사용자의 비밀번호와 액세스 키는 주기적으로 갱신하는 것은 반드시 필요합니다.

감사합니다.