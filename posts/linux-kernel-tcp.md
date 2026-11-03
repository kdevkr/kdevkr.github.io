---
title: 리눅스 커널 TCP 원격 코드 실행 취약점
date: 2026-11-03T20:00+09:00
description: 리눅스 커널 IPv4 TCP 취약점(CVE-2026-98432)의 영향 범위와 배포판 패치 현황, 실무 인프라 점검 기준을 정리한다.
tags:
  - Linux
  - Security
  - Kernel
  - CVE-2026-98432
---

# {{ $frontmatter.title }}

리눅스 커널의 IPv4 TCP 연결 처리 과정에서 Use-After-Free 취약점인 [CVE-2026-98432](https://cve.org/CVERecord?id=CVE-2026-98432) (CVSS 9.8)가 발견됐다.

## IPv4 TCP 연결

취약점 자체는 MPTCP 리스너 유무와 관계없이 커널이 일반 IPv4 TCP 연결 요청을 처리하는 과정에서 발생한다. 별도 인증 없이 조작한 패킷을 보내는 것만으로 원격 코드 실행이나 커널 패닉까지도 일으킬 수 있다.

## MPTCP — Multipath TCP

일반적인 리눅스 서버는 기본적으로 MPTCP가 꺼져 있다. 문제는 **Go 1.24부터 리눅스에서 MPTCP를 기본으로 켜도록** 바뀌었다는 점이다. Go로 만든 Caddy, Tailscale, Loki, Prometheus 같은 도구를 실행 중이라면 관리자가 의도하지 않아도 MPTCP 리스너가 열린다.

앤스로픽(Anthropic)은 Claude 모델로 이 **MPTCP 리스너 환경** 을 파고들어 KASLR을 우회하고 루트 권한의 원격 코드 실행을 실증했다. MPTCP가 꺼진 일반 TCP 서버라도 원격 커널 패닉 가능성이 남아 있어 안심할 수 없다.

## 배포판 패치

우분투 배포판은 [큰 불만과 이탈](https://news.hada.io/topic?id=36468)을 고민 중이나, 사내에서 쓰는 [Amazon Linux](https://aws.amazon.com/ko/security/security-bulletins/2026-160-aws/)와 고객사 환경인 [AlmaLinux](https://almalinux.org/blog/2026-10-30-cve-2026-98432/)는 공식 패치가 나와 있으니 커널을 업데이트하고 서버를 재시작해야 한다.

## 긴급 조치가 불필요한 환경

- **AWS ALB 뒤의 백엔드**: ALB가 앞단에서 TCP 연결을 종단 처리하는 경우
- **사설망 내부 서비스 (Loki, DB 등)**: 외부 TCP 패킷을 직접 받지 않는 경우
- **로컬 맥(macOS)**: 리눅스가 아닌 XNU 커널을 쓰므로 이번 취약점과 무관

## Nginx 또는 배스천 호스트

앞단에 로드밸런서 없이 퍼블릭 서브넷에 직접 노출된 환경이라면 빠른 시일 내에 커널을 업데이트하고 재부팅해야 한다.

```bash [terminal]
# Amazon Linux 2 / AlmaLinux 8
sudo yum update -y kernel && sudo reboot

# Amazon Linux 2023 / AlmaLinux 9, 10
sudo dnf update -y kernel && sudo reboot
```

## 참고 자료

- [GHSA-qp6h-4hvh-qqqc](https://github.com/advisories/GHSA-qp6h-4hvh-qqqc)
- [로그프레소 CVE-2026-98432 보안 권고](https://logpresso.com/ko/blog/2026-10-31-cve-2026-98432-security-advisory)
