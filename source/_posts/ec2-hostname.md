---
title: AWS EC2 호스트이름
date: 2025-01-10T23:00+09:00
tags:
- EC2 Hostname
- hostnamectl
- /etc/hostname
---

최근 고객사의 시계열 데이터베이스 서버에 있는 데이터를 최적화하고 삭제되는 데이터의 일부를 CSV로 추출하여 S3 버킷에 백업하는 유지보수 작업을 수행하고 있습니다. 해당 시계열 데이터베이스는 상용 기술로 라이센스 확인을 위해 외부 통신을 수행하는데 이 과정에서 서버 호스트이름을 라이센스 발급 시 지정된 값으로 지정해야합니다.

고객사 인프라팀에서 복제된 서버를 제공해주었지만 호스트이름이 임의로 설정되어있기 때문에 호스트이름을 <U>hostnamectl</U>을 통해 변경해야 했습니다. 고객사 환경에 접근 통제를 위해 <U>HIWARE(HI-TAM)</U>이 적용되어 있어 작업 진행 시 서버 호스트이름 변경이 접근 통제에 영향을 미치지 않음을 확인받았습니다.

#### hostnamectl 을 통한 호스트이름 변경

```sh Terminal
sudo hostnamectl set-hostname tsdb.local

[ec2-user@tsdb ~]$ hostname -f
tsdb.local
```

EC2 인스턴스가 이미 만들어진 경우이므로 서버 접속 후에 hostnamectl 명령어를 통해 호스트이름을 변경할 수 있습니다. 서버 재부팅은 수행하지 않을 계획이므로 [서버 재부팅 시 호스트이름 고정을 위한 설정](https://docs.aws.amazon.com/linux/al2/ug/set-hostname.html)은 진행하지 않았습니다.

#### 사용자 데이터의 cloud-config 로 호스트이름 지정

```yaml user-data
#cloud-config
hostname: tsdb.local
fqdn: tsdb.local
manage_etc_hosts: true
```

만약, 초기 인프라 구성 시 EC2 인스턴스를 생성하는 단계에서 호스트이름을 지정하고 싶다면 위와 같이 사용자 데이터 항목에 <U>[cloud-config](https://serverfault.com/a/787905)</U> 설정을 포함하여 IP 주소 기반이 아닌 원하는 호스트이름을 적용할 수 있습니다. 

#### 호스트이름 변경을 위한 파일 목록

이외의 방법을 찾아보면 EC2 인스턴스의 <U>OS 유형에 따라</U> 아래와 같은 파일을 수정해서 호스트이름을 변경할 수 있음을 알 수 있습니다.

- /etc/hostname
- /etc/hosts
- /etc/sysconfig/network
- /etc/cloud/cloud.cfg

#### 참고 자료

- [Change the hostname of your AL2 instance - Amazon Linux 2](https://docs.aws.amazon.com/linux/al2/ug/set-hostname.html)
- [Prettify your EC2 Hostnames](https://medium.com/@pratheekhegde/prettify-your-ec2-hostnames-1d89f4a7c76d)
- [Customized cloud-init - AL2023](https://docs.aws.amazon.com/linux/al2023/ug/cloud-init.html)