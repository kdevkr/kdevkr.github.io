---
title: AWS JDBC Wrapper 디버그하기
date: 2025-03-06T23:00+09:00
tags:
- AWS JDBC Advanced Driver
- HikariCP
- Aurora PostgreSQL
---

회사 맥북에서 연결중이던 JDBC 커넥션이 점심 시간으로 인해 잠자기 상태에 들어가고나서 오후 업무를 위해 `잠자기 상태에서 벗어나면서 IAM 인증이 불가능한 상태`가 되어버리고 있습니다. 이와 같이 **DB 연결에 문제가 생겼을 때 JDBC에 대한 디버깅을 위해** HikariCP와 AWS JDBC Wrapper Driver에 대한 로그를 활성화하는 방법을 알아보겠습니다. 

#### FATAL: PAM authentication failed for user

잠자기 상태에서 벗어난 맥북에서 Aurora PostgreSQL에 대한 PAM Authentication 인증이 실패했다는 오류 로그가 출력됩니다. [AWS IAM Authentication Plugin](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/docs/using-the-jdbc-driver/using-plugins/UsingTheIamAuthenticationPlugin.md)은 IAM 기반 인증을 위해서 [RdsUtilities](https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/services/rds/RdsUtilities.html)를 통해 인증 토큰을 발급하고 AWS SigV4(Signature Version 4)를 통해  [IAM 데이터베이스 인증(PAM 인증)](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/AuroraUserGuide/UsingWithRDS.IAMDBAuth.html)을 수행할 수 있도록 지원해주고 있습니다. IAM 플러그인에서 iamExpiration 옵션으로 인증 토큰을 캐시하고 [인증 토큰이 만료되면 다시 발급하여 요청하도록 구현](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/4c105331641b4f35de56d09b7f919428f89625dd/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthConnectionPlugin.java#L188-L200)되어 있습니다.

> 개발 환경에서 발생하는 현상이라 인텔리제이에서 애플리케이션을 다시 실행하면 정상적으로 연결할 수 있으므로 크리티컬한 문제는 아닙니다만, 왜 AWS 프로파일로 지정된 IAM 역할로 인증 토큰을 발급하는 ProfileCredentialProvider를 사용하고 있는데 잠자기 상태에서 벗어난 경우에는 왜 인증에 실패하는 것일까요? 

#### HikariCP Configuration

먼저, IAM 프로파일로 발급되어 만료된 인증 토큰을 재사용하고 있는 것은 아닐까 싶어서 HikariCP에 대한 설정을 검토하였고 `maxLifetime` 과 `keepaliveTime` 그리고 `iamExpiration` 옵션을 기본값보다는 작게 설정해보았습니다.  당연하게도 애플리케이션이 실행중인 상태에서 동작에 대한 옵션이기 때문에 PAM 인증 불가 이슈는 해결할 수 없었습니다.

```yaml
spring:
  datasource:
    hikari:
      max-lifetime: 600000
      keepalive-time: 300000
```

- maxLifetime: 커넥션 풀에 커넥션이 최대로 유지될 수 있는 시간으로 데이터베이스 연결 제한 시간보다 작아야하지만 PostgreSQL의 경우 MySQL 처럼 wait_timeout 값이 존재하지 않습니다.
- keepaliveTime: maxLifetime 값보다 작아야하는 설정으로 지정된 값이 도래되었을때 커넥션 풀에서 기존 커넥션을 제거하고 새롭게 연결한 커넥션을 풀에 추가하는데 사용합니다. 기본값은 2분(120000ms) 입니다.
- iamExpiration: [AWS IAM Authentication Plugin](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/docs/using-the-jdbc-driver/using-plugins/UsingTheIamAuthenticationPlugin.md) 옵션으로 IAM 기반 인증 토큰이 캐시되어 유지되는 시간입니다. 기본값은 15분입니다.

#### HikariCP Configuration Logging

```yaml
logging.level:
    com.zaxxer.hikari.HikariConfig: TRACE
```

스프링 부트 애플리케이션 HikariCP 설정값을 로그로 확인하고 싶다면 `com.zaxxer.hikari.HikariConfig` 에 대한 로그 레벨을 `DEBUG` 이상으로 변경하면 됩니다. 

#### AWS JDBC Wrapper Logging

```yaml
logging.level:
  software.amazon.jdbc: trace
  software.amazon.jdbc.plugin.DefaultConnectionPlugin: trace
  software.amazon.jdbc.plugin.iam.IamAuthConnectionPlugin: trace
```

AWS JDBC Wrapper에 대한 전체 로그를 확인하고 싶다면, software.amazon.jdbc 패키지에 대한 로그 레벨을 TRACE로 설정하고 그게 아니라면 원하는 클래스에 대한 로그 레벨만 조정하면 됩니다. DefaultConnectionPlugin 는 커넥션을 수행할 때 호출되는 함수가 로그로 출력되며 IamAuthConnectionPlugin 는 IAM 프로파일에 대한 [인증 토큰을 발급하는 로그](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/4c105331641b4f35de56d09b7f919428f89625dd/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthConnectionPlugin.java#L164-L167)를 출력합니다.

