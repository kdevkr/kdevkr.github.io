---
title: KDB+
date: 2021-11-05
tags:
 - Kx
 - KDB+
---

> 이 글은 KDB+라는 시계열 데이터베이스를 활용하면서 국내 레퍼런스를 찾아볼 수 없는 문제로 인하여 별도로 정리한 내용입니다. 따라서, 전문적으로 활용하는 수준은 아니므로 잘못된 정보가 포함되어있을 수 있음을 알려드립니다. KDB+에 대한 더 자세한 내용은 https://github.com/kdevkr/kdb를 참고하시기 바랍니다.

## KDB+
[KDB+](https://kx.com/)는 KxSystems라는 회사에서 개발하고 제공하는 상용 시계열 데이터베이스입니다. 메모리 엔진을 사용하므로 데이터를 넣거나 연산을 수행하는 시간이 굉장히 짧습니다. 그러나 q 라는 자체적으로 고안한 언어에 대해서 이해해야해서 러닝커브에 대한 단점이 있습니다. 예를 들어, 다음은 KxSystems에서 권장하는 [Tickerplant라는 아키텍처의 스크립트 일부분](https://github.com/KxSystems/kdb-tick/blob/master/tick.q)입니다.
```q
ld:{if[not type key L::`$(-10_string L),string x;.[L;();:;()]];i::j::-11!(-2;L);if[0<=type i;-2 (string L)," is a corrupt log. Truncate to length ",(string last i)," and restart";exit 1];hopen L};
tick:{init[];if[not min(`time`sym~2#key flip value@)each t;'`timesym];@[;`sym;`g#]each t;d::.z.D;if[l::count y;L::`$":",y,"/",x,10#".";l::ld d]};

endofday:{end d;d+:1;if[l;hclose l;l::0(`.u.ld;d)]};
ts:{if[d<x;if[d<x-1;system"t 0";'"more than one day?"];endofday[]]};

if[system"t";
 .z.ts:{pub'[t;value each t];@[`.;t;@[;`sym;`g#]0#];i::j;ts .z.D};
 upd:{[t;x]
 if[not -16=type first first x;if[d<"d"$a:.z.P;.z.ts[]];a:"n"$a;x:$[0>type first x;a,x;(enlist(count first x)#a),x]];
 t insert x;if[l;l enlist (`upd;t;x);j+:1];}];

if[not system"t";system"t 1000";
 .z.ts:{ts .z.D};
 upd:{[t;x]ts"d"$a:.z.P;
 if[not -16=type first first x;a:"n"$a;x:$[0>type first x;a,x;(enlist(count first x)#a),x]];
 f:key flip value t;pub[t;$[0>type first x;enlist f!x;flip f!x]];if[l;l enlist (`upd;t;x);i+:1];}];
```

KDB+에서는 q라는 언어로 작성된 스크립트를 사용합니다. 위처럼 KxSystems에서 제공하는 샘플 스크립트가 존재하기는 하지만 코드에 대한 설명이 없으므로 위 코드를 이해하는 건 전부 사용자인 개발자의 몫이며 이로 인하여 러닝커브가 높을 수 있습니다. 저는 Q 언어에 대한 튜토리얼을 제공할 의도가 아니므로 공식 레퍼런스에서 제공하는 정보를 참고하면서 알게되거나 느낀점을 공유해보려고 합니다.

> Q 언어에 대해서 궁금하시다면 [Q language resources by topic](https://code.kx.com/q/basics/by-topic/)를 참고하세요.

### q 프로세스
KDB+/q 프로세스는 Windows, Mac OSX, Linux 운영체제에서 사용할 수 있도록 지원합니다. 운영체제에 따라 사용할 수 있는 기능이 몇가지 부분에 대해서 다를 수는 있습니다. 예를 들어, 리눅스 운영체제에서는 [프로세스 통신](https://code.kx.com/q4m3/11_IO/#116-interprocess-communication)을 위해 TCP/IP를 사용할 때 유닉스 도메인 소켓 방식을 사용할 수 있습니다.

#### 실행 환경 변수
KDB+의 q 프로세스는 실행되는 시점에 QHOME, QLIC, QINIT 환경 변수를 참조합니다. 

- QHOME: KDB 프로세스를 실행하기 위하여 부트스트랩할 q.k 파일을 찾는 경로입니다.
- QLIC: KDB 프로세스에서 사용할 라이센스 파일을 지정합니다. 기본적으로 QHOME 경로에서 kc.lic 파일을 요구합니다.
- QINIT: q.k 파일이 부트스트랩된 이후에 루트 컨텍스트 위치에서 실행될 스크립트 파일입니다. 이 환경변수가 정의되지 않으면 QHOME 위치에서 q.q 파일을 실행합니다.

#### 프로세스 실행 인수
공식 문서의 [커맨드 라인 옵션](https://code.kx.com/q/basics/cmdline/)을 참고하면 프로세스 실행 시 적용할 수 있는 인수 옵션을 확인할 수 있습니다. 일반적으로 프로세스를 실행할 때 지정하는 옵션은 아래와 같습니다.

```q
// -p: 수신 포트
// -s: 병렬 처리 시 사용될 보조 스레드
q script.q -p 5000 -s 8
```

프로세스 실행 시 보조 스레드 옵션을 지정해야 스레드가 활성화되며 REPL에서만 동작합니다. 따라서, 백그라운드 데몬 프로세스를 실행하는 경우 보조 스레드 수를 동적으로 변경할 수 없습니다. 아래와 같이 클라이언트를 통해 q 프로세스에 보조 스레드 수를 변경하기 위한 시스템 명령을 전달하는 경우 오류가 발생합니다.

```q
q)\s 4
'enable secondary threads via cmd line -s only
```

#### 프로세스 종료
REPL 세션 또는 연결된 클라이언트에서 [\\](https://code.kx.com/q/basics/syscmds/#quit)를 입력하거나 [exit 0](https://code.kx.com/q/ref/exit/)을 입력해서 프로세스를 종료할 수 있습니다. 

```q
\\\
exit 0
sublime-q >> 현재 연결은 원격 호스트에 의해 연결이 강제로 끊겼습니다.
```

### 스크립트 파일
REPL인 q 세션에서는 멀티 라인 표현식을 지원하지 않습니다. 따라서, [스크립트 파일](https://code.kx.com/q/learn/tour/scripts/)을 작성하는게 더 효율적이며 서브라임 텍스트의 [sublime-q](https://github.com/komsit37/sublime-q)와 같은 패키지를 활용하면 쉽게 q 프로세스와 통신하여 상호작용이 가능합니다. 또한, 스크립트 파일을 작성해두면 q 프로세스를 실행할 때 해당 스크립트 파일을 불러올 수 있도록 추가할 수 있습니다.

```q
q script.q -p 5000
KDB+ 4.0 2021.07.12 Copyright (C) 1993-2021 Kx Systems
w64/ 12(16)core 32700MB Mambo desktop-ojj4tb3 192.168.0.2 EXPIRE 2022.11.01 kdevkr@gmail.com KOD #5006323

2021.11.04T22:38:41.153 [INFO] KDB+ Version: 4
2021.11.04T22:38:41.153 [INFO] KDB+ ProcessID: 24388
2021.11.04T22:38:41.153 [INFO] KDB+ License: 16 2022.11.01 2022.11.01 1 0 0 0 kdevkr@gmail.com KOD #5006323 0
The script file loaded after q.q file.
```

> QINIT 또는 q.q 파일에 정의된 스크립트는 무조건 실행되므로 공통으로 적용되어야하는 사항은 QINIT 스크립트 파일에 작성하는 것이 좋습니다.

#### 스크립트 내 프로세스 통신
스크립트 내에서 프로세스 통신을 위해 [Connection handles](https://code.kx.com/q/basics/handles/)를 사용하는 경우 일반적인 문자열 형태의 q 표현식을 전달하는 것보다는 [람다 함수와 파라미터](https://code.kx.com/q/learn/startingkdb/ipc/)를 보내는 메시지 형식을 사용하는 것이 더 효율적입니다.

```q
h: hopen `::5011;
h({trades};::)
```

위와 같이 함수와 파라미터를 전달하는 경우 IDE에서 지원하는 구문 강조가 적용되어 원하는 바를 더 명확하게 확인할 수 있다는 장점도 제공됩니다.

#### 커맨드 라인 파라미터
프로세스에서 실행할 스크립트를 작성할 때 프로세스 실행 시 입력해야할 정보가 필요할 수 있습니다. KDB에서 제공하는 미리 정의된 네임스페이스를 통해 커맨드 라인에서 입력한 파라미터를 스크립트에서 가져올 수 있습니다.

```q
q -p 5000 -pidfile q.pid
```

```q
// .z.x를 사용하여 커맨드 라인 옵션을 제외한 인수를 파라미터로 가져올 수 있다.
.z.x
"-pidfile"
"q.pid"

// .Q.opt를 사용하여 커맨드 라인 파라미터를 Dict로 변경할 수 있다.
.Q.opt .z.x
pidfile| "q.pid"

// .Q.def를 사용하여 커맨드 라인 파라미터에 대한 기본값을 정의할 수 있다.
.Q.def[`whoami`logdst`pidfile!(`mambo;`$("logs/q.log");`)].Q.opt .z.x
whoami | mambo
logdst | logs/q.log
pidfile| q.pid
```

### 사용자 및 패스워드
[사용자에 대한 패스워드를 정의한 파일을 지정](https://code.kx.com/q/basics/cmdline/#-u-usr-pwd)하여 q 프로세스와의 연결을 제한할 수 있습니다. 비밀번호는 평문, MD5, SHA-1을 지원합니다. 단, 사용자와 비밀번호 암호 방식은 유일해야하므로 평문을 사용하는 사용자와 SHA-1 해시가 적용된 사용자를 같이 구성할 수 없습니다. q 프로세스를 실행할 때 -u 옵션에 패스워드 파일을 지정하면 프로세스 실행 후에도 패스워드 파일을 수정하고 \u 명령어로 프로세스를 중단하지 않고 사용자 및 패스워드를 적용할 수 있습니다. 이와 같은 정보를 토대로 다음과 같은 방식으로도 사용자 및 패스워드를 적용할 수 있습니다.

**익명 사용자에 대한 패스워드 파일 생성**
```txt
:
```

**q 프로세스 실행 시 패스워드 파일 적용**
```q
q -p 5000 -u userpass.txt
```

**신규 사용자의 패스워드 해시 생성**
```q
// raze string md5 "mambo"
// "dfa67b75dc3d5868c3e88c83774c0d01"

raze string -33!"mambo"
"78492a38605bdf6e691c4e2f77c69c4a0904c647"
```

**신규 사용자 및 패스워드 적용 후 저장**

```txt
mambo:78492a38605bdf6e691c4e2f77c69c4a0904c647
```

**사용자 및 패스워드 정보 갱신**
```q
\u

hopen `:localhost:5000:mambo:mambo
```

> 패스워드 파일에 사용자 이름을 생략함으로써 익명 사용자에 대한 비밀번호도 적용할 수 있습니다.

### 아키텍처
학습 단계에서는 KDB+를 단일 q 프로세스로 실행하여 사용하지만 실제로 운용되는 환경에서는 KxSystems에서 권장하는 [Tickerplant 아키텍처](https://code.kx.com/q/architecture/)를 구성합니다. q 프로세스에서 사용할 메모리가 부족해지면 **`wsfull** 오류가 발생하고 프로세스가 종료되는 문제점을 가지고 있습니다. Tickerplant는 FeedHandler에서 전송되는 데이터를 수신하는 TP 프로세스와 TP 프로세스로 들어온 데이터를 가져가는 RDB(Realtime DB) 프로세스, 날짜 또는 시간 단위로 저장하는 HDB(Historical DB) 프로세스로 분리하게 됩니다. 각 프로세스의 역할이 구분되어있으므로 현재 날짜 또는 시간에 대한 데이터를 메모리에 저장하는 RDB 프로세스가 예기치 못한 상황에 종료되더라도 TP 프로세스는 지속적으로 데이터를 수신할 수 있게 됩니다.

> [Realtime database](https://code.kx.com/q/learn/startingkdb/tick/)
> As a minimum, it is recommended to have RAM of at least 4× expected data size, so for 5 GB data per day, the RDB machine should have at least 20 GB RAM. In practice, much larger RAM might be used.

위 내용에 따르면 날짜별로 파티셔닝되는 구조를 가지는 경우에 RDB 프로세스에 5GB 규모의 데이터를 보유하고 있어야한다면 시스템적으로 최소한 20GB 만큼의 메모리가 준비되어야합니다. 또한, 시스템 자원을 준비할 수 있지 않아 날짜가 아닌 시간 단위로 파티셔닝하는 경우 무수히 많은 폴더가 만들어지므로 긴 범위의 기간에 대한 연산을 수행하여야하는 경우 I/O 성능이 좋은 디스크를 사용해야할 수 있습니다.

#### 데이터 관리
Tickerplant는 KDB+에서 권장되는 아키텍처이지만 데이터 관리에 대한 문제점을 가지고 있습니다. 일반적으로 사용되는 증권 시장의 경우 데이터가 순차적으로 발생한다는 것이 보장되며 지난 기간에 대한 데이터가 현재 시간에 들어오지 않는다는 것을 기준으로 하기 때문에 사업 분야와 고객의 요구사항으로 인하여 현재 시점에 지난 기간에 대한 데이터를 등록하는 경우 RDB 프로세스에서 메모리에 저장된 데이터를 파일로 저장하는 시점에 해당 파티션 폴더에는 지난 기간에 대한 파티션 데이터가 포함되어있게 됩니다.

q 프로세스에서 파티션 테이블에 대해서는 각 파티션에 맞는 데이터만 존재해야함을 보장해야합니다. 그 이유는 데이터 연산 시 파티셔닝의 기준이 되는 특수한 컬럼을 통해 전체 파티션을 조회하지 않고도 빠르게 필요한 파티션의 데이터를 메모리에 로드할 수 있기 때문입니다. 결국에는 RDB 프로세스가 저장한 파티션 폴더의 데이터를 확인하고 올바른 파티션에 데이터를 병합해야하는 작업을 수행해야합니다.

데이터베이스를 운용하면서 데이터 병합 과정을 거치고 난 후 파티셔닝된 폴더가 순차적으로 나열되지 않을 수 있을 수 있습니다. 이러한 문제가 발생하는 경우 q 프로세스는 정확한 파티션을 확인할 수 없으므로 일부 조회가 불가능한 상태가 될 가능성이 있습니다. 다행히도 KDB+에서 제공하는 몇가지 함수를 이용해서 잘못된 파티셔닝을 바로 잡도록 작업을 수행해볼 수 있습니다.

- [.Q.chk (fill HDB)](https://code.kx.com/q/ref/dotq/#qchk-fill-hdb)
- [.Q.bv (build vp)](https://code.kx.com/q/ref/dotq/#qbv-build-vp)
- [.Q.vp (missing partitions)](https://code.kx.com/q/ref/dotq/#qvp-missing-partitions)

```q
.Q.bv[]
.Q.vp

.Q.chk[]
```

### 제한 및 오류
KDB+의 q 프로세스에 존재하는 몇가지 제한 사항에 대해서 알아보겠습니다.

#### 라이센스 코어 제한
먼저, 상업용 라이센스를 구매하더라도 라이센스에 지정된 코어 수를 넘어가게되는 시스템을 사용하려는 경우 q 프로세스 실행 시 **`cores** 라는 오류가 발생합니다. 이는 q 프로세스가 해당 코어 수를 사용할 수 있도록 허용되지 않기 때문이므로 프로세스를 실행할 때 리눅스의  **taskset**을 활용하여 프로세스가 사용할 수 있는 CPU를 지정해야합니다.

#### 함수 파라미터 개수 제한
공식 문서의 [Errors](https://code.kx.com/q/basics/errors/)를 참고하면 q 프로세스에서 발생하는 오류에 대해서 검토할 수 있습니다. 특히, 함수 파라미터 개수는 최대 8개로 제한되어있는 특징이 있습니다. 따라서, 스크립트에 정의하는 함수 또는 람다에서 사용되는 파라미터 개수가 8개보다 많아지는 경우 Dict를 활용해야할 수 있습니다. 이외에도 다음의 제한된 사항이 있습니다.

- conn: Too many connections (1022 max)
- elim: Too many enumerations (max: 57)
- globals: Too many global variables
- limit: Too many constants
- locals: Too many local variables
- params: Too many parameters (8 max)

### 느낀점
현재 조직에서는 KDB+ 시계열 데이터베이스를 사용중이지만 이와 관련한 국내 레퍼런스는 찾아볼 수 없으므로 다른 회사로 이직하게되면 더이상 관심가지지않을 것 같습니다. 컬럼형 시계열 데이터베이스이면서 빠른 속도를 제공하는 것은 맞지만 그에 따른 라이센스 비용과 어떻게 사용하는 것이 좋거나 문제가 발생했을때의 해결방안을 찾고 원하는 결과를 가지기 위해서 Q 언어와 함께 qSQL이라고하는 SQL과 비슷하지만 다른 쿼리를 작성하는 것이 효율적이다라고 볼 수 없는 것 같습니다.

기본적으로 메모리에 데이터를 저장하고 파일로 저장된 데이터는 연산 시 메모리에 불러오게되므로 데이터 규모에 따라 프로세스를 실행하는 시스템 자원이 보장되어야한다는 문제점도 있습니다. 시스템 메모리 자원을 확보할 수 없는 경우 파티션으로 저장되는 구조를 지원하지만 다수의 폴더로 분산하여 데이터를 저장하기 때문에 디스크 I/O 성능도 고려해야합니다. 결국 예상되는 규모에 따라 안정적으로 운용될 수 있도록 시스템 자원을 준비해야합니다.

조직내에서는 어쩔 수 없이 사용하고 있지만 개인적으로 학습하는 것은 추천하지 않을 것 같습니다.

## 레퍼런스

- [code.kx](https://code.kx.com/)
- [community.kx](https://community.kx.com/)




