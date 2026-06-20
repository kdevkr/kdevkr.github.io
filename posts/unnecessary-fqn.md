---
title: Unnecessary FQN
date: 2026-06-20T08:55+09:00
description: AI 에이전트가 생성하는 불필요한 FQN(Unnecessary FQN) 문제를 방지하기 위해 Checkstyle, PMD, IntelliJ 설정을 다룹니다.

tags:
  - Java
  - Linter
  - FQN
---

# Unnecessary FQN

LLM 기반의 AI 에이전트가 코드를 작성하거나 리팩토링할 때, 이미 파일 상단에 임포트(Import)되어 있는 클래스임에도 불구하고 패키지명까지 모두 명시하는 **불필요한 FQN(Unnecessary FQN)** 코드가 자주 발생해요.

## Fully Qualified Name을 선호하는 이유

AI 에이전트는 코드의 전체 구조나 기존 임포트 맥락을 실시간으로 추적하며 편집하기보다는, 국소적인 코드 변경(Diff) 단위로 작업을 진행하는 경우가 많아요. 그러다 보니 기존 임포트와의 충돌을 피하고 100% 컴파일이 성공하는 안정적인 코드를 보장하기 위해, 단순 클래스명 대신 패키지 전체 경로가 포함된 **FQN(Fully Qualified Name)** 방식을 관습적으로 선호하며 생성하게 돼요.

```java
import java.nio.charset.StandardCharsets;

public class FileService {
    public void process() {
        // 이미 상단에 StandardCharsets가 임포트되어 있음에도 FQN을 이중으로 사용한 모습
        byte[] bytes = "text".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
```

## AI 에이전트를 위한 코드 린트 구성

프로젝트에 정적 분석 도구인 [Checkstyle](https://docs.gradle.org/current/userguide/checkstyle_plugin.html)이 구성되어 있더라도, FQN 관련 검증 규칙이 없어서 AI 에이전트가 무심코 삽입한 불필요한 FQN 코드는 감지되지 않아요.

이를 보완하기 위해서 우리는 다른 정적 분석 도구인 **PMD**를 함께 사용해야 해요. PMD에서 제공하는 [UnnecessaryFullyQualifiedName](https://pmd.github.io/pmd/pmd_rules_java_codestyle.html#unnecessaryfullyqualifiedname) 규칙을 통해 임포트문이나 동일 패키지 내에서 불필요하게 작성된 FQN을 정확히 감지해 낼 수 있어요.

특히 직접 룰셋을 세팅하기 복잡하다면, AI 에이전트에게 **"불필요한 FQN 방지를 위한 완화된 Checkstyle 및 PMD 설정을 사용하는 Java 버전에 맞춘 최신 구성으로 세팅해달라"**고 요청해 보세요. 에이전트가 알아서 프로젝트 환경을 인식하고 최적화된 빌드 및 정적 분석 도구 설정을 자동으로 완료해 줘요.

실제로 에이전트에게 관련 구성을 요청하면 다음과 같이 빌드 스크립트와 규칙 파일을 작성하여 정적 분석 환경을 구축해 줘요.

::: code-group

```kotlin [build.gradle.kts]
plugins {
    java
    checkstyle
    pmd
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

checkstyle {
    toolVersion = "13.6.0"
    configFile = file("checkstyle.xml")
    // 일반 위반은 warning이라 빌드를 깨지 않음.
    // import 위생(error)만 maxErrors=0 정책에 걸려 빌드를 실패시킨다.
    maxWarnings = Int.MAX_VALUE
}

pmd {
    toolVersion = "7.24.0"
    isConsoleOutput = true
    ruleSetFiles = files("pmd-ruleset.xml")
    ruleSets = listOf<String>()
}
```

```xml [checkstyle.xml]
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
          "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
          "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
    <property name="charset" value="UTF-8"/>
    <property name="severity" value="warning"/>

    <!-- 일반적인 파일 포맷팅 규칙들... -->

    <module name="TreeWalker">
        <!-- Import 위생에 대한 규칙 설정 예시 -->
        <module name="AvoidStarImport"/>
        <module name="UnusedImports"/>
        <module name="RedundantImport"/>
    </module>
</module>
```

```xml [pmd-ruleset.xml]
<?xml version="1.0" encoding="UTF-8"?>
<ruleset name="Custom Ruleset"
         xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">
    <description>Custom Ruleset for FQN Inspection</description>
    <rule ref="category/java/codestyle.xml/UnnecessaryFullyQualifiedName" />
</ruleset>
```

:::

### 정적 분석 구성 사양

| 대상 환경 / 도구 | 권장 구성 버전 | 비고                                      |
| :--------------- | :------------- | :---------------------------------------- |
| **Java**         | 21             | 프로젝트 기준 JDK 버전                    |
| **Checkstyle**   | 13.x           | Gradle Checkstyle 플러그인 연동 버전      |
| **PMD**          | 7.x            | `UnnecessaryFullyQualifiedName` 감지 지원 |

## 코드 검수를 위한 IntelliJ IDE 인스펙션 설정

기본적으로 AI 에이전트가 Checkstyle과 PMD를 수행해서 프로젝트 코드 스타일을 맞춰줄 거예요. 그럼에도 불구하고 에이전트가 놓치거나 변경하는 도중 생성한 코드를 사람이 직접 더블 체크하는 검수 과정은 꼭 필요해요.

인텔리제이(IntelliJ IDEA)에서는 기본적으로 불필요한 FQN 검사 자체는 활성화되어 있지만, 에디터 내에서 시각적으로 도드라지게 보여주는 강조 표시(Effects)는 설정되어 있지 않아요.

따라서 우리가 직접 설정창에서 [UnnecessaryFullyQualifiedName](https://www.jetbrains.com/help/inspectopedia/UnnecessaryFullyQualifiedName.html)를 검색한 후, 심각도를 ==스타일 제안== 으로 선택하고 에디터 내 강조 표시도 ==Text style suggestion== 과 같이 에디터에서 식별 가능하도록 변경해 주어야 해요.

![IntelliJ 설정의 불필요한 정규화된 이름 검사](/images/posts/unnecessary-fqn/001.png)

이렇게 설정해 두면 에디터 상에서 에이전트가 추가한 불필요한 FQN 코드 영역이 즉시 시각적으로 하이라이트되어, 코드 리뷰 및 검수 중에 손쉽게 파악하고 단순 이름으로 교정할 수 있게 도와줘요. 실제 설정 변경을 적용하면 에디터 상에서 `java.nio.charset.StandardCharsets` 와 같은 FQN 영역에 물결 형태 등으로 ==스타일 제안== 강조가 표시되는 것을 볼 수 있어요.


![스타일 제안 강조 표시 예시](/images/posts/unnecessary-fqn/002.png)

감사합니다.
