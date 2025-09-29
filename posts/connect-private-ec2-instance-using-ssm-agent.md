---
title: AWS SSM 에이전트로 프라이빗 EC2 인스턴스에 연결하기
date: 2021-02-19
tags:
- AWS
- SSM Agent
---

오늘은 아마존 웹 서비스에서 제공하는 SSM(System Session Manager) 에이전트를 통해서 퍼블릭 IP를 통한 SSH 접속이 아닌 HTTPS 엔드포인트를 사용해서 프라이빗 서브넷에 위치하는 인스턴스에 접근할 수 있는 방법을 알아보고자 합니다. 

인터넷에서 접근할 수 있는 아이피 주소가 할당되지 않는 프라이빗 서브넷에 위치하는 프라이빗 EC2 인스턴스에 접근하기 위해서는 퍼블릭 IP가 할당되는 퍼블릭 서브넷에서 실행되는 **배스천 호스트**가 필요하며 이 배스천 호스트라는 서버를 경유하여 내부 네트워크 연결을 통해 프라이빗 인스턴스로 접근할 수 있도록 구성하게 됩니다. SSH 클라이언트를 사용해서 배스천 호스트에 접속하기 위해서는 퍼블릭 DNS 또는 퍼블릭 IP 주소를 가지는 퍼블릭 인스턴스이어야하므로 배스천 호스트를 구성한다는 의미는 불필요하게 인스턴스를 유지하여 비용이 발생한다는 문제와 내부 인스턴스에 접근하기 위한 키 페어가 배스천 호스트에 있다는 단점을 가지게 됩니다.

## AWS Systems Manager 
HTTPS 엔드포인트를 사용해서 인터넷과 연결되지 않는 프라이빗 서브넷에 접근할 수 있도록 관리형 인스턴스를 만들기 위해서는 아마존 웹 서비스의 Systems Manager 서비스를 통해서 [SSM 에이전트](https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/sysman-install-ssm-agent.html)가 설치된 EC2 인스턴스를 관리형 인스턴스로 등록하여 관리되도록 구성해야합니다.

### 호스트 관리 기능 활성화

![](/images/posts/connect-private-ec2-instance/aws-ssm-quick-setup.png)

AWS Systems Manager의 빠른 설정 기능 중 Host Management 구성을 통해 쉽게 EC2 인스턴스를 관리형 인스턴스로 등록하기 위한 작업을 활성화 할 수 있습니다. 학습 단계이므로 간단하게 현재 리전에 대한 모든 인스턴스를 관리하도록 선택하고 생성하시기 바랍니다.

#### 관리형 인스턴스 조건 검토
Systems Manager에서 EC2 인스턴스를 관리형 인스턴스로 등록하기 위해서는 다음의 조건이 충족되어야하므로 이를 검토해야합니다.

- SSM 에이전트 설치 : EC2 인스턴스에 SSM 에이전트가 설치되어있어야 합니다.
- SSM 엔드포인트 연결 : SSM 서비스가 SSM 에이전트로 통신할 수 있어야 합니다.
- SSM IAM 역할 연결 : AmazonSSMManagedInstanceCore 정책을 포함하는 IAM 역할을 연결해야합니다.

### SSM 에이전트를 위한 VPC 엔드포인트 구성
SSM 에이전트는 SSH 프로토콜이 아닌 HTTPS 엔드포인트를 통해서 인스턴스 접근을 제공하기에 앞서 호스트 관리 구성을 통해 활성화된 SSM 에이전트가 VPC 내 프라이빗 서브넷에 접근할 수 있도록 AWS PrivateLink로 구동되는 [VPC 인터페이스 엔드포인트](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)를 설정해야 합니다.

#### VPC DNS 호스트 이름 활성화
먼저 VPC 엔드포인트를 생성하기 위해서는 VPC에 대한 속성들 중에서 **DNS 호스트 이름을 활성화**해야합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-enable-dns-name.png)

#### VPC 엔드포인트 생성
VPC의 DNS 호스트 이름이 활성화되었음을 확인하였다면 **EC2와 SSM 서비스에 대한 VPC 엔드포인트**를 생성합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-vpc-endpoints.png)

### EC2 인스턴스 프로파일 지정
빠른 설정 기능의 호스트 관리 구성을 수행했기에 **AmazonSSMRoleForInstancesQuickSetup**이라는 IAM 역할이 자동으로 생성됩니다. 이제 EC2 인스턴스를 실행할 때 AmazonSSMRoleForInstancesQuickSetup IAM 역할을 지정하면 AWS Systems Manager가 SSM 에이전트와 통신하여 관리형 인스턴스로 등록됩니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-managed-instance-core-policy.png)

AWS Systems Manager가 관리형 인스턴스로 등록하는데에 약간의 시간이 소요될 수 있어 잠시 기다리셔야하며 만약에 AmazonSSMRoleForInstancesQuickSetup IAM 역할이 자동으로 만들어지지 않았다면 AmazonSSMManagedInstanceCore 정책을 지정한 IAM 역할을 직접 생성하시기 바랍니다.

#### IAM 역할
다음은 IAM 역할이 지정되지 않은 인스턴스는 내부적으로 SSM 에이전트가 설치되어있어도 SSM 에이전트가 통신할 수 있는 권한이 없으므로 아래와 같이 웹 콘솔에서 Session Manager를 사용하여 인스턴스에 연결할 수 없습니다.

![IAM 역할이 지정되지 않은 인스턴스](/images/posts/connect-private-ec2-instance/aws-ssm-connect-instance-console-failed.png)

만약, IAM 역할이 지정되지 않았음을 확인한다면 AmazonSSMRoleForInstancesQuickSetup 역할을 지정하시기를 바랍니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-set-iam-role.png)

#### HTTPS 인바운드 트래픽 허용
AmazonSSMRoleForInstancesQuickSetup 역할을 지정하였으나 Session Manager를 통해 인스턴스 연결이 불가능하다면 VPC를 구성하는 프라이빗 네트워크 주소 범위에 대해서 HTTPS에 대한 인바운드 트래픽을 허용하도록 해야합니다. SSM 에이전트는 HTTPS 엔드포인트로 통신하여 인스턴스 접근을 제공한다는 점을 인지하셔야 합니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-https-inbound-trafic.png)

#### Session Manager 활성화
잘 따라오셨다면 SSM 에이전트와의 통신이 성공적으로 이루어지고 Systems Manager가 관리형 인스턴스로 등록했다면 EC2 웹 콘솔을 통해서 프라이빗 인스턴스에 배스천 호스트 없이도 직접 연결할 수 있습니다. 

![](/images/posts/connect-private-ec2-instance/aws-ssm-connect-instance-console.png)

## AWS SSM CLI
SSM 서비스에 대한 권한을 가지는 IAM 프로파일을 가지고 있다면 AWS CLI의 ssm 명령어를 사용해서 프라이빗 인스턴스에 접근할 수 있습니다. 만약, AWS CLI이 설치되지 않은 상태라면 아래와 같이 사용중인 운영체제에 맞는 방법으로 AWS CLI를 설치하시기 바랍니다.

![](/images/posts/connect-private-ec2-instance/aws-ssm-install-aws-cli-2-for-windows.png)

### SSM 세션 시작하기
AWS CLI을 사용하기 위하여 `AmazonSSMManagedInstanceCore` 정책이 부여된 크레덴셜을 프로파일로 등록한 후 AWS SSM CLI의 `start-session` 명령어로 관리형 인스턴스에 대한 세션을 시작할 수 있습니다. 

![IAM 프로파일 크레덴셜 구성](/images/posts/connect-private-ec2-instance/aws-ssm-configure-aws-cli-profile.png)

![](/images/posts/connect-private-ec2-instance/aws-ssm-cli-start-session.png)

#### SSM 포트 포워딩
SSM 에이전트는 포트 포워딩 세션 기능도 제공하므로 다음과 같이 포트 포워딩에 대한 도큐먼트와 함께 **관리형 인스턴스의 포트 번호(portNumber)** 와 **로컬 호스트의 포트 번호(localPortNumber)** 를 파라미터로 제공하면 됩니다. 예를 들어, 프라이빗 인스턴스의 8080 포트에 대해서 로컬 호스트의 5000 포트로 연결하고자 한다면 다음과 같이 명령어를 실행하면 됩니다.

```shell
aws ssm start-session \
--profile mambo \ 
--target $instance_id \
--document-name AWS-StartPortForwardingSession \
--parameters '{"portNumber":["8080"], "localPortNumber":["5000"]}'

Starting session with SessionId: $session_id
Port 5000 opened for sessionId $session_id
Waiting for connections...
```

### SSH 연결 활성화
기본적으로 SSM 에이전트는 HTTPS 엔드포인트를 통해서 통신하므로 SSH 접속에 대한 22번 포트에 대한 보안 그룹 설정이 필요하지 않습니다. 그러나, SCP와 같은 동작을 위해서 [SSH 연결 활성화](https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/session-manager-getting-started-enable-ssh-connections.html)를 구성하여 SSM을 통해서 SSH 연결을 수행할 수 있습니다. 

_~/.ssh/config_

```shell
# SSH over Session Manager
host i-* mi-*
    ProxyCommand C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p"
```

> 내부적으로 SSH 프로토콜을 사용한 터널링을 수행한다는 점과 SSM 에이전트를 통해 SSH 연결을 시도하면 로깅 기능은 활성화되지 않는다는 점을 감안하시기 바랍니다.

### Interactive CLI - Gossm
저는 사용하지는 않고 있지만 [AWS SSM 이용해 EC2 접속하는 CLI 개발](https://medium.com/@gjbae1212/aws-ssm-%EC%9D%B4%EC%9A%A9%ED%95%B4-ec2-%EC%A0%91%EC%86%8D%ED%95%98%EB%8A%94-cli-%EA%B0%9C%EB%B0%9C-62c2f7357fb8)에서 소개하는 [gossm](https://github.com/gjbae1212/gossm)은 AWS SSM CLI의 불편함을 보완하여 좀 더 편하게 사용할 수 있도록 제공하니 활용해보시면 좋을 것 같습니다. 

## 참고

- [Setting up Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started.html)
- [AWS SSM으로 EC2 인스턴스에 접근하기 (SSH 대체)](https://musma.github.io/2019/11/29/about-aws-ssm.html)
- [AWS Session Manager: A better way to SSH](http://sawers.com/blog/aws-session-manager-a-better-way-to-ssh/)

감사합니다.