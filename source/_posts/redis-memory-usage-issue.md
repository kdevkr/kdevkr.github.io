---
title: 레디스 메모리 사용량 이슈
date: 2022-12-01
tags:
- 레디스
- 스프링 세션 레디스
---

일반적인 웹 서비스처럼 실시간으로 많은 사용자와 그리고 각 사용자에 의해 대량의 트래픽이 발생하는 시스템은 아닙니다만 애플리케이션이 스케일 아웃되어 분산되는 것을 고려하여 스프링 세션을 활용하여 세션을 레디스에 저장하고 있습니다. 그런데 어느 시점부터 특정 환경에서의 레디스 서버의 메모리 사용량이 조금씩 오르더니 레디스가 설치된 서버의 가용 메모리인 1GB의 절반 이상을 점유하는 상태가 되었습니다.

시스템 환경 특성 상 많은 사용자의 세션 데이터가 저장될 가능성은 아직까지 없으며 1GB 정도의 메모리 사양을 가지는 작은 단일 인스턴스에 레디스를 설치하여 클러스터 방식이 아닌 스탠다드-얼론 모드로 사용해도 문제 없이 동작하고 있습니다. 세션 저장소로써 레디스를 도입하였고 생각보다 레디스의 사용량이 많지 않았기에 자주 변경되지 않지만 호출되는 부하가 클 것으로 보이는 일부 데이터베이스 조회에 대해서 캐시를 적용해두었습니다. 하지만, 캐시되는 데이터는 생각보다 많지 않으며 레디스에 새로운 키가 등록되는 횟수가 자주 발생하지는 않습니다.

인터넷 글과 커뮤니티를 보다보면 대부분이 스프링 부트와 함께 스프링 세션으로 쉽게 세션 데이터를 레디스에 저장하도록 적용하는 것을 볼 수 있는데요. 하지만, 레디스라는 데이터 저장소에 대해서는 생각보다 다루는 글이 많지 않기 때문에 아마도 대부분이 레디스에 대한 기술적인 경험이 부족하기에 레디스 설치 시 기본값으로 제공하는 옵션들을 그대로 사용하게 되었을 것 입니다. 이것을 레디스 뿐만 아니라 거의 모든 기술에 해당할 수 있는데 해당 기술을 관리하는 사람들이 가장 범용적인 목적으로 사용할 때 최적의 옵션을 지정해둔 것이라는 믿음이 있기 때문입니다.

#### 레디스의 메모리 사용량이 조금씩 늘어나는 현상
시스템의 사용자가 많아져서 사용자마다 생성되는 각 세션 데이터가 많아진다거나 애플리케이션에서 캐시 데이터로 저장하는 항목이 늘어남으로써 레디스의 메모리 사용량이 증가할 수 있는 것은 당연합니다. 그러나, 고객 측으로부터 전달받은 최근 한달 간의 모니터링 지표에는 특정 시점부터 메모리 사용량이 지속적으로 생각보다 급격한 기울기의 그래프로 증가함을 보이고 있었습니다. 해당 지표는 사실 상 서버 메모리에 대한 사용량이므로 고객이 서버 운영을 위해서 별도로 설치한 백신 프로그램이나 모니터링을 위한 에이전트로 인해서 서버 메모리의 사용량이 증가했을 것이라 초기에는 의심했었습니다.

그러나, 백신 프로그램이 설치된 시기와 업데이트된 기록이 없었고 레디스에서 저장한 스냅샷(dump.rdb) 파일의 용량이 생각보다 크고 레디스의 복제된 프로세스에 의해 디스크 작업이 생각보다 자주 발생하는 것을 확인하고 이상함을 인지하게 되었습니다.

#### 레디스에 세션 데이터가 무분별하게 저장되어있음
메모리 사용량이 높아지는 시점 부근에 해당 환경에 애플리케이션에 대한 핫픽스 버전 패치가 수행되었음을 확인하였고 해당 버전에서 추가되거나 변경된 작업에 대해서 검토했습니다. 그러나, 초기 검토 결과로는 레디스에 영향이 될 만한 작업이 없다고 판단하였기에 레디스에 저장한 스냅샷 파일을 복사하여 로컬 환경에서 스냅샷 파일을 토대로 레디스를 실행한 후 레디스 클라이언트(redis-cli)를 통해 저장되어있는 데이터들을 확인하였습니다. 

다른 환경보다 캐시된 데이터의 수가 많았으나 검토 결과 캐시 데이터가 많을 수 밖에 없는 사유가 있었고 사용중인 메모리 사용량을 캐시 데이터가 차지하는 비율이 생각보다 적었다는 것입니다. 세션 관련 키와 캐시 관련된 키를 나누어서 삭제해본 결과 대부분이 세션 관련 키로 인한 메모리 점유였으며 세션 아이디로 보이는 키가 무분별하게 저장되어있는 것을 확인하였습니다. 생각해보니 시스템의 요구사항으로 사용자의 로그인은 7일 동안 길게 유지한다는 것으로부터 기본 세션 만료 정책이 7일로 설정되어 spring:session:으로 시작되는 세션 관련 키가 60만개를 넘어서 저장된 상태에 있었기에 해당 키들이 삭제되기까지 오래걸린다는 점도 파악하였습니다.

> 일반적인 웹 서비스라면 세션 유지 시간을 작게 설정하겠지만 시스템 특성 상 로그인을 길게 유지할 수 있도록하는 요구사항이 있으며 레디스는 기본값에 따라 최대 메모리 설정이 되어있지 않았으므로 레디스에서는 메모리 할당이 불가능한 경우 가상 메모리를 통해 스왑까지 시도할 수 있는 상황이 되어버린 상태입니다.

아무튼 무분별하게 저장된 세션 키들은 만료 시점이 되어서야 자동으로 키가 삭제되므로 레디스의 메모리 사용량이 조금씩 늘어나는 것을 모니터링 지표에 나타나게 된 것입니다. 메모리 사용량이 늘어나는 이유에 대해서 이렇게 무분별하게 저장되는 원인을 찾아야하는데 레디스에 세션 데이터를 등록하는 것은 애플리케이션일 것이므로 변경사항에 대해서 다시 자세하게 검토해야 했습니다.

#### 스프링 프레임워크의 구현을 이해하지 못한 이유로 무분별한 세션 데이터가 저장될 수 있음
변경사항 중 보안 요구사항에 따라 사용자의 요청이나 내부적인 작업으로 인해 데이터베이스에 SQL이 호출되기까지의 일련의 과정을 감시할 수 있도록 로그로 저장하거나 출력을 해야했고 이 과정에서 요청된 세션 아이디가 있다면 항목에 포함되어야 했습니다. 이 작업은 공통 모듈 코드로써 컨트롤러 레벨이 아닌 서비스나 DB 레이어에서 수행되었는데 관련 로직에서는 세션 아이디를 기록하기 위해서 스프링 프레임워크에서 제공하는 [RequestContextHolder](https://github.com/spring-projects/spring-framework/blob/main/spring-web/src/main/java/org/springframework/web/context/request/RequestContextHolder.java)를 통해 [RequestAttributes](https://github.com/spring-projects/spring-framework/blob/main/spring-web/src/main/java/org/springframework/web/context/request/RequestAttributes.java)를 가져온 후 세션 아이디를 반환하는 함수를 호출하도록 작성되었습니다.

사실 단순히 코드만 확인한다면 해당 요구사항에 대한 처리 로직으로 인해 무분별하게 세션 데이터가 저장될 수 있는지 검토하는 건 어려울 것이라는 생각이 듭니다. 세션 아이디를 가져오는 함수에 대해서 자세히 살펴보아야 아래와 같이 빈 값(NULL)이 될 수 없다는 것이 주석으로 설명되어 있기 때문입니다.

```java
/**
 * Return an id for the current underlying session.
 * @return the session id as String (never {@code null})
 */
String getSessionId();
```

이에 따라 스프링 프레임워크 개발자는 [ServletRequestAttributes](https://github.com/spring-projects/spring-framework/blob/52e967a5256d389f486b0159e05e2656e4411701/spring-web/src/main/java/org/springframework/web/context/request/ServletRequestAttributes.java#L138-L142) 구현체에서 세션 아이디가 반드시 반환되어야하므로 요청 정보에서 세션을 가져올 때 없으면 생성되도록 인자가 반드시 true인 상태로 동작하게 구현해두었음을 확인하였습니다. 일반적으로는 세션 방식이나 토큰 기반의 인증 중 하나를 수행하는 애플리케이션을 만들게 될 텐데 아직은 모놀리식 프로젝트로써 (일부는 모듈화) 기본적인 사용자가 호출하는 세션 방식의 API와 IoT와 같은 외부 데이터 연계를 위해서 사용하는 토큰 기반의 OAuth API를 모두 사용할 수 있도록 되어있는 배경이 있습니다.

세션 아이디라 함은 세션 방식의 요청에서만 의미가 있으며 세션이 활용되지 않는 토큰 기반의 요청에 대해서는 레디스에 세션 데이터가 저장될 사유가 없습니다. 해당 코드가 서블릿 요청이라면 스레드 로컬을 통해서 현재 요청 정보를 가져올 수 있으므로 세션 아이디를 가져오는 함수를 무조건 호출하는 점을 생각해보니 토큰 기반 요청에서 세션 아이디를 가져오는 함수를 호출하게 되는 경우 존재하지 않았던 새로운 세션이 만들어지게 된다는 것을 인지하게 되었습니다. 스프링 세션의 내부 구현에 의해서 요청에 대한 응답을 수행하고나서 그 과정에서 변경된 세션 정보들이 있다면 레디스에 저장하기 때문에 토큰 기반 요청에서 내부적으로 세션을 발급해버리면 스프링 세션은 요청이 무엇인지를 판단하지 않고 세션이 생성되었으니 레디스에 저장하게 됩니다.

#### 세션 아이디를 조회하는 코드 로직의 변경
스프링 프레임워크의 구현을 제대로 이해하지 못한 상태에서 요구사항을 처리한 개발자의 실수인 것은 명확합니다. ServletRequestAttributes를 통해 세션 아이디를 쉽게 가져올 수 있었으나 상황에 따라 예상하지 못했던 결과를 가져오게 되었으므로 세션 아이디를 조회하는 코드를 HttpServletRequest로부터 현재 스레드 로컬 내에 세션이 있다면 가져오도록 변경했습니다. 이렇게 하면 토큰 기반 요청 시에는 새로운 세션이 만들어지지 않으므로 더이상 스프링 세션의 내부 동작이 수행되지 않아 불필요하게 세션 관련 키가 저장되지 않습니다.

#### 운영적인 측면의 레디스 옵션 권고
본 문제에 대한 원인을 찾아가기까지 생각보다 어려웠기 때문에 임시 대응책으로 최대 메모리 설정을 권고하였습니다. 그러나, 운영적인 측면으로 바라보았을때는 최대 메모리 제한 및 메모리 정책에 대한 옵션들은 반드시 적용해두었어야할 항목입니다. 아마도 문제가 발생하기 전까지는 여러가지 항목에 대해서 신경쓰지 않아도 정상적으로 운용되었기에 기본값으로도 충분하다고 생각되었을지 모릅니다.

```conf
tcp-backlog 1024
maxmemory 400mb
maxmemory-policy allkeys-lfu
```

```shell
ulimit -n 65535
echo 'net.ipv4.tcp_max_syn_backlog=1024' >> /etc/sysctl.conf
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

> 위 내용은 레디스 운영 관련 글을 검색해보고 정리한 항목인데 리눅스 커널 파라미터 조정에 대해서는 아직은 고객측에게 전달하지 않은 상태입니다. 

한가지 명확하지 않은 부분은 최대 메모리 옵션에 적용되어야할 수치인데 BGSAVE를 통해 RDB 스냅샷을 수행하는 경우 Fork 방식으로 프로세스를 복제하여 덤프 파일을 생성하기 때문에 실제로 메모리 사용량이 두배 이상이 될 수 있다는 점입니다. 대부분 OS 메모리의 60% ~ 70% 정도의 값으로 설정하라고 설명하지만 이 부분을 고려하지 않은 수치 이거나 클러스터를 구성하였을 경우를 이야기할 지 모르겠습니다.

#### 트러블슈팅 회고
개발자로써는 생각지도 못한 이슈를 경험하였지만 고객은 사용중인 제품에 대한 안정성을 문제삼을 수 있는 큰 이슈였습니다. 그러나, 개인적으로는 원인을 찾아가는 과정에서 redis-cli를 통해서 여러가지 명령어를 수행하며 데이터를 확인해볼 수 있는 좋은 경험이었다고 생각됩니다. 또한, 원인을 확정해가는 과정에서 부하 테스트 도구인 k6를 이용해서 가상의 사용자를 통해 OpenAPI를 호출해보기도 하였습니다. 이 문제에 대해서 돌아보면서 이 경험과 비슷한 [(Troubleshooting) 레디스 사망일기](https://perfectacle.github.io/2019/05/29/redis-monitoring/)라는 글도 확인한다거나 [Redis 야무지게 사용하기](https://www.youtube.com/watch?v=92NizoBL4uA)를 통해서 레디스에 대해서도 다시한번 학습하는 계기가 되었습니다. 