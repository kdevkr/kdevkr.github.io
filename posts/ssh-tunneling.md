---
title: SSH 터널링
date: 2023-05-11
tags:
- SSH
- SecurtCRT Firewall
---

기본적으로는 운영 환경의 Amazon Aurora PostgreSQL에는 로컬 호스트에서 접근하지 않는다. 그러나, 스테이징이나 테스트 환경에서 동작하는 데이터베이스에는 원인 검토를 위해 로컬 호스트에서 애플리케이션을 실행하고 디버그해야할 필요성이 요구되기도 한다. 일반적으로 데이터베이스는 외부에서 접근할 수 없는 프라이빗 서브넷에 위치하도록 인프라를 구성한다. 따라서, 데이터베이스에 접근하기 위해서는 퍼블릭 서브넷에 위치하는 배스천 호스트를 통해 Amazon Aurora PostgreSQL에 접근할 수 있는 호스트로 이동한 후 접근하게 된다.

![](/images/posts/ssh-tunneling/01.png)

창천향로님이 작성해두신 [DataGrip 에서 SSH 터널링으로 DB 접근하기](https://jojoldu.tistory.com/623)를 참고하면 SSH Configuration을 설정해두고 데이터베이스 연결 시 SSH Tunnel 을 구성하여 RDS 엔드포인트로 연결할 수 있다. 이와 같이 데이터베이스 관리를 위해서 SSH 터널링으로 접속하여 데이터베이스 상태나 데이터 그리고 SQL을 수행해볼 수 있다. 하지만, 데이터베이스 도구로써 연결하는 것이므로 애플리케이션에서는 다른 방식으로 SSH 터널링을 수행해야한다.

회사에서는 상용 SSH 클라이언트인 SecureCRT를 사용하고 있다. 배스천 호스트에 대한 연결 세션을 생성해놓고 Amazon Aurora PostgreSQL에 접속할 수 있는 호스트로 연결하기 위해 [Firewall](https://documentation.help/SecureCRT/GO_Firewall.htm)을 배스천 호스트 세션으로 선택할 수 있다. 

![](/images/posts/ssh-tunneling/02.png)

인스턴스 연결 세션은 배스천 호스트를 Firewall로써 선택해두었기에 프록시 연결을 수행할 수 있다. 위와 같이 인스턴스 연결에 성공하였다면 RDS 엔드포인트에 대해 포트포워딩을 설정하면 된다. 포트포워딩 시에는 Dynamic forwarding using SOCKS 4 or 5을 선택하면 RDS 엔드포인트를 지정할 수 없으므로 Destnation host is different from the SSH Server를 체크하고 RDS 엔드포인트 주소를 입력하자.

![](/images/posts/ssh-tunneling/03.png)

이제 인텔리제이나 DataGrip으로 로컬 호스트 주소를 사용하여 Amazon Aurora PostgreSQL에 연결할 수 있다. 

![](/images/posts/ssh-tunneling/04.png)

일반적으로 개발 환경에 대한 데이터베이스는 퍼블릭 서브넷에 구성하고 일부 IP 대역에 대해서는 다이렉트 접속이 가능하도록 하기도 하므로 이와 같은 SSH 터널링은 필요하지 않을 수 있다. 퍼블릭 서브넷에 위치하지 않고 다이렉트 연결이 불가능한 인프라 구성이라면 SSH 터널링을 통해 로컬 호스트에서 RDS 엔드포인트에 연결할 수 있으므로 로컬 개발 환경에서 애플리케이션을 실행하는 경우에도 스테이징이나 테스트 환경에서 운영중인 데이터베이스에 연결하여 디버그할 수 있게 된다.

