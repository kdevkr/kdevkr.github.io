---
title: 화이트리스트 IP 범위를 통한 액세스 제한
date: 2023-01-24
---

일반적으로 IT 시스템에서 특정 IP 대역에 대한 접근 제한을 설정하는 것은 인프라 영역에서 수행하는 편인데요. 예를 들어, 국내 사용자를 대상으로 하는 서비스에서는 웹 방화벽을 통해서 필리핀 혹은 중국과 같은 일부 국가에서 임의로 접근하는 트래픽을 애플리케이션까지 도달하지 않도록 합니다. 애플리케이션 레벨에서의 IP 보안 기능은 구현하지 않는 편이지만 일부 고객의 보안 요구사항에 의해서 네트워크 제한 기능을 적용하기도 합니다. 애플리케이션 레벨에서는 클라이언트 IP를 무작정 신뢰할 수는 없기 때문에 2차 비밀번호와 같은 2FA를 도입하는 것을 요구했지만 고객 입장에서는 기존에 사용하던 방식을 그대로 요구하는 것 같습니다.

#### 다양한 웹 서비스의 IP 보안 기능
네이버부터 깃허브까지 알게 모르게 IP 주소 범위를 통해서 액세스를 제한하는 기능을 제공하고 있습니다. 고객의 요구사항에 따라서 특정 하위 사용자에 대한 로그인 시도 시 화이트리스트로 정해진 IP 주소 범위를 검증하는 것을 추가하고자 합니다.

- [네이버 IP 보안](https://privacy.naver.com/protection_activity/ip_security?menu=protection_activity_service_naver_info)
- [카페24 IP 접속제한설정](https://serviceguide.cafe24.com/ko_KR/SH.SG.IP.html)
- [소스 IP를 바탕으로 AWS에 대한 액세스 거부](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html)
- [Gmail의 허용 목록에 IP 주소 추가하기](https://support.google.com/a/answer/60751?hl=ko)
- [깃허브 조직에 허용되는 IP 주소 관리](https://docs.github.com/ko/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization)

#### IP 주소 범위 체크를 위한 자바 라이브러리
PostgreSQL에서는 [Network Address Functions and Operators](https://www.postgresql.org/docs/current/functions-net.html)를 통해 CIDR 표기에 대한 IP 범위를 체크할 수 있으며 비즈니스 로직을 수행하는 애플리케이션 레벨에서는 아래와 같은 라이브러리들을 활용할 수 있을 것 같습니다. 현재 시스템은 스프링 시큐리티를 사용하고 있으므로 굳이 다른 라이브러리는 필요하지 않을 것으로 생각됩니다

- [IpAddressMatcher](https://github.com/spring-projects/spring-security/blob/main/web/src/main/java/org/springframework/security/web/util/matcher/IpAddressMatcher.java)
- [Apache Commons Net](https://commons.apache.org/proper/commons-net/)
- [IPAddress](https://seancfoley.github.io/IPAddress/)

#### 주의사항
시스템에 접근 가능한 IP 범위를 화이트리스트로 등록하고 로그인을 제한하는 비즈니스 로직을 구현하는 것은 다른 주니어 개발자들에게 맡기려고 합니다. 그 이유는 IP와 CIDR 표기법 등 인프라 영역에서 네트워크 지식을 알아가기 위한 좋은 요구사항이라고 생각되기 때문입니다. 제가 완성된 기능을 리뷰하더라도 개인적으로 생각되는 주의사항에는 다음의 항목들이 있습니다.

- X-Forwarded-For
- -Djava.net.preferIPv4Stack=true

오늘날의 인프라 구성 상 HttpServletRequest.getRemoteAddr() 함수의 결과는 클라이언트 아이피가 아닐 가능성이 많으며 로드밸런서 등을 거치면서 전달되는 XFF와 같은 프록시 헤더에 의존해야만 한다는 점입니다. 만약, AWS VPC 아이피 대역이 클라이언트 아이피로 파악된다면 모든 로그인이 가능한 취약점이 발생할지도 모릅니다. 두번째는 아직까지 IPv4에 대한 CIDR로 판단하는 경우가 많다는 것이겠지만 IPv6가 전달되었을때 검증할 수 있는지도 고려하고 테스트해야할 중요한 부분이라고 생각됩니다. 

