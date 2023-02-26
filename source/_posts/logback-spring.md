---
title: 스프링 부트 로그백 운영 설정
date: 2023-02-26
tags:
- Logging
- Logback
---

스프링 부트 프로젝트를 기반으로 하는 애플리케이션에서는 기본적인 로깅 라이브러리로써 로그백이 사용됩니다. 스프링 부트의 포함된 org/springframework/boot/logging/logback/base.xml 파일을 토대로 콘솔 및 파일로 로그를 출력할 수 있게 기본값이 정의되어 있습니다. LoggingApplicationListener에 의해 애플리케이션이 실행될 때 호출되는 여러가지 이벤트에 의해 LogbackLoggingSystem 으로써 로그백 설정이 적용됩니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!--
Base logback configuration provided for compatibility with Spring Boot 1.1
-->

<included>
	<include resource="org/springframework/boot/logging/logback/defaults.xml" />
	<property name="LOG_FILE" value="${LOG_FILE:-${LOG_PATH:-${LOG_TEMP:-${java.io.tmpdir:-/tmp}}}/spring.log}"/>
	<include resource="org/springframework/boot/logging/logback/console-appender.xml" />
	<include resource="org/springframework/boot/logging/logback/file-appender.xml" />
	<root level="INFO">
		<appender-ref ref="CONSOLE" />
		<appender-ref ref="FILE" />
	</root>
</included>
```

위와 같이 설정되어있어도 기본적으로는 애플리케이션 로그는 콘솔이라는 표준 출력에 의해 기록되는 편입니다. 그러나 애플리케이션을 운영하다보면 보안 감사 혹은 비즈니스 동작에 대한 검증을 위해 일부 로그를 별도로 남겨야할 수 있습니다. 이러한 요구사항이 있다면 기본적인 로그백 설정 보다는 운영을 위한 커스텀 구성을 하는 것이 좋습니다.

#### logback-spring.xml
> When possible, we recommend that you use the -spring variants for your logging configuration (for example, logback-spring.xml rather than logback.xml). If you use standard configuration locations, Spring cannot completely control log initialization.

스프링 부트 공식 문서의 [Custom Log Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.logging.custom-log-configuration)에 대한 내용에 따라 logback-spring.xml 이라는 파일명으로 로그백에 대한 설정 파일을 구성하는 것이 효율적입니다. [Profile-specific Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.logging.logback-extensions.profile-specific)에서 설명하는 것처럼 <springProfile> 및 <springProperty> 태그를 기반으로 애플리케이션에서 사용하는 속성값을 그대로 사용할 수 있습니다.

#### ch.qos.logback.core.rolling.RollingFileAppender
오류에 대한 로그만 별도로 추출하여 기록한다거나 특정 비즈니스 로직에 대한 로그를 별도로 나누어서 관리하고자 한다면 FileAppender 또는 RollingFileAppender과 함께 SizeAndTimeBasedRollingPolicy를 적용하여 원하는 출력 형태로 로그가 남도록 구성하는게 좋습니다. 

```xml
<Configuration scan="true" scanPeriod="30 seconds">
    <include resource="org/springframework/boot/logging/logback/defaults.xml" />
    <include resource="org/springframework/boot/logging/logback/console-appender.xml" />

    <property name="ERROR_LOG_FILE" value="${LOG_PATH}/error_${LOG_FILE}"/>
    <appender name="ERROR_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
        <encoder>
            <pattern>${FILE_LOG_PATTERN}</pattern>
            <charset>${FILE_LOG_CHARSET}</charset>
        </encoder>
        <file>${ERROR_LOG_FILE}</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOGBACK_ROLLINGPOLICY_FILE_NAME_PATTERN:-${ERROR_LOG_FILE}.%d{yyyy-MM-dd}.%i.gz}</fileNamePattern>
            <cleanHistoryOnStart>${LOGBACK_ROLLINGPOLICY_CLEAN_HISTORY_ON_START:-false}</cleanHistoryOnStart>
            <maxFileSize>${LOGBACK_ROLLINGPOLICY_MAX_FILE_SIZE:-10MB}</maxFileSize>
            <totalSizeCap>${LOGBACK_ROLLINGPOLICY_TOTAL_SIZE_CAP:-0}</totalSizeCap>
            <maxHistory>${LOGBACK_ROLLINGPOLICY_MAX_HISTORY:-7}</maxHistory>
        </rollingPolicy>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE" />
        <appender-ref ref="ERROR_FILE" />
    </root>
</Configuration>
```

> 리눅스 서버의 로그 로테이션을 별도로 활용중이라면 굳이 로그백에서 RollingFileAppender를 사용할 필요는 없다. 

위 ERROR_FILE appender는 org/springframework/boot/logging/logback/file-appender.xml를 기반으로 작성하였으며 애플리케이션 속성에 의해 결정된 LOG_PATH에 error_를 파일명에 포함하여 남기도록 했습니다.

#### 참고 

- [Logging in Spring Boot](https://www.baeldung.com/spring-boot-logging)
- [A Guide To Logback](https://www.baeldung.com/logback)
- [The logback manual](https://logback.qos.ch/manual/index.html)