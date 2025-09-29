---
title: EC2 인스턴스 연결(콘솔) 허용하기
date: 2021-09-26
tags:
- AWS
- EC2
---

안녕하세요 Mambo 입니다.

오늘 알아볼 내용은 EC2 인스턴스 연결(EC2 Instance Connect) 기능입니다. 일반적으로 EC2 인스턴스에 접속하기 위해서는 SSH 클라이언트를 사용합니다. 아마존 EC2 콘솔은 SSH 클라이언트를 사용하지 않고도 EC2 인스턴스에 연결할 수 있는 기능을 제공하고 있습니다. 어떻게 해야 EC2 콘솔을 통해 EC2 인스턴스에 연결할 수 있는지 알아봅시다.

## EC2 인스턴스 연결
**EC2 인스턴스 연결**은 아마존 EC2 콘솔을 통해 퍼블릭 IPv4 주소가 할당된 인스턴스에 연결할 수 있는 기능입니다. EC2 인스턴스 연결에 대한 자세한 내용은 [EC2 Instance Connect를 사용한 연결](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/ec2-instance-connect-methods.html#ec2-instance-connect-connecting-console) 문서에서 확인할 수 있습니다.

퍼블릭 IPv4 주소가 할당된 Amazon Linux 2 또는 Ubuntu 16.04 이상의 인스턴스라면 아마존 EC2 콘솔에서 제공하는 EC2 인스턴스 연결 기능을 사용하여 인스턴스에 접속할 수 있습니다.

### 인바운드 SSH 트래픽 허용
기본으로 제공하는 보안 그룹에는 SSH 트래픽을 수신하는 것을 허용하지 않습니다. EC2 인스턴스 연결을 사용하기 위해서는 **EC2_INSTANCE_CONNECT라는 서비스가 사용하는 IP 대역에 대하여 SSH 트래픽을 수신하도록 허용**해야합니다.

EC2_INSTANCE_CONNECT 서비스가 사용하는 IP 대역은 [AWSIP 주소 범위](https://ip-ranges.amazonaws.com/ip-ranges.json)에서 EC2_INSTANCE_CONNECT 서비스와 VPC가 생성된 region에 대하여 필터링을 해야합니다.

![](/images/posts/allow-ec2-instance-connect/ec2-instance-connect-01.png)

다행히도 다른 서비스와 다르게 EC2_INSTANCE_CONNECT는 리전별로 하나이므로 **13.209.1.56/29** IP 대역을 SSH 트래픽으로 수신하도록 허용하면 됩니다.

회사에서 지급받은 구형 맥북에서 [AWS 문서에서 알려주는 다음의 명령어](https://aws.amazon.com/ko/premiumsupport/knowledge-center/ec2-instance-connect-troubleshooting/)를 쳐봐도 하나만 나옵니다.

```sh
curl -s https://ip-ranges.amazonaws.com/ip-ranges.json| jq -r '.prefixes[] | select(.region=="us-east-1") | select(.service=="EC2_INSTANCE_CONNECT") | .ip_prefix'
13.209.1.56/29
```

![](/images/posts/allow-ec2-instance-connect/ec2-instance-connect-02.png)

위와 같이 13.209.1.56/29 대역에 대한 SSH 트래픽을 수신할 수 있도록 허용하였으니 이제 이 보안그룹을 인스턴스에 추가하면 됩니다.

### 샘플 인스턴스 생성
![](/images/posts/allow-ec2-instance-connect/ec2-instance-connect-03.png)

샘플 인스턴스는 기본으로 제공하는 보안 그룹을 지정하였습니다. 따라서 SSH 트래픽에 대해서 허용하지 않은 상태이므로 다음과 같이 EC2 인스턴스 연결을 시도하면 실패하게 됩니다.

![](/images/posts/allow-ec2-instance-connect/ec2-instance-connect-04.png)

이제 샘플 인스턴스에 ec2-instance-connect 보안그룹을 추가하겠습니다.

![](/images/posts/allow-ec2-instance-connect/ec2-instance-connect-05.png)

다시 아마존 EC2 콘솔의 EC2 인스턴스 연결으로 샘플 인스턴스에 접속해보겠습니다.

![](/images/posts/allow-ec2-instance-connect/ec2-instance-connect-06.png)

EC2_INSTANCE_CONNECT 서비스의 IP 대역을 허용하였기 때문에 정상적으로 접속되었습니다.

![](/images/posts/allow-ec2-instance-connect/complete.gif)

보안을 중요시하는 회사라면 모든 IP 대역에 대하여 SSH 접속을 허용하지 않고 **EC2_INSTANCE_CONNECT 서비스와 회사에서 사용되는 IP 대역을 허용하시는 것을 권장**합니다.

감사합니다.