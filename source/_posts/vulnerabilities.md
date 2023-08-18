---
title: 보안 취약점 조치
date: 2023-08-18T23:00+09:00
---

[Github Advisory Database](https://github.com/advisories?query=type%3Areviewed+ecosystem%3Amaven)에는 Maven에 대해 약 3800개의 취약점 정보가 있다. 회사에서 서비스 모니터링을 위한 시스템이 구축되어있지는 않지만 임시적으로 뉴렐릭을 적용한 환경이 있어 APM & Services의 Vulnerability Management 메뉴에서 보안 취약점 정보를 확인할 수 있었다. 

#### Vulnerability 2023-03-03
2023-03-23 일자에 수집된 보안 취약점은 52개로 CRITICAL 6개, HIGH 22개, MEDIUM 22개, LOW 2개 였다.

| name                                                                                               | severity | exploitable | issueId        |
| -------------------------------------------------------------------------------------------------- | -------- | ----------- | -------------- |
| Deserialization of Untrusted Data in org.codehaus.jackson:jackson-mapper-asl                       | CRITICAL | false       | CVE-2019-10202 |
| XML external entity injection in Terracotta Quartz Scheduler                                       | CRITICAL | false       | CVE-2019-13990 |
| Template injection in thymeleaf-spring5                                                            | CRITICAL | false       | CVE-2021-43466 |
| Remote Code Execution in Spring Framework                                                          | CRITICAL | false       | CVE-2022-22965 |
| Apache Xalan Java XSLT library integer truncation issue when processing malicious XSLT stylesheets | CRITICAL | false       | CVE-2022-34169 |
| Undertow client not checking server identity presented by server certificate in https connections  | CRITICAL | false       | CVE-2022-4492  |

<details>
<summary>More</summary>

| name                                                                                            | severity | exploitable | issueId             |
| ----------------------------------------------------------------------------------------------- | -------- | ----------- | ------------------- |
| Arbitrary code execution in Apache Commons BeanUtils                                            | HIGH     | false       | CVE-2014-0114       |
| Cleartext Transmission of Sensitive Information in Apache MINA                                  | HIGH     | false       | CVE-2019-0231       |
| Insecure Deserialization in Apache Commons Beanutils                                            | HIGH     | false       | CVE-2019-10086      |
| Improper Restriction of XML External Entity Reference in jackson-mapper-asl                     | HIGH     | false       | CVE-2019-10172      |
| Improper Restriction of XML External Entity Reference                                           | HIGH     | false       | CVE-2020-13692      |
| Deeply nested json in jackson-databind                                                          | HIGH     | false       | CVE-2020-36518      |
| Improper Privilege Management in Elasticsearch                                                  | HIGH     | false       | CVE-2020-7009       |
| Deserialization of Untrusted Data in com.jsoniter:jsoniter                                      | HIGH     | false       | CVE-2021-23441      |
| Undertow Uncontrolled Resource Consumption                                                      | HIGH     | false       | CVE-2021-3629       |
| Uncaught Exception in jsoup                                                                     | HIGH     | false       | CVE-2021-37714      |
| Undertow vulnerable to Denial of Service (DoS) attacks                                          | HIGH     | false       | CVE-2021-3859       |
| SnakeYaml Constructor Deserialization Remote Code Execution                                     | HIGH     | false       | CVE-2022-1471       |
| Undertow vulnerable to Dos via Large AJP request                                                | HIGH     | false       | CVE-2022-2053       |
| pgjdbc Does Not Check Class Instantiation when providing Plugin Classes                         | HIGH     | false       | CVE-2022-21724      |
| Improper handling of case sensitivity in Spring Framework                                       | HIGH     | false       | CVE-2022-22968      |
| Denial of service in Spring Framework                                                           | HIGH     | false       | CVE-2022-22970      |
| Deserialization of Untrusted Data in Gson                                                       | HIGH     | false       | CVE-2022-25647      |
| Uncontrolled Resource Consumption in snakeyaml                                                  | HIGH     | false       | CVE-2022-25857      |
| Partial Path Traversal in com.amazonaws:aws-java-sdk-s3                                         | HIGH     | false       | CVE-2022-31159      |
| PostgreSQL JDBC Driver SQL Injection in ResultSet.refreshRow() with malicious column names      | HIGH     | false       | CVE-2022-31197      |
| Uncontrolled Resource Consumption in Jackson-databind                                           | HIGH     | false       | CVE-2022-42003      |
| Uncontrolled Resource Consumption in FasterXML jackson-databind                                 | HIGH     | false       | CVE-2022-42004      |
| Pivotal Spring Framework contains unsafe Java deserialization methods                           | MEDIUM   | false       | CVE-2016-1000027    |
| Exposure of Sensitive Information to an Unauthorized Actor in Elasticsearch                     | MEDIUM   | false       | CVE-2019-7619       |
| Cross-site scripting in Apache HttpClient                                                       | MEDIUM   | false       | CVE-2020-13956      |
| Uncontrolled Resource Consumption in XNIO                                                       | MEDIUM   | false       | CVE-2020-14340      |
| Privilege Escalation Flaw in Elasticsearch                                                      | MEDIUM   | false       | CVE-2020-7014       |
| Log entry injection in Spring Framework                                                         | MEDIUM   | false       | CVE-2021-22060      |
| Improper Output Neutralization for Logs in Spring Framework                                     | MEDIUM   | false       | CVE-2021-22096      |
| API information disclosure flaw in Elasticsearch                                                | MEDIUM   | false       | CVE-2021-22135      |
| Denial of Service in Elasticsearch                                                              | MEDIUM   | false       | CVE-2021-22144      |
| undertow Race Condition vulnerability                                                           | MEDIUM   | false       | CVE-2021-3597       |
| Infinite loop in Apache MINA                                                                    | MEDIUM   | false       | CVE-2021-41973      |
| jackson-databind possible Denial of Service if using JDK serialization to serialize JsonNode    | MEDIUM   | false       | CVE-2021-46877      |
| Allocation of Resources Without Limits or Throttling in Spring Framework                        | MEDIUM   | false       | CVE-2022-22950      |
| Allocation of Resources Without Limits or Throttling in Spring Framework                        | MEDIUM   | false       | CVE-2022-22971      |
| jsoup may not sanitize code injection XSS attempts if SafeList.preserveRelativeLinks is enabled | MEDIUM   | false       | CVE-2022-36033      |
| snakeYAML before 1.31 vulnerable to Denial of Service due to Out-of-bounds Write                | MEDIUM   | false       | CVE-2022-38749      |
| snakeYAML before 1.31 vulnerable to Denial of Service due to Out-of-bounds Write                | MEDIUM   | false       | CVE-2022-38750      |
| snakeYAML before 1.31 vulnerable to Denial of Service due to Out-of-bounds Write                | MEDIUM   | false       | CVE-2022-38751      |
| snakeYAML before 1.32 vulnerable to Denial of Service due to Out-of-bounds Write                | MEDIUM   | false       | CVE-2022-38752      |
| Snakeyaml vulnerable to Stack overflow leading to denial of service                             | MEDIUM   | false       | CVE-2022-41854      |
| TemporaryFolder on unix-like systems does not limit access to created files                     | MEDIUM   | false       | CVE-2022-41946      |
| pgjdbc Arbitrary File Write Vulnerability                                                       | MEDIUM   | false       | GHSA-673j-qm5f-xpv8 |
| Privilege Context Switching Error in Elasticsearch                                              | LOW      | false       | CVE-2020-7020       |
| Path traversal in org.postgresql:postgresql                                                     | LOW      | false       | CVE-2022-26520      |
</details>

##### [CVE-2019-10202](https://github.com/advisories/GHSA-c27h-mcmw-48hv)
애플리케이션에서 org.codehaus.jackson:jackson-mapper-asl 라이브러리를 사용할 필요가 없음에도 일부 코드가 레거시 프로젝트로부터 복사되었기 때문에 jackson-databind 라이브러리에 포함된 ISO8601Utils를 사용하도록 코드를 변경하고 불필요한 jackson-mapper-asl 의존성을 제거하였다.

##### [CVE-2019-13990](https://github.com/advisories/GHSA-9qcf-c26r-x5rf)
취약점 정보와 같이 XML External Entity(XXE) 가능성은 없으나 Quartz 라이브러리의 버전을 2.3.2로 변경하였다.

```groovy
ext {
    set('quartz.version', '2.3.2')
}
```

##### [CVE-2021-43466](https://github.com/advisories/GHSA-qcj6-jqrg-4wp2)
애플리케이션에서 프론트에 대한 HTML 파일을 Thymeleaf 엔진을 통해 제공하고 있으므로 라이브러리 버전을 3.0.13.RELEASE로 변경했다.

```groovy
ext {
    set('thymeleaf.version', '3.0.13.RELEASE')
}
```

##### [CVE-2022-22965](https://github.com/advisories/GHSA-36p3-wjmg-h94x)
`Spring4Shell`로 불리는 취약점으로 스프링 부트 버전을 변경하지 않고 스프링 프레임워크 버전을 취약점에 대해 조치된 버전으로 변경하였다. 다만, 애플리케이션에서 톰캣이 아닌 언더토우를 사용하고 있으므로 취약점 대상은 아니다. 그리고 취약점이 조치된 5.2.20.RELEASE가 아닌 CVE-2022-22968, CVE-2022-22970, CVE-2022-22971와 같은 나머지 취약점도 조치될 수 있도록 5.2.24.RELEASE로 변경했다.

```groovy
ext {
    set('spring-framework.version', '5.2.24.RELEASE')
}
```

##### [CVE-2022-4492](https://github.com/advisories/GHSA-pfcc-3g6r-8rg8)
언더토우를 사용하고 있으나 취약점 가능성이 적어보이지만 사용중인 스프링 부트 2.3.12.RELEASE 와 Undertow 2.2.24.Final에 대한 호환성 문제는 없는 것으로 보여 취약점 정보를 제거하기 위해서 2.2.24.Final로 변경하였다.

```groovy
ext {
    set('undertow.version', '2.2.24.Final')
}
```

나머지 CRITICAL 레벨이 아닌 취약점은 굳이 조치할 필요성이 높지는 않아보이나 최대한 취약점을 제거하고자 분석 후 취약점이 조치된 버전으로 변경하였다.

#### Vulnerability 2023-08-18
2023-03-03 에 수집된 취약점 정보를 조치하고 2023-08-18 에 체크된 취약점 정보는 아래와 같다.

| name                                                                        | severity | exploitable | issueId          |
| --------------------------------------------------------------------------- | -------- | ----------- | ---------------- |
| Pivotal Spring Framework contains unsafe Java deserialization methods       | CRITICAL | FALSE       | CVE-2016-1000027 |
| Spring Boot Security Bypass with Wildcard Pattern Matching on Cloud Foundry | CRITICAL | FALSE       | CVE-2023-20873   |
| SnakeYaml Constructor Deserialization Remote Code Execution                 | HIGH     | FALSE       | CVE-2022-1471    |
| Spring Boot Welcome Page Denial of Service                                  | HIGH     | FALSE       | CVE-2023-20883   |

##### [CVE-2016-1000027](https://github.com/advisories/GHSA-4wrc-f8pq-fpqp)
보안 레벨이 CRITICAL이고 CVSS 점수도 9.8로 상당히 높지만 [spring-framework/issues/24434](https://github.com/spring-projects/spring-framework/issues/24434)에서 언급되는 내용처럼 `HTTP Invoker endpoint`를 사용하는 기능이 포함되지 않는 애플리케이션에 대해서는 취약점 대상이 아니다.

##### [CVE-2023-20873](https://github.com/advisories/GHSA-g5h3-w546-pj7f)
AWS 또는 네이버 클라우드에 배포되는 애플리케이션으로 Cloud Foundry에 배포되는 환경이 아니므로 굳이 조치할 필요는 없다.

##### [CVE-2022-1471](https://github.com/advisories/GHSA-mjmj-j48q-9wg2)
스프링 부트 3+로 변경할 필요는 없는데 스프링 부트 2.5.15 에서 [Improve compatibility with SnakeYAML 2.0](https://github.com/spring-projects/spring-boot/commit/d1d990acd7a06aa34112896d753bcae679203f35) 처리가 되었기에 Snakeyaml 라이브러리의 버전만 2.0+로 변경하면 된다. 
만약, 스프링 부트 2.5.15로 변경한다면 [CVE-2023-20883](https://github.com/advisories/GHSA-xf96-w227-r7c4)도 함께 조치할 수 있다.

이렇게 취약점 제거 조치는 수행했으나 실제로 반영하는 것은 조심해야한다. 라이브러리 버전 변경으로 인한 시스템 영향도를 제대로 체크한다는 것을 보장할 순 없기 때문에 한번에 수정하는 것은 지양해야할 수 있다. 