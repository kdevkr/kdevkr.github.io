---
title: 비트마스크를 활용한 설비 디바이스 Fault 처리
date: 2026-04-30T07:00+09:00
description: 산업 설비의 결함·경고 상태를 16비트 정수로 압축해 효율적으로 처리하는 방법을 비트마스크, Java BitSet, kdb+/q 예시로 정리합니다.
tags:
    - Bitmask
    - BitSet
    - vs
---

# 비트마스크를 활용한 설비 디바이스 Fault 처리

**비트마스크는 하나의 정수를 사용해서 여러 개의 상태에 대한 ON/OFF 플래그를 관리할 수 있는 기술**입니다. 산업 현장의 설비 디바이스에서 발생하는 결함(Fault)이나 경고(Warning) 등의 이벤트 상태를 효율적으로 처리할 때 주로 활용됩니다.

## 1. 2-Byte Word 기반 상태 압축

SCADA나 PLC 같은 산업용 제어 시스템에서는 메모리와 대역폭의 최적화가 필수적입니다. 수십 개의 장비 상태를 각각 `boolean`이나 문자열로 전송하기엔 페이로드 낭비가 심합니다.

대신 **여러 상태를 묶어 16비트 정수형(2바이트 워드)** 형태로 압축하여 전송하면, 2바이트 패킷 하나로 최대 16개의 상태 코드를 한 번에 처리할 수 있습니다.

### 비트별 이벤트 매핑 테이블 예시 (Alarm, Warning, Error)

| Bit 위치 |  Hex 값  |      이진수 표현      | 상태 명칭 (이벤트)              | 심각도  |
| :------: | :------: | :-------------------: | :------------------------------ | :-----: |
|    0     | `0x0001` | `0000 0000 0000 0001` | 정전 발생 (Blackout)            |  Alarm  |
|    1     | `0x0002` | `0000 0000 0000 0010` | 누전 감지 (Leakage)             |  Alarm  |
|    2     | `0x0004` | `0000 0000 0000 0100` | 과전압 발생 (Overvoltage)       | Warning |
|    3     | `0x0008` | `0000 0000 0000 1000` | 저전압 발생 (Undervoltage)      | Warning |
|    4     | `0x0010` | `0000 0000 0001 0000` | 과열 감지 (Overheat)            | Warning |
|    5     | `0x0020` | `0000 0000 0010 0000` | 통신 지연 (Comm Delay)          | Warning |
|    6     | `0x0040` | `0000 0000 0100 0000` | 팬 모터 과부하 (Fan Overload)   |  Error  |
|    7     | `0x0080` | `0000 0000 1000 0000` | 비상 정지 작동 (E-Stop)         |  Alarm  |
|    8     | `0x0100` | `0000 0001 0000 0000` | 센서 통신 오류 (Sensor Fail)    |  Error  |
|    9     | `0x0200` | `0000 0010 0000 0000` | 필터 교체 주기 (Filter Clog)    | Warning |
|    10    | `0x0400` | `0000 0100 0000 0000` | 전류 불평형 (Current Unbalance) |  Error  |
|    11    | `0x0800` | `0000 1000 0000 0000` | 가스 누출 감지 (Gas Leak)       |  Alarm  |
|    12    | `0x1000` | `0001 0000 0000 0000` | 메인 전원 상실 (Power Loss)     |  Alarm  |
|    13    | `0x2000` | `0010 0000 0000 0000` | 보정 데이터 유실 (Calibration)  |  Error  |
|    14    | `0x4000` | `0100 0000 0000 0000` | 정기 점검 도래 (Maintenance)    | Warning |
|    15    | `0x8000` | `1000 0000 0000 0000` | 시스템 재부팅 (System Reset)    | Warning |

> [!NOTE]
> **심각도(Severity) 구분**
>
> - **Alarm**: 즉각적인 조치가 필요한 치명적 상태.
> - **Error**: 장비가 정상 작동하지 않는 결함 상태.
> - **Warning**: 예방 정비 및 주의가 필요한 상태.

## 2. 비트 연산 (Bitwise)

설비 데이터로부터 각 상태 플래그를 추출해 내는 연산 패턴입니다.

- **특정 비트 위치(`pos`)의 ON 확인**

    ```java
    int status = 5;
    boolean isOn = ((status >> pos) & 1) == 1;
    ```

- **비트 플래그 추출 및 검출 (`BitSet`)**

    ```java
    int status = 5;
    BitSet bitSet = BitSet.valueOf(new long[]{status});
    boolean isOn = bitSet.get(pos);
    ```

- **이진수 문자열 ↔ 정수**:
    - 문자열 ➡️ 정수: `Integer.parseInt("1010", 2); // 10`
    - 정수 ➡️ 문자열: `Integer.toBinaryString(10); // "1010"`

## 3. Java 구현 예시

```java [FaultHandler.java]
void main() throws Exception {
    // kdb+ IPC 드라이버 접속
    c connection = new c("localhost", 5001);

    // reverse 키워드로 비트 벡터 순서를 뒤집어 LSB를 0번 인덱스로 위치시킴
    boolean[] bits = (boolean[]) connection.k("reverse 0b vs 5h");

    if (bits[0]) System.out.println("정전");
    if (bits[1]) System.out.println("누전");
    if (bits[2]) System.out.println("과전압");
    if (bits[3]) System.out.println("저전압");
}
```

## 4. 시계열 데이터베이스(TSDB) 활용

대용량 데이터 처리에 특화된 **kdb+/q** 환경에서는 `vs`(Vector from Scalar) 키워드로 대규모 장비 상태 정수를 비트 벡터로 쉽게 변환할 수 있습니다.

```q
// 16비트 정수 상태(5)를 비트 벡터로 복원
q) flags: 0b vs 5h
q) flags
0000000000000101b

// LSB를 0번 인덱스로 맞추기 위해 비트 벡터 뒤집기
q) reverse 0b vs 5h
1010000000000000b

// 비트 벡터로부터 원본 정수 복원
q) 0b sv flags
5h
```

공식 Java IPC 클라이언트(`c.java`)는 kdb+의 비트 벡터를 Java의 `boolean[]` 배열로 자동 매핑해 주므로 별도의 비트 파싱 로직이 불필요하여 BitSet 를 사용할 필요는 없습니다. BitSet는 정수형 값이 주어지는 경우에 활용해보세요.
