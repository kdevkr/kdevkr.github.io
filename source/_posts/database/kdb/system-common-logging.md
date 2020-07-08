---
    date: 2020-07-08
    title: KDB - System Common Logging
    tags:
      - KDB
---

## 들어가며
KDB+/q 스크립트에서 로그 메시지를 출력하는 방법과 함께 `Log4j`와 같이 로그 레벨 기반의 로깅 시스템을 적용하기 위한 방법에 대해서 알아봅니다.

## System Common Logging

### Write in Console
KDB+에서 콘솔에 값을 출력하기 위한 방법은 여러가지가 있습니다.

- [!Display](https://code.kx.com/q/ref/display/)
- [show](https://code.kx.com/q/ref/show/)
- -1 또는 -2

기본 `q.q` 파일의 내용에서처럼 `-1`과 `-2`를 이용하여 문자열을 출력할 수 있습니다.
```q kdb+/q
-1"Welcome to kdb+ 32bit edition\nFor support please see http://groups.google.com/d/forum/personal-kdbplus\nTutorials can be found at http://code.kx.com\nTo exit, type \\\\\nTo remove this startup msg, edit q.q";
```

단, `!Display` 와 `show`는 따옴표가 그대로 출력되므로 감안하고 사용하시기 바랍니다.

### System.out.println
자바에서 가장 기본적인 로그 출력 함수는 `System.out.println`입니다. 그렇다면 q 스크립트에서 사용할 기본 메시지 출력 함수를 만들어봅시다.

```q kdb+/q
.system.out.println:{-1 " "sv string`date`second$.z.P," ",x;}
/ join strings using raze
.system.out.println:{-1 raze[(" "sv string`date`second$.z.P;" ";x)];}
```

로컬 타임스탬프에서 날짜와 시간을 추출하여 하나의 문자열로 만든 후 파라미터로 받은 문자열 x를 결합하여 콘솔로 출력합니다.

### Logging with LogLevel
기본 메시지 출력 함수를 정의해보았으나 이를 사용하기에는 뭔가 좀 불편한 부분이 있습니다. `Log4j`와 같은 라이브러리는 로그 레벨에 따라 로그를 출력할지 말지를 결정합니다. 우리도 기본 메시지 출력 함수를 로그 레벨에 따라 출력되도록 확장해봅시다.

먼저, `.system` 네임스페이스에 데이터베이스에 대한 로그 레벨 변수를 만들겠습니다.
로그 레벨은 다음과 같이 error, info, warn, debug, trace로 구성합니다.

```q kdb+/q
\d .system
logLevel: 0

/ 로그 출력 형식
-1 raze[" "sv string`date`second$.z.P]," ","INFO"," - ","Hello World"]
```

로그 출력함수는 `날짜 시간 로그레벨 - 메시지` 형식으로 출력합니다. 이제 로그레벨별로 로그 함수를 정의합니다.

```q kdb+/q
.system.log:{if[x <= .system.logLevel;-1 raze[" "sv string`date`second$.z.P]," ",y," - ",z]}

.log.error: .system.log[0;"[ERROR]"]
.log.info: .system.log[1;"[INFO]"]
.log.warn: .system.log[2;"[WARN]"]
.log.debug: .system.log[3;"[DEBUG]"]
.log.trace: .system.log[4;"[TRACE]"]
```

그러면 이제 시스템 로그 레벨을 디버그로 설정하고 디버그 단위로 출력하면 시스템 로그로 남기게 됩니다.

```q
.system.logLevel:3
.log.debug "Hello World"

/ 2020.07.08 09:10:54 [DEBUG] - Hello World
```