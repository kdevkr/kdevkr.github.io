---
title: 리눅스 프로세스를 안전하게 종료시키는 방법
date: 2026-04-25T20:00+09:00
tags:
    - Linux
    - Shell Script
    - DevOps
---

# 리눅스 프로세스를 안전하게 종료시키는 방법

최근 신규 프로젝트 환경 구성 중, 종료 스크립트 테스트 과정에서 서버의 모든 프로세스가 종료되는 사고가 있었습니다. 본 포스트에서는 해당 사고의 ==트러블슈팅 과정==과 올바른 프로세스 종료 방안을 정리합니다.

## 1. 사고 원인: 빈 변수와 pgrep의 함정

PID 재사용 문제를 방지하기 위해 도입한 `pgrep -f` 방식이 ==변수 미할당==과 만나 대참사를 일으켰습니다.

### 결함이 있는 스크립트 (실제 사례)

```bash [dangerous-kill.sh]
TICK_PORT=$(prop 'TICK_PORT')
RDB_WRITER_PORT=$(prop 'RDB_WRITER_PORT')
RDB_READER_PORT=$(prop 'RDB_READER_PORT')
HDB_WRITER_PORT=$(prop 'HDB_WRITER_PORT')
GATEWAY_PORT=$(prop 'GATEWAY_PORT') # HDB Reader
FEED_PORT=$(prop 'FEED_PORT') # 설정값에 없어 빈 값이 할당됨

# 종료할 프로세스 포트 목록
PORTS=("$TICK_PORT" "$RDB_WRITER_PORT" "$RDB_READER_PORT" "$FEED_PORT")

# 실행중인 프로세스 종료 시도
for port in "${PORTS[@]}"; do
  # $port가 비어있을 경우 pgrep -f "p "가 실행됨
  pgrep -f "p $port" | xargs -r kill -9 2>/dev/null
done
```

### AI 분석 결과

- **패턴 매칭**: 루프를 돌던 중 설정되지 않은 **`$FEED_PORT`** 값이 비어 있어 `pgrep -f "p "`가 실행되었습니다. 이 패턴은 서버 내의 다른 모든 시계열 데이터베이스 프로세스들이 공통적으로 사용하는 **`-p $PORT`** 옵션 문자열과 매칭되었고, 결과적으로 시스템 내 가동 중이던 모든 DB 인스턴스를 종료 대상으로 검출하여 종료시켰습니다.
- **결과**: 신규 TSDB 인스턴스만 종료하려던 시도가 서버 내에서 가동 중이던 **모든 시계열 데이터베이스 프로세스를 종료**시켜버렸습니다. 시스템 로그만으로는 명확한 원인을 파악하기 어려워 OOM으로 오해하기 쉬운 상황이었으나, AI를 통한 스크립트 정밀 분석으로 결함이 판명되었습니다.

## 2. ==안전한 종료==를 위한 기술적 대안

### 정확한 타겟팅 (lsof, ss, fuser)

명령행 문자열에 의존하는 `pgrep`보다 커널 레벨의 파일 서술자를 확인하는 도구가 안전합니다.

```bash [safe-kill-examples.sh]
# 1. lsof: 특정 포트의 PID만 추출하여 종료
PID=$(lsof -ti :$PORT)
[ -n "$PID" ] && kill -15 $PID

# 2. ss: sport 필터를 사용해 해당 포트의 PID만 추출
PID=$(ss -ltpn sport = :$PORT | grep -oP 'pid=\K\d+')
[ -n "$PID" ] && kill -15 $PID

# 3. fuser: 특정 포트 프로세스에 SIGTERM(15) 전송
fuser -k -15 $PORT/tcp
```

### 시그널 활용: SIGTERM vs SIGKILL

프로세스를 강제로 종료하는 **SIGKILL(9)** 보다 **SIGTERM(15)** 을 먼저 수행하여, 프로세스가 ==IPC 리소스 정리==와 데이터 저장을 스스로 마무리할 기회를 주어야 합니다.

## 3. 쉘 스크립트 ==방어 코드==

### 변수 검증 및 교차 검증

`${VAR:?}` 구문을 사용하여 빈 변수일 경우 스크립트를 즉시 종료(Fail-fast)하고, PID 파일과 실제 실행 패턴을 대조하여 검증합니다.

```bash [robust-kill.sh]
PID_FILE="${1:?PID 파일 경로가 필요합니다.}"
PATTERN="${2:?프로세스 매칭 패턴이 필요합니다.}"

# PID 파일 존재 여부와 패턴 일치를 동시에 검증 (pgrep -F)
if pgrep -F "$PID_FILE" -f "$PATTERN" > /dev/null; then
    kill -15 $(cat "$PID_FILE")
    # 종료 확인 후 PID 파일 삭제
    sleep 1
    kill -0 $(cat "$PID_FILE") 2>/dev/null || rm -f "$PID_FILE"
fi
```

### Wait & Kill 전략

SIGTERM 후 일정 시간 대기하며 프로세스 생존 여부를 `kill -0`으로 확인한 뒤, 종료되지 않으면 SIGKILL을 보냅니다.

```bash
kill -15 $PID
for i in {1..10}; do
  kill -0 $PID 2>/dev/null || exit 0
  sleep 1
done
kill -9 $PID
```

## 마치며: AI 에이전트의 역할에 대하여

이번 사고는 무심코 지나치기 쉬운 ==스크립트 결함== 이었는데요. 원인을 찾지 못하고 넘어갈 수도 있었는데 **AI 에이전트** 의 도움으로 스크립트의 논리적 결함을 빠르게 찾아내어 개발자의 ==트러블슈팅 과정== 에 도움이 되었습니다. 다만, AI 에이전트의 ==모델적 한계== 가 있기 때문에 모든 케이스를 찾아낼 순 없을겁니다. 인프라 엔지니어가 아닌 개발자에게 AI 에이전트의 ==인프라 지식== 은 큰 도움이 됩니다.
