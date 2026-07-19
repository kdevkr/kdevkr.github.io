---
title: VM 가상화 기술 이해하기
date: 2026-07-19T17:00+09:00
description: 가상화 기술과 컨테이너 기반 기술에 대해서 다룹니다.
tags:
    - hypervisor
    - container
---

# VM 가상화 기술 이해하기

이전 글인 [기획자도 알아야할 IT 인프라 기초](/posts/beginner-it-infrastructure) 에서 현대 IT 인프라의 전반적인 지식을 간단하게 살펴보았는데요. 이번 글에서는 인프라의 기초를 담당하는 ==가상 머신(VM) 가상화 기술== 과 그 핵심인 [하이퍼바이저](https://aws.amazon.com/ko/what-is/hypervisor/) 와 함께 VM 가상화 기술과는 다른 컨테이너 기술에 대해서 알아보려고 해요.

## 하이퍼바이저(Hypervisor)

==하이퍼바이저(Hypervisor)== 는 하드웨어를 가상화한 기술이라고 생각하면 돼요. 하이퍼바이저가 하드웨어 위에서 어떻게 실행되는지에 따라 크게 두 가지 유형으로 나눌 수 있어요.

### 네이티브(Native) 하이퍼바이저

물리 하드웨어에 바로 설치해서 실행되는 방식으로, 호스트 운영체제 없이 직접 하드웨어를 제어하기 때문에 ==오버헤드가 적고 리소스 관리가 효율적== 이라 주로 엔터프라이즈 서버 환경 및 클라우드 서비스 인프라에서 사용되고 있어요.

- VMware ESXi
- [KVM](https://www.redhat.com/ko/topics/virtualization/what-is-KVM)
- Xen
- [Microsoft Hyper-V](https://learn.microsoft.com/ko-kr/windows-server/virtualization/hyper-v/architecture)

예를 들어, [Amazon EC2는 Xen 및 Nitro 하이퍼바이저를 지원](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/instance-types.html#instance-hypervisor-type)하고 있어요. 구형 세대 인스턴스는 **Xen 하이퍼바이저** 방식이고, 신규 세대 인스턴스들은 베어메탈 하드웨어에 가까운 성능을 제공하기 위해서 [**Nitro System** 카드를 사용하는 KVM 기반 하이퍼바이저](https://aws.amazon.com/ko/ec2/nitro/)를 자체적으로 개발해서 사용하고 있대요.

### 호스트(Hosted) 하이퍼바이저

기존의 호스트 운영체제(예: Windows, macOS, Linux) 위에 애플리케이션 형태로 설치되어 실행되는 구조예요. 설치와 구성이 간편하지만 ==상대적으로 오버헤드가 커서== 개인 개발 환경이나 테스트 용도로 주로 쓰이고 있어요.

- Oracle VirtualBox
- VMware Workstation
- Parallels Desktop

## 컨테이너 기반 가상화 기술

기존 가상 머신과 다르게 [컨테이너 기반 가상화 기술](https://aws.amazon.com/ko/compare/the-difference-between-containers-and-virtual-machines/)은 ==운영체제(OS) 커널을 공유== 해요. 하드웨어를 가상화하지 않기 때문에 가벼워서 마이크로서비스 아키텍처에 적합하여 컨테이너 기술이 발달하게 되었어요. 지금은 쿠버네티스를 관리하는 [PaaS 플랫폼을 제공](https://k-paas.or.kr/)하는 회사도 많은데 이 컨테이너 기술의 발전이 클라우드 서비스 환경 발전을 이루어낸 게 아니에요.

![클라우드 가상 머신 위 컨테이너 런타임 계층 구조](/images/posts/understanding-vm-virtualization/002.svg)

다시 정리하면, 현재 대부분의 IT 인프라는 클라우드 회사에서 **하이퍼바이저 기반으로 제공하는 가상 머신** 위에 Docker, containerd, CRI-O 와 같은 **컨테이너 런타임** 으로 애플리케이션을 구동하고 있다고 생각하면 돼요.
