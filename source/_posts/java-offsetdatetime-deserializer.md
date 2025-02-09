---
title: OffsetDateTime Deserializer
date: 2025-01-24T20:00+09:00
tags:
- OffsetDateTime
- ObjectMapper
- Deserializer
---

스프링 부트에서 사용하는 ObjectMapper를 위해서 Jackson 라이브러리에서 지원하고 있는 [JavaTimeModule을 등록](https://www.baeldung.com/java-jackson-offsetdatetime#registering-javatimemodule)하여 OffsetDateTime에 대한 Serializer를 등록할 수 있습니다. 기본으로 제공되는 OffsetDateTimeSerializer는  <u>2025-01-24T00:00:00+09:00</u> 와 같은 패턴에 대한 변환을 지원하기도 하고 지난 [자바 날짜 및 시간 포맷](/java-datetime-format/)에서 여러 형태의 패턴을 지원하기 위해 [DateTimeFormatter를 만들어 사용](https://www.baeldung.com/java-datetimeformatter)하기도 했었습니다.

#### KDB+의 Timestamp 문자열

```q KDB+
`timestamp$.z.d
2025.01.24D00:00:00.000000000

`datetime$`timestamp$.z.d
2025.01.24T00:00:00.000
```

```java
Caused by: com.fasterxml.jackson.databind.exc.InvalidFormatException: Cannot deserialize value of type `java.time.OffsetDateTime` from String "2025-01-24T00:00:00.000000000": Failed to deserialize java.time.OffsetDateTime: (java.time.format.DateTimeParseException) Text '2025-01-24T00:00:00.000000000' could not be parsed at index 29
```

KDB+라고 하는 시계열 데이터베이스의 [Timestamp](https://code.kx.com/q/basics/datatypes/#temporal)는 JSON으로 변환하는 경우  <u>2025-01-24T00:00:00.000000000</u> 형태의 나노초 정밀도를 가지는 UTC 기준의 문자열이 됩니다. 따라서, 기존에 만들었던 DateTimeFormatter로는 커버할 수 없는 패턴이므로 OffsetDateTime으로 변환할 수 없음을 위 오류 로그를 통해 확인할 수 있습니다. 이런 경우에는 일반적인  <u>ISO_OFFSET_DATE_PATTERN</u>이 아니므로 ObjectMapper에 OffsetDateTime을 위한 Deserializer 를 등록하여 의도하는 DateTimeFormatter를 사용하도록 코드를 수정해야할 수 밖에 없습니다.

#### 나노초 정밀도를 지원하는 OffsetDateTimeDeserializer

```java JsonConfig
@Bean
public Jackson2ObjectMapperBuilder objectMapperBuilder() {
    return new Jackson2ObjectMapperBuilder()
            .modules(new JavaTimeModule())
            .deserializerByType(OffsetDateTime.class, new OffsetDateTimeDeserializer());
}

private static class OffsetDateTimeDeserializer extends JsonDeserializer<OffsetDateTime> {
    @Override
    public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException {
        String str = jsonParser.getValueAsString();
        if (str == null || str.isEmpty()) {
            return null;
        }

        // NOTE: 숫자로만 구성되는 밀리초 단위의 타임스탬프
        if (str.matches("^\\d+$")) {
            long value = jsonParser.getNumberValue().longValue();
            Instant instant = Instant.ofEpochMilli(value);
            return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
        }

        try {
            return OffsetDateTime.parse(str, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (DateTimeException e) {
            // NOTE: KDB+ Timestamp
            return OffsetDateTime.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS").withZone(ZoneOffset.UTC));
        }
    }
}
```

생성된 [ObjectMapper에 Deserializer를 등록](https://www.baeldung.com/jackson-deserialization)할 수도 있지만 __Jackson2ObjectMapperBuilder__ 를 사용하는 경우 위과 같이 OffsetDateTime 클래스에 대한 Deserializer를 등록할 수 있는 함수를 별도로 제공하고 있습니다. 위 예시 코드는 숫자로 구성된 경우와 일반적인 포맷으로 변환을 할 수 없으면  <u>나노초 정밀도를 가지는 KDB+ 타임스탬프 문자열</u>을 처리하도록 작성한 것 입니다. 프로덕션의 코드에서는 ObjectMapper 뿐만 아니라  <u>Gson에 대한 Deserializer를 작성하여 함께 사용</u>하고 있습니다.
