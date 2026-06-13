---
title: 스프링 부트 4에서 사라진 언더토우(Undertow)
date: 2026-06-13T17:28+09:00
description: 스프링 부트 4에서 공식 지원하던 Undertow가 제거된 배경을 알아봅니다.
tags:
    - Spring Boot
    - Undertow
    - Jakarta Servlet
---

# 스프링 부트 4에서 사라진 언더토우(Undertow)

최근 Spring Boot 4 학습을 위해 데모 프로젝트를 만들다가, 오랫동안 기본 톰캣(Tomcat) 대신 즐겨 사용하던 **언더토우(Undertow)** 지원이 공식적으로 종료된 사실을 알게 되었어요. 예전에 [국내 개발자 커뮤니티(OKKY)의 글](https://okky.kr/articles/543099)을 접한 이후, Undertow가 톰캣 대비 가볍고 성능(처리량 및 메모리 점유율)이 뛰어나다는 장점 때문에 실무 프로젝트 등에서 기본 톰캣 대신 [언더토우](/posts/spring-boot-undertow)로 전환하여 오랫동안 사용해 왔었는데요. 그동안 스프링 부트에서 공식 지원하던 Undertow가 왜 제거되었는지 그 구체적인 배경이 궁금하여 직접 찾아보고 정리해 보았습니다.

## Undertow의 Jakarta Servlet 6.1 미지원

Spring Boot 4.0은 **Jakarta Servlet 6.1** 스펙을 최소 베이스라인으로 요구해요. 하지만 Spring Boot 4.0 릴리즈 준비 단계에서 Undertow는 Servlet 6.1을 지원하지 않았던 상태였나 봐요. 등록된 [스프링 부트 이슈(#46917)](https://github.com/spring-projects/spring-boot/issues/46917)에 따르면, 이 호환성 문제로 인해 Spring Boot 4.0에서는 `spring-boot-starter-undertow` 스타터 의존성과 자동 설정을 제거할 수밖에 없었다고 합니다. 최소 사양을 충족하지 못하는 서블릿 컨테이너를 프레임워크 수준에서 안고 갈 수는 없었기 때문이에요.

## Undertow 2.4.0.Final 릴리즈 및 Jakarta Servlet 6.1 지원

**2026년 5월 6일**, Undertow 진영에서 Jakarta Servlet 6.1 스펙을 공식적으로 지원하는 [Undertow 2.4.0.Final](https://github.com/undertow-io/undertow/releases/tag/2.4.0.Final) 버전을 릴리즈했어요. 

하지만 이보다 앞선 **2026년 4월 9일** 에 확정된 [이슈 답변](https://github.com/spring-projects/spring-boot/issues/46917#issuecomment-4207555189)에 따르면, 스프링 부트 팀은 공식적으로 재도입할 계획이 없음을 확정해 둔 상태였습니다. 코어 수준의 공식 지원 대신 신뢰할 수 있는 커뮤니티 모듈이 개발된다면 스타터 README 목록에 기꺼이 등록해 주겠다는 가이드라인만 제시하고 있죠.

이러한 결정은 프레임워크 생태계의 안정성을 고려한 스프링 부트 진영의 어쩔 수 없는 선택으로 보여요.

## Undertow 프로젝트의 마이그레이션 방향

공식 지원이 중단된 만큼 Spring Boot 4.0 마이그레이션 시점에는 **기본 Tomcat(톰캣)으로의 전환을 권장** 해요. 우선은 기본 톰캣으로 먼저 전환하여 애플리케이션의 기능과 동작을 검증하는 것이 가장 안전하며, 톰캣보다 가볍고 도커 컨테이너 환경에 더 적합해 보이는 경량 **Jetty(제티)** 라는 선택지도 함께 고려해 볼 수 있습니다.
