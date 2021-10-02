---
title: EC2 인스턴스에서 S3 버킷 액세스하기
date: 2021-10-02
tags:
- EC2
- S3
---

안녕하세요 Mambo 입니다.

오늘은 EC2 인스턴스에서 S3 버킷에 액세스할 수 있도록 구성하는 방법에 대해 알아봅니다.

최근 회사에서 진행하고 있는 프로젝트 중에는 보안 정책에 의해 고객이 구성한 EC2 인스턴스에 대한 접근 정보만을 제공받아 애플리케이션 실행해야하는 요구사항이 생겼습니다. 현재 애플리케이션에서 사용중인 데이터베이스 중에는 EC2 인스턴스에 직접 설치하여 사용하고 있는 상용 시계열 데이터베이스가 있습니다. 이 데이터베이스의 데이터를 주기적으로 백업하기 위하여 매일 1시에 파일로 저장된 데이터를 압축하여 S3로 저장하는 스크립트를 수행하고 있습니다. 고객이 보유한 EC2 인스턴스에서 이 데이터베이스의 백업 파일을 저장하기 위한 S3 버킷에 대한 권한을 지정해주도록 유도할 예정입니다.

## S3 버킷 정책
S3에서 버킷을 만들면 기본적으로 **모든 퍼블릭 액세스 차단**됩니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-01.png)

그리고 **버킷 정책**을 통해 버킷 또는 버킷에 저장된 오브젝트에 대한 액세스 권한을 부여할 수 있습니다. 

### 버킷 정책 생성
버킷 정책을 생성할 때는 아마존 웹 서비스에서 제공하는 [AWS Policy Generator](http://awspolicygen.s3.amazonaws.com/policygen.html)를 사용하는 것이 좋습니다.

다음은 특정 IP에 대해서 버킷에 대한 조회, 읽기, 쓰기 권한을 부여하는 정책을 생성한 예시입니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::mambo.kr",
                "arn:aws:s3:::mambo.kr/*"
            ],
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": "218.156.190.x/32"
                }
            }
        }
    ]
}
```

> 버킷 정책을 정의하는 JSON의 크기는 20kB로 제한됩니다.

버킷 정책에 대한 더 자세한 내용은 [버킷 정책 예제](https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/example-bucket-policies.html) 문서를 참고하세요.

## EC2 인스턴스
아마존 리눅스 AMI로 EC2 인스턴스를 실행하면 AWS CLI가 기본으로 설치되어있습니다. 따라서, AWS CLI를 사용해서 S3 서비스에 작업을 수행할 수 있습니다.

### IAM 역할 생성
S3 버킷 권한 설정에서 버킷 정책을 설정할 수 있으나 IAM 역할을 만들고 인라인 정책으로 적용할 수도 있습니다. 우리는 EC2 인스턴스에서 접근해야하므로 EC2 서비스에 대한 IAM 역할을 만들어서 인스턴스 프로파일로 등록하겠습니다.

먼저, EC2 인스턴스에서 AWS CLI로 버킷을 조회해보겠습니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-02.png)

현재 EC2 인스턴스에는 IAM 인스턴스 프로파일이 지정되어있지 않기 때문에 오류가 발생합니다.

IAM 메뉴에서 신규로 역할을 생성합니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-03.png)

S3 버킷에 대한 권한을 인라인 정책으로 정의할 것이므로 관리형 정책은 설정하지않습니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-04.png)

생성한 IAM 역할을 EC2 인스턴스 프로파일로 지정합니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-05.png)

IAM 역할에 어떠한 정책을 적용하지 않고 버킷을 조회해보겠습니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-06.png)

IAM 역할을 지정하였기에 AWS CLI를 사용할 수 있게 되었지만 mambo.kr 이라는 버킷에 대한 ListObjectsV2 작업은 Access Denied 오류가 발생했습니다.

### 인라인 정책
우리가 생성한 IAM 역할에는 어떠한 정책도 연결하지 않았기 때문에 접근 권한을 가지지 않는게 당연합니다. 다시 IAM 메뉴로 돌아가서 **인라인 정책 추가**를 선택합니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-07.png)

버킷 정책 예제를 참고해서 다음과 같이 JSON 형식으로 버킷 정책을 정의합니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Mannual",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::mambo.kr",
                "arn:aws:s3:::mambo.kr/*"
            ]
        }
    ]
}
```

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-08.png)

### 버킷 조회
S3 버킷에 대한 정책이 IAM 인라인 정책으로 연결되었으니 버킷에 대한 접근 권한이 가지게 되었는지 확인합니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-09.png)

EC2 인스턴스에서 사용자 계정의 보유한 S3 버킷에 대한 목록은 권한이 없어서 조회할 수 없으나 인라인 정책으로 정의된 mambo.kr 버킷에 대해서는 조회되었습니다.

만약, S3 버킷 목록을 조회하고 싶다면 다음과 같이 Statement를 추가하시면 됩니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Mannual",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::mambo.kr",
                "arn:aws:s3:::mambo.kr/*"
            ]
        },
        {
            "Sid": "Mannual-2",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::*/*"
            ]
        }
    ]
}
```

빈 텍스트 파일을 만들어서 버킷에 업로드하고 가져올 수 있는지 확인해보겠습니다.

![](/images/posts/ec2-instance-access-s3-bucket/s3-bucket-10.png)

S3에 저장할 수 있는 크기에 대한 제한은 없으나 PUT 요청으로 업로드 가능한 크기는 최대 5GB입니다. AWS CLI의 S3 명령어를 사용하는 경우 일정 크기 이상이라면 멀티파트 업로드를 수행하므로 알고 계시고 신경쓰지 않아도 됩니다.

## 마치며
퍼블릭 IP가 할당되지 않는 EC2 인스턴스라면 AWS PrivateLink로 구성되는 VPC 인터페이스 엔드포인트를 사용하여 [S3 서비스와 통신할 수 있도록 설정](https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/privatelink-interface-endpoints.html)해야합니다. 그리고 다른 사용자 계정의 ARN을 제공받아서 접근할 수 있게 구성할 수도 있으니 공식 문서에서 제공하는 다양한 정책 예제를 참고해봅시다.

감사합니다.