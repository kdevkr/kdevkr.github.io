---
title: 알려진 문제
date: 2026-10-23T06:00+09:00
description: PHP2Shell 취약점 타임라인으로 살펴보는 알려진 문제와 보안 패치 배포 과정의 혼란을 돌아본다.
tags:
  - Security
  - PHP2Shell
  - CVE
---

# 알려진 문제

최근 PHP 코어의 원격 코드 실행(RCE) 취약점인 **PHP2Shell** ([`CVE-2026-109618`](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w), [`CVE-2026-109619`](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp))이 공개되면서 큰 혼란이 일었다. [PHP 재단이 공개한 타임라인](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/)을 살펴보면 이 문제는 어제오늘 갑자기 튀어나온 결함이 아니었다.

::: info 우리 회사는 PHP를 안 쓰는 줄 알았어요
출근길에 [대응 권고 뉴스](https://logpresso.com/ko/blog/2026-10-21-php2shell-security-advisory)를 공유하자마자 일본 고객사의 확인 요청이 들어왔어요. 공식 제품에는 안 쓰지만, 사내 네트워크 관리 시스템과 고객사의 자빅스(Zabbix) 웹 화면에 PHP가 숨어 있었어요.
:::

## 2024년 이미 알려진 OOM 문제

근본적인 원인이 된 메모리 부족(OOM) 문제는 이미 2024년 외부 보안 감사 과정에서 드러났다. 당시 한 코어 개발자가 OOM 결함의 징후를 발견하고 공격 가능성을 이론적으로 추정해 두었다.

하지만 구체적인 공격 경로가 입증되지 않고 명확한 근거가 없어 우선순위에서 밀렸다. 코어 엔진을 다룰 수 있는 인력 부족까지 겹치면서 별다른 조치 없이 오랜 기간 방치되었다.

::: info 우리 저장소에도 이런 이슈가 많아요
회사 깃허브 저장소에도 일어날 가능성이 적어 보인다며 '알려진 문제'로 남겨둔 오래된 이슈들이 많아요.
:::

## Patch the Planet으로 발견

오랫동안 구석에 숨어 있던 문제는 2026년 PHP 재단이 OpenAI의 **Patch the Planet** 프로그램에 참여하면서 풀리기 시작했다. 보안 업체(Calif, Wiz)와 OpenAI는 **GPT-5.6 Sol** 같은 최신 AI 모델을 활용해 2024년 OOM 결함에서 이어지는 무인증 원격 코드 실행 공격 경로를 잇달아 찾아냈다.

2024년에 단순 추정으로만 머물렀던 알려진 문제는 실제 공격 가능성의 근거가 확보되자 최상위 우선순위로 격상되었다. 곧바로 긴급 대응으로 이어졌고 패치는 [한국 시간 기준 10월 22일 23:00에 공개할 예정](https://news.hada.io/topic?id=35748)이었다.

## 혼란스러웠던 배포 과정

패치 배포 전까지 사전 공개 유예(엠바고)를 걸어두었으나, [PHP 재단이 공유한 경위](https://news.hada.io/topic?id=35766)를 보면 공개하기도 전에 여러 돌발 상황이 발생하면서 전 세계적으로 심각한 혼란을 만들어냈다.

| 일시 (KST) | 내용 |
| --- | --- |
| 10월 21일 00:00 | [트위터](https://x.com/k_firsov/status/2112641845926989944) 및 커뮤니티에 두 CVE ID와 [잘못된 위험도 점수(`CVSS 10.0`)](https://news.hada.io/topic?id=35746) 선유출 |
| 10월 21일 04:30 | PHP 보안팀의 긴급 사전 공지 발표 및 패치 배포 일정 단축(23:00) |
| 10월 21일 05:00 | 보안 업체 Calif의 실수로 패치 배포 몇 시간 전에 [공격 증명(PoC) 데모 영상](https://www.youtube.com/watch?v=pfWZrdzvooc) 공개 |
| 10월 21일 16:41 | Chainguard의 엠바고 위반 및 패치 포함 컨테이너 이미지 선배포 |
| 10월 21일 23:00 | 공식 보안 패치(PHP 8.5.12, 8.4.27, 8.3.36, 8.2.35) 최종 배포 |

::: warning 약속을 어긴 조기 공개는 인재예요
사전에 약속된 엠바고를 깨고 영상을 공개하거나 먼저 배포해 버린 건 명백한 인재(人災)예요. 전 세계 사이트를 일시적으로 중단하게 만드는 행위예요.
:::

## 참고 자료

- [PHP 보안취약점(PHP2Shell) 관련 기업 보안 대응 수칙](https://www.boho.or.kr/kr/bbs/view.do?bbsId=B0000133&pageIndex=1&nttId=72230&menuNo=205020)
- [Today's PHP Security Release, and How We're Strengthening PHP Security](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/)
- [PHP 원격 코드 실행 취약점(PHP2Shell) 대응 권고](https://logpresso.com/ko/blog/2026-10-21-php2shell-security-advisory)
