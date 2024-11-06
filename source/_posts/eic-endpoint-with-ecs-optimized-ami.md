---
title: Amazon ECS 최적화 AMI 에서 EC2 인스턴스 연결 엔드포인트 사용하기
date: 2024-11-06T22:00+09:00
tags:
- EIC Endpoint
- Amazon ECS Optimized AMI
---

```sh Instance Connect Console
Failed to connect to your instance
Error establishing SSH connection to your instance. Try again later.
```

ECS 클러스터의 EC2 용량 공급자를 통해 오토스케일링 그룹(ASG)으로 프라이빗 서브넷에 실행된 EC2 인스턴스에 EC2 Instance Connect 엔드포인트를 사용하여 연결에 실패했습니다. AWS 문서에 따르면, [Amazon ECS-optimized Linux AMIs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html)는 [ec2-instance-connect 설치가 가능](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-connect-set-up.html)하며 최신 Amazon Linux 버전에는 기본적으로 포함하고 있다고 나와있지만 Amazon ECS‐optimized AMI(al2023-ami-ecs-hvm-2023.0.20241031-kernel-6.1-arm64)에서 기본적으로 설치된 패키지가 아닙니다.

```sh Terminal
$ yum list installed | grep ec2
amazon-ec2-net-utils.noarch            2.5.1-1.amzn2023.0.1               @System
cloud-init-cfg-ec2.noarch              22.2.2-1.amzn2023.1.12             @System
dracut-config-ec2.noarch               3.0-4.amzn2023.0.2                 @System
ec2-utils.noarch                       2.2.0-1.amzn2023.0.1               @System
grub2-efi-aa64-ec2.aarch64             1:2.06-61.amzn2023.0.12            @System

$ sudo dnf install ec2-instance-connect -y

$ sudo cat /etc/ssh/sshd_config | grep AuthorizedKeysCommand
AuthorizedKeysCommand /opt/aws/bin/eic_run_authorized_keys %u %f
AuthorizedKeysCommandUser ec2-instance-connect

$ sudo dnf --releasever=latest update -y
```

#### Amazon ECS Optimized AMI의 사용자 데이터로 ec2-instance-connect 패키지 설치하기

ECS 클러스터의 오토스케일링 그룹에서 EC2 인스턴스를 실행할 때 사용하는 시작 템플릿의 사용자 데이터 스크립트로 EC2 Instance Connect 엔드포인트 연결을 위한 패키지를 설치할 수 있습니다. 

![](/images/posts/eic-endpoint-with-ecs-optimized-ami/01.png)

```sh Instance Connect Console
$ sudo dnf list installed | grep ec2
amazon-ec2-net-utils.noarch            2.5.1-1.amzn2023.0.1               @System      
cloud-init-cfg-ec2.noarch              22.2.2-1.amzn2023.1.12             @System      
dracut-config-ec2.noarch               3.0-4.amzn2023.0.2                 @System      
ec2-instance-connect.noarch            1.1-19.amzn2023                    @amazonlinux 
ec2-instance-connect-selinux.noarch    1.1-19.amzn2023                    @amazonlinux 
ec2-utils.noarch                       2.2.0-1.amzn2023.0.1               @System      
grub2-efi-aa64-ec2.aarch64             1:2.06-61.amzn2023.0.12            @System
```

#### 참고 링크
- https://github.com/aws/containers-roadmap/issues/1300
- https://github.com/aws/amazon-ecs-ami/issues/170