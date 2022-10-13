---
title: 우분투 리눅스 서버 환경 구축하기
date: 2022-10-14
tags:
- Ubuntu
- WSL2
- VirtualBox
---

일반적으로 웹 개발자는 리눅스 서버 및 인프라 환경을 직접적으로 구축할 일은 없다고 말합니다. 그러나, 조직 규모에 따라 인프라 팀 또는 서버 엔지니어가 인프라를 구성할수도 있고 웹 개발자가 클라우드 서비스를 이용해서 간단하게 리눅스 서버를 실행할 수도 있습니다. 이전 회사의 서버 엔지니어이셨던 부장님이 현재 조직에 오기전까지는 사내 개발자들이 인프라를 작게나마 담당하고 있었습니다.

사내 인프라 환경을 마음껏 사용할 수 있는 조직이 아니고서야 리눅스 서버를 쉽게 실행해볼 수 있는 환경은 없기 때문에 웹 개발자가 로컬 컴퓨터에 가상 머신을 통해 우분투와 같은 리눅스 배포판을 설치할 수 있어야하며 이를 통해 리눅스 서버에 대한 경험을 학습해볼 수 있습니다. 실무에서 어느 정도 규모가 있는 기업에서는 CentOS와 같은 RHEL 기반의 리눅스 배포판을 사용하는 경우가 많은데 데비안 계열의 우분투 리눅스도 많이 발전하여 이제는 안정성 있는 LTS 버전을 제공하므로 최근에는 많이 활용되고 있습니다.

> CentOS EOL 문제로 인하여 실제로 CentOS 대체제 중 하나인 [AlmaLinux](https://almalinux.org/)를 사용하여 인프라를 구성한 고객 환경도 있으며 일부 산업 업계에서는 리눅스 보다는 윈도우 서버를 사용하게 되는 환경도 존재합니다. 현재 조직에서 사용하는 시계열 데이터베이스도 [AWS 마켓플레이스에서 우분투 이미지로 제공](https://aws.amazon.com/marketplace/pp/prodview-pscy5dov2ftms#pdp-overview)하고 있습니다.

아무튼 많은 웹 개발자들도 집에서는 윈도우 OS가 설치된 컴퓨터를 사용하기 때문에 윈도우 10에서 [Oracle VM VirtualBox](https://www.virtualbox.org/) 또는 [WSL2(Windows Subsystem for Linux 2)](https://learn.microsoft.com/ko-kr/windows/wsl/about)를 사용하여 리눅스 서버 환경을 구축할 수 있다고 말할 수 있습니다. 단일 우분투 서버가 필요하다면 WSL2를 활성화하고 간단하게 우분투 리눅스를 실행할 수 있지만 다양한 우분투 버전 또는 다수의 우분투 리눅스가 필요하다고 생각된다면 가상 머신을 활용하는게 좋습니다.

#### WSL2
[Microsoft Store](https://aka.ms/wslstore)에서 다양한 리눅스 배포판을 설치할 수 있는데 CentOS는 인터넷 검색을 통해서 별도로 설치해야하므로 본 글의 목표인 데비안 계열의 [우분투 리눅스 배포판](https://www.microsoft.com/store/productId/9PN20MSR04DW)을 선택하여 설치하기를 바랍니다. WSL2를 설치하기 전에 [윈도우 터미널](https://www.microsoft.com/store/productId/9N0DX20HK701)을 먼저 설치하여 사용하는 것을 추천하며 컴퓨터에 윈도우 터미널을 설치하였다면 관리자 권한으로 실행한 후 아래의 명령어를 통해서 Windows System for Linux 기능을 활성화 해야합니다.

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

![](/images/posts/ubuntu-linux/01.png)

위 명령어를 수행하여 WSL 기능을 활성화했다면 [WSL2 리눅스 커널](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)을 다운로드하여 설치한 후 관리자 권한의 윈도우 터미널을 열고 WSL2 버전을 선택하면 끝입니다.

```powershell
wsl --set-default-version 2
```

![](/images/posts/ubuntu-linux/02.png)

> 만약, WSL2를 사용하여 우분투 리눅스 배포판을 실행하는데 실패하였다면 다음의 가이드 문서를 따르기를 바란다.
> [Windows 터미널 설치 및 설정 시작](https://learn.microsoft.com/ko-kr/windows/terminal/install)
> [WSL을 사용하여 Windows에 Linux 설치](https://learn.microsoft.com/ko-kr/windows/wsl/install?source=recommendations)
> [Install Ubuntu on WSL2 on Windows 10](https://ubuntu.com/tutorials/install-ubuntu-on-wsl2-on-windows-10#1-overview)

#### VirtualBox
WSL2를 사용해도 다양한 버전의 우분투 리눅스를 설치할 수 있지만 버츄얼박스와 같은 가상 머신으로 기본적인 리눅스 설정이 완료된 클린 버전을 만들어두고 이미지를 복제하여 리눅스 서버를 실행하는게 학습하는데 도움이 된다고 생각합니다. 먼저, [윈도우용 버츄얼박스](https://www.virtualbox.org/wiki/Downloads)와 함께 [우분투 서버 이미지](https://ubuntu.com/download/server)에 대한 ISO 파일을 다운로드하여 준비합니다.

![](/images/posts/ubuntu-linux/03.png)
![](/images/posts/ubuntu-linux/04.png)
![](/images/posts/ubuntu-linux/05.png)

> 가상 머신으로 우분투를 설치하는 경우에는 기본적인 데스크톱 이미지 대신에 서버 이미지를 사용하는 것이 좋습니다. 일반적이지 않은 폐쇄망 환경(아이피를 오픈하지 않는)에서 원격 데스크톱 환경이 필요한 경우에는 데스크톱을 설치하는 경우도 있는데 원격 데스크톱 연결에 대한 여러가지 문제가 있기 때문에 이러한 환경에서는 윈도우 서버를 사용하게 되는 편입니다.

우분투 리눅스를 실행하기 위한 가상 머신은 최소한 메모리 1GB, 디스크 볼륨 30GB 로 선택하는 것을 추천하는데 이는 AWS 클라우드 서비스에서 제공하는 프리티어 사양과 동일하기 때문입니다. 또한 공유기를 사용하여 로컬 아이피를 할당받아 컴퓨터를 사용하고 있다면 네트워크 유형을 NAT가 아닌 호스트 어댑터로 변경하여 공유기에서 별도의 IP를 할당받도록 하는게 좋습니다.

![](/images/posts/ubuntu-linux/06.png)

```powershell
PS C:\Users\Mambo> ssh ubuntu@192.168.0.31
The authenticity of host '192.168.0.31 (192.168.0.31)' can't be established.
ECDSA key fingerprint is SHA256:BJ3p2IZBDv3Im2I1Nsfj93KPSQcB4SAIxG9bOEbTPCU.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '192.168.0.31' (ECDSA) to the list of known hosts.
ubuntu@192.168.0.31's password:
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-50-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Thu Oct 13 01:11:59 AM UTC 2022

  System load:  0.6376953125       Processes:               104
  Usage of /:   33.0% of 13.67GB   Users logged in:         0
  Memory usage: 22%                IPv4 address for enp0s3: 192.168.0.31
  Swap usage:   0%


39 updates can be applied immediately.
To see these additional updates run: apt list --upgradable


Last login: Thu Oct 13 01:12:00 2022
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

ubuntu@ubuntu:~$
```

리눅스 서버가 준비되었다면 위와 같이 로컬 컴퓨터에서 SSH 접속을 시도해볼 수 있습니다. 언급하지 않은 부분이기에 우분투 리눅스를 설치할 때 OpenSSH를 함께 설치하는 옵션을 선택하지 않았다면 가상 머신 콘솔창에서 OpenSSH 서버 패키지를 설치해보는 경험을 할 수도 있습니다. 이제 우분투 리눅스를 어떻게 활용할 수 있는가는 우리가 무엇을 하고 싶은가에 달려있습니다. 

감사합니다.

