---
title: AWS SSM 에이전트로 프라이빗 EC2 인스턴스에 연결하기
date: 2021-02-19
tags:
- AWS
- SSM Agent
---

`2021년 2월 19일에 공유한 AWS SSM 에이전트로 프라이빗 EC2 인스턴스에 연결하기를 토대로 부족한 정보를 추가한 글입니다.`

안녕하세요 Mambo입니다. 

오늘은 아마존 웹 서비스의 SSM(System Session Manager)를 사용하여 프라이빗 서브넷에서 구동되고 있는 EC2 인스턴스에 연결하는 방법에 대해서 알아보고자 합니다.

일반적으로 로컬 환경과 같은 외부 호스트에서 서버 인스턴스에 접근하기 위해서 `SSH(Secure Shell)`을 사용합니다. 그러나 SSH 클라이언트를 사용하여 EC2 인스턴스에 접근하기 위해서는 **퍼블릭 DNS 또는 퍼블릭 IP 주소를 가지는** 퍼블릭 인스턴스이어야 합니다. 인터넷과 연결되지 않는 프라이빗 서브넷에 위치하는 프라이빗 EC2 인스턴스에 접근하기 위해서는 퍼블릭 IP가 할당된 퍼블릭 인스턴스를 `배스천(Bastion) 호스트`로써 사용하여 경유해야합니다. 이렇게 배스천 호스트를 구성하는 것은 불필요하게 인스턴스를 유지하는 문제도 있으며 SSH 접속을 위한 개인키가 인터넷과 연결된 퍼블릭 EC2 인스턴스에 위치하게 되는 단점을 보유하게 됩니다.

아마존 웹 서비스에서는 배스천 호스트를 담당하도록 구성하는 퍼블릭 인스턴스의 단점을 보완하기 위하여 SSH와 개인키를 사용하지 않고도 HTTPS를 사용하여 인터넷과 연결되지 않은 프라이빗 서브넷에 접근할 수 있도록 **AWS Systems Manager**를 제공합니다. AWS Systems Manager가 [SSM 에이전트](https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/sysman-install-ssm-agent.html)가 설치된 EC2 인스턴스를 관리형 인스턴스로 등록함으로써 IAM과 SSM 에이전트를 사용하여 관리형 인스턴스로 접속할 수 있습니다.

## AWS Systems Manager 
AWS Systems Manager가 EC2 인스턴스를 관리형 인스턴스로 등록하도록 구성하기 위해서는 몇가지 설정을 해야합니다.

### 호스트 관리 기능 활성화
AWS Systems Manager의 빠른 설정을 통해 Host Management 구성을 사용하여 EC2 인스턴스를 관리형 인스턴스로 등록하기 위한 작업을 활성화 할 수 있습니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-quick-setup.png)

### SSM 에이전트를 위한 VPC 엔드포인트 구성
호스트 관리 구성을 통해 활성화된 SSM 서비스가 VPC 내 프라이빗 서브넷에 접근할 수 있도록 AWS PrivateLink로 구동되는 [VPC 인터페이스 엔드포인트](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)를 구성해야합니다.

#### VPC DNS 호스트 이름 활성화
VPC 엔드포인트를 생성하기 위해서는 VPC 속성 중 **DNS 호스트 이름을 활성화**해야합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-enable-dns-name.png)

#### VPC 엔드포인트 생성
EC2와 SSM 서비스에 대한 VPC 엔드포인트를 생성합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-vpc-endpoints.png)

### EC2 인스턴스 프로파일 지정
빠른 설정을 통해 호스트 관리 기능을 활성화하면 **AmazonSSMRoleForInstancesQuickSetup**이라는 IAM 역할이 생성됩니다. EC2 인스턴스에 대해 AmazonSSMRoleForInstancesQuickSetup IAM 역할을 지정하면 AWS Systems Manager가 SSM 에이전트와 통신하여 관리형 인스턴스로 등록됩니다.

만약, AmazonSSMRoleForInstancesQuickSetup이 자동으로 생성되지 않는다면 AmazonSSMManagedInstanceCore 정책을 지정한 IAM 역할을 직접 생성하시면 됩니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-managed-instance-core-policy.png)

#### IAM 역할
IAM 역할이 지정되지 않은 인스턴스는 다음과 같이 SSM 에이전트를 통해 연결할 수 없습니다.

![IAM 역할이 지정되지 않은 인스턴스](/images/posts/connect-private-ec2-instance/aws-ssm-connect-instance-console-failed.png)

AmazonSSMRoleForInstancesQuickSetup 역할을 지정해봅니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-set-iam-role.png)

#### HTTPS 인바운드 트래픽 허용
AmazonSSMRoleForInstancesQuickSetup 역할을 지정하더라도 VPC를 구성하는 프라이빗 네트워크 주소 범위에 대하여 HTTPS 트래픽을 허용해야합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-https-inbound-trafic.png)

#### Session Manager 활성화
SSM 에이전트 통신이 성공적으로 이루어진 경우 EC2 콘솔을 통해 Session Manager를 사용하여 프라이빗 인스턴스에 연결할 수 있습니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-connect-instance-console.png)

### 관리형 인스턴스 검토
관리형 인스턴스는 Systems Manager와 함께 사용하도록 구성된 EC2 인스턴스입니다. EC2 인스턴스를 관리형 인스턴스로 등록하기 위해서는 다음의 조건이 충족되어야 합니다. 

- SSM 에이전트 설치 : EC2 인스턴스에 SSM 에이전트가 설치되어있어야 합니다.
- SSM 엔드포인트 연결 : SSM 서비스가 SSM 에이전트로 통신할 수 있어야 합니다.
- SSM IAM 역할 연결 : AmazonSSMManagedInstanceCore 정책을 포함하는 IAM 역할을 연결해야합니다.


## AWS SSM CLI
로컬 호스트에서 SSM 에이전트가 설치된 EC2 인스턴스에 접근하기 위해서 AWS CLI의 SSM 명령어를 사용할 수 있습니다.

### AWS CLI 설치
각 환경에 맞는 AWS CLI 인스톨러를 실행하여 AWS CLI를 설치합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-install-aws-cli-2-for-windows.png)

### 크레덴셜 프로파일 설정
AWS CLI을 사용하기 위하여 `AmazonSSMManagedInstanceCore` 정책이 부여된 크레덴셜을 프로파일로 등록합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-configure-aws-cli-profile.png)

### SSM 세션 시작하기
AWS SSM CLI의 `start-session` 명령어로 관리형 인스턴스에 대한 세션을 시작할 수 있습니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-cli-start-session.png)

#### SSM 포트 포워딩
세션을 시작할 때 포트 번호를 파라미터로 제공하여 SSH에서 처럼 포트 포워딩을 수행할 수 있습니다. 이때 파라미터 중 `portNumber`는 관리형 인스턴스의 포트이고 `localPortNumber`는 현재 로컬 호스트의 포트임을 감안하시기 바랍니다.

```sh
aws ssm start-session \
--profile mambo \ 
--target $instance_id \
--document-name AWS-StartPortForwardingSession \
--parameters '{"portNumber":["8080"], "localPortNumber":["5000"]}'

Starting session with SessionId: $session_id
Port 5000 opened for sessionId $session_id
Waiting for connections...
```

> 윈도우 터미널에서는 "를 \\"로 문자 처리해야해요.

## SSM CLI 고급 기능
SSM 에이전트를 통해 연결되는 세션은 SSH를 활용하는 것이 아니므로 EC2 인스턴스의 22번 포트에 정의된 보안 그룹이 무시됩니다. 또한, [SSH 연결 활성화](https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/session-manager-getting-started-enable-ssh-connections.html)를 통해 세션 매니저가 SSH 연결을 수행할 수 있습니다. 

세션 매니저를 통해 SSH 연결을 수행하는 경우 22번 포트가 인바운드 규칙에 없더라도 SSH 또는 SCP를 사용할 수 있습니다. PEM 파일이 누군가에 의해 탈취되었더라도 SSM 관리형 인스턴스 역할이 부여된 크레덴셜이 없으면 관리형 인스턴스에 접근할 수 없습니다.

> SSM CLI로 SSH 연결을 수행하는 예제는 [AWS SSM으로 EC2 인스턴스에 접근하기](https://musma.github.io/2019/11/29/about-aws-ssm.html)를 참고하세요.

### Gossm
[AWS SSM 이용해 EC2 접속하는 CLI 개발](https://medium.com/@gjbae1212/aws-ssm-%EC%9D%B4%EC%9A%A9%ED%95%B4-ec2-%EC%A0%91%EC%86%8D%ED%95%98%EB%8A%94-cli-%EA%B0%9C%EB%B0%9C-62c2f7357fb8)에서 소개하는 [gossm](https://github.com/gjbae1212/gossm)은 AWS SSM CLI을 좀 더 편하게 사용할 수 있도록 지원하니 활용하시면 좋습니다.

본 글에서 진행한 AWS 콘솔 화면은 회사에서 사용중인 계정을 통해 알아보았기 때문에 주요 정보는 전부 마스킹 처리되었습니다. 프라이빗 EC2 인스턴스에 대한 접근을 위해 배스천 호스트 대신에 SSM 에이전트를 사용해보세요.

감사합니다.