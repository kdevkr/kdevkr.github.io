---
title: 코틀린과 Jackson 라이브러리
date: 2025-02-19T00:00+09:00
tags:
- Kotlin
- Jackson
---

개인적으로 에너지 사업에서 사용되는 [KPX의 중개거래 API에 대한 모킹](https://github.com/kdevkr/deras-mock-api) 샘플을 만들어보면서 코틀린 기반 스프링 애플리케이션을 학습해보고 있습니다. 이 과정에서 간단하게 경험한 Jackson 관련 내용을 적어보고자 합니다. 본 글에 작성된 것은 오직 코틀린에만 해당하는 내용이 아닐 수 있으므로 주의하여 참고하시길 바랍니다.

```kts build.gradle.kts
dependencies {
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
}
```

Jackson 라이브러리에서는 [코틀린 지원](https://www.baeldung.com/kotlin/jackson-kotlin)을 위해 [jackson-module-kotlin](https://github.com/FasterXML/jackson-module-kotlin) 모듈을 제공하고 있습니다. 그래서 코틀린 기반 스프링 프레임워크에서도 JSON 직렬화를 위해서 Jackson 라이브러리를 사용하게 되나봅니다. 스프링 부트 자동 설정에서는 [코틀린 지원](https://docs.spring.io/spring-boot/reference/features/kotlin.html)으로 코틀린 모듈이 클래스패스에 있으면 자동으로 등록하고 해주고 있음이 아래와 같이 나와 있습니다.

> Jackson’s Kotlin module is required for serializing / deserializing JSON data in Kotlin. It is automatically registered when found on the classpath. A warning message is logged if Jackson and Kotlin are present but the Jackson Kotlin module is not.

위 스프링 공식 문서의 내용에 따르면 클래스 패스에 코틀린 모듈이 포함되어 있지 않다면 WARN 로그를 출력해준다고 되어있지만 코틀린 모듈에 대한 의존성을 제거하고 애플리케이션을 실행해도 관련 로그는 확인할 수 없었습니다. 그리고 만약, 자동 설정이 아닌 애플리케이션을 위해 상세한 설정을 위해 별도의 빈으로 등록한다면 코틀린 기반 스프링 애플리케이션에서 ObjectMapper의 코틀린 모듈이 제대로 등록되어있는지 검증해야할 것 같습니다.

#### 제네릭 유형을 위한 TypeReference

자바 기반 코드에서는 제네릭 유형에 대한 직렬화를 위해서 **TypeReference<>() {} 와 같은 형태로 코드를 작성해야**만 했습니다. 코틀린 모듈에는 **readValue와 convertValue 에 대한 확장 함수를 포함**하고 있어 구체적인 클래스 정보를 **추론**할 수 있습니다.

```kt
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.convertValue

data class MyStateObject(val name: String, val age: Int)

val obj = mapper.readValue<MyStateObject>(json)
```

#### Flatten 하게 직렬화할 수 있는 @JsonUnwrapped

```json
{
  "FORE_SET_GEN_ID": "V000",
  "TRADE_DAY": "20210601",
  "FORECAST_VALUES": [
    {
      "CBP_GEN_ID": "AA11",
      "ESS_MTR_TYPE": 0,
      "HH_01": 0,
      "HH_02": 0,
      "HH_03": 0,
      "HH_04": 0,
      "HH_05": 0,
      "HH_06": 0,
      "HH_07": 0,
      "HH_08": 100.223,
      "HH_09": 100.223,
      "HH_10": 100.223,
      "HH_11": 100.223,
      "HH_12": 100.223,
      "HH_13": 100.223,
      "HH_14": 100.223,
      "HH_15": 100.223,
      "HH_16": 100.223,
      "HH_17": 100.223,
      "HH_18": 100.223,
      "HH_19": 0,
      "HH_20": 0,
      "HH_21": 0,
      "HH_22": 0,
      "HH_23": 0,
      "HH_24": 0
    }
  ]
}
```

Jackson 에서 제공해주는 **@JsonUnwrapped 어노테이션**은 빈 클래스에 포함된 필드에 대해서 **Flattened** 되어 풀어헤쳐진 형태의 JSON으로 직렬화할 수 있는 방법을 제공합니다. KPX 중개거래 API 중 예측값 제출에서는 **HH_01 부터 HH_24 까지 HH_XX 형태로 전달**되는 시간 필드 정보가 포함되기 때문에, 모든 시간을 나열하기 보다는 **각 시간이 Key로 구성되는 Map으로 된 필드에 @JsonUnwrapped 를 사용**하는게 좋을 것 같다는 생각을 했습니다.

#### combination not yet supported

```kt
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Cannot define Creator property "values" as @JsonUnwrapped: combination not yet supported
```

자바 기반 코드와 다르게 코틀린에서는 어노테이션을 그대로 사용하면 위와 같은 오류가 발생할 수 있습니다. 코틀린 모듈 이슈의 [오래된 조언](https://github.com/FasterXML/jackson-module-kotlin/issues/56#issuecomment-321932309)대로 의도하는 부분을 Prefix로 제공해야하는 것 같습니다. 그러나, @field:JsonUnwrapperd 로 바꾸어도 JSON 데이터로 전달되는 요청을 변환하는 과정에서는 동일한 오류를 확인할 수 있습니다. Jackson 은 직렬화를 수행하는 과정에서 생성자 그리고 Getter와 Setter를 활용하게 됩니다. 그런데 Map 클래스 특성 상 Getter와 Setter 함수가 존재하지 않는 특이한 클래스가 됩니다. 그래서 @JsonAnyGetter 와 @JsonAnySetter와 같은 어노테이션의 도움이 필요하게 됩니다.

#### The following declarations have the same JVM signature

```kt
Kotlin: Platform declaration clash: The following declarations have the same JVM signature (getValues()Ljava/util/Map;):
    fun `<get-values>`(): MutableMap<String, Double> defined in kr.kdev.mock.kpx.model.ForecastValue
    fun getValues(): Map<String, Double> defined in kr.kdev.mock.kpx.model.ForecastValue
```

무작정 @JsonAnyGetter를 추가해버리면 코틀린에서 data 클래스의 필드로 인해 만들어지는 Getter 함수의 시그니처 중복 문제가 발생할 수 있습니다. 이 경우 다음과 같이 중복되는 필드에 private 키워드를 선언하면 문제에서 벗어날 수 있습니다. 또한, [연산자 오버로딩](https://kotlinlang.org/docs/operator-overloading.html)으로 값을 가져오고 설정하는게 더 간편해졌습니다.

```kt ForecastValue.kt
@JsonNaming(PropertyNamingStrategies.UpperSnakeCaseStrategy::class)
data class ForecastValue(
    val cbpGenId: String,
    val essMtrType: Int = 0,
    @JsonIgnore // NOTE: @JsonUnwrapped not support map object.
    private var values: MutableMap<String, Double> = mutableMapOf(),
) {
    @JsonAnyGetter
    fun getValues(): Map<String, Double> = values

    @JsonAnySetter
    fun setValue(
        key: String,
        value: Double,
    ) {
        values[key] = value
    }

    operator fun get(index: Int): Double = values["HH_%02d".format(index)] ?: 0.0

    // EXAMPLE: (1..24).forEach { forecastValue[it] = 0.0 }
    operator fun set(
        index: Int,
        value: Double,
    ) {
        values["HH_%02d".format(index)] = value
    }
}
```

#### UPPER_SNAKE_CASE 와 @ModelAttribute

KPX 중개거래 API는 대문자와 언더스코어(_)로 이루어지는 UPPER_SNAKE_CASE로 필드명이 구성되는 것을 확인할 수 있습니다. **@JsonNaming**은 JSON 직렬화 시 변환하는 방식을 별도로 지정할 수 있게 지원하므로 앞서 ForecastValue 데이터 클래스에 **PropertyNamingStrategies.UpperSnakeCaseStrategy** 가 적용된 것을 확인할 수 있습니다.

```sh Terminal
{"HTTP_CODE":201,"HTTP_STATUS":"CREATED","DATA":{"FORE_SET_GEN_ID":"V001","TRADE_DAY":"20250219","FORECAST_VALUES":[{"CBP_GEN_ID":"A011","ESS_MTR_TYPE":0,"HH_01":0.0,"HH_02":0.0,"HH_03":0.0,"HH_04":0.0,"HH_05":0.0,"HH_06":0.0,"HH_07":0.0,"HH_08":0.0,"HH_09":0.0,"HH_10":0.0,"HH_11":0.0,"HH_12":0.0,"HH_13":0.0,"HH_14":0.0,"HH_15":0.0,"HH_16":0.0,"HH_17":0.0,"HH_18":0.0,"HH_19":0.0,"HH_20":0.0,"HH_21":0.0,"HH_22":0.0,"HH_23":0.0,"HH_24":0.0}]}}
```

@ModelAttribute는 스프링 컨트롤러의 핸들러 **함수 파라미터 정의 시 데이터 바인딩을 위해서 사용**하는 어노테이션으로 자주 사용하는 것입니다. 그런데, @ModelAttribute는 JSON 직렬화 방식이 아니므로 지원하지 않으므로 @ModelAttribute가 아닌 @RequestParam을 사용하여 UPPER_SNAKE_CASE 형태로 지정해야합니다. 다음은 예측값 제출 조회 API의 요청 쿼리 파라미터 부분을 정의한 것에 대한 예시입니다.

```kt
@GetMapping("/forecast/metering")
fun getForecastMetering(
    @RequestParam("FORE_SET_GEN_ID") foreSetGenId: String,
    @DateTimeFormat(pattern = "yyyyMMdd") @RequestParam("TRADE_DAY") date: LocalDate,
): ForecastMeteringResponse {
    
}
```

> [KPX 중개거래 API 가이드 문서](https://www.kpx.or.kr/boardDownload.es?bid=0048&list_no=69006&seq=1)를 보면 v1 에서 v2로 넘어가면서 UPPER_SNAKE_CASE로 일괄 변경된 걸 인지할 수 있습니다. 어떤 언어로 작성된 서버인지는 모르겠으나 대부분의 경우 카멜 케이스를 채택하는 경우가 많아서 자바 개발자 입장에서는 생각보다 불편한 부분이라고 느껴지게 됩니다.

이상 끝.