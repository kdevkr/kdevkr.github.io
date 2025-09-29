---
title: Amazon Linux 2를 VirtualBox에서 실행하기
date: 2023-10-04T22:00+0900
tags:
- AL2
- Oracle VirtualBox
---

[Amazon Linux 2를 온프레미스 가상 머신으로 실행](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/amazon-linux-2-virtual-machine.html) 문서를 참고하여 Amazon Linux 2 가상 머신 이미지를 통해 온프레미스 개발 및 테스트를 위한 환경을 실행할 수 있다. 참고로 AL2을 대체하는 Amazon Linux 2023에 대해서는 [아직 가상 머신 이미지를 제공하지 않는](https://github.com/amazonlinux/amazon-linux-2023/issues/102) 것 같다. 그래서 AL2이 2025-06-30 일자로 EOL이 되더라도 VirtualBox에서 Amazon Linux 2를 실행해보고자 한다.

#### Amazon Linux 2 가상 머신 이미지 다운로드

우분투와 같이 Amazon Linux 2에 대한 설치 파일을 제공하는 것이 아니므로 부팅을 위한 이미지와 미리 정의된 가상 머신 이미지를 다운받아야 한다.

- [seed.iso 부팅 이미지](https://drive.google.com/file/d/17iBVLBLLJahQDb-3kgsWRCh72hzt1FIp/view?usp=sharing)  
- [Amazon Linux 2 LTS 2.0.20230926.0 x86_64 VirtualBox image](https://cdn.amazonlinux.com/os-images/2.0.20230926.0/virtualbox/amzn2-virtualbox-2.0.20230926.0-x86_64.xfs.gpt.vdi)

#### 가상 머신 만들기 및 실행

![1. 가상 머신 만들기](/images/posts/amazonlinux2-virtualbox/01.png)  

새로 만들기 버튼을 눌러 가상 머신을 만듭니다. 리눅스 유형에 대한 운영 체제 종류는 공식 문서에 나와있는대로 Red Hat (64-bit)를 선택하자. 그리고 가상 디스크는 미리 정의된 가상 머신 이미지로 추가해야 한다. 위 스크린샷에 나와있는 듯이 [Amazon Linux 2 가상 머신 이미지](https://cdn.amazonlinux.com/os-images/latest/) 페이지에서 다운로드 받은 이미지를 선택하면 된다.

![2. 부팅 이미지 디스크 추가](/images/posts/amazonlinux2-virtualbox/02.png)  

가상 머신을 실행하기 전에 호스트 이름과 사용자 계정 정의를 위한 부팅 이미지를 가상 광학 디스크에 추가해야한다. Amazon Linux 2 가상 머신 이미지 페이지에서 다운받을 수 있는 seed.iso 파일이 `VERR_NOT_SUPPORTED` 사유로 가상 광학 디스크에 추가할 수 없을 수 있는데 본 글에서 제공하는 seed.iso 부팅 이미지 링크를 통해 `기본 사용자(ec2-user:amazon)`만 정의된 파일을 다운로드할 수 있으니 참고하도록 하자.

※ 본 글에서 제공하는 seed.iso 파일은 아래와 같이 정의되어있다.

```yaml user-data
#cloud-config
#vim:syntax=yaml
users:
  - default
chpasswd:
  list: |
    ec2-user:amazon

```


```yaml meta-data
local-hostname: amazonlinux
```

> 부팅 이미지 파일은 MacOS 환경에서 hdiutil 도구를 사용하여 생성하였다.
> $ hdiutil makehybrid -o seed.iso -hfs -joliet -iso -default-volume-name cidata seedconfig/

![3. 사용자 계정 구성](/images/posts/amazonlinux2-virtualbox/03.png)  

가상 머신을 실행하고 맨처음 기본 사용자 계정인 ec2-user를 입력하면 사용자 계정에 대한 구성을 수행한다.

![4. ec2-user 로그인](/images/posts/amazonlinux2-virtualbox/04.png)  

다시한번 로그인 화면이 출력되면 ec2-user와 amazon을 입력하면 위와 같이 Amazon Linux 2에 대한 로고를 확인할 수 있다. 처음 로그인에 성공했다면 그 이후에는 부팅 이미지가 필요하지 않다. 가상 머신을 종료하고 부팅 이미지를 가상 광학 디스크에서 제거하자.

