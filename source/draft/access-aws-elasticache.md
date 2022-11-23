---
title: VPC 외부에서 ElastiCache 접근하기
date: 2022-10-14
---

현재 조직에서는 작은 EC2 인스턴스 내에 단일 레디스 프로세스를 실행하여 세션 저장소로 사용하고 있었는데 시스템의 요구사항이 점점 늘어나게 되면서 캐시 저장소로 조금씩 활용되고 있어서 더 높은 자원을 가지는 EC2 인스턴스 유형으로 전환 및 고 가용성을 위한 레디스 클러스터룰 구성해야할 요건이 생긴 것 같다. 조직 내에는 다른 회사처럼 인프라 엔지니어로 구성된 인프라 팀이 별도로 존재하지 않기 때문에 인프라 관리 포인트의 문제로 인해서 아마존 웹 서비스에서 제공하는 매니지드 서비스인 Amazon ElastiCache for Redis를 도입하는 것을 검토해야할 필요성이 생겼다.

#### 클러스터 액세스 제어
Amazon ElastiCache는 VPC 외부에서 접근이 가능한 엔드포인트를 제공하는 매니지드 관계형 데이터베이스 서비스인 RDS와는 다르게 VPC 서브넷에서 접근하기 위한 앤드포인트 주소를 제공한다. ElastiCache에 대해서 설명하는 많은 글에서는 VPC 내부에서만 접근하므로 비밀번호가 필요없다고 이야기하는데 고급 설정 중 보안 섹션에서 **전송 중 데이터 암호화**를 활성화해야 레디스 클러스터에 대한 액세스 제어 기능이 부여된다.

![](/images/posts/access-aws-elasticache/01.png)  

> 보안 섹션의 암호화 기능은 아래와 같이 클러스터 생성 후에는 변경할 수 없습니다.

![](/images/posts/access-aws-elasticache/02.png)

#### VPC 외부 접근 구성
Amazon ElastiCache 에서 자체적으로 퍼블릭 인터넷에서 접근할 수 있는 방법을 제공하지 않으므로 VPC 아이피 대역을 경유할 수 있는 방법을 적용해야 외부 접근이 가능하다. 예를 들어, 퍼블릭 액세스가 가능한 서브넷에 실행중인 EC2 인스턴스에서 ElastiCache 클러스터 엔드포인트에 대하여 HAProxy와 같은 TCP 프록시 구성을 통해서 사내 아이피 대역과 같은 개발 환경에서 접근할 수 있도록 포트포워딩을 적용할 수 있다. 

```shell
$ sudo yum install haproxy
$ sudo vi /etc/haproxy/haproxy.cfg

#---------------------------------------------------------------------
# main frontend which proxys to the backends
#---------------------------------------------------------------------
frontend frontend
        bind 0.0.0.0:6379
        default_backend elasticache

backend elasticache
        mode    tcp
        option  tcplog
        server  upstream elasticache.xxxxx.cache.amazonaws.com:6379

# wq

$ haproxy -f /etc/haproxy/haproxy.cfg -c
Configuration file is valid

$ sudo systemctl restart haproxy
$ sudo systemctl status haproxy
● haproxy.service - HAProxy Load Balancer
   Loaded: loaded (/usr/lib/systemd/system/haproxy.service; disabled; vendor preset: disabled)
   Active: active (running) since Thu 2022-10-13 06:59:01 UTC; 2h 41min ago
 Main PID: 7091 (haproxy-systemd)
   CGroup: /system.slice/haproxy.service
           ├─7091 /usr/sbin/haproxy-systemd-wrapper -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid
           ├─7092 /usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -Ds
           └─7093 /usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -Ds

Oct 13 06:59:01 ip-192-169-14-62.ap-northeast-2.compute.internal systemd[1]: Stopped HAProxy Load Balancer.
Oct 13 06:59:01 ip-192-169-14-62.ap-northeast-2.compute.internal systemd[1]: Started HAProxy Load Balancer.
Oct 13 06:59:01 ip-192-169-14-62.ap-northeast-2.compute.internal haproxy-systemd-wrapper[7091]: haproxy-systemd-wrapper: executing /usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -Ds
```

> [외부 AWS에서 ElastiCache 리소스에 액세스](https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/mem-ug/accessing-elasticache.html#access-from-outside-aws)에서 설명하는 것처럼 AWS Client VPN 구성을 통해서 외부에서 VPC 앤드포인트에 접근할 수 있습니다. 다만, [VPN 세션 최대 기간](https://docs.aws.amazon.com/ko_kr/vpn/latest/clientvpn-admin/cvpn-working-max-duration.html)이 24시간이므로 지속해서 연결할 수 있는 환경을 만들 수 없으며 개발 및 테스트 목적으로 사용해야 합니다.

사실 ElastiCache 서비스에 대해 외부 접근 구성을 테스트한 이유는 특정 고객의 AWS 클라우드 인프라 구성에 외부 IDC에서 데이터베이스들을 접근해야할 요구사항이 있으므로 인터넷 트래픽에 의해 클러스터 성능이 효율적이지 못하더라도 HAProxy의 TCP 프록시를 통해 특정 IP 대역에서 ElastiCache 서비스에 접근할 수 있도록 할 수 있음을 검증했다.

