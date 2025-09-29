---
title: 보안 취약점 (Vulnerability)
date: 2023-08-22T21:00+09:00
---



[Github Advisory Database](https://github.com/advisories?query=type%3Areviewed+ecosystem%3Amaven)에는 Maven에 대해 약 3800개의 취약점 정보가 있다. 회사에서 서비스 모니터링을 위한 시스템이 구축되어있지는 않지만 임시적으로 뉴렐릭을 적용한 환경이 있어 APM & Services의 Vulnerability Management 메뉴에서 보안 취약점 정보를 확인할 수 있었다. 우선 체크된 보안 취약점은 58개로 CRITICAL 6개, HIGH 25개, MEDIUM 21개, LOW 6개 이다.

#### Vulnerability
| name                                                                                              | severity | exploitable | issueId                                                               |
| ------------------------------------------------------------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------- |
| Pivotal Spring Framework contains unsafe Java deserialization methods                             | CRITICAL | FALSE       | [CVE-2016-1000027](https://github.com/advisories/GHSA-4wrc-f8pq-fpqp) |
| Deserialization of Untrusted Data in org.codehaus.jackson:jackson-mapper-asl                      | CRITICAL | FALSE       | [CVE-2019-10202](https://github.com/advisories/GHSA-c27h-mcmw-48hv)   |
| Template injection in thymeleaf-spring5                                                           | CRITICAL | FALSE       | [CVE-2021-43466](https://github.com/advisories/GHSA-qcj6-jqrg-4wp2)   |
| Remote Code Execution in Spring Framework                                                         | CRITICAL | FALSE       | [CVE-2022-22965](https://github.com/advisories/GHSA-36p3-wjmg-h94x)   |
| Undertow client not checking server identity presented by server certificate in https connections | CRITICAL | FALSE       | [CVE-2022-4492](https://github.com/advisories/GHSA-pfcc-3g6r-8rg8)    |
| Spring Boot Security Bypass with Wildcard Pattern Matching on Cloud Foundry                       | CRITICAL | FALSE       | [CVE-2023-20873](https://github.com/advisories/GHSA-g5h3-w546-pj7f)   |

<details>
<summary>More</summary>

| name                                                                                               | severity | exploitable | issueId             |
| -------------------------------------------------------------------------------------------------- | -------- | ----------- | ------------------- |
| Pivotal Spring Framework contains unsafe Java deserialization methods                              | CRITICAL | FALSE       | CVE-2016-1000027    |
| Deserialization of Untrusted Data in org.codehaus.jackson:jackson-mapper-asl                       | CRITICAL | FALSE       | CVE-2019-10202      |
| Template injection in thymeleaf-spring5                                                            | CRITICAL | FALSE       | CVE-2021-43466      |
| Remote Code Execution in Spring Framework                                                          | CRITICAL | FALSE       | CVE-2022-22965      |
| Undertow client not checking server identity presented by server certificate in https connections  | CRITICAL | FALSE       | CVE-2022-4492       |
| Spring Boot Security Bypass with Wildcard Pattern Matching on Cloud Foundry                        | CRITICAL | FALSE       | CVE-2023-20873      |
| Arbitrary code execution in Apache Commons BeanUtils                                               | HIGH     | FALSE       | CVE-2014-0114       |
| Insecure Deserialization in Apache Commons Beanutils                                               | HIGH     | FALSE       | CVE-2019-10086      |
| Improper Restriction of XML External Entity Reference in jackson-mapper-asl                        | HIGH     | FALSE       | CVE-2019-10172      |
| Deeply nested json in jackson-databind                                                             | HIGH     | FALSE       | CVE-2020-36518      |
| Undertow Uncontrolled Resource Consumption                                                         | HIGH     | FALSE       | CVE-2021-3629       |
| Uncaught Exception in jsoup                                                                        | HIGH     | FALSE       | CVE-2021-37714      |
| Undertow vulnerable to Denial of Service (DoS) attacks                                             | HIGH     | FALSE       | CVE-2021-3859       |
| jackson-databind possible Denial of Service if using JDK serialization to serialize JsonNode       | HIGH     | FALSE       | CVE-2021-46877      |
| SnakeYaml Constructor Deserialization Remote Code Execution                                        | HIGH     | FALSE       | CVE-2022-1471       |
| Undertow vulnerable to Dos via Large AJP request                                                   | HIGH     | FALSE       | CVE-2022-2053       |
| pgjdbc Does Not Check Class Instantiation when providing Plugin Classes                            | HIGH     | FALSE       | CVE-2022-21724      |
| Improper handling of case sensitivity in Spring Framework                                          | HIGH     | FALSE       | CVE-2022-22968      |
| Denial of service in Spring Framework                                                              | HIGH     | FALSE       | CVE-2022-22970      |
| Deserialization of Untrusted Data in Gson                                                          | HIGH     | FALSE       | CVE-2022-25647      |
| Uncontrolled Resource Consumption in snakeyaml                                                     | HIGH     | FALSE       | CVE-2022-25857      |
| Partial Path Traversal in com.amazonaws:aws-java-sdk-s3                                            | HIGH     | FALSE       | CVE-2022-31159      |
| PostgreSQL JDBC Driver SQL Injection in ResultSet.refreshRow() with malicious column names         | HIGH     | FALSE       | CVE-2022-31197      |
| Apache Xalan Java XSLT library integer truncation issue when processing malicious XSLT stylesheets | HIGH     | FALSE       | CVE-2022-34169      |
| Denial of Service due to parser crash                                                              | HIGH     | FALSE       | CVE-2022-40153      |
| Uncontrolled Resource Consumption in Jackson-databind                                              | HIGH     | FALSE       | CVE-2022-42003      |
| Uncontrolled Resource Consumption in FasterXML jackson-databind                                    | HIGH     | FALSE       | CVE-2022-42004      |
| json stack overflow vulnerability                                                                  | HIGH     | FALSE       | CVE-2022-45688      |
| json-smart Uncontrolled Recursion vulnerabilty                                                     | HIGH     | FALSE       | CVE-2023-1370       |
| Spring Framework vulnerable to denial of service                                                   | HIGH     | FALSE       | CVE-2023-20863      |
| Spring Boot Welcome Page Denial of Service                                                         | HIGH     | FALSE       | CVE-2023-20883      |
| Uncontrolled Resource Consumption in XNIO                                                          | MEDIUM   | FALSE       | CVE-2020-14340      |
| Improper privilege management in elasticsearch                                                     | MEDIUM   | FALSE       | CVE-2020-7019       |
| Log entry injection in Spring Framework                                                            | MEDIUM   | FALSE       | CVE-2021-22060      |
| Improper Output Neutralization for Logs in Spring Framework                                        | MEDIUM   | FALSE       | CVE-2021-22096      |
| Exposure of Sensitive Information to an Unauthorized Actor                                         | MEDIUM   | FALSE       | CVE-2021-22134      |
| API information disclosure flaw in Elasticsearch                                                   | MEDIUM   | FALSE       | CVE-2021-22135      |
| Denial of Service in Elasticsearch                                                                 | MEDIUM   | FALSE       | CVE-2021-22144      |
| undertow Race Condition vulnerability                                                              | MEDIUM   | FALSE       | CVE-2021-3597       |
| Allocation of Resources Without Limits or Throttling in Spring Framework                           | MEDIUM   | FALSE       | CVE-2022-22950      |
| Allocation of Resources Without Limits or Throttling in Spring Framework                           | MEDIUM   | FALSE       | CVE-2022-22971      |
| jsoup may not sanitize code injection XSS attempts if SafeList.preserveRelativeLinks is enabled    | MEDIUM   | FALSE       | CVE-2022-36033      |
| snakeYAML before 1.31 vulnerable to Denial of Service due to Out-of-bounds Write                   | MEDIUM   | FALSE       | CVE-2022-38749      |
| snakeYAML before 1.31 vulnerable to Denial of Service due to Out-of-bounds Write                   | MEDIUM   | FALSE       | CVE-2022-38750      |
| snakeYAML before 1.31 vulnerable to Denial of Service due to Out-of-bounds Write                   | MEDIUM   | FALSE       | CVE-2022-38751      |
| snakeYAML before 1.32 vulnerable to Denial of Service due to Out-of-bounds Write                   | MEDIUM   | FALSE       | CVE-2022-38752      |
| Denial of Service due to parser crash                                                              | MEDIUM   | FALSE       | CVE-2022-40152      |
| Snakeyaml vulnerable to Stack overflow leading to denial of service                                | MEDIUM   | FALSE       | CVE-2022-41854      |
| TemporaryFolder on unix-like systems does not limit access to created files                        | MEDIUM   | FALSE       | CVE-2022-41946      |
| Spring Framework vulnerable to denial of service via specially crafted SpEL expression             | MEDIUM   | FALSE       | CVE-2023-20861      |
| Guava vulnerable to insecure use of temporary directory                                            | MEDIUM   | FALSE       | CVE-2023-2976       |
| pgjdbc Arbitrary File Write Vulnerability                                                          | MEDIUM   | FALSE       | GHSA-673j-qm5f-xpv8 |
| Privilege Context Switching Error in Elasticsearch                                                 | LOW      | FALSE       | CVE-2020-7020       |
| Information Disclosure in Guava                                                                    | LOW      | FALSE       | CVE-2020-8908       |
| Path traversal in org.postgresql:postgresql                                                        | LOW      | FALSE       | CVE-2022-26520      |
| Denial of Service via stack overflow                                                               | LOW      | FALSE       | CVE-2022-40154      |
| Denial of Service via stack overflow                                                               | LOW      | FALSE       | CVE-2022-40155      |
| Denial of Service due to parser crash                                                              | LOW      | FALSE       | CVE-2022-40156      |
</details>

#### CRITICAL Vulnerability

위 CRITICAL 레벨의 보안 취약점 중에서 [CVE-2019-10202](https://github.com/advisories/GHSA-c27h-mcmw-48hv)를 제외하고는 취약점 대상이 되는 시스템 환경은 아니기 때문에 굳이 애플리케이션에서 사용중인 라이브러리 의존성 버전을 변경할 필요는 없다고 생각된다. CVE-2019-10202에 대해서는 애플리케이션에서 org.codehaus.jackson:jackson-mapper-asl 라이브러리를 사용할 필요가 없음에도 일부 코드가 레거시 프로젝트로부터 복사되었기 때문에 jackson-databind 라이브러리에 포함된 ISO8601Utils를 사용하도록 코드를 변경하고 불필요한 jackson-mapper-asl 의존성을 제거하였다. 

```groovy
ext {
    set('quartz.version', '2.3.2') // CVE-2019-13990
    set('thymeleaf.version', '3.0.13.RELEASE') // CVE-2021-43466
    set('spring-framework.version', '5.2.24.RELEASE') // CVE-2022-22965
    set('undertow.version', '2.2.24.Final') // CVE-2022-4492]
}
```

나머지 CRITICAL 레벨이 아닌 취약점은 굳이 조치할 필요성이 높지는 않아보이나 최대한 취약점을 제거하고자 분석 후 Github Advisory Database를 통해 취약점이 조치된 버전으로 변경하였다.

#### Vulnerability
취약점 조치 이후에 체크되어 남아있는 취약점은 아래와 같다. 

| name                                                                        | severity | exploitable | issueId                                                               |
| --------------------------------------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------- |
| Pivotal Spring Framework contains unsafe Java deserialization methods       | CRITICAL | FALSE       | [CVE-2016-1000027](https://github.com/advisories/GHSA-4wrc-f8pq-fpqp) |
| Spring Boot Security Bypass with Wildcard Pattern Matching on Cloud Foundry | CRITICAL | FALSE       | [CVE-2023-20873](https://github.com/advisories/GHSA-g5h3-w546-pj7f)   |
| SnakeYaml Constructor Deserialization Remote Code Execution                 | HIGH     | FALSE       | [CVE-2022-1471](https://github.com/advisories/GHSA-mjmj-j48q-9wg2)    |
| Spring Boot Welcome Page Denial of Service                                  | HIGH     | FALSE       | [CVE-2023-20883](https://github.com/advisories/GHSA-xf96-w227-r7c4)   |

CRITICAL 레벨의 CVE-2016-1000027와 CVE-2023-20873 도 취약점 내용을 살펴보면 취약점이 발생할 수 있는 시스템 환경이 아니기 때문에 굳이 조치할 필요가 없다. 더구나 취약점 정보를 제거하기 위해서는 상당히 높은 스프링 부트 3+으로 변경해야하기 때문에 굳이 시도하지 않으려고 한다. 

CVE-2022-1471에 대해서는 스프링 부트 2.5.15 에서 [Improve compatibility with SnakeYAML 2.0](https://github.com/spring-projects/spring-boot/commit/d1d990acd7a06aa34112896d753bcae679203f35) 처리가 되었기 때문에 Snakeyaml 라이브러리의 버전만 2.0+로 변경하면 되지만 스프링 부트 2.4+로 변경하는 것도 생각보다 많은 설정들이 변경되어서 쉽지 않다. 만약, 스프링 부트 2.5.15로 변경한다면 [CVE-2023-20883](https://github.com/advisories/GHSA-xf96-w227-r7c4)도 함께 조치할 수 있다.

이렇게 취약점 제거 조치는 수행했으나 실제로 반영하는 것은 조심해야한다. 라이브러리 버전 변경으로 인한 시스템 영향도를 제대로 체크한다는 것을 보장할 순 없기 때문에 한번에 수정하는 것은 지양해야할 수 있다. 앞서, jackson-databind 라이브러리를 2.11.4 에서 상위 버전으로 업그레이드하는 과정에서 아래와 같은 직렬화 이슈가 발생하였다.

```shell
Caused by: com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Java 8 date/time type `java.time.Instant` not supported by default: add Module "com.fasterxml.jackson.datatype:jackson-datatype-jsr310" to enable handling (through reference chain: java.util.Collections$UnmodifiableMap["build"]->java.util.LinkedHashMap["time"])
```

이와 같은 이슈를 해결하기 위해서 ObjectMapper를 만들어서 사용하는 모든 코드에 JavaTimeModule을 수동으로 등록하도록 변경해야한다.

```java
ObjectMapper objectMapper = new ObjectMapper();
objectMapper.registerModule(new JavaTimeModule());
```

인텔리제이를 통해 검색해보니 생각보다 건드려야하는 코드가 많아서 jackson-databind 라이브러리를 상위 버전으로 변경하지 않고 2.11.4를 유지하고자 한다.

#### OWASP Dependency-Check
[OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)라는 SCA 도구를 사용해서 CPE와 CVE를 검출할 수 있다. 아래와 같이 dependencycheck 그래들 플러그인을 등록하고나서 dependencyCheckAnalyze 태스크를 수행하면 `build/reports/dependency-check-report.html` 파일이 생성되어 취약점 정보를 확인할 수 있다.

```groovy build.gradle
plugins {
    id 'org.owasp.dependencycheck' version '8.4.0'
}

dependencyCheck {
    // build/reports/dependency-check-report.html
    analyzers {
        nodeEnabled = false
        nodeAudit {
            enabled = false
            yarnEnabled = false
            pnpmEnabled = false
        }
    }
}
```

> [젠킨스 OWASP Dependency-Check 플러그인](https://plugins.jenkins.io/dependency-check-jenkins-plugin/)도 있는데 OWASP Dependency-Check로 체크하는 경우 생각보다 많은 취약점이 확인되어서 최신 라이브러리를 사용하는 프로젝트가 아니라면 좋아보이지는 않는다. 개인적으로 CVE 검출을 위해서 사용하진 않을 것 같다.
