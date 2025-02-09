---
title: DNS
date: 2025-01-12T21:00+09:00
tags:
- DNS Cache
- DNS Resolver
---

국내 개발자 커뮤니티에 [자바 개발자가 알아야할 DNS](https://okky.kr/articles/1519036)라는 지식을 공유했던 것을 이어서 DNS 실전 교과서라는 책을 읽어보고 조금 더 DNS에 대한 정보를 찾아서 정리해볼까 합니다. GeekNews 에 공유된 [DNS 학습이 왜 여전히 어려운가요?](https://news.hada.io/topic?id=10062)라는 글처럼 **웹 개발자로써 DNS에 대해서 무엇을 어디까지 알고 있어야 하는지** 알기 어려운 것 같습니다. 

#### DNS 조회 실패로 인한 IP 주소 확인 불가

```sh
SdkClientException: Received an UnknownHostException when attempting to interact with a service.
See cause for the exact endpoint that is failing to resolve.
If this is happening on an endpoint that previously worked,
there may be a network connectivity issue or your DNS cache could be storing endpoints for too long.
```

Amazon SQS에 대한 DNS 캐시가 초기화되는 시점에 사내 네트워크 사용량의 과부하로 인하여  <u>사내 라우터를 통한 DNS 조회를 할 수 없어서</u> SQS에 대한 엔드포인트 주소를 알 수 없는 이슈가 발생한 경우가 있었습니다. 그리고 아래와 같이 DNS 이슈에 대한 대응에 대한 정보도 찾아볼 수 있었어요.

- [캐시된 죽은 IP로 URL 프록시 장애 대응 회고](https://techblog.herrencorp.com/f1106801-e6a0-4e67-aeaf-bca603f191ff)
- [서울 리전의 Amazon EC2 DNS 확인 이슈 요약](https://aws.amazon.com/ko/message/74876/)
- [온라인 협업 도구 노션(Notion) 장애와 DNS 문제 대응](https://www.44bits.io/ko/post/news--notion-outage-dns-issue)

#### Amazon Route53 레코드 관리

저는 주로 Amazon Route53에 서버에 대한 IP 주소 또는 별칭으로 A 레코드를 등록하고 이미 등록된 서버에 대해 별칭을 추가로 사용하기 위해서 CNAME 레코드를 등록하게 되는 것 같습니다. 개인적으로 GoDaddy에서 구매한 kdev.ing 도메인에 대한 네임 서버로  <u>[Amazon Route53을 등록하게 되면](https://jryancanty.medium.com/domain-by-godaddy-dns-by-route53-fc7acf2f5580)  1달러의 세금이 발생</u>하므로 변경하지 않은 상태로 Github Pages 를 연결해서 사용하고 있기도 합니다.

#### 이메일 보안을 위한 SPF, DKIM, DMARC

서버 엔지니어 혹은 인프라 팀이 별도로 존재하는 조직이 아니라면 개발자가 이메일 발송 시 [신뢰할 수 있는 도메인을 설정](/email-spf-dkim-dmarc/)하는 작업을 진행해야할 수 있어요. 마찬가지로 저는 작은 규모에 속한 주니어 개발자였기에 사내 메일 서버에서 Amazon SES를 통해 이메일을 보내기 위해서 [DMARC, DKIM, SPF](https://www.cloudflare.com/ko-kr/learning/email-security/dmarc-dkim-spf/)를 설정했었던 적이 있습니다. 만약, 이메일 보안을 위해서 DMARC를 적용하고자 한다면 아래와 같은 글들을 참고해도 좋을 것 같습니다.

- [Setting up DMARC, SPF, DKIM with Amazon SES](https://help.emailoctopus.com/article/68-setting-up-dmarc-spf-dkim)
- [How To Setup SPF, DKIM, And DMARC In Your Amazon SES Account](https://www.youtube.com/watch?v=C7rRSaP6fdA)

#### 인터넷 속도를 빠르게 하는 방법 😪

일반적으로 인터넷 속도를 빠르게 하는 방법을 찾아보면 [DNS 설정을 변경](https://support-leagueoflegends.riotgames.com/hc/ko/articles/360022610053-%EA%B3%B5%EC%9A%A9-DNS-%EC%84%9C%EB%B2%84%EB%A5%BC-%ED%86%B5%ED%95%B4-%EC%9D%B8%ED%84%B0%EB%84%B7-%EC%97%B0%EA%B2%B0-%ED%92%88%EC%A7%88-%ED%96%A5%EC%83%81)하거나 DNS 캐시를 비우는 걸 추천하는데요. ISP 통신 사업자의 DNS 대신에 클라우드 플레어의 [1.1.1.1](https://one.one.one.one/)로 변경하는 건 별 다른 의미가 없죠. 개발자 입장에서는 참고해야할 정보들이 해외 사이트에서 찾게되는 경우가 많은데, 저는 일부 HTTPS 접근을 차단하는 것을 방지하기 위해서 [유니콘 HTTPS](https://getunicorn.app/ko/product/unicorn-https/windows)와 같은 DNS 변경 소프트웨어를 사용하고 있습니다.

##### DNS 캐시 비우기

리눅스 서버에서는 캐시된 DNS 정보가 손상되거나 잘못된 경우로 확인된다면 DNS 정보를 즉시 갱신하기 위해서 DNS 캐시를 삭제하는 명령어를 찾아보니 resolvectl 또는 systemd-service 를 통해 DNS 캐시를 삭제할 수 있습니다.

```sh Terminal
# sudo systemd-service --flush-caches
sudo resolvectl flush-caches

# sudo systemd-resolve --statistics
sudo resolvectl statistics
```

#### Local DNS Resolver

대부분의 리눅스에서는 systemd-resolved 를 DNS Resolver로 사용하기 때문에 [/etc/resolv.conf 에는 127.0.0.53 이 설정](https://medium.com/@linuxadminhacks/dd-721dc2b25d1c)되어 있습니다. 그리고 [DNS resolution 및 resolv.conf 에 대한 이해](https://medium.com/@hsahu24/understanding-dns-resolution-and-resolv-conf-d17d1d64471c)라는 글을 통해 DNS 리졸버에서 IP 주소를 쿼리하기 위해서 사용할 [DNS 서버를 설정](https://www.baeldung.com/linux/etc-resolv-conf-file)하는 것을 알 수 있습니다. AWS EC2는  <u>VPC의 게이트웨이(CIDR 대역에서 .2)</u>를 DNS Resolver로 사용하도록 설정되어 있네요.

```sh /etc/resolv.conf
[ec2-user@tsdb ~]$ cat /etc/resolv.conf
nameserver 192.168.0.2
search ap-northeast-2.compute.internal
```

실무에서는 AWS 클라우드를 많이 활용하는 만큼 [Amazon Route 53 Resolver](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html)에 대해서 좀 더 학습해봐야할 것 같습니다. 그동안 AWS 인프라를 활용해왔지만 VPC 내에서 어떻게 DNS 쿼리를 수행하고 관리하는지 생각해본적은 없었기 때문입니다.

