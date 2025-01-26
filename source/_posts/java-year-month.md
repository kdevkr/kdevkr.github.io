---
title: 자바에서 연도와 월 다루기
date: 2025-01-26T12:00+09:00
tags:
- LocalDate
- Year
- YearMonth
- TemporalAdjusters
---

자바에서 날짜 및 시간을 다루는 경우 Instant, OffsetDateTime 또는 ZonedDateTime과 같이 타임존 오프셋이 포함되는 것을 활용하는 것이 좋습니다. 그런데, 가끔은 <U>연,월,일 통계와 같은 요구사항으로 인해</U> YearMonth 또는 LocalDate를 사용해야하는 경우가 있습니다. 예를 들어, 2025년 2월에 대한 통계를 위해서 2025년 2월의 <U>첫번째 날짜와 마지막 날짜의 범위를 알아야</U> 합니다. 첫번째 날짜는 명확하므로 간단하지만 마지막 날짜는 월마다 다른데 특히나, 2월의 마지막 날짜는 28일이기도 합니다.

자바에서 연 또는 월에 대한 마지막 날짜를 가져오는 방법을 여러가지가 있습니다. Year 또는 YearMonth의 lengthXXX 함수를 통해 마지막 날짜를 가져와서 지정할 수 있으며 YearMonth 에는 더 직관적인 atEndOfMonth 함수를 포함하고 있습니다. 또한, <U>[TemporalAdjusters](https://www.baeldung.com/java-temporal-adjuster)</U>를 통해 날짜를 변환하는 것도 가능하죠.

#### 월 누적을 위한 첫번째 날짜와 마지막 날짜 가져오기

```java
YearMonth yearMonth = YearMonth.of(2025, 2);
LocalDate startDate = yearMonth.atDay(1);
LocalDate endDate = yearMonth.atEndOfMonth();
```

> 마지막 날짜를 구하기 위해서 YearMonth.lengthOfMonth 또는 TemporalAdjusters.lastDayOfMonth 함수를 이용할 수도 있습니다.

#### 연 누적을 위한 첫번째 날짜와 마지막 날짜 가져오기

```java
Year year = Year.of(2025);
LocalDate firstDate = year.atDay(1);
LocalDate lastDate = year.atDay(year.length());
```

> 마지막 날짜를 구하기 위해서 TemporalAdjusters.lastDayOfYear 함수를 이용할 수도 있습니다.

#### 스프링 컨트롤러 핸들러 함수 파라미터

```java
@RestController
@RequestMapping("/api")
public class SampleApi {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.registerCustomEditor(Month.class, new MonthPropertyEditor());
    }

    @GetMapping("/stat/{year:[0-9]{4}}")
    public ResponseEntity<?> getStatOfYear(@PathVariable("year") Year year) {
        LocalDate fromDate = year.atDay(1);
        LocalDate toDate = year.atDay(year.length());
        return ResponseEntity.ok(Map.of(
                "from", fromDate.format(DATE_FORMAT),
                "to", toDate.format(DATE_FORMAT)));
    }

    @GetMapping("/stat/{yearMonth:[0-9]{4}\\-[0-9]{2}}")
    public ResponseEntity<?> getStatOfYearMonth(
            @DateTimeFormat(pattern = "yyyy-MM")
            @PathVariable("yearMonth") YearMonth yearMonth) {
        LocalDate fromDate = yearMonth.atDay(1);
        LocalDate toDate = yearMonth.atEndOfMonth();
        return ResponseEntity.ok(Map.of(
                "from", fromDate.format(DATE_FORMAT),
                "to", toDate.format(DATE_FORMAT)));
    }

    @GetMapping("/stat/{year}/{month}")
    public ResponseEntity<?> getStatOfYearMonth(@PathVariable("year") Year year,
                                                @PathVariable("month") Month month) {
        return getStatOfYearMonth(YearMonth.of(year.getValue(), month));
    }

    private static class MonthPropertyEditor extends PropertyEditorSupport {
        @Override
        public void setAsText(String text) throws IllegalArgumentException {
            if (text.matches("\\d+")) {
                setValue(Month.of(Integer.parseInt(text)));
                return;
            }
            setValue(Month.valueOf(text.toUpperCase()));
        }
    }
}
```

스프링 컨트롤러의 핸들러 함수를 작성할 때 연도와 월에 대한 파라미터를 int 가 아닌 <U>Year와 YearMonth</U>를 그대로 활용할 수 있도록 바인딩이 가능합니다. 단, <U>Month</U>의 경우 클래스가 아닌 Enum 이기 때문에 별도의 <U>PropertyEditor</U>를 작성하여 <U>WebDataBinder</U>에 등록해야합니다. 파라미터 바인딩으로 변환하는 과정을 공통적으로 적용하므로 더 효율적이고 직관적인 코드를 작성할 수 있음을 알았습니다.
