---
title: Hardening SSH
date: 2022-10-26
tags:
- SSH
- MFA
---

대부분의 회사에서 AWS 콘솔 환경에 로그인할 수 있는 IAM 계정에는 MFA(Multi Factor Authentication) 활성화를 반드시 설정하도록 가이드한다. 이와 함께 배스천 호스트에 대한 SSH 접속 시 인터랙티브 세션으로 연결되는 사용자에 대한 모든 명령어를 기록하도록 설정하거나 [Google Authenticator PAM module](https://github.com/google/google-authenticator-libpam)를 통해서 TOTP 기반의 2FA를 적용하도록 구성하기도 한다. 아래의 링크들을 참고하면 아마존 웹 서비스 환경에서 프라이빗 서브넷에 위치하는 인스턴스들에 접근하기 위해서 보다 보안적인 배스천 호스트를 구성하기 위한 방법을 학습할 수 있다.

- [How to Record SSH Sessions Established Through a Bastion Host](https://aws.amazon.com/ko/blogs/security/how-to-record-ssh-sessions-established-through-a-bastion-host/)
- [Hardening SSH using AWS Bastion and MFA](https://medium.com/kaodim-engineering/hardening-ssh-using-aws-bastion-and-mfa-45d491288872)

```shell
# SCP 명령과 같이 인터랙티브 세션이 아닌 경우는 아래와 같은 오류 메시지를 제공한다.
This bastion supports interactive sessions only. Do not supply a command
```

#### SSH with MFA
우분투 리눅스 배포판에 SSH와 함께 TOTP를 적용하여 MFA를 적용하는 방법을 따라해보고자 한다. 먼저, 사용중인 리눅스 배포판에 따라 패키지 도구를 통해 Google Authenticator PAM을 아래와 같이 설치한다.

```shell
# Google Authenticator PAM 설치
$ sudo apt install libpam-google-authenticator

# Google Authenticator PAM를 SSH PAM 정책에 등록
$ sudo vi /etc/pam.d/sshd
@include common-password

auth required pam_google_authenticator.so
auth required pam_permit.so

# ChallengeResponseAuthentication 또는 KbdInteractiveAuthentication를 yes로 변경
$ sudo vi /etc/ssh/sshd_config
KbdInteractiveAuthentication yes

# SSH 서비스를 재시작
$ sudo systemctl restart sshd.service
```

> 사용자 및 비밀번호 기반의 SSH 연결을 위해서 다른 글들과는 다르게 Authentication Methods는 지정하지 않았습니다.

```shell
$ google-authenticator -t -d -f -r 3 -R 30 -w 3
Warning: pasting the following URL into your browser exposes the OTP secret to Google:
  https://www.google.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/ubuntu@ubuntu%3Fsecret%3DWBVCRGPZZEMRH6LMCHHHS4W6Y4%26issuer%3Dubuntu
Your new secret key is: WBVCRGPZZEMRH6LMCHHHS4W6Y4
Enter code from app (-1 to skip): 950725
```

```powershell
# C:/Users/Mambo/.ssh/config
Host 192.168.0.29
    HostName 192.168.0.29
    PasswordAuthentication yes
    ChallengeResponseAuthentication yes
    PreferredAuthentications keyboard-interactive
```

> SSH 클라이언트 설정 파일에 접속하려는 호스트에 대해 PasswordAuthentication 및  ChallengeResponseAuthentication를 적용해야 비밀번호 입력 후 TOTP 코드를 입력할 수 있습니다.

```shell
PS C:\Users\Mambo> ssh ubuntu@192.168.0.29
Password: ubuntu
Verification code: 994052

NOTE: This SSH session will be recorded
AUDIT KEY: 2022-10-27_08-04-04_ubuntu

ubuntu@ubuntu:~$
```

[How To Harden OpenSSH on Ubuntu 20.04](https://www.digitalocean.com/community/tutorials/how-to-harden-openssh-on-ubuntu-20-04)와 같은 글을 참고하여 더욱 더 강화된 SSH를 구성할 수 있습니다.