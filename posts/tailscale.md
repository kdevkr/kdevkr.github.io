---
title: Tailscale VPN 으로 로컬 환경에 접근하기
date: 2026-05-01T22:00+09:00
description: Tailscale 을 사용해 외부 기기에서 로컬 개발 서버에 접근하고, VitePress 의 호스트 차단 정책까지 함께 푸는 방법을 정리합니다.
tags:
    - Tailscale
    - WireGuard
    - VPN
    - VitePress
---

# Tailscale VPN 으로 로컬 환경에 접근하기

로컬 환경에서 웹 서비스를 개발하다 보면 **내 핸드폰에서 바로 접근해 보고 싶을 때** 가 있습니다. 모바일 화면에서 레이아웃이 어떻게 잡히는지, 터치 인터랙션이 자연스러운지 실제 기기로 확인해야 하는 순간이죠.

기존에는 이런 경우 공인 IP 를 할당받고 공유기 포트포워딩을 설정해 외부에서 접근할 수 있게 구성했어야 합니다. ISP 가 동적 IP 를 발급하면 [DDNS](https://en.wikipedia.org/wiki/Dynamic_DNS) 를 따로 붙여야 하고, 무엇보다 dev 서버를 인터넷에 그대로 노출시키는 부담이 따릅니다. [Tailscale](https://tailscale.com/) 은 WireGuard 기반의 메시 VPN 으로, 공인 IP 없이 내 기기들끼리만 닿는 사설 네트워크를 구성해 이 과정을 통째로 건너뛰게 해 줍니다.

## 1. 왜 Tailscale 인가요?

사실 외부 디바이스에서 로컬 환경에 접근해야 할 일은 흔치 않습니다. 다만 모바일에서만 재현되는 버그 트러블슈팅, 또는 요구사항 수정이 의도대로 반영됐는지 작업 방향을 빠르게 확인할 때처럼 **종종 도움이 되는 순간** 이 있습니다.

대부분의 회사에서는 [WireGuard](https://www.wireguard.com/) 같은 사내 VPN 을 인프라 팀이 운영하므로, 이런 일회성 외부 접근도 보통은 인프라 팀 요청을 거쳐야 합니다. Tailscale 은 같은 WireGuard 위에 **MagicDNS** 와 ACL 을 얹어 둔 매니지드 메시 VPN 으로, **같은 계정으로 로그인된 디바이스끼리만 통신을 허용** 합니다. 보안 정책에 위배되지 않는다면, 별도 요청 없이도 휴대폰에서 내 로컬 dev 서버에 잠깐 접근해 보는 시나리오에 잘 맞습니다.

> [!CAUTION]
> 회사 환경에서는 사내 VPN 이나 사무실 라우터가 같은 역할을 해 주는 경우가 많아 Tailscale 이 따로 필요하지 않을 수 있습니다. 이 글은 어디까지나 **개인 작업 환경(집 PC ↔ 개인 노트북·휴대폰)** 을 묶는 시나리오에 초점을 맞추고 있습니다.
>
> 사내 자산이 연결된 PC 에 Tailscale 을 설치하려 한다면, **반드시 사내 인프라 팀 또는 보안 책임자에게 사용 가능 여부를 사전에 확인** 하세요. 개인 디바이스 한정으로 보이더라도 회사 네트워크·소스 코드·계정에 닿아 있는 환경이라면 정보보안 정책상 BYO-VPN/메시 네트워크가 금지되어 있을 수 있고, 임의 도입은 징계 사유가 될 수 있습니다.

## 2. 내 핸드폰에서 로컬 블로그에 접속하기

블로그 개선 작업을 가정하고 내 핸드폰에서 로컬 PC에 실행중인 블로그에 접속해서 모바일 테스트를 진행해보려고 해요. 본 블로그는 [VitePress](https://vitepress.dev/) 로 빌드되며, `pnpm l` 로 띄운 dev 서버를 Tailscale 을 통해 휴대폰에서 바로 열어 볼 수 있도록 구성해볼게요.

먼저, vite dev 서버는 기본적으로 로컬호스트에서 접근하도록 제한되는데 외부에서 접근하도록 허용하기 위해서 `--host` 옵션을 추가하면 됩니다.

```ps
pnpm vitepress dev --host

  vitepress v1.6.4

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://100.xxx.xxx.xxx:5173/
  ➜  Network: http://172.20.64.1:5173/
  ➜  Network: http://192.168.35.223:5173/
  ➜  press h to show help
```

이제 다른 기기에서 `http://pc.tailxxxx.ts.net:5173` 으로 접근할 수 있게 되었습니다. 만약, 휴대폰에서 접속이 안된다면 [Allow local network access](https://tailscale.com/docs/features/exit-nodes#local-network-access) 옵션을 활성화했는지 체크해보세요. 이 설정이 꺼져 있으면 외부 기기에서 들어온 요청이 PC 의 로컬 서비스(예: `http://100.xxx.xxx.xxx:5174`)에 도달할 수 없어요.

> [!TIP]
> [Exit Node](https://tailscale.com/docs/features/exit-nodes) 는 **내 PC 를 다른 tailnet 기기의 인터넷 출구로 사용** 하는 기능입니다. 카페 와이파이의 노트북이 우리 집 PC 의 공인 IP 를 통해 인터넷에 나가게 만드는 식이죠 — 내 PC 를 곧 개인 VPN 출구로 쓰는 셈입니다.

## 3. VitePress 호스트 차단 풀기

```text
Blocked request. This host ("pc.tailxxxx.ts.net") is not allowed.
To allow this host, add "pc.tailxxxx.ts.net" to `server.allowedHosts` in vite.config.js.
```

로컬 액세스 허용 옵션을 활성화하고 휴대폰 브라우저에서 위와 같은 응답이 보였는데요. 위 오류는 Vite 개발 서버에서 `Host` 헤더를 검사해서 올바르지 않은 요청으로 거부한 것이라 Vite 설정에서 `server.allowedHosts` 에 tailnet 도메인을 등록해 주면 해결됩니다. 다음은 VitePress 에서 vite 옵션을 설정하는 예시를 보여줍니다.

```ts [.vitepress/config.mts]
const vitePressOptions: UserConfig = {
    vite: {
        server: {
            allowedHosts: [".ts.net"],
        },
        // ...
    },
};
```

## 4. Funnel 로 동료에게 잠깐 공유하기

Tailscale 에 인증된 내 기기에서만 접근했다면 이제는 누군가에게 잠깐 접근할 수 있도록 공개하는 기능을 테스트 해볼게요. 동료 개발자나 QA 엔지니어가 요구사항 수정 결과를 즉시 확인하고 싶을 수 있잖아요. 빌드·배포 단계를 건너뛰고 로컬에서 고친 그 화면을 곧장 공유할 수 있다는 점이 큰 장점이겠죠.

[Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel) 은 tailnet 의 한 기기에서 띄운 서비스를 **공개 인터넷에 HTTPS 로 노출** 시켜주는 기능으로 먼저, Funnel 권한을 활성화 해 줘야 합니다.

### Funnel 권한 활성화

Funnel 은 기본적으로 비활성화되어 있어 [Admin 콘솔의 Access Controls](https://login.tailscale.com/admin/acls) 에서 노드 속성으로 허용해 줘야 합니다.

```jsonc [tailnet-policy.hujson]
{
    "nodeAttrs": [
        {
            "target": ["*"],
            "attr": ["funnel"],
        },
    ],
}
```

### 로컬 포트를 Funnel 로 노출

이제 funnel 명령어로 접속하고 싶은 포트를 입력하면, 자동으로 `https://pc.tailxxxx.ts.net/` 주소를 제공하므로 tailnet 에 연결되지 않은 디바이스에서도 접근할 수 있습니다.

```ps
tailscale funnel 5173
```

```text
Available on the internet:

https://pc.tailxxxx.ts.net/
|-- proxy http://127.0.0.1:5173

Press Ctrl+C to exit.
```

이제 Tailscale 이 [Let's Encrypt](https://letsencrypt.org/) 인증서를 설정한 `https://pc.tailxxxx.ts.net/` 주소를 제공하므로 tailnet 에 연결되지 않은 디바이스에서도 접근할 수 있습니다.

> [!CAUTION]
> Funnel 은 인터넷에 노출하는 기능이므로 작업이 끝나면 `tailscale funnel reset` 으로 즉시 닫아 주세요!

## 5. 마치며

Tailscale 이 [개인용 무료](https://tailscale.com/blog/pricing-v4) 정책을 확대했다는 소식을 보고 로컬 환경에 접속하기라는 주제로 다루어보았습니다. 여러분도 필요할 때 유용하게 활용할 수 있을 것 같습니다.
