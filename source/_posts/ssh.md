---
title: SSH 키 페어 발급 및 원격 호스트 연결하기
date: 2022-07-03
tags:
- SSH
- Key Pair
- RSA
- ED25519
---

개발자 또는 시스템을 운용하는 사람들이 서버 엔지니어가 구축한 원격 호스트에 접속하기 위해서 SSH 프로토콜을 사용한다. 우리가 컴퓨터에 로그인하는 것처럼 간단하게 사용자 이름과 비밀번호를 사용하기도 하며 공개키 기반 인증으로 비밀번호를 대체하거나 2FA(OTP)를 추가적으로 인증하여 보안을 적용하기도 한다. SSH 프로토콜을 사용하는 이유에는 TCP 보안 채널을 연결하고 통신 내용에 대해 암호화하여 패킷을 보호하고 안전하게 서버에 접속하여 통신할 수 있도록 구성하기 위함에 있다. 초보 개발자라면 이 글을 통해서 SSH 키페어를 발급해보고 아마존 웹 서비스의 EC2 인스턴스 또는 깃허브 저장소에 등록하여 원격 호스트에 연결하는 방법을 통해서 SSH에 대해 이해해보기를 바란다.

먼저, 서버 엔지니어가 리눅스 서버 환경을 준비하고 제공해주는 것처럼 내 컴퓨터에 가상의 리눅스 환경을 만들어볼 수 있는데 아래의 두가지 방법 중에서 [OracleVM VirtualBox](https://www.virtualbox.org/)을 사용해서 리눅스 서버를 준비하였다.

- [Install Ubuntu on WSL2 on Windows 10](https://ubuntu.com/tutorials/install-ubuntu-on-wsl2-on-windows-10)
- [How to run Ubuntu Desktop on a virtual machine using VirtualBox](https://ubuntu.com/tutorials/how-to-run-ubuntu-desktop-on-a-virtual-machine-using-virtualbox)

```shell
sudo apt-get update
sudo apt-get install openssh-server
ssh -V
OpenSSH_8.9p1 Ubuntu-3, OpenSSL 3.0.2 15 Mar 2022
```

> VirtualBox로 준비된 우분투 리눅스의 주소는 192.168.0.28 이다.

내 컴퓨터에 설치된 OpenSSH 클라이언트를 사용해서 위 우분투 리눅스에 접속해보도록 하자.

```powershell
PS C:\Users\Mambo> ssh ubuntu@192.168.0.28
ubuntu@192.168.0.28's password:
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-47-generic x86_64)
```

실제 리눅스 서버 그리고 인프라에 따라서 여러가지 네트워크 방화벽 정책이 있을 수 있지만 지금은 내 컴퓨터에 가상 환경으로 우분투 리눅스를 준비했고 어떤 방화벽도 존재하지 않으므로 사용자 이름과 비밀번호만으로 SSH 프로토콜을 사용하여 리눅스 서버에 연결할 수 있었다.

## SSH 키 페어
아마존 웹 서비스의 EC2 인스턴스 또는 깃허브 저장소와 같은 서비스에서는 SSH 프로토콜을 사용해서 서버에 연결할 때에 사용자 이름과 비밀번호를 사용하지 않고 공개키 기반의 키 페어라는 것을 사용한다. 비밀번호 인증보다 공개키 기반 인증을 구성하는 이유는 비밀번호 인증 방식의 경우에는 서버에서 사용되는 비밀번호를 외부로 그대로 대칭키로써 노출하는 것이며 공개키 기반 인증은 서버에서 신뢰할 수 있는 키를 보유한 클라이언트가 서로 다른 키를 가지고 있기 때문이다.

> SSH 키페어가 보안적으로 완벽한 것은 아니므로 SSH 클라이언트가 보유하는 비밀키가 제 3자에게 탈취되지 않도록 잘 관리해야하는 것은 필요하다.

### SSH 키 페어 생성하기
아마존 웹 서비스를 이용하는 개발자라면 웹 콘솔이나 AWS CLI의 create-key-pair 명령을 사용해서 RSA 또는 ED25519 기반의 키 페어를 간단하게 생성할 수 있다. 그러나, 일반적인 경우라면 어떠한 환경에 의존하지 않고 OpenSSH에 포함된 ssh-keygen 도구를 사용하는 방법에 대해서 알아야한다. 앞서, 준비된 우분투 리눅스에 사용자 이름과 비밀번호를 사용해서 접속하였을때 윈도우의 OpenSSH 클라이언트를 이용하였는데 윈도우 10의 선택적 기능을 통해서 간단하게 OpenSSH 클라이언트를 설치할 수 있고 Git Bash를 설치해도 ssh-keygen이 포함되어있으므로 자신이 원하는 방식을 선택해보면 좋을 것 같다.

![윈도우 10의 선택적 기능을 통해서 설치한 OpenSSH 클라이언트](/images/posts/ssh/ssh-01.png)

```powershell
# in Windows Terminal
PS C:\Users\Mambo\keypair> ssh -V
OpenSSH_for_Windows_7.7p1, LibreSSL 2.6.5

# in Git Bash
$ ssh -V
OpenSSH_9.0p1, OpenSSL 1.1.1p  21 Jun 2022
``` 

OpenSSH를 확인했다면 [Generating a new SSH key and adding it to the ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)를 참고해서 ssh-keygen으로 SSH 키페어를 생성하는 방법에 대해서 알아보자. 

#### RSA 키 페어

```powershell
PS C:\Users\Mambo\keypair> ssh-keygen -t rsa -b 4096 -m PEM -f win-mambo-rsa-4096.pem
Generating public/private rsa key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in win-mambo-rsa-4096.pem.
Your public key has been saved in win-mambo-rsa-4096.pem.pub.
The key fingerprint is:
SHA256:F3ECBEjeXszb6ccTJ2EWz9eaxvZoAg4f6F4rU0aDYJY mambo@DESKTOP-OJJ4TB3
The key's randomart image is:
+---[RSA 4096]----+
|   ....+o.o o    |
|   ...Eo   + +  .|
|    .o..+.. + o o|
|     . ..+o= o + |
|      . S.*.o B  |
|       . *o+ * o |
|        .o= = o .|
|       .o. o +   |
|        .o.      |
+----[SHA256]-----+
```

#### ED25519 키 페어
```powershell
PS C:\Users\Mambo\keypair> ssh-keygen -t ed25519 -m PEM -f win-mambo-ed25519.pem
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in win-mambo-ed25519.pem.
Your public key has been saved in win-mambo-ed25519.pem.pub.
The key fingerprint is:
SHA256:oad/A11tVJQFxRIDA63pozCFj/FsTCDh51hALNdFBVU mambo@DESKTOP-OJJ4TB3
The key's randomart image is:
+--[ED25519 256]--+
|   o+o o++++E.+BB|
|  ..+.o     ..oo.|
|   o..oo.  o o . |
|     =o.o.o . o  |
|    . oXSo . .   |
|      +oB +      |
|      .+ o .     |
|       .. o      |
|        .. .     |
+----[SHA256]-----+
```

먼저, RSA 기반의 키 페어를 만들때는 기본적으로 2048 비트 이상으로 만들어지게 되는데 아마존 웹 서비스나 깃허브 저장소에서는 모두 4096 비트를 지원하고 있으며 이를 권장하는 편이다. 그런데, 시스템에서 ED25519 방식을 지원한다면 키 길이에 따른 보안 효율 상 ED25519를 사용하는게 더 나은 선택이 될 수 있다.

### SSH 공개키 등록하기
```powershell
PS C:\Users\Mambo\keypair> scp .\window-mambo.pub ubuntu@192.168.0.28:/home/ubuntu/.ssh/
ubuntu@192.168.0.28's password:
window-mambo.pub                                                                      100%  104    51.6KB/s   00:00

# in ubuntu
ubuntu@ubuntu:~/.ssh$ cat window-mambo.pub >> authorized_keys
```

```powershell
PS C:\Users\Mambo\keypair> ssh -i .\window-mambo.pem ubuntu@192.168.0.28
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-47-generic x86_64
```

이렇게 해서 SSH 키 페어를 발급하고 가상 환경인 우분투 리눅스에 키 페어를 등록하고 SSH로 접속해보았다. 서버 엔지니어는 이러한 과정을 거치게 되면서 최종적으로 개발자인 우리에게 서버에 접속할 사용자 이름과 함께 비밀키를 전달한 것임을 알 수 있다.

## SSH 키 페어 실습
이제 아마존 웹 서비스와 깃허브 저장소 서비스에 SSH 키페어를 등록하고 연결하는 것을 실습해보면서 다시 한번 머리에 숙지하도록 해보자.

### 깃허브 공개키 등록하기
먼저, 사내에서 사용중인 조직 계정으로 등록되어있는 프라이빗 깃허브 리파지토리를 복사해오거나 푸시해야한다면 조직에 속한 내 사용자 계정에 SSH 키 페어를 등록하고 깃허브 서버에 인증할 수 있어야 한다. 사용자 계정 설정 > 액세스 > [SSH and GPG Keys](https://github.com/settings/keys) 메뉴로 진입하면 SSH 키 페어를 등록할 수 있도록 제공하고 있으므로 앞서 만들었던 ED25519 키 페어를 등록하고 깃허브에 접속할 수 있는지 테스트 해보자.

![](/images/posts/ssh/ssh-02.png)

![](/images/posts/ssh/ssh-03.png)

![](/images/posts/ssh/ssh-04.png)

깃허브 서버에 우리가 만든 키 페어를 등록하였으므로 내 컴퓨터의 OpenSSH 클라이언트로 깃허브에 연결할 수 있는지 확인해보자. 깃허브에서는 앞서 리눅스 서버에 연결했던 것 처럼 쉘을 제공하지는 않지만 인증에 성공할 수 있는지 검증해볼 수 있다.

```powershell
PS C:\Users\Mambo\keypair> ssh -i win-mambo-ed25519.pem -T git@github.com
The authenticity of host 'github.com (15.164.81.167)' cannot be established.
ECDSA key fingerprint is SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'github.com,15.164.81.167' (ECDSA) to the list of known hosts.
Hi kdevkr! You've successfully authenticated, but GitHub does not provide shell access.
```

### EC2 공개키 등록하기
아마존 웹 서비스에서 EC2 인스턴스를 실행할 때 키 페어를 자동으로 만들어주기도 하는데 이미 만들어진 SSH 키 페어를 가져와서 등록하고 사용할 수 있도록 지원하고 있다. 내 컴퓨터에서 발급했던 공개키를 가져와서 등록한 후 EC2 인스턴스인 리눅스 서버에 접속할 수 있는지 확인해보자.

![](/images/posts/ssh/ssh-05.png)

```powershell
PS C:\Users\Mambo\keypair> ssh -i win-mambo-ed25519.pem ec2-user@15.164.219.55
The authenticity of host '15.164.219.55 (15.164.219.55)' cannot be established.
ECDSA key fingerprint is SHA256:64Ca/STwUWZkN+ggo5jx6BCvwyhNRcCY5/xjk0SkSjU.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '15.164.219.55' (ECDSA) to the list of known hosts.

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/

[ec2-user@ip-10-0-2-243 ~]$ cat ~/.ssh/authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOy21gZ45To8FNf6hilxV51QqT9JCBjIpVKCRlup7m4D window-mambo
```

> EC2 인스턴스가 퍼블릭 서브넷에 위치하고 22번 포트가 허용되어있다면 SSH 키 페어를 사용하여 EC2 인스턴스에 접속할 수 있는데, 인터넷에서 바로 접근할 수 없는 프라이빗 서브넷에 위치한 EC2 인스턴스에 SSM 에이전트를 구성한다면 아마존 웹 서비스에서 제공하는 [SSM 엔드포인트를 사용해서 SSH 접속이 가능](/connect-private-ec2-instance-using-ssm-agent/)하도록 만들 수 있다.

## 트러블슈팅
지난 [ED25519](/ed25519) 글을 읽어본 분들이라면 윈도우 컴퓨터에서 발급한 ED25519 키 페어를 발급하고 윈도우 환경에서 비밀키를 사용해서 인증을 시도하면 키 형식이 올바르지 않아서 실패하는 문제가 있다는 것을 확인했을 것이다. 지난번 글에서는 단순히 안되는 부분을 언급하고 마무리하였지만 이 문제에 대해서 왜 그런것인가에 대해 궁금해졌고 [aws-cli/discussions/7074](https://github.com/aws/aws-cli/discussions/7074)로 관련 문제에 대해서 질문을 통해서 원인을 찾게 되었다.

![](/images/posts/ssh/ssh-06.png)

윈도우 환경에서 AWS CLI를 통해서 키 페어를 발급하고나서 비밀키 파일에 대해서 에디터로 열어보면 위와 같이 UTF-16LE 인코딩 형식과 CRLF 개행 방식으로 되어있는 것을 확인할 수 있었다. OpenSSH의 ssh-keygen으로 만들어지는 키페어 파일을 살펴보면 UTF-8과 LF로 만들어지는데 Git Bash에 포함되어있는 dos2unix라는 도구를 통해서 UTF-16LE로 되어있는 인코딩 형식을 UTF-8로 변경해보고 시도해본결과 정상적으로 접속을 수행할 수 있었다.

```sh
$ dos2unix aws-mambo.pem
dos2unix: converting UTF-16LE file aws-mambo.pem to UTF-8 Unix format...
```

```powershell
PS C:\Users\Mambo\keypair> ssh -i aws-mambo.pem ec2-user@3.34.188.47

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-10-0-2-42 ~]$
```

또한, 윈도우 터미널이 아니라 Git Bash에서 시도해본 결과 다음과 같이 다시한번 키 형식이 올바르지 않다는 메시지가 발생했는데 이번에는 CRLF로 되어있던 개행 형식을 LF로 변경하게되면 성공적으로 접속할 수 있음을 확인했다.

```shell
$ ssh -i aws-mambo.pem ec2-user@3.34.188.47
Load key "aws-mambo.pem": invalid format
ec2-user@3.34.188.47: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

```shell
$ ssh -i aws-mambo.pem ec2-user@3.34.188.47

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-10-0-2-42 ~]$
```

실무에서 SSH 키 페어를 전달받았는데 SSH 접속이 불가능하다면 전달받은 키 페어 파일의 인코딩 형식과 개행 형식을 살펴보고 위와 같이 변경해서 시도해보기를 추천한다. 

> 실무에서는 조직 혹은 인프라 환경마다 다양한 방식으로 서버에 접속할 수 있는 방법을 제한하는데요. 배스천 호스트로 우선 접속하거나서 각 서버마다 정해진 사용자 이름과 비밀번호를 사용하여 이동해야하거나 심지어는 SSH 키 페어 인증 뿐만 아니라 OTP를 통한 2FA 인증을 요구하도록 구성하기도 합니다. 저는 서버 엔지니어가 아니므로 SSH 연결 시 2FA을 구성하는 것은 모르기에 이 부분에 대해서는 별도로 찾아보아야겠습니다.

## 참고  
- [Connect to your Linux instance using SSH](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html)  
- [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)  
