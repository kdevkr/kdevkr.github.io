---
title: 타임스탬프 문자열 패턴
date: 2022-10-10
tags:
- Java
- PostgreSQL
- Moment
- Elasticsearch
---

현재 조직에서 만드는 시스템에서 특정 언어를 사용하도록 설정된 계정에서만 [캘린더](https://fullcalendar.io/)에 입력된 예약 스케줄 정보가 표시되지 않는다는 버그 리포트를 받았습니다. 처음에는 버그 리포트의 내용처럼 캘린더 라이브러리에 언어 정보가 적용되지 않아서 표시되지 않는다고 1차원적으로 예상하였습니다. 그러나 실제로는 예약된 스케줄 정보가 표시되지 않은 이유는 자바스크립트 날짜/시간 라이브러리로 사용중인 Moment.js 에서 사용중인 날짜 템플릿 패턴이 올바르게 적용되지 않은 상태로 코드가 작성되어 있었어요.

#### 문제에 대한 원인

프론트엔드 코드에서 Moment를 사용하여 예약 스케줄에 대한 날짜 정보를 다음과 같은 패턴으로 포맷팅을 하도록 되어있었어요.

```js
let dateFormat = moment().format('yyyy-MM-DD HH:mm:ss.SSS')
```

위 코드의 문제점을 바로 알아차리신 분들이라면 공식 문서를 제대로 참고하는 프론트엔드 개발자라고 생각되는데요. [Moment.js의 공식 문서 상 날짜 포맷팅 패턴](https://momentjs.com/docs/#/displaying/format/)을 살펴보면 yyyy 라는 표현은 Era Year로 되어있습니다. 현재 시스템은 다국어 지원을 위해서 영어, 한국어, 일본어를 선택할 수 있도록 제공하고 있는데요. 기본적으로는 영어와 한국어를 사용하게 되는데 문제가 발생했던 것은 [일본어를 선택한 계정에서](https://jsfiddle.net/pcjrk2ob/3) 였습니다.

```js
moment().format('yyyy-MM-DD HH:mm:ss.SSS')
"0004-10-10 17:03:28"
```

신입 프론트엔드 개발자는 개발 환경에서 한국어로 선택된 계정에서 작업을 진행했고 요구사항을 처리하는 과정에서 위 포맷을 적용해도 정상적으로 의도한 날짜 포맷으로 변환되어 작업을 완료했다고 배포 목록에 포함되었을 것입니다.

#### 언어 또는 기술마다 날짜 표현 패턴이 다르다
위 문제를 경험하고나서 찾아보니 언어마다 혹은 기술마다 날짜를 표현하는 포맷이 달랐는데요. 사용하는 기술에 대해서 좀 더 주의해야겠다는 생각을 가지게 된 것 같습니다.

- [Java DateTimeFormatter](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html#patterns) : yyyy-MM-dd HH:mm:ss.SSS
- [PostgreSQL Date/Time Formatting](https://www.postgresql.org/docs/current/functions-formatting.html#FUNCTIONS-FORMATTING-DATETIME-TABLE) : YYYY-MM-DD HH24:MI:SS.MS
- [Elasticsearch date formats](https://www.elastic.co/guide/en/elasticsearch/reference/current/migrate-to-java-time.html#java-time-migration-incompatible-date-formats) : uuuu-MM-dd HH:mm:ss

> 개발자의 사소한 실수로부터 만들어진 버그지만 그 내면에는 알아야할 중요한 정보가 남아있습니다. 많은 개발자 분들이 자신이 한 실수에 대해서 공유하는 문화도 만들어지면 좋을 것 같네요. 그리고 이 사이드 이펙트를 만들어낸 것은 조직의 신입 프론트엔드 개발자이지만 코드를 검토해주지 않는 동료 개발자와 제대로 테스트되지 않은 채로 배포된 조직의 문제로 볼 수 있습니다. 조직 내 개발자들이 조금씩이나마 코드 리뷰를 할 수 있는 환경이 만들어지기를 바랍니다.