---
title: UnknownHostException
date: 2024-11-03T00:00+09:00
tags:
- HTTP
- DNS
---

> Received an UnknownHostException when attempting to interact with a service. See cause for the exact endpoint that is failing to resolve. If this is happening on an endpoint that previously worked, there may be a network connectivity issue or your DNS cache could be storing endpoints for too long.

```sh
Oct 30 01:22:14 ubuntu dockerd[2293083]: time="2024-10-30T01:22:14.752476083Z" level=error msg="[resolver] failed to query external DNS server" client-addr="udp:127.0.0.1:59546" dns-server="udp:127.0.0.53:53" error="read udp 127.0.0.1:59546->127.0.0.53:53: i/o
 timeout" question=";sqs.ap-northeast-2.amazonaws.com.\tIN\t A" spanID=0e95ec0f4aa8fcbc traceID=c69346a57036fa48d3850134bb60b134
Oct 30 01:24:37 ubuntu newrelic-infra-service[3023646]: time="2024-10-30T01:24:37Z" level=warning msg="[engine] failed to flush chunk '3024031-1730251471.397479652.flb', retry in 9 seconds: task_id=0, input=tail.9 > output=newrelic.0 (out_id=0)" component=inte
grations.Supervisor output=stderr process=log-forwarder
```

위 오류는 AWS SDK Java 의 SQS 클라이언트를 사용하여 큐에 등록된 메시지를 처리하기 위해서 HTTP 통신을 수행할 때 발생할 수 있는 예외 상황입니다. [개발자가 알아야할 DNS](https://www.youtube.com/watch?v=q6iRZRawpQQ)와 같이 개발자가 DNS에 대한 개념을 알고 있어도 위와 같은 상황에 대해 원인을 찾고 빠르게 대처할 수 있을까요? 그리고 이 네트워크 문제가 발생한 이유는 무엇일까요.

#### /etc/resolv.conf

우선 리눅스에서는 NetworkManager를 통해 [/etc/resolv.conf](https://www.baeldung.com/linux/dns-resolv-conf-file) 통해 로컬 DNS와 외부 DNS에 대한 정보를 관리합니다. 해당 문제가 발생한 사내 컴퓨터에는 라우터에 대한 아이피와 Cloudflare(1.1.1.1)이 DNS 서버로 지정되어 있었습니다.

#### JVM의 DNS 캐싱 기본값은 30초

> The Java virtual machine (JVM) caches DNS name lookups. When the JVM resolves a hostname to an IP address, it caches the IP address for a specified period of time, known as the time-to-live (TTL). Because AWS resources use DNS name entries that occasionally change, **we recommend that you configure your JVM with a TTL value of 5 seconds**.

AWS SDK Java 에서는 [InetAddress.getAllByName를 사용하며](https://github.com/aws/aws-sdk-java/issues/1503#issuecomment-372851462) 이로 인해 [JVM의 DNS TTL](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/jvm-ttl-dns.html) 설정에 의존합니다. 그리고 다음은 Amazon Corretto 17의 java.security 파일에 기재된 주석 설명입니다. 그러므로, 기본적으로는 (Security Manager를 설정하지 않기 때문에) 30초 동안 DNS 결과를 캐싱하게 됩니다.

```properties /usr/lib/jvm/java-17-amazon-corretto.aarch64/conf/security/java.security
#
# The Java-level namelookup cache policy for successful lookups:
#
# any negative value: caching forever
# any positive value: the number of seconds to cache an address for
# zero: do not cache
#
# default value is forever (FOREVER). For security reasons, this
# caching is made forever when a security manager is set. When a security
# manager is not set, the default behavior in this implementation
# is to cache for 30 seconds.
#
# NOTE: setting this to anything other than the default value can have
#       serious security implications. Do not set it unless
#       you are sure you are not exposed to DNS spoofing attack.
#
#networkaddress.cache.ttl=-1
```

> 따라서, 정상적으로 실행중인 애플리케이션에서 갑자기 DNS 요청이 수행되었는지를 이해할 수 있고, 해당 요청을 수행한 시점에 DNS 서버에서는 요청에 대한 응답을 할 수 없었다는 것을 (**failed to query external DNS server** 오류 메시지를 통해) 알 수 있게 됩니다.

#### DNS 요청이 실패한 이유

```sh
dig sqs.ap-northeast-2.amazonaws.com

; <<>> DiG 9.11.4-P2-RedHat-9.11.4-26.P2.amzn2.13.8 <<>> sqs.ap-northeast-2.amazonaws.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 45612
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;sqs.ap-northeast-2.amazonaws.com. IN   A

;; ANSWER SECTION:
sqs.ap-northeast-2.amazonaws.com. 16 IN A       3.34.228.79

;; Query time: 0 msec
;; SERVER: 192.168.0.2#53(192.168.0.2)
;; WHEN: Sun Nov 03 05:53:46 UTC 2024
;; MSG SIZE  rcvd: 77
```

dig(또는 nslookup) 명령어를 통해 [sqs.ap-northeast-2.amazonaws.com](https://www.nslookup.io/domains/sqs.ap-northeast-2.amazonaws.com/dns-records)에 대한 DNS 질의를 수행해볼 수 있습니다. 정상적인 경우 아래와 같이 UDP를 통해 DNS 질의에 대한 결과를 받을 수 있어야 합니다. 앞서 오류에 대한 메시지를 살펴보면 DNS 질의에 대한 요청이 타임아웃 되어버렸습니다. 뒤늦게 알게된 정보이지만 사내에서 프로젝트 관련 내용을 공유하기 위해 **구글 드라이브에 약 60GB 정도 되는 문서를 업로드 및 다운로드 했다**고 합니다.

#### 사실 애플리케이션 입장에서 크리티컬한 문제는 아니다

AWS SDK를 통해 SQS 메시지 처리를 수행하는 애플리케이션은 사용자에게 전달된 카카오 알림톡 메시지에 대한 발송 결과를 수신하여 처리하기 위한 작업을 수행합니다. 따라서, 일시적으로 SQS에 저장된 알림톡 결과 메시지를 처리하지 못하더라도 (지속적으로 SQS 통신을 수행할 수 없는 상태가 아니라면) 크리티컬한 문제는 아닙니다. 그럼에도 불구하고 DNS 오류에 대한 알림을 확인하고 애플리케이션 기능에 대해 주기적인 모니터링은 필요한 부분입니다.

아무튼 해프닝!...