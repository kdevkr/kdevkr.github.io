---
title: Amazon Linux 2023을 VirtualBox에서 실행하기
date: 2024-01-29T23:00+0900
tags:
- Oracle VirtualBox
- AL2023
---

[Amazon Linux 2를 VirtualBox에서 실행하기](/amazonlinux2-virtualbox/)처럼 Amazon Linux 2023을 VM 가상머신으로 실행해보자. 

#### Amazon Linux 2023 가상 머신 이미지 다운로드

- [seed.io 부트 이미지](https://drive.google.com/file/d/17iBVLBLLJahQDb-3kgsWRCh72hzt1FIp/view?usp=sharing)
- [Amazon Linux 2023 LTS 2023.3.20240122.0 kernel-6.1 x86_64 KVM image](https://cdn.amazonlinux.com/al2023/os-images/2023.3.20240122.0/kvm/)

#### 가상 머신 만들기 및 실행

![1. 가상 머신 만들기](/images/posts/amazonlinux2023-virtualbox/01.png)

새로 만들기 버튼을 눌러 가상 머신을 만들자. 리눅스 유형에 대한 운영 체제 종류는 공식 문서에 나와있지 않으나 Fedora 기반으로 알려져있으므로 Fedora (64-bit)를 선택했다. 그리고 가상 디스크는 미리 정의된 가상 머신으로 추가해야 한다. 위 스크린샷에 나와있듯이 [Amazon Linux 2023 가상 머신 이미지](https://cdn.amazonlinux.com/al2023/os-images/2023.3.20240122.0/) 페이지에서 다운로드 받은 KVM 이미지를 선택하면 된다.

![2. 부팅 이미지 디스크 추가](/images/posts/amazonlinux2023-virtualbox/02.png)

부팅 디스크 이미지 파일은 이전 [Amazon Linux 2를 VirtualBox에서 실행하기](/amazonlinux2-virtualbox/) 글에서 공유한 seed.iso 파일을 그대로 사용하도록 하자. 사용자 이름은 ec2-user 이며 초기 비밀번호는 amazon 이다.

![3. 사용자 계정 구성](/images/posts/amazonlinux2023-virtualbox/03.png)

![4. ec2-user 로그인](/images/posts/amazonlinux2023-virtualbox/04.png)

ec2-user 및 amazon 을 입력하면 Amazon Linux 2 와는 다르게 초기 비밀번호 변경을 요구한다. 위 스크린샷처럼 신규 비밀번호를 입력하고 로그인을 완료하자. 또한, 사용자 계정 구성이 올바르지 않게 될 수 있어 부팅 디스크로 사용한 seed.iso를 해제하지 않는 것을 권장한다.