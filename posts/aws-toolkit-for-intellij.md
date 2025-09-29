---
title: 인텔리제이 AWS Toolkit 의 자격 증명
date: 2025-03-07T22:00+09:00
tags:
- AWS Toolkit
- IAM Authneticaiton
---

> AWS Toolkit에 의한 자격 증명에 대해 aws-toolkit-jetbrains의 [#5428 이슈 댓글](https://github.com/aws/aws-toolkit-jetbrains/issues/5428#issuecomment-2705866663)로 남겨놓은 부분에 대해 정리한 것입니다.

지난 AWS JDBC Wrapper 디버그하기에 언급된 점심 시간 이후에 잠자기 상태에서 벗어나면서 `IAM 인증이 실패하는 상태에 대한 원인`을 알게되었는데요. 결론을 먼저 말해보자면 `AWS Toolkit` 플러그인에서는 AWS_PROFILE 환경 변수가 아닌 [AWS_SESSION_TOKEN 환경 변수를 설정](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/migration-env-and-system-props.html)한다는 것 입니다. 버그가 아니라 AWS 공식 문서 또는 플러그인 설정에서도 상세 내용이 기재되어있지 않은 자격 증명을 설정하는 방식의 차이로 인한 증상이었습니다. 

![](/images/posts/aws-toolkit-for-intellij/01.png)

먼저, AWS JDBC Wrapper의 [IAM Authentication Plugin](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/docs/using-the-jdbc-driver/using-plugins/UsingTheIamAuthenticationPlugin.md)은 IAM 기반 인증을 위해 자격 증명을 발급하는 과정에서 기본 자격증명 프로바이더 체인을 사용하게 됩니다. 그래서 [자격증명을 불러오는 순서](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html#credentials-default)에 따라서 ProfileCredentialsProvider 보다는 EnvironmentVariableCredentialsProvider가 먼저 사용되기 때문에 AWS_PROFILE 보다는 AWS_SESSION_TOKEN 환경 변수에 의한 임시 자격 증명을 사용하게 됩니다. 저는 AWS Toolkit 플러그인 설명에서 말하는 환경 변수가 AWS_PROFILE 일 것이라고 오해하고 있었는데 AWS Connection 옵션을 사용할 때 `System.getEnv` 를 호출해보니 AWS_PROFILE 환경 변수가 아닌 AWS_SESSION_TOKEN 이 지정된 것을 확인할 수 있었습니다.  물론 애플리케이션을 실행할 때 AWS_PROFILE 환경 변수를 지정하지 않고 AWS Toolkit의 AWS Connection 옵션을 사용했으므로  `AWS_SESSION_TOKEN 환경 변수로 적용된 상태`였던 겁니다.

![](/images/posts/aws-toolkit-for-intellij/02.png)

#### AWS Toolkit 자격증명 디버그

```java
Error occurred while opening a connection: 'org.postgresql.util.PSQLException: FATAL: PAM authentication failed for user "iam_user"'
[cluster-endpoint]:5432/?DBUser=iam_user&Action=connect&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEPb*******&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250307T060442Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=******2WAAH%2F20250307%2Fap-northeast-2%2Frds-db%2Faws4_request&X-Amz-Signature=6d0f87518f4e6ed80dc857deb398984f66ba8922bcf150e32471dc4a6fc9679d
```

[IamAuthConnectionPlugin](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthConnectionPlugin.java)의 로그 레벨을 `TRACE`로 설정하면 AWS Connection을 사용하는 경우 [임시 자격증명 방식](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)이기 때문에 [IamAuthUtils.generateAuthenticationToken](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/4c105331641b4f35de56d09b7f919428f89625dd/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthConnectionPlugin.java#L193-L200) 호출 결과로 동일한 토큰이 반환되는 것을 로그로 확인할 수 있고 AWS_PROFILE 환경 변수 또는 default 프로파일을 사용하는 경우에는 매번 새로운 토큰이 반환되는 것을 볼 수 있습니다. AwsCredentialsManager.setCustomHandler 함수를 호출해서 [AwsCredentialsProvider를 별도로 지정](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/docs/using-the-jdbc-driver/custom-configuration/AwsCredentialsConfiguration.md)할수도 있지만 AWS Connection 옵션 사용으로 인한 이슈에는 해결책이 되질 않습니다.

#### IAM Authentication 플러그인의 iamExpiration 파라미터

자격증명 문제를 검토하는 과정에서 `iam` 플러그인을 적용할 때 사용할 수 있는 `iamExpiration` 파라미터를 확인할 수 있었습니다. 그런데, 이 파라미터는 IAM 자격 증명의 만료 시간이 아니라 `토큰이 내부적으로 캐시되는 시간`에 대한 설정임에 주의해야합니다. AWS JDBC Wrapper 에서 IAM 플러그인의 동작을 살펴보면 자격증명 프로바이더로부터 전달받은 토큰을 [SigV4 요청 시 X-Amz-Security-Token 으로 전달](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html)하게 되고 기본적으로 [IamAuthCacheHolder](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/wrapper/src/main/java/software/amazon/jdbc/plugin/iam/IamAuthCacheHolder.java#L27)에 15분간 캐시되도록 설정되어 재사용되는 것을 알 수 있습니다.

현재로서는 AWS Connection 기능을 사용하는 경우 애플리케이션을 다시 실행하는 동작을 수행해야만 하는데 로컬 개발 시 자주 애플리케이션을 다시 빌드하거나 재실행하는 경우가 많기 때문에 그렇게 불편한 부분은 아니라고 생각되어 [AWS_PROFILE 환경 변수로 기본 프로파일을 지정하는 방법](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-profiles.html)으로 돌아가지 않고 AWS Connection 옵션을 그대로 사용하고 점심을 먹고 난 후에는 인증 실패 오류는 무시하고 그냥 애플리케이션을 다시 실행하기로 했습니다.