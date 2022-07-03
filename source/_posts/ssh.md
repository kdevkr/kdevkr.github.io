---
title: SSH 키 페어 발급 및 원격 호스트 연결하기
date: 2022-07-03
tags:
- SSH
- Key Pair
- RSA
- ED25519
---

일반적으로 (원격 호스트인) 서버에 접속하기 위해서 사용자 계정과 비밀번호를 공유하기보다는 SSH 프로토콜을 사용하여 TCP 보안 채널을 연결하고 통신 내용에 대한 암호화를 통해 패킷을 보호하고 안전하게 서버에 접속해서 통신할 수 있도록 구성합니다. 오늘은 SSH 프로토콜을 통해 서버에 접속하는 과정에 대해서 정리해보면서 그저 서버 접속을 위한 PEM 파일을 받아서 접속할 뿐이었던 부분을 머리속에서 정리해보고자 합니다. 저와 함께 SSH 키 페어를 발급해보고 발급된 키 페어를 아마존 웹 서비스의 EC2 인스턴스 또는 깃허브 저장소에 등록한 후 원격 호스트에 연결하여 성공적으로 인증할 수 있는지를 확인해보시기 바랍니다.

## SSH 키 페어
SSH 프로토콜을 사용하기 위해서는 SSH 키 페어라고 하는 공개키와 비밀키(퍼블릭 키와 프라이빗 키)로 구성된 키 페어를 만들고나서 서버에서는 공개키를 보유하도록 하고 서버에 접속 또는 인증하고자하는 클라이언트는 비밀키를 가지고 있음으로써 공개키 기반의 인증을 수행하여 보안 채널을 연결하게 됩니다. SSH 프로토콜을 사용해서 TCP 보안 채널을 연결하는 과정에 대해서는 본 글에서 다루고자하는 부분이 아니므로 자세히 설명된 다른 글들을 찾아보시기 바랍니다.

### SSH 키 페어 생성하기
아마존 웹 서비스를 이용하고 있는 개발자라면 웹 콘솔이나 AWS CLI의 create-key-pair 명령을 사용해서 RSA 또는 ED25519 기반의 키 페어를 생성할 수도 있습니다만, 일반적인 개발자라면 어떤 환경에 의존하지 않는 OpenSSH에 포함되는 ssh-keygen 도구를 사용해야 합니다. 자신이 사용하는 운영체제에 따라서 기본으로 포함된 OpenSSH를 사용하거나 설치하면 됩니다. 만약 윈도우 10을 사용하고 있다면 Git Bash를 설치하면 ssh-keygen이 포함되어있고 선택적 기능을 통해서 OpenSSH 클라이언트를 쉽게 설치할 수 있습니다.

![윈도우 10의 선택적 기능을 통해서 설치한 OpenSSH 클라이언트](/images/posts/ssh/ssh-01.png)

```powershell
# in Windows Terminal
PS C:\Users\Mambo\keypair> ssh -V
OpenSSH_for_Windows_7.7p1, LibreSSL 2.6.5

# in Git Bash
$ ssh -V
OpenSSH_9.0p1, OpenSSL 1.1.1p  21 Jun 2022
``` 

아무튼 OpenSSH를 확인했다면 [Generating a new SSH key and adding it to the ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)와 같은 문서를 참고해서 ssh-keygen으로 SSH 키 페어를 생성해보도록 하겠습니다.

먼저, RSA 알고리즘 기반의 키 페어를 만들때는 기본적으로 2048 비트 이상으로 만들어지게 되며 이 글을 작성하는 시점에서는 아마존 웹 서비스나 깃허브 저장소 모두 4096 비트를 지원하고 권장하는 편입니다.

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

4096 비트를 가지는 RSA 키 페어를 만들게되면 키의 길이가 너무 길어지게 되므로 ED25519 알고리즘을 지원하는 원격 호스트라면 ED25519 기반의 키 페어를 생성하고 사용하는게 더 좋습니다. 지난 [ed25519](/ed25519/) 글을 읽어보시면 RSA 보다 ED25519를 사용하게 되는 이유에 대해서 알아가실 수 있습니다.

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

### 깃허브 공개키 등록하기
사용자 계정 설정 > 액세스 > [SSH and GPG Keys](https://github.com/settings/keys) 메뉴로 진입하면 SSH 키를 등록할 수 있는 기능을 제공하고 있습니다. 앞서 만들었던 ED25519 키 페어를 등록하고 깃허브에 접속할 수 있는지 테스트 해보겠습니다.

![](/images/posts/ssh/ssh-02.png)

![](/images/posts/ssh/ssh-03.png)

![](/images/posts/ssh/ssh-04.png)

자 이제 깃허브에 등록한 공개키에 대한 비밀키를 사용해서 SSH 접속을 시도해보면 어떻게 될까요?

```powershell
PS C:\Users\Mambo\keypair> ssh -i win-mambo-ed25519.pem -T git@github.com
The authenticity of host 'github.com (15.164.81.167)' cannot be established.
ECDSA key fingerprint is SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'github.com,15.164.81.167' (ECDSA) to the list of known hosts.
Hi kdevkr! You've successfully authenticated, but GitHub does not provide shell access.
```

### EC2 공개키 등록하기
아마존 웹 서비스에서 EC2 인스턴스를 실행할 때 키 페어를 만들지 않아도 이미 만들어진 SSH 키 페어를 가져와서 등록할 수 있도록 제공하고 있습니다.

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

퍼블릭 서브넷에 위치한 EC2 인스턴스에 SSH 접속이 가능함을 확인했습니다. 

## AWS ED25519 Invalid Format
지난 [ED25519](/ed25519) 글을 잘 읽어보신 분들이라면 아마존 웹 서비스의 웹 콘솔이나 AWS CLI를 통해서 ED25519 키 페어를 발급하고 윈도우 환경에서 비밀키를 사용해서 인증을 시도하면 키 형식이 올바르지 않는 문제가 있다는 것을 확인할 수 있었을텐데요. 지난 글에서는 단순히 안되는 것 같다고 마무리 하였지만 이 문제에 대해서 왜 그런것인가에 대해서 궁금해져서 [aws-cli/discussions/7074](https://github.com/aws/aws-cli/discussions/7074)로 관련 문제에 대해서 질문을 하였고 원인을 찾게 되었습니다.

![](/images/posts/ssh/ssh-06.png)

윈도우 환경에서 AWS CLI를 통해 키 페어를 발급하고 비밀키를 파일로 만들면 위와 같이 UTF-16LE 인코딩 형식과 CRLF 개행 방식으로 되어있는 것을 확인할 수 있었습니다. OpenSSH의 ssh-keygen으로 만들어지는 키페어 파일을 UTF-8과 LF로 만들어집니다. Git Bash에 포함되어있는 dos2unix라는 도구를 통해서 UTF-16LE로 되어있는 인코딩 형식을 UTF-8로 변경해보고 시도해보았습니다.

```sh
$ dos2unix aws-mambo.pem
dos2unix: converting UTF-16LE file aws-mambo.pem to UTF-8 Unix format...
```

윈도우 터미널을 통해서 UTF-16LE 및 CRLF로 되어있는 비밀키를 사용하면 올바르지 않았던 키 형식 문제가 해결되었고 다음과 같이 성공적으로 접속되었습니다.

```powershell
PS C:\Users\Mambo\keypair> ssh -i aws-mambo.pem ec2-user@3.34.188.47

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-10-0-2-42 ~]$
```

이 상태에서 윈도우 터미널이 아닌 Git Bash에서도 시도를 하면 다음과 같이 다시 키 형식이 올바르지 않다는 문제가 발생하게 됩니다.

```sh
$ ssh -i aws-mambo.pem ec2-user@3.34.188.47
Load key "aws-mambo.pem": invalid format
ec2-user@3.34.188.47: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

이때는 CRLF로 되어있던 개행 형식을 LF로 변경하면 성공적으로 접속됨을 확인할 수 있습니다.
```sh
$ ssh -i aws-mambo.pem ec2-user@3.34.188.47

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-10-0-2-42 ~]$
```

이렇게 SSH 키 페어를 발급하고 원격 호스트에 연결하는 과정에 대해서 알아보았고 지난 글에서 경험했던 문제에 대해서 다시한번 살펴보며 원인을 찾아보는 경험도 해보았습니다. 감사합니다.

## 참고  
- [Connect to your Linux instance using SSH](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html)  
- [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)  
