---
title: EC2 Node Exporter
date: 2022-05-21
tags:
- EC2
- node-exporter
---

조직에서 아마존 웹 서비스를 클라우드 환경으로 사용하곤 있지만 인프라 엔지니어로 구성된 인프라팀이 별도로 존재하지 않다보니 클라우드 서비스를 제대로 활용하지 않고 필요하다고 생각될 때 어떻게 사용해야하는가를 찾아보고 고민하게 되는 것 같습니다. 서버 인스턴스 모니터링에 대해서도 기본적으로는 웹 콘솔에서 지표를 확인할 수 있도록 [Amazon EC2 모니터링](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/monitoring_ec2.html)기능을 제공하고 있지만 5분 단위로 수집되는 지표를 1분 단위로 수집하기 위해서는 [인스턴스에 대한 세부 모니터링 활성화](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/using-cloudwatch-new.html)를 해야하고 더 많은 인스턴스에 대한 지표를 확인하기 위해서는 EC2 인스턴스에 [CloudWatch 에이전트 설치](https://docs.aws.amazon.com/ko_kr/AmazonCloudWatch/latest/monitoring/installing-cloudwatch-agent-ssm.html)해야하고 별도의 비용이 추가적으로 든다는 점으로 인하여 사용하지는 않고 있습니다.

회사 사내 서버에 개인적으로 프로메테우스 및 그라파나 서버를 실행해두었기 때문에 Node Exporter를 활용해서 EC2 인스턴스에 접속할 수 있는 권한이 있다면 지표를 수집할 수 있는 방안을 마련할 수 있다고 생각되었습니다. 고객으로 부터 웹 콘솔을 접근할 수 있는 권한을 부여받기도 하고 어떤 고객은 보안 상 이유로 인하여 인프라 구성과 관리는 직접 담당하고 정해진 스펙에 따라서 생성한 EC2 인스턴스 접속 권한만 부여하기 때문에 CloudWatch를 공통적으로 사용하도록 할 수 없습니다.

> 회사 사내 서버에 임시적으로 구성한 프로메테우스 및 그라파나는 모니터링 방안이 검토되면 조직내에서 운영중인 클라우드 환경으로 이전할 생각입니다.

아무튼 현재 조직에서 모니터링 방안을 제대로 검토할 수 있는 단계는 아니지만 고객의 인프라 환경에 시스템을 배포하고 운영하고 있으므로 최소한 원인을 찾아가기 위한 지표는 남겨두어야한다고 생각하기에 Node Exporter를 일괄적으로 설치하는 작업을 수행했고 이에 대한 정보를 남기고자 합니다.

## Node Exporter
[Node Exporter](https://github.com/prometheus/node_exporter)는 프로메테우스 프로젝트에서 공식적으로 지원하는 시스템 매트릭을 수집하는 방법을 제공하는 Exporter 입니다. [Installing and running the Node Exporter](https://prometheus.io/docs/guides/node-exporter/#installing-and-running-the-node-exporter)와 같이 Node Exporter를 설치하고 실행하는 방법에 대한 가이드 문서도 제공하고 있습니다.

EC2 인스턴스는 상태가 정상적이지 않음이 확인되면 [인스턴스 복구](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/ec2-instance-recover.html) 기능으로 아마존 웹 서비스에서 자동으로 인스턴스 상태를 복원할 수 있습니다. 그래서 언제든지 EC2 인스턴스가 재부팅되어 실행중인 프로세스가 종료될 수 있습니다. 서버 인스턴스가 재부팅되어도 자동으로 프로세스가 실행되도록 유지하기 위해서 Systemd와 같은 서비스를 등록하도록 구성하는 것이 좋습니다.

### EC2 인스턴스 아키텍처
아마존 웹 서비스에서는 일반적으로 사용되는 amd64 기반의 아키텍처 뿐만 아니라 [Arm 기반의 AWS Graviton 프로세서](https://aws.amazon.com/ko/ec2/graviton/)로 제공되는 인스턴스를 제공하고 최근에는 Arm 기반의 인스턴스를 통해 더 저렴한 가격으로 서버 인스턴스를 실행하므로 EC2 인스턴스의 아키텍처를 확인하고 사용할 수 있는 올바르게 빌드된 파일을 다운로드 받아서 설치해야합니다.

```bash
$ uname -rmpo
4.14.256-197.484.amzn2.aarch64 aarch64 aarch64 GNU/Linux
```

### 릴리즈 파일 다운로드 및 설치
EC2 인스턴스의 아키텍처 유형을 확인했다면 [릴리즈 파일](https://github.com/prometheus/node_exporter/releases)에서 위 아키텍처에 맞는 arm64가 포함된 릴리즈 파일을 다운로드합니다. 대부분의 예제는 일반적으로 사용하는 x86_64 아키텍처를 기준으로 하기 때문에 amd64를 다운로드 합니다.

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.3.1/node_exporter-1.3.1.linux-arm64.tar.gz

tar zxvf node_exporter-1.3.1.linux-arm64.tar.gz
sudo cp node_exporter-1.3.1.linux-arm64/node_exporter /usr/local/bin/

sudo useradd -M -r -s /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
```

#### Node Exporter 용 사용자 추가
인프라 엔지니어가 아니기에 사용자를 직접 추가해본적이 없어서 사용자를 추가하는 명령어에 대해서 알아보아야했습니다. 많은 예제들에서 사용자 추가 시 적용하는 옵션이 제각각이라서 더 혼란이 있었습니다. 

- [useradd(8) - Linux man page](https://linux.die.net/man/8/useradd)
- [/bin/false, /sbin/nologin 의 차이점](https://faq.hostway.co.kr/Linux_ETC/1624)
- [How do I add a user in Linux without a home directory?](https://linuxhint.com/add-user-linux/)

```bash
# sudo useradd --no-create-home --system --shell /bin/false node_exporter
sudo useradd -M -r -s /bin/false node_exporter
```

> 시스템 계정을 생성하되 로그인이 불가능하도록 하면 되는 것 같습니다.

### Systemd 서비스 등록
설치한 바이너리를 실행하기 위해서 Systemd 서비스를 등록하고 Systemctl 명령어를 통해 프로세스를 실행하고 서버가 부팅될 때 자동으로 시작되도록 활성화합니다.

```bash
sudo tee /etc/systemd/system/node_exporter.service <<"EOF"
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl status node_exporter
sudo systemctl enable node_exporter
```

### 매트릭 확인
Node Exporter 서비스가 정상적으로 실행됬다면 curl 명령어를 통해서 지표를 가져올 수 있는지 확인하고 종료합니다.

```bash
curl -s localhost:9100/metrics
```

## 참고
- [Node Exporter Setup on Linux Nodes](https://docs.vmware.com/en/VMware-vRealize-Operations-Management-Pack-for-Kubernetes/1.6/kubernetes-solution/GUID-A1B68BE5-EF38-48E1-AA80-FD71E6F19989.html)
- [How To Install Prometheus on Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-install-prometheus-on-ubuntu-16-04)
- [Getting Started with Prometheus and Node Exporter](https://devdojo.com/ruanbekker/getting-started-with-prometheus-and-node-exporter)
- [How To Monitor Linux Servers Using Prometheus Node Exporter](https://devopscube.com/monitor-linux-servers-prometheus-node-exporter/)