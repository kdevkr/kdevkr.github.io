---
title: 개발자가 알아보는 VPN
date: 2025-01-16T23:00+09:00
tags:
- OpenVPN
- IPSec/IKEv2
- WireGuard
---

개발자 입장에서 [VPN](https://docs.tosspayments.com/resources/glossary/vpn)은 재택 근무 시 암호화 기술을 통해 사내 네트워크에 접근하기 위해서 사용되는 기술입니다. 널널한 개발자님의 [개발자는 알아야 할 VPN 작동원리](https://www.youtube.com/watch?v=Q0EgiHhw-E4)처럼 여러가지 VPN 프로토콜 중 많이 사용되는 OpenVPN, IPSec, WireGuard에 대해서 간단하게나마 알아보도록 하겠습니다. 

#### OpenVPN

<U>SSL VPN</U>으로 구글에 __임직원 VPN__ 키워드로 검색을 해보면 [현대자동차 그룹](https://vpn.hyundai.net), [LG화학](https://global.lgchem.com/), [LG헬로비전](https://intravpn.lghv.net/) 그리고 [고려대학교](https://vpn.korea.ac.kr/) 등에서 사외 접속을 위한 VPN 사이트를 임직원을 위해 제공하는 것을 알 수 있습니다. 개인적인 경험으로는 맥에서 OpenVPN 클라이언트로 [Tunnelblick](https://tunnelblick.net/)를 사용했던 것으로 기억합니다. AWS 인프라에서는 SSL VPN으로 AWS Client VPN을 제공하고 있으나 비용적인 문제로 인하여 대부분의 기업에서는 도입을 포기하지 않을까 생각됩니다.

#### IPSec/IKEv2

IKEv2 기반 VPN은 고객사 사이트 접근을 위하여 허용된 아이피를 위해서 사용했던 경험은 있으나 <U>사이트 간 연결(Site to Site)을 위한 VPN</U>은 사용해본 적이 없습니다. IKEv2 VPN 에서는 사설 인증서 등록 과정이 필요하므로 신입 개발자 입장에서는 설정이 생각보다 어려웠지 않았나 싶습니다. AWS 인프라에서는 VPC 에서 온프레미스 네트워크 접근을 위해서 <U>AWS Site to Site VPN</U>을 제공하는 것 같은데 아무래도 사용해볼 기회는 없을 것 같습니다.

#### WireGuard

현재 사용중인 VPN 방식으로 [wg-easy](https://github.com/wg-easy/wg-easy)를 통해 UI 기반의 WireGuard VPN 서버를 도커 이미지를 활용해 구축할 수 있는 것 같습니다. [인프랩](https://tech.inflab.com/20241031-vpn-history/)과 같은 스타트업에서는 WireGuard 기반 VPN을 위하여 [Tailscale](https://tailscale.com/)를 도입하는 것으로 보이네요. WireGuard VPN 클라이언트 설정은 생각보다 간단하니 한번 알아보도록 하겠습니다. 일단 클라이언트 구성 파일은 인터페이스(Interface)와 피어(Peer) 블록으로 분리되어 설정하게 됩니다.

```sh
[Interface]
PrivateKey = oAE3A26JxwFujPlffL7ZxjEt46CooEye4VQMeN4wGFQ=
Address = 10.x.x.x/24
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = jtc6uT4caKpznwM3UnlSIBnzYrIW2huOnFlpHwBRKEc=
AllowedIPs = 125.x.x.x/24, 10.10.x.x/23
Endpoint = 125.x.x.x:51820
PersistentKeepalive = 25
```

##### Split Tunnel

WireGuard VPN 설정 시 전체 터널링(Full Tunnel)과 스플릿 터널링(Split Tunnel)으로 나누어지는데 재택 근무 시에는 <U>전체 트래픽(0.0.0.0/0)</U>을 VPN으로 경유하는 것보다는 사내 서버 네트워크 접근을 위해 <U>필요한 IP 대역만을 CIDR로 설정하여 트래픽이 분리되도록</U> 하는게 좋다고 합니다. 현재 회사에서도 재택 근무를 하지 않아도 사내에서 와이파이가 연결된 상태에서 특정 서버 대역 접근을 위해서 VPN 설정을 하여 접근하고 있습니다.

이렇게 개발자 입장에서 여러가지 VPN에 대해서 간단하게나마 알아보았는데 다양한 VPN 프로토콜 중에서 <U>OpenVPN, IPSec/IKEv2, WireGuard 만 알아도 충분할 것</U>이라 생각됩니다.

