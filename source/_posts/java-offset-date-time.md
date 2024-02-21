---
title: Java OffsetDateTime
date: 2024-02-22T12:00+0900
tags:
- OffsetDateTime
- DateTimeFormatter
- DateTimeFormatterRegistrar
---

```java
OffsetDateTime.parse("2024-01-01T00:00:00+09:00") // OK 
OffsetDateTime.parse("2024-01-01T00:00:00+0900")  // Parse Error! 
```

자바에서 OffsetDateTime 을 사용하여 날짜 및 시간 정보를 전달하거나 받을 때 위와 같이 +0900과 같이 콜론(:) 구분자가 포함되지 않는 오프셋 표현에 대해서는 변환을 지원하지 않는다. DateTimeFormatter로 Z 나 XX로 +0900에 대한 오프셋을 인식할 수 있지만 왜 기본적으로는 유연하게 지원하지 않는 걸까?

#### DateTimeFormatter.ISO_OFFSET_DATE_TIME

```java DateTimeFormatter
static {
    ISO_OFFSET_DATE_TIME = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .append(ISO_LOCAL_DATE_TIME)
            .parseLenient()
            .appendOffsetId()
            .parseStrict()
            .toFormatter(ResolverStyle.STRICT, IsoChronology.INSTANCE);
}
```

그 이유는 appendOfffsetId 함수 내부적으로 OffsetIdPrinterParser.INSTANCE_ID_Z 를 사용하고 있으며 +01:00 과 같은 표현식을 지원하고 오프셋이 포함되지 않는 경우 Z로 인식하도록 되어있기 때문이다. 따라서, `+HHmm` 형태의 포맷을 처리할 수 있도록 설정하면 되는데 스프링 부트 프로젝트라면 아래와 같이 기본 설정을 변경할 수 있다.

```yml application.yml
spring.mvc.format:
  date-time: yyyy-MM-dd'T'HH:mm:ss[Z][XX]
  time: HH:mm:ss[Z][XX]
```

> Java Time API 에는 OffsetDate 는 없으며 날짜 표현은 LocalDate 로 가능합니다.

#### DateTimeFormatterRegistrar

WebMvcProperties 속성으로 날짜 및 시간에 대한 패턴을 설정하는 것보다 더 유연하게 DateTimeFormatterBuilder를 사용해서 여러가지 패턴을 함께 처리하고 싶은 경우에는 DateTimeFormatterRegistrar를 사용하여 FormatterRegistry에 등록할 수 있다.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setDateTimeFormatter(dateTimeFormatter());
        registrar.setTimeFormatter(timeFormatter());
        registrar.setUseIsoFormat(true);
        registrar.registerFormatters(registry);
    }

    public DateTimeFormatter dateTimeFormatter() {
        return new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("[yyyy-MM-dd'T'HH:mm:ss]")
            .appendPattern("[yyyy-MM-dd'T'HH:mm]")
            .optionalStart()
            .appendOffsetId()
            .optionalEnd()
            .optionalStart()
            .appendOffset("+HHmm", "Z")
            .optionalEnd()
            .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
            .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
            .parseDefaulting(ChronoField.MILLI_OF_SECOND, 0)
            .toFormatter();
    }

    public DateTimeFormatter timeFormatter() {
        return new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendOptional(DateTimeFormatter.ISO_OFFSET_TIME)
            .appendPattern("[HH:mm:ss]")
            .appendPattern("[HH:mm]")
            .optionalStart()
            .appendOffsetId()
            .optionalEnd()
            .optionalStart()
            .appendOffset("+HHmm", "Z")
            .optionalEnd()
            .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
            .toFormatter();
    }

}
```

#### 쿼리 파라미터 오프셋 인코딩 처리

```txt
/api/period?start=2024-02-20T00:00:00+09:00&end=2024-02-20T23:00:00+09:00
```

포스트맨 도구로 위와 같이 쿼리 파라미터에 오프셋을 포함하는 날짜 및 시간 정보를 전달한다면 `+` 문자로 인해 오류가 발생한다. URL 표준 스펙에서 + 문자는 공백을 의미하므로 서버에서 인식할 수 있는 문자열은 `2024-02-20T00:00:00 09:00` 이다. 포스트맨에서 입력한 값을 드래그하면 Set Variable 팝오버 기능이 표시되는데 **URI 인코딩과 디코딩할 수 있는 옵션**을 제공한다. 오프셋을 표현하는 `+` 문자는 `%2B` 로 변환하여 전달해야한다.

![](https://file.okky.kr/images/1708432889280.png)
