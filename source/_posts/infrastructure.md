---
title: 개발자를 위한 인프라 지식
date: 2022-05-15
tags:
- Infrastructure
- Microarchitecture
---

> IT가 어렵다고 느끼게 되는 이유는 기술의 발전으로 예전에는 불가능했다거나 그러지 않았던 부분들이 변화해서 많은 선택지가 생기기 때문입니다. 온-프레미스 환경을 넘어서 클라우드 환경으로 인프라를 구성하게 되는 것도 동일합니다.

IT 분야에서 반드시 그래야한다는 것이 보장되지 않는 것과 비슷하게 모든 회사 또는 조직이 시스템을 운영하기 위한 인프라를 어떻게 구성한다거나 인프라를 담당하기 위한 팀을 별도로 구성할 지 일부 인원들이 담당할지는 알 수 없습니다. 작은 조직에서는 인건비의 문제로 인하여 서버 인프라 엔지니어를 최소화하고 클라우드 환경을 통해 개발자가 스스로 인프라를 구성하고 운영하는 선택을 할 것입니다. 조직에서 만드는 시스템이나 서비스의 규모가 커지게되면 업무의 과중화로 인하여 [카카오 서비스의 모든 시스템과 트래픽을 책임지는 ‘인프라팀’ 이야기](https://tech.kakao.com/2020/12/07/kakao-infra-team/) 또는 [토스 서비스의 근간을 다지는 사람들, 인프라 엔지니어링 팀을 만나다](https://blog.toss.im/article/infraengineeringteam-interview)에서처럼 클라우드 환경의 인프라를 사용하더라도 더 효율적으로 인프라를 구성하고 중점적으로 관리하기 위해서 인프라 팀을 구성하게 될 것입니다. 

## 인프라스트럭처
인프라 영역에 대해서 서버 인프라 엔지니어에게 원하는 바를 전달하기 위해서는 인프라 영역에 대한 지식을 어느정도 알고 있어야 합니다. 인프라 영역을 담당하는 것과 인프라 영역에 대한 지식을 알고 협업하는 것은 다르다고 생각됩니다. 솔루션 회사의 사업팀 인원들은 IT 분야 또는 시스템에서 사용되는 용어나 개념들을 학습하여 업무에 활용하는 것처럼 개발자도 개발 영역 뿐만 아니라 인프라 영역에 대한 개념을 알고 있는게 당연할 것 입니다. 개발 영역과 마찬가지로 인프라 영역에서 알아야할 지식도 무궁무진합니다. 클라우드 환경에서 가상의 네트워크 영역을 구성하기 위해서 사이더(CIDR) 블록 및 NAT와 같은 개념을 알아야하거나 시스템을 운영하기 위해서 적합한 [EC2 인스턴스 유형](https://aws.amazon.com/ko/ec2/instance-types/)을 선택할 수 있어야합니다.

### 서버 CPU 아키텍처
온-프레미스 환경에서는 호환성을 위해서 일반적으로 인텔 제품군의 제온 프로세서와 같은 X86_64 아키텍처 기반의 서버용 CPU를 사용하는 경우가 많았을 것입니다. 클라우드 환경에서는 인텔과 AMD와 같은 amd64 아키텍처 기반의 프로세서 뿐만 아니라 arm64 아키텍처 기반의 프로세서를 사용할 수 있도록 지원하므로 선택지가 다양하고 서버 인스턴스에서 구동되는 프로세스의 목적에 따라서 선택하게 됩니다. 현재 조직에서는 [EC2 인스턴스 유형을 교체하는 이유](/reason-for-replacing-ec2-instance-type/)에서처럼 서버 비용을 줄이기 위한 목적으로 일부 서버 인스턴스에 대해서 클라우드 서비스에서 제공하는 최신 인스턴스 유형으로 전환하기도 했죠. 

![](/images/posts/infrastructure/arm-01.png)

서버 CPU 아키텍처의 선택지가 다양해짐으로써 사용해야하는 프로세스나 도구에서 CPU 아키텍처를 지원하는지를 검토해야할 수 있습니다. 위 스크린샷처럼 [Promethues Node Exporter](https://github.com/prometheus/node_exporter/releases)를 Arm 아키텍처 기반의 서버에서 사용하기 위해서는 **arm64**로 빌드된 바이너리를 다운로드해야합니다. 도커 컨테이너를 통해서 프로세스를 실행하는 것도 도커 이미지가 [Arm 아키텍처로 빌드된 이미지](https://docs.docker.com/desktop/multi-arch/#build-multi-arch-images-with-buildx)를 지원하는지 확인해보고 사용해야합니다.

#### 서버 아키텍처 확인
클라우드 서비스 콘솔에 접속할 수 있다면 서버 인스턴스가 어떤 아키텍처 기반인지 쉽게 확인할 수 있을 것 입니다. 그러나 일반적으로는 SSH 접속을 통해서 서버에 접근할 수 있는 권한을 부여할 것이므로 현재 접속한 서버내에서 어떤 아키텍처를 사용하는지를 확인할 수 있어야합니다. 서버 내에서 아키텍처 정보를 확인하려면 커널 또는 CPU에 대한 정보를 조회하는 명령어나 도구를 사용하면 됩니다. 여러분들이 접속하는 서버에서 다음의 명령어를 확인해보세요.

```shell
$ uname -rmpo
4.14.256-197.484.amzn2.aarch64 aarch64 aarch64 GNU/Linux

$ cat /proc/version
Linux version 4.14.256-197.484.amzn2.aarch64 (mockbuild@ip-10-0-46-15) (gcc version 7.3.1 20180712 (Red Hat 7.3.1-13) 
(GCC)) #1 SMP Tue Nov 30 00:18:02 UTC 2021

$ hostnamectl
   Static hostname: ip-192-168-53-1.ap-northeast-2.compute.internal
         Icon name: computer-vm
           Chassis: vm
        Machine ID: ec2d229d0283ccced53f112dc3648f3a
           Boot ID: 67c156512c204340b1ac01d60eb45b26
    Virtualization: amazon
  Operating System: Amazon Linux 2
       CPE OS Name: cpe:2.3:\o:amazon:amazon_linux:2
            Kernel: Linux 4.14.256-197.484.amzn2.aarch64
      Architecture: arm64

$ lscpu
Architecture:        aarch64
Byte Order:          Little Endian
CPU(s):              4
On-line CPU(s) list: 0-3
Thread(s) per core:  1
Core(s) per socket:  4
Socket(s):           1
NUMA node(s):        1
Model:               1
BogoMIPS:            243.75
L1d cache:           64K
L1i cache:           64K
L2 cache:            1024K
L3 cache:            32768K
NUMA node0 CPU(s):   0-3
Flags:               fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp cpuid asimdrdm lrcpc dcpop asimddp ssbs
```

> x86_64와 amd64는 X86 명령어 집합의 아키텍처이며 aarch64와 arm64는 arm 명령어 집합의 아키텍처입니다.

### 디스크 볼륨
서버 인스턴스에서 사용하는 디스크 볼륨에 대한 부분에 대해서 이야기가 오고갈 수 있습니다. 클라우드 서비스는 다양한 [디스크 볼륨 유형](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/ebs-volume-types.html)을 선택할 수 있도록 지원하므로 서버 인스턴스의 목적에 맞는 디스크 볼륨을 추가하여 사용하기 때문입니다. 현재 사용중인 디스크 볼륨 정보를 확인하고 어떤 파일시스템의 파티션인지를 확인하고 디스크 볼륨의 용량을 증설해야할 수도 있죠. 

```shell
$ df -hT
Filesystem     Type      Size  Used Avail Use% Mounted on
/dev/root      ext4       30G  8.9G   21G  31% /
/dev/nvme1n1   xfs      1000G  629G  371G  63% /data/main
/dev/nvme2n1   xfs       2.0T  306G  1.7T  16% /data/sub

$ lsblk -f
NAME        FSTYPE   LABEL           UUID                                 FSAVAIL FSUSE% MOUNTPOINT
nvme1n1     xfs                      18891124-be54-415d-ba02-21dc6acf9e4f  370.9G    63% /data/main
nvme2n1     xfs                      5be85d99-8ed0-440b-a423-486bdef1b1b4    1.7T    15% /data/sub
nvme0n1
└─nvme0n1p1 ext4     cloudimg-rootfs e8070c31-bfee-4314-a151-d1332dc23486   20.1G    31% /
```

위 예시 결과를 보면 서버 인스턴스에 연결된 루트 볼륨은 NVMe 기반이며 ext4 파일시스템의 파티션으로 되어있음을 확인할 수 있습니다. 추가로 연결된 데이터 볼륨은 동일하게 NVMe 기반이지만 xfs 파일시스템으로 되어있는 것을 확인할 수 있습니다. 

```shell
$ du --max-depth 1 | sort -nr
188679628 .
187045152 ./elasticsearch-7.3.2
1034772   ./kibana-7.3.2
18756     ./node_exporter-1.1.2.linux-amd64
```

du 명령어를 통해서 현재 경로 기준에서 사용량이 많은 디렉토리 순서대로 출력했습니다. 디스크 볼륨의 용량이 부족해지면 사용량이 많은 디렉토리가 무엇인지 확인하고 불필요한 파일이 남아있는지를 먼저 확인하고 용량 확보가 불가능하다면 디스크 볼륨 증설을 요청하거나 작업을 수행할 것 입니다.

### 네트워크
인프라 영역 중 네트워크에 대한 부분은 외부 시스템과의 연동이 필요한 경우가 아니라면 생각보다 경험해볼 가능성이 적습니다. 외부 시스템의 IP 또는 호스트 주소로 트래픽이 전달되는지를 확인하거나 외부 API를 서버 내에서 직접 요청해볼 수도 있습니다. 

```shell
# 네트워크 인터페이스 조회
ifconfig

# 내부 아이피 조회
hostname -I

# 외부 아이피 조회
curl ipconfig.io

# TCP 바인딩 포트 조회
netstat -tnlp

# 트래픽 경로 추적
traceroute google.com

# DNS 조회
nslookup -type=mx google.com
dig google.com mx
```

### 시스템 로그
인프라 엔지니어로 구성된 인프라 팀이 조직내에 있다면 서버 시스템에서 발생하는 다양한 로그 또는 지표를 모니터링할 수 있는 Zabbix, Datadog과 같은 솔루션을 도입할 것입니다. 서버에 기록된 시스템 로그는 서버에서 발생한 일련의 이벤트들의 기록이므로 어떠한 문제가 파악되었을때 원인을 찾아가기 위한 분석 용도로 사용할 수 있습니다. 모니터링 시스템이 구축되어있지 않아도 시스템 로그를 확인할 수 있는 방법은 알아야합니다. 사용자의 요청이 애플리케이션으로 전달되는 과정에서 서버 네트워크 트래픽이 로그로 기록된다거나 엔진엑스와 같은 웹서버에서 리버스 프록시를 수행하기 전에 요청에 대해 액세스 로그를 기록합니다. 심지어는 애플리케이션 서버에서도 자체적으로 액세스 로그를 남기거나 애플리케이션의 주요 기능에 대한 동작을 로그로 저장되도록 정의하기도 합니다. 서버 인프라 엔지니어가 있다면 더 상세하게 원인을 파악할 수 있는 방법을 시도하겠지만 개발자로써는 간단하게 로그를 확인할 수 있으면 됩니다.

#### 리눅스 로그 디렉토리
리눅스 시스템의 로그가 저장되는 기본 디렉토리는 **/var/log** 입니다. 별도로 설치한 프로세스의 로그가 아니라면 대부분의 로그들이 이 경로에 저장될 것입니다. 

```shell
# 접속 기록 조회
lastlog -t 1

# systemd 로그 조회
journalctl -b

# 커널 부트 메시지 조회
dmesg

# 시스템 로그 조회
tail /var/log/syslog
```

> Zabbix와 같은 모니터링 솔루션을 도입하는 경우 [로그 파일 감시](https://www.zabbix.com/documentation/current/en/manual/config/items/itemtypes/log_items) 기능으로 예상되는 문제를 감지할 수 있습니다.

#### 로그 관리
서버를 관리하는 인프라 엔지니어 입장에서는 로그 파일을 효율적으로 관리하기 위해서 logrotate라고하는 로그 관리 도구를 사용합니다. 서버에 저장되는 로그 파일을 일정한 패턴을 주기로 구분하여 저장함으로써 나중에 어떠한 문제가 발생하거나 감사를 위해서 특정 시점에 대한 로그를 요청했을때 쉽게 전달할 수 있도록 대비합니다. 예를 들어, Nginx에 대한 로테이션 설정 파일을 살펴보면 아래와 같이 되어있는 것을 확인할 수 있습니다.


```shell
$ cat /etc/logrotate.d/nginx
/var/log/nginx/*.log {
        daily
        missingok
        rotate 52
        compress
        delaycompress
        notifempty
        create 640 nginx adm
        sharedscripts
        postrotate
                if [ -f /var/run/nginx.pid ]; then
                        kill -USR1 `cat /var/run/nginx.pid`
                fi
        endscript
}
```

인프라 영역에서 로그 관리에 대한 개념을 알게된다면 개발자로써 애플리케이션 서버에서 기록되는 로그에 어떠한 정보를 남겨야하는가를 좀 더 고민하게 될 것입니다. 너무 불필요한 정보를 로그로 남기게 되어 서버의 디스크 볼륨의 용량을 너무 차지하게 되고 로그 분석도 힘들어질 수 있기 때문입니다.

개발자가 알아야할 기초적인 부분에 대해서 다루어보았습니다. 더 자세하게 들어간다면 시스템 성능의 지표를 확인하거나 시스템을 더 효율적으로 만드는 커널 튜닝에 대한 부분도 다루어보아야합니다. 인프라 영역에 대해서 더 많은 경험을 하게되면 이에 대한 부분도 공유해볼 수 있기를 바랍니다.

## 참고
- [AWS Graviton 프로세서](https://aws.amazon.com/ko/ec2/graviton/)
- [ARM 프로세서를 선택해야 하는 이유](https://www.oracle.com/kr/cloud/compute/arm/what-is-arm/)
- [미래 컴퓨팅 환경 반영하는 ARM 아키텍처 기술](https://www.epnc.co.kr/news/articleView.html?idxno=205714)