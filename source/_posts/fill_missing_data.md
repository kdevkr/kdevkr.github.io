---
title: 비어있는 날짜 데이터를 채우는 방법
date: 2025-08-04T22:00+09:00
tags:
- Java
- PostgreSQL
- KDB+
---

한국전력의 전기요금은 검침일 기준으로 월 청구요금이 계산된다고 한다. 만약, 일별 요금 정보가 존재할 때 빠져있는 일자를 채우려면 어떻게 해야할까? 
자바 애플리케이션 코드, 데이터베이스 SQL, 그리고 시계열 데이터베이스 기준에서 알아보도록 하자.

#### 자바 코드에서 빠진 날짜를 채우기

```java
List<Billing> billingList = new ArrayList<>();
billingList.add(Billing.of(LocalDate.parse("2025-07-10")).setBill(0).calVat());
billingList.add(Billing.of(LocalDate.parse("2025-07-11")).setBill(50).calVat());
billingList.add(Billing.of(LocalDate.parse("2025-07-12")).setBill(25).calVat());

LocalDate startDate = LocalDate.parse("2025-07-10");
LocalDate endDate = LocalDate.parse("2025-08-09");

Set<LocalDate> billDates = billingList.stream().map(Billing::getBillDate).collect(Collectors.toSet());
Set<LocalDate> dates = startDate.datesUntil(endDate.plusDays(1L)).collect(Collectors.toSet());
for (LocalDate date : dates) {
    if (!billDates.contains(date)) {
        billingList.add(Billing.of(date));
    }
}
```

#### PostgreSQL에서 빠진 날짜를 채우기

```sql
SELECT 
  d::date AS bill_date,
  COALESCE(s.bill, 0) AS bill,
  COALESCE(s.vat, 0) AS vat
FROM 
  generate_series('2025-07-10'::date, '2025-08-09'::date, '1 day') d
LEFT JOIN 
  billing s ON s.bill_date = d::date
ORDER BY 
  d;
```

#### KDB+ 시계열 데이터베이스에서 빠진 날짜를 채우기

```q
n:11;
dates: ([] bill_date: {x +til y-x}[2025.07.10;2025.08.09]);
billing: `bill_date xkey ([] bill_date: n?dates`bill_date; bill: n?100; vat: n?0.0f);
result: update bill:0^bill, vat:0^vat from dates lj billing;
```

그런데, 만약 일별 요금 정보가 다수의 고객들이 함께 포함된다면 어떻게 해야하지???