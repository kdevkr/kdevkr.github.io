---
title: 코틀린
date: 2025-02-12T21:00+09:00
tags:
- Kotlin
- Kotlin DSL
---

> 저는 코틀린이 안드로이드 개발을 위한 언어라고 생각하기만 했습니다만, 스프링 프레임워크 5 이상부터 코틀린에 대한 지원을 시작했고 JVM 진영의 빌드 시스템인 Gradle 에서도 코틀린 언어를 기본적으로 채택하고 있습니다. 생각보다 많은 채용 공고에서도 코틀린 경험자를 우대하는 것을 확인할 수 있었습니다.

#### Gradle Kotlin DSL

Gradle의 기본 언어는 [Kotlin DSL](https://docs.gradle.org/current/userguide/kotlin_dsl.html)로 변경되었습니다. 코틀린 기반 스프링을 사용하지 않더라도 자바 기반 프로젝트의 Gradle에서 [코틀린으로 빌드 스크립트를 작성](https://docs.gradle.org/current/userguide/kotlin_dsl.html#sec:scripts)할 수 있습니다. [Spring Initializr](https://start.spring.io/)에서 프로젝트 생성 시 Gradle DSL로 코틀린을 선택하면 settings.gradle.kts 와 build.gradle.kts 파일이 포함됩니다.

#### 인텔리제이 - K2 모드

IntelliJ IDEA 2024.2 이상을 사용중이라면 [K2 모드를 활성화](https://blog.jetbrains.com/ko/idea/2024/08/meet-the-renovated-kotlin-support-k2-mode/)하세요. 프로젝트의 Kotlin 컴파일러 버전과 상관없이 조금 더 개선된 코드 강조, 코드 완성 등을 제공한다고 합니다. 코틀린을 웹으로 학습하기 위한 [Kotlin Playgound](https://play.kotlinlang.org/) 도 K2 컴파일러로 동작합니다.

> 파일 - 설정 - 언어 및 프레임워크 - Kotlin - K2 모드 활성화

#### kapt 대신에 KSP 사용하기

코틀린의 [Gradle best practices](https://kotlinlang.org/docs/gradle-best-practices.html)에서 어노테이션 처리를 위해 [유지보수 모드인 kapt](https://kotlinlang.org/docs/kapt.html) 대신에 [Kotlin Symbol Processing API](https://kotlinlang.org/docs/ksp-overview.html)로 [마이그레이션](https://developer.android.com/build/migrate-to-ksp)을 추천합니다. 단, 스프링 프로젝트에서 QueryDSL을 사용하고 있다면 [Querydsl에서 Kotlin JDSL 으로](https://spoqa.github.io/2024/05/03/transfer-jdsl.html)와 같이 라인에서 개발한 오픈소스인 [Kotlin JDSL](https://github.com/line/kotlin-jdsl)로의 전환을 고려해야할 수 있습니다.

```kts
plugins {
    id("com.google.devtools.ksp") version "2.1.0-1.0.29"
}
```

