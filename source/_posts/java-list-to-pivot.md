---
title: 자바에서 데이터 리스트를 피봇 테이블로 만들기
date: 2025-02-09T19:00+09:00
tags:
- List
- Pivot
---

```java Data
@Getter
@Setter
public class Data {
    private String date;
    private String report;
    private Double sum;
    private Double avg;
}
```

```java PivotData
@ToString
@Getter
@Setter
@JsonNaming(value = PropertyNamingStrategies.UpperSnakeCaseStrategy.class)
@SuppressWarnings({"squid:S116"})
public class PivotData {
    @JsonProperty("date")
    private String date;
    private Double POWER;
    private Double ENERGY;
    private Double TEMP;
    private Double HERTZ;
}
```

```java PivotDataConverter
@UtilityClass
public class PivotDataConverter {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, String> AVG_REPORTS = Set.of("POWER", "TEMP", "HERTZ").stream()
            .collect(Collectors.toUnmodifiableMap(s -> s, s -> s));

    public static List<PivotData> from(List<Data> list) {
        return MAPPER.convertValue(list.stream()
                .collect(Collectors.groupingBy(Data::getDate))
                .entrySet()
                .parallelStream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date", entry.getKey());
                    entry.getValue().forEach(data -> {
                        Double value = AVG_REPORTS.containsKey(data.getReport()) ? data.getAvg() : data.getSum();
                        row.put(data.getReport(), value);
                    });
                    return row;
                }).toList(), new TypeReference<>() {
        });
    }
}
```

날짜와 리포트 항목으로 이루어진 **시계열 데이터의 통계 정보**를 날짜와 리포트 항목별 값 형태로 이루어지는 **피봇 테이블 리스트**로 바꿔보았습니다. 날짜를 포함한 하나 이상의 필드로 그룹핑 되면서 리포트 항목에 따라  **합계** 또는  **평균값**을 사용해야 합니다. [Collectors.groupingBy](https://www.baeldung.com/java-groupingby-collector) 를 사용해서 데이터 리스트를 날짜 기준으로 그룹핑하고 각 리포트 항목을 하나의 Map 으로 생성하고나서 **ObjectMapper**를 사용해 피봇된 형태의 클래스를 가진 리스트로 변환했습니다. 위 예시에서 전력량에 대해서만 합계를 사용하지만 실제로는 대부분의 리포트 항목에 대해 합계값을 사용하게 되므로 평균값을 사용해야하는 리포트 항목만을 별도로 관리하도록 코드를 작성했습니다.