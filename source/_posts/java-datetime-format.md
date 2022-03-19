---
title: 자바 날짜 및 시간 포맷
date: 2022-03-19
tags:
- TimeZone
- ZoneId
- Instant
- ZonedDateTime
- DateTimeFormatter
---

여러 국가를 대상으로 해야하는 서비스를 만들어가게 되는 경우 언어 뿐만 아니라 시간을 다루는 것도 중요합니다. 단순하게 말해서 한국에서 서비스를 제공한다고해서 한국 시간으로 모든 시간 데이터를 다루는 것은 좋은 방식이 아닙니다. 기본적으로는 UTC라고 하는 세계 협정 시간을 기준으로 시간을 저장해야합니다. PostgreSQL과 같은 데이터베이스에서도 Timestamp를 저장하게 되는 경우 내부적으로는 UTC로 저장됩니다. 따라서, 2022년 3월 19일 12시 라는 시간은 `2022년 3월 19일 03시`로 저장되는것이죠.

> 애플리케이션 뿐만 아니라 서버 그리고 데이터베이스 모두 UTC로 설정하여 사용하는게 일반적입니다. 예를 들어, 아마존 웹 서비스의 EC2는 한국 리전인데도 불구하고 한국 시간대가 아닌 UTC로 설정되어있습니다.

그리고 시간 데이터를 전달할 때는 `2022-03-19 12:00`과 같은 문자열 형태가 아닌 [Unix Timestamp](https://www.unixtimestamp.com/)의 밀리초가 부여된 상태로 서버와 클라이언트간 요청과 응답에 사용됩니다. 가끔씩 국내 시간만 다루던 개발자들이 UTC 또는 Unix Timestamp에 대해서 모르는 경우도 꽤 많았습니다. 밀리초 형식의 Unix Timestamp를 전달받았으나 실제로 변환해보니 9시간이 빠진게 아니라 오히려 9시간이 더해진 상태로 전달하던 경험도 있습니다.

## Java Date Format
서버와 클라이언트 간에 시간 데이터를 전달하거나 개발자 사이에 API를 제공할 때에는 앞서 이야기한 Unix Timestamp로 전달하도록 스펙을 맞출 수 있습니다. 그러나 개발자가 아닌 일반 사용자가 서비스 내에서 CSV 또는 엑셀 파일 형식으로 데이터를 업로드하거나 다운로드 받을때에는 숫자값인 Unix Timestamp가 아닌 `2022-03-19 12:00:00`과 같은 어떠한 문자 형태이어야합니다. 왜냐하면 일반인들은 UTC가 무엇인지 Unix Timestamp가 무엇인지 모르는 사람이 많으니까요. 심지어는 개발자들 중에서도...

> 자바 8의 Date/Time API에 대해서는 네이버 D2에 공유된 [Java의 날짜와 시간 API]([https://d2.naver.com/helloworld/645609)를 참고하시면 좋을 것 같습니다.

### DateTimeFormatter
자바 8의 날짜 및 시간 클래스에 대해서 날짜 포맷을 적용해야하는 경우 [DateTimeFormatter](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html)를 사용해야합니다. 그리고 일반적으로 다음과 같은 코드로 날짜 데이터를 변환할 수 있죠.

```java
TimeZone tzSeoul = TimeZone.getTimeZone("Asia/Seoul");
String dateStr = "2022-03-19 12:00:00";
DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(tzSeoul.toZoneId());
ZonedDateTime dateTime = ZonedDateTime.parse(dateStr, dateTimeFormatter);
System.out.printf("%s -> %s%n", dateStr, dateTime);
```

> 위 코드는 이해하기에는 쉬우나 한가지 문제점은 어떤 특정한 형태의 문자열로 구성된 데이터만 변환할 수 있다는 점입니다.

만약, 서비스 사용자가 2022년 3월 19일 0시의 시간을 표현하고자 한다면 2022-03-19 00:00:00과 같이 불필요하게 00:00:00을 붙여야하는 단점이 생기게 됩니다. 이를 보완하기 위해서는 여러가지 형식의 날짜 포맷을 처리할 수 있는 코드가 필요합니다.

### DateTimeFormatterBuilder
여러가지 형태의 날짜 형식을 지원해야하는 경우에는 **Optional 패턴**을 적용해서 처리할 수 있습니다. DateTimeFormatter에 그대로 적용할수도 있으나 DateTimeFormatterBuilder를 통해 여러가지 처리 방식에 대한 옵션이 적용된 형태로 DateTimeFormatter를 만들 수 있습니다.

```java
TimeZone tzSeoul = TimeZone.getTimeZone("Asia/Seoul");
DateTimeFormatter dateTimeFormatter = new DateTimeFormatterBuilder()
        .appendPattern("[yyyy-MM-dd HH:mm:ss]")
        .appendPattern("[yyyy-MM-dd HH:mm]")
        .appendPattern("[yyyy-MM-dd]")
        .parseDefaulting(ChronoField.HOUR_OF_DAY, 0)
        .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
        .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
        .toFormatter()
        .withZone(tzSeoul.toZoneId());

String[] dateStrArr = new String[]{"2022-03-19 00:00:00", "2022-03-19 00:00", "2022-03-19"};

for (String dateStr : dateStrArr) {
    ZonedDateTime dateTime = ZonedDateTime.parse(dateStr, dateTimeFormatter);
    System.out.printf("%s -> %s%n", dateStr, dateTime);
}

// 2022-03-19 00:00:00 -> 2022-03-19T00:00+09:00[Asia/Seoul]
// 2022-03-19 00:00 -> 2022-03-19T00:00+09:00[Asia/Seoul]
// 2022-03-19 -> 2022-03-19T00:00+09:00[Asia/Seoul]
```

#### Unable to obtain LocalTime from TemporalAccessor
```java
TimeZone tzSeoul = TimeZone.getTimeZone("Asia/Seoul");
DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("[yyyy-MM-dd HH:mm:ss][yyyy-MM-dd HH:mm][yyyy-MM-dd]").withZone(tzSeoul.toZoneId());

String[] dateStrArr = new String[]{"2022-03-19 00:00:00", "2022-03-19 00:00", "2022-03-19"};

for (String dateStr : dateStrArr) {
    ZonedDateTime dateTime = ZonedDateTime.parse(dateStr, dateTimeFormatter);
    System.out.printf("%s -> %s%n", dateStr, dateTime);
}
```

위와 같이 DateTimeFormatterBuilder를 사용하지 않고서도 DateTimeFormatter 패턴 자체로 날짜 포맷 체이닝을 구성할 수 있습니다. 그러나, 2022-03-19와 같이 시간 부분이 없는 형태의 경우에는 다음과 같이 처리할 수 없다는 예외가 발생하게 됩니다.

```java
java.time.format.DateTimeParseException: Text '2022-03-19' could not be parsed: Unable to obtain ZonedDateTime from TemporalAccessor: {},ISO,Asia/Seoul resolved to 2022-03-19 of type java.time.format.Parsed
	at java.base/java.time.format.DateTimeFormatter.createError(DateTimeFormatter.java:2017)
	at java.base/java.time.format.DateTimeFormatter.parse(DateTimeFormatter.java:1952)
	at java.base/java.time.ZonedDateTime.parse(ZonedDateTime.java:598)
	at test.Main.main(Main.java:17)
Caused by: java.time.DateTimeException: Unable to obtain ZonedDateTime from TemporalAccessor: {},ISO,Asia/Seoul resolved to 2022-03-19 of type java.time.format.Parsed
	at java.base/java.time.ZonedDateTime.from(ZonedDateTime.java:566)
Caused by: java.time.DateTimeException: Unable to obtain ZonedDateTime from TemporalAccessor: {},ISO,Asia/Seoul resolved to 2022-03-19 of type java.time.format.Parsed

	at java.base/java.time.format.Parsed.query(Parsed.java:235)
	at java.base/java.time.format.DateTimeFormatter.parse(DateTimeFormatter.java:1948)
	... 2 more
Caused by: java.time.DateTimeException: Unable to obtain LocalTime from TemporalAccessor: {},ISO,Asia/Seoul resolved to 2022-03-19 of type java.time.format.Parsed
Caused by: java.time.DateTimeException: Unable to obtain LocalTime from TemporalAccessor: {},ISO,Asia/Seoul resolved to 2022-03-19 of type java.time.format.Parsed

	at java.base/java.time.LocalTime.from(LocalTime.java:431)
	at java.base/java.time.ZonedDateTime.from(ZonedDateTime.java:561)
	... 4 more
```

> 따라서, DateTimeFormatterBuilder로 문자열로 구성된 날짜 및 시간 데이터에 구성되지 않는 부분을 어떻게 처리할 것인가에 대한 옵션을 적용하여 DateTimeFormatter를 만들어서 사용하는게 좋아보입니다.

만약, 이 글을 보시는 여러분들이 여러가지 형태의 날짜 포맷을 처리하기 위해서 아래와 같이 DateTimeFormattter를 여러개 만들어서 처리하는 코드를 작성했다면 DateTimeFormatterBuilder로 하나의 DateTimeFormatter를 사용해서 좀 더 깔끔한 형태의 코드로 만들어보시기를 추천해드립니다.

```java
String dateStr = "2022-03-19";
ZonedDateTime dateTime = null;
try {
    dateTime = ZonedDateTime.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(tzSeoul.toZoneId()));
} catch (DateTimeException e) {
    LocalDateTime localDateTime = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(tzSeoul.toZoneId())).atStartOfDay();
    dateTime = ZonedDateTime.of(localDateTime, tzSeoul.toZoneId());
}
System.out.println(dateTime);
```

감사합니다.