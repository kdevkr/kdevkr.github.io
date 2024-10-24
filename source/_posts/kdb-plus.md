---
title: KDB+ 시계열 데이터베이스
date: 2024-10-24T21:00+09:00
tags:
- KDB+
- Performance
---

KDB+는 벡터 기반의 언어를 제공하며 높은 성능을 제공하는 시계열 데이터베이스를 조금 더 활용할 수 있는 방안을 알아보자.

#### 병렬 처리를 위한 보조 스레드

KDB+는 기본적으로 싱글 코어와 싱글 스레드 기반으로 동작한다. 병렬 처리(Parallel Processing)는 별도의 보조 스레드에 의해 수행된다. 보조 스레드는 KDB+ 프로세스 실행 시 `-s` 옵션으로 지정하며 메인 스레드와 보조 스레드간 통신은 IPC 직렬화를 수행하므로 오버헤드가 큰 작업에 해당되므로 사용중인 코어 수에 따라 적당한 보조 스레드를 구성해야한다. 또한, 프로세스 내에서 보조 스레드 수를 조정할 순 있지만 프로세스 실행 시 지정한 보조 스레드 수를 넘을 순 없음에 주의해야한다.

```sh
q -p 5555 -s 12
```

- Parallel Each – peach
- Parallel on Cut – .Q.fc

> 다수의 파티션을 조회해야하는 HDB 프로세스는 보조 스레드를 두어 사용자 정의 함수에서 병렬 처리가 가능하도록 고려하세요.

#### 파티션 수에 따른 디스크 성능 이슈

관계형 데이터베이스에서 디스크 I/O 가 중요한 것처럼 KDB+ 에서도 일정 시간 범위에 대한 데이터를 조회하기 위하여 확인해야할 파티션의 수에 따라 디스크 I/O가 중요해진다. 예를 들어, 1시간 단위로 저장해놓은 파티션의 경우에 한달 범위에 대한 통계를 위해서 조회하고자 한다면 약 720개의 파티션 폴더를 조회해야하고 KDB+ 프로세스는 해당 폴더 액세스를 위해 디스크 볼륨에 의존할 수 밖에 없다. 이처럼 시계열 데이터베이스를 활용한다고 해도 하루에 저장되는 데이터 규모에 따라 파티션을 결정해야하는 것이 중요하다. KDB+ 에서는 다수의 디스크 볼륨을 사용할 수 있는 [세그먼트](https://code.kx.com/q/database/segment/)도 지원하는데 서로 다른 디스크 볼륨을 통해 병렬 액세스를 수행할 수 있다.

> Partition data correctly: data for a particular date must reside in the partition for that date.

##### 조회 범위 별 소요 시간 비교

| 기준 | 조회 범위 | 시간별 파티션 | 일자별 파티션 |
| ---- | --------- | ------------- | ------------- |
| 일별 | 한달      | 2.95s 🌀       | 30ms⭐️         |
| 주간 | 7일       | 50ms          | 40ms          |
| 월간 | 1년       | 40.79s 🔥      | 83ms⭐️         |

> InfluxDB 또는 TimescaleDB 에서 [Continuous aggregates](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/) 기능을 포함하고 있는 이유도 규모가 큰 데이터를 빠르게 조회하기 위함 입니다.

#### 조회 성능을 향상시킬 수 있는 속성

KDB+ 에서는 Sorted, Unique, Grouped, Parted 와 같은 [속성(Attribute)](https://code.kx.com/q/ref/set-attribute/)을 제공하여 쿼리에 대한 성능을 높일 수 있다. 관계형 데이터베이스에서 인덱스와 힌트라고 이해하면 될 것 같다.

```q
/ apply attributes
meter_with_attr: 0!update `s#id, `p#name, `g#timestamp from `name xasc select from meter
meta meter_with_attr

| c         | t f a |
| --------- | ----- |
| date      | d     |
| id        | s   s |
| name      | s   p |
| timestamp | p   g |
| val       | f     |

/ remove attributes
meter_with_attr:update `#id,`#name from meter_with_attr
meta meter_with_attr

| c         | t f a |
| --------- | ----- |
| date      | d     |
| id        | s     |
| name      | s     |
| timestamp | p   g |
| val       | f     |
```

> 파티션으로 저장된 테이블은 모든 파티션에 속성이 지정되어있어야 합니다. [dbmaint.setattrcol](https://github.com/KxSystems/kdb/blob/master/utils/dbmaint.md#setattrcol) 를 참고하세요.

---

벡터 DB에 대한 관심도가 높아지면서 [KDB.AI](https://kdb.ai/)는 AI를 위한 벡터 데이터베이스로 제공하는가 봅니다.
