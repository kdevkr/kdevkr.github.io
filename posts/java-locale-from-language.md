---
title: 문자열에서 로케일로 변환하는 방법
date: 2024-02-21T23:00+0900
tags:
- Locale
- LocaleUtils
- StringUtils
---

#### Locale.forLanguageTag

```java
Locale.forLanguageTag("ko_KR"); // → ""
Locale.forLanguageTag("ko_KR".replace("_", "-")); // → ko_KR
```

Locale.forLanguageTag 함수에서 `ko-KR` 이 아닌 `ko_KR` 과 같이 언어(Langauge)와 국가(Country)에 대한 정보를 언더스코어 형태의 문자열을 파라미터에 넣는 경우 오류가 발생하지 않고 **비어있는 Locale**이 만들어진다. 따라서, `Locale.forLanguageTag` 함수를 이용해서 로케일로 변환하려는 경우에는 **언더스코어(_)를 하이픈(-)으로 변환**해야한다.

#### LocaleUtils 와 StringUtils

String 클래스에 포함되어있는 replace 함수를 이용해서 `IETF BCP 47 언어 태그` 형식으로 변경해도 되지만 스프링 프레임워크 또는 프로젝트에서 많이 사용되는 라이브러리에 포함되어있는 아래와 같은 유틸 함수들을 이용해도 문자열을 Locale로 올바르게 변환할 수 있다.

```java
org.apache.commons.lang3.LocaleUtils.toLocale("ko_KR")l
org.springframework.util.StringUtils.parseLocale("ko_KR");
```
