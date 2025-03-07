---
title: AWS JDBC Wrapper 디버그하기
date: 2025-03-06T23:00+09:00
tags:
- AWS JDBC Advanced Driver
- HikariCP
- Aurora PostgreSQL
---

AWS JDBC Wrapper를 사용하여 IAM 기반 데이터베이스 인증 방식으로 전환하게 되면서 여러가지 이슈와 문제들을 경험하고 있습니다. 본 글에서 다루게 될 내용은 회사 맥북에서 연결중이던 JDBC 커넥션이 점심 시간으로 인해 잠자기 상태에 들어간 후 오후 업무를 위해 잠자기 상태에서 벗어난 경우 IAM 인증이 실패하는 오류를 경험하고 있었고 이와 같이 **DB 연결에 문제가 생겼을 때 JDBC에 대한 디버깅을 위해** HikariCP와 AWS JDBC Wrapper Driver에 대한 로그를 활성화하여 여러가지를 검토하기 위한 방법에 대한 것입니다.

#### FATAL: PAM authentication failed for user

먼저, 점심을 먹고나서 인텔리제이 콘솔에 빨간색으로 표시되는 건 Aurora PostgreSQL에 대한 PAM Authentication 인증이 실패했다는 오류 로그 입니다. [AWS IAM Authentication Plugin](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/docs/using-the-jdbc-driver/using-plugins/UsingTheIamAuthenticationPlugin.md)에서는 IAM 기반 인증을 위해 Aurora PostgreSQL로 SigV4 요청을 보내어 [IAM 데이터베이스 인증(PAM 인증)](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/AuroraUserGuide/UsingWithRDS.IAMDBAuth.html)을 수행하고 있습니다. 이때, [RdsUtilities](https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/services/rds/RdsUtilities.html)를 통해 토큰을 발급하는데 [인증 토큰이 만료되면 다시 발급하여 요청하도록 구현](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/4c105331641b4f35de56d09b7f919428f89625dd/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthConnectionPlugin.java#L188-L200)되어 있습니다. 로컬 개발 환경에서 발생하는 현상이지만 인텔리제이에서 애플리케이션을 다시 실행하면 정상적으로 연결할 수 있으므로 크리티컬한 이슈는 아닙니다. 그런데, 왜 AWS 프로파일로 지정된 IAM 역할로 인증 토큰을 발급하는 ProfileCredentialProvider를 사용하고 있을텐데 정상적으로 연결되던 것이 `잠자기 상태로 오랫동안 유지되었을때는 왜 인증에 실패하는 걸까`요?

#### HikariCP Configuration Logging

```yaml
logging.level:
    com.zaxxer.hikari.HikariConfig: TRACE
```

스프링 부트 애플리케이션의 HikariCP 설정값을 로그로 확인하고 싶다면 `com.zaxxer.hikari.HikariConfig` 에 대한 로그 레벨을 `DEBUG` 이상으로 변경하면 됩니다. IAM 기반 인증을 위한 플러그인 설정값을 지정하고 있으므로 어떻게 설정되고 있는지도 검토하기 위해서 활성화했습니다. 하지만, wrapperPlugins 에 iam 플러그인을 지정한 것 이외에는 별다른 부분이 없었습니다.

#### AWS JDBC Wrapper Logging

```yaml
logging.level:
  software.amazon.jdbc.Driver: trace
  software.amazon.jdbc.plugin.iam.IamAuthConnectionPlugin: trace
```

AWS JDBC Wrapper에 대한 전체 로그를 확인하고 싶다면, software.amazon.jdbc 패키지에 대한 로그 레벨을 TRACE로 설정하고 그게 아니라면 원하는 클래스에 대한 로그 레벨만 조정하면 됩니다. software.amazon.jdbc.Driver 는 AWS JDBC Wrapper를 통해 JDBC 연결 시 사용되는 프로퍼티가 로그로 출력되며 IamAuthConnectionPlugin 는 IAM 프로파일에 대한 [인증 토큰을 발급하는 로그](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/4c105331641b4f35de56d09b7f919428f89625dd/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthConnectionPlugin.java#L164-L167)를 출력합니다.

현재 발생중인 PAM 인증 실패에 대한 원인은 명확하게 파악이 되질 않고 있습니다. [AWS CLI로 인증 토큰을 직접 발급하고 PSQL을 사용해서 연결](https://repost.aws/knowledge-center/aurora-postgresql-connect-iam) 해볼 수도 있으므로 다양하게 검토해보고 있습니다. 저는 잠자기 상태에서 벗어난 맥북에서 경험하고 있지만 잠자기 상태와는 상관없이 발생하는 문제일 수도 있습니다. 또 다른 개발자는 간헐적으로 JDBC 연결을 수행할 수 없는 증상도 경험했었는데 이것은 `Wireguard에 의한 클라이언트 충돌 문제로 확인`되었습니다.