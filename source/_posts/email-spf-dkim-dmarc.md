---
title: 신뢰할 수 있는 이메일 발송 도메인
date: 2022-05-18
tags:
- SPF
- DKIM
- DMARC
---

시스템을 개발하는 단계에서는 메일 발송 기능을 위해서 회사 내 서버 인프라 엔지니어분께 사내 메일 서버를 대신 이용할 수 있도록 요청하고 메일 서버를 이용할 수 있는 SMTP 서버와 사용자 인증 정보를 전달받아서 테스트하곤 했습니다. 그러나, 실제로 시스템을 운용하는 시점에 들어서자 회사 사내 메일 서버로 전달되는 전송 건들이 많아져서 회사 인프라 담당 엔지니어분으로부터 [Amazon SES](https://aws.amazon.com/ko/ses/)로 메일 서버를 전환해달라는 요청을 받고 화사 사내 메일 서버 대신에 클라우드 환경에서 제공하는 SMTP 서버를 사용하도록 작업을 하였습니다. 

## Amazon SES
저는 서버 인프라 엔지니어는 아니기 때문에 인프라 영역에서 사용되는 모든 지식을 알지는 못하는데요. 개발자로써 이메일 발송 기능을 구현하는 방법에 대해서 찾아보면 [프리마커 템플릿으로 이메일 발송하기](/sending-mail-with-freemarker-template/)와 같이 SMTP 프로토콜을 사용하면 된다는 것을 알 수 있습니다. 

![](/images/posts/email-spf-dkim-dmarc/ses-01.png)

Amazon SES는 SMTP 엔드포인트와 STARTTLS/TLS 옵션에 따라 사용해야하는 포트와 SMTP 인증을 위한 크레덴셜을 발급하고 인증만 하면 사용할 수 있습니다. 간단한 클릭만으로도 SMTP 크레덴셜을 발급할 수 있기 때문에 개발자라면 누구나 쉽게 사용자 인증 정보를 가져와서 메일 서버를 이용할 수 있습니다. Amazon SES는 인증된 이메일 주소로 메일을 발송할 수 있거나 도메인을 인증하여 이메일 발송에 대한 신원을 검증할 수 있도록 제공하고 있는데요. 그래서 아래와 같이 이메일 수신이 가능한 발신 이메일이 존재한다면 간단하게 발신 주소를 등록할 수 있습니다.

![](/images/posts/email-spf-dkim-dmarc/ses-02.png)

### 이메일에 대한 발신 주소를 신뢰할 수 없음

간단하게 SMTP 메일 서버를 전환할 수 있기 때문에 어려운 작업은 아니라고 생각했었는데 잠시 후 예상하지 못했던 문제가 파악되었어요. Amazon SES의 SMTP 서버를 사용하도록 전환하고나서 시스템에서 발송하는 이메일을 수신자가 받았을때 스팸 메일함으로 전달되는 것이었습니다. 그래서 원인을 찾아보니 [Amazon SES를 사용하여 전송하는 이메일이 스팸으로 표시되는 이유는 무엇입니까?](https://aws.amazon.com/ko/premiumsupport/knowledge-center/ses-email-flagged-as-spam/)와 같은 가이드를 찾았습니다. SMTP 서버에 의해 전달되는 이메일을 신뢰할 수 있는지 검증하는 것은 Amazon SES가 보장할 수 없다는 부분과 다음의 요인이 있다는 것을 안내하고 있었습니다.

> [DomainKeys Identified Mail(DKIM)](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html) 또는 [Sender Policy Framework(SPF)](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-spf.html)와 같은 이메일 인증 부족

### 발신 도메인 검증
[Configuring identities in Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/configure-identities.html) 문서를 살펴보면 SMTP 프로토콜은 자체적으로 인증 기능이 없다는 것과 이러한 부분으로 인해 스패머가 발신 주소를 위장할 수 있다는 점을 알게 되었습니다. 그래서 SPF 또는 DKIM와 같은 인증 매커니즘을 사용하게 된다고 소개하고 있습니다. 이제껏 듣도보도 못한 새로운 용어가 나타나게 된거죠. [이메일 스푸핑과 피싱에 대처하기](https://blog.cloudflare.com/ko-kr/tackling-email-spoofing-ko-kr/)에서 DNS의 도메인 레코드를 사용해서 스푸핑을 방지하기 위한 매커니즘을 구성한다는 점을 이해할 수 있었습니다. 

![](/images/posts/email-spf-dkim-dmarc/ses-03.png)

수신된 이메일이 올바른 곳으로부터 발송된 것인지를 검증하기 위해서는 도메인 기반으로 신원을 검증하고 SPF, DKIM, DMARC와 같은 DNS 레코드를 도메인에 설정해야했습니다. 다행히도 Route53으로 도메인을 사용중이기에 Amazon SES에서 자동으로 DNS 레코드를 설정할 수 있었습니다. [Amazon SES를 사용하여 DMARC 준수](https://docs.aws.amazon.com/ko_kr/ses/latest/dg/send-email-authentication-dmarc.html)에 따라 도메인 레코드에 DMARC 정책이 설정되었는지를 확인하고 Amazon SES가 도메인을 검증하기를 기다렸습니다.

![](/images/posts/email-spf-dkim-dmarc/ses-04.png)

### 이메일 보안 DNS 레코드 질의
DKIM으로 도메인 검증을 하였음을 확인하였고 추가적으로 dig와 같은 DNS 질의 명령어 도구를 통해서 DNS 레코드가 반영되었는지 확인할 수 있었습니다. 

```bash
# SPF 레코드 확인
dig TXT example.com +short
"v=spf1 include:_spf.google.com ip4:xxx.xxx.xxx.xxx a:mail.example.com ~all"
# DKIM 레코드 확인
dig TXT google._domainkey.example.com +short
"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoamWoQQ5zEdcFQnGaWN055oT3sEnCgN5bcAze5R6uvI1P" "X4d+CGbNDSVJqOmQPyrJdK2fOVG3hvjMkoilYcgWrGKDat2Nh29ftN5tTx5SVK/kl+5aPKRd9q6q9c9EWL7aRS2hqoGRyzW0Nb0ilKZc/" "odDbh3bgNhN6AJqIZwlE9BJgkYT5aT6TGJM/Vi4GJcYDEKm6yDexTJKzfZ8o8TCRDufCYDF8F+dKKyLvyaKrngfgIjRi5PiGVGbyNrIL7iMp1CkJ7ErpkYCJw5DeTQkXi8Gxt+Km61sIP2F8IZyd/" "WrEXJmk2pHzRfiJJqIiY4r3s4loR/sJ4hQPS6HEq7JQIDAQAB"
# DMARC 레코드 확인
dig TXT _dmarc.example.com +short
"v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com; ruf=mailto:postmaster@example.com"
```

### 발신 도메인 신뢰 확인
도메인 기반의 인증 매커니즘이 적용되고나서는 수신된 이메일이 스팸으로 분류되지 않게 되었고 원본 메일 정보를 확인하면 SPF, DKIM, DMARC에 대한 검증이 통과된 것을 확인할 수 있습니다.

![](/images/posts/email-spf-dkim-dmarc/ses-05.png)

> 원본 메일을 확인하는 것은 서버 인프라 엔지니어분이 알려주셨어요! 😁



따라서, 이메일이 정상적인 곳으로부터 발신된 것을 검증하기 위해서는 도메인 레코드를 사용한다는 것을 알게되었습니다. 수신된 이메일을 검증하는 과정을 더 자세하게 알고 싶다면 [이메일의 SPF/DKIM/DMARC가 어떻게 동작하는지 인터랙티브하게 보기](https://www.learndmarc.com/)를 이용해보시기 바랍니다. 

## 참고

- [Amazon SES를 사용하여 전송하는 이메일이 스팸으로 표시되는 이유는 무엇입니까?](https://aws.amazon.com/ko/premiumsupport/knowledge-center/ses-email-flagged-as-spam/)
- [이메일 스푸핑과 피싱에 대처하기](https://blog.cloudflare.com/ko-kr/tackling-email-spoofing-ko-kr/)
- [이메일의 SPF/DKIM/DMARC가 어떻게 동작하는지 인터랙티브하게 보기](https://www.learndmarc.com/)