---
title: 애플리케이션 민감정보
date: 2026-11-26T07:00+09:00
description: AWS SSM Parameter Store와 Secrets Manager를 활용해 EC2와 ECS 애플리케이션에 환경 변수로 시크릿을 주입하는 방법을 정리한다.
tags:
  - AWS
  - Security
  - Secrets Manager
  - SSM
---

# {{ $frontmatter.title }}

최근 [테스트 서버에 AWS SSM Patch Manager를 도입](/posts/aws-ssm-patch-manager)해 보고 있던 와중에 EC2 서버에서 `app.jar` 옆에 놓인 `application.yml`이 눈에 밟혔다. 고객사 환경은 ECS로 전환하기 전 상태인 EC2 서버를 직접 운용하는 구성이고 테스트 서버도 이에 맞춰져 있다.

이 환경에서는 `app.jar`와 같은 경로에 `application-{env}.yml` 같은 별도 설정 파일을 두고 사용한다. 가장 단순하고 편리하지만 SSRF 같은 공격 표면으로 EC2 서버까지 도달하면 평문 파일의 민감한 값이 쉽게 조회되어 외부 웹훅으로 유출될 수 있다.

## AWS Secrets Manager와 SSM Parameter Store 비교

AWS에서 시크릿을 저장할 때 주로 **AWS Secrets Manager** 와 **AWS SSM Parameter Store** (`SecureString`) 중 하나를 선택한다고 한다. Parameter Store는 값을 파라미터 단위로 하나씩 관리하며 기본(Standard) 티어는 무료로 쓸 수 있다. 반면 Secrets Manager는 여러 값을 JSON 하나로 묶어 관리하는 방식과 자동 회전을 지원하지만 시크릿 단위 월 과금과 API 호출 비용이 발생한다.

다만 애플리케이션 쪽에서 **비밀번호 자동 교체** 를 함께 지원하지 않는다면 유료인 Secrets Manager를 쓰는 의미가 생각보다 크지 않다.

## IAM 권한과 환경 변수 주입

시크릿을 조회하려면 실행 환경의 IAM 역할에 필요한 최소 권한만 붙여 두어야 한다. EC2는 **인스턴스 프로파일 역할** 에, ECS는 **태스크 실행 역할** 에 시크릿 조회 권한을 부여하며 사용자 관리 KMS 키를 쓴다면 복호화 권한도 함께 필요하다.

### EC2 - `jq`

EC2에서는 실행 전 배포 스크립트에서 AWS CLI로 값을 조회해 환경 변수로 넘길 수 있다. Secrets Manager는 JSON 묶음에서 `jq`로 키를 꺼내고, Parameter Store는 경로 패턴으로 묶어 조회한다.

::: code-group

```bash [Secrets Manager]
#!/usr/bin/env bash
set +x
set -euo pipefail

secret="$(aws secretsmanager get-secret-value \
  --secret-id myapp/prod \
  --query SecretString \
  --output text)"

export SPRING_DATASOURCE_USERNAME="$(jq -er '.DB_USERNAME' <<< "$secret")"
export SPRING_DATASOURCE_PASSWORD="$(jq -er '.DB_PASSWORD' <<< "$secret")"
export APP_API_KEY="$(jq -er '.API_KEY' <<< "$secret")"

unset secret
exec java -jar app.jar
```

```bash [Parameter Store]
#!/usr/bin/env bash
set +x
set -euo pipefail

params="$(aws ssm get-parameters-by-path \
  --path /myapp/prod/ \
  --recursive \
  --with-decryption \
  --query 'Parameters[].{Name:Name,Value:Value}' \
  --output json)"

export SPRING_DATASOURCE_USERNAME="$(jq -er '.[] | select(.Name == "/myapp/prod/DB_USERNAME") | .Value' <<< "$params")"
export SPRING_DATASOURCE_PASSWORD="$(jq -er '.[] | select(.Name == "/myapp/prod/DB_PASSWORD") | .Value' <<< "$params")"
export APP_API_KEY="$(jq -er '.[] | select(.Name == "/myapp/prod/API_KEY") | .Value' <<< "$params")"

unset params
exec java -jar app.jar
```

:::

스크립트 상단에 `set +x`와 `set -euo pipefail`을 두어 로그 노출과 조회 실패 시 기동을 막고, `unset`으로 임시 변수를 비운 뒤 `exec`로 Java 프로세스를 실행한다.

### ECS - `secrets.valueFrom`

ECS에서는 별도 스크립트 없이 태스크 정의의 `secrets.valueFrom`으로 환경 변수를 바로 주입한다. Secrets Manager JSON 시크릿은 ARN 뒤에 `:키이름::` 형식을 붙여 특정 키만 매핑하며, Parameter Store는 파라미터 ARN을 그대로 지정한다.

```json [task-definition.json]
{
  "secrets": [
    {
      "name": "SPRING_DATASOURCE_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:myapp/prod-AbCdEf:DB_PASSWORD::"
    },
    {
      "name": "SPRING_MAIL_PASSWORD",
      "valueFrom": "arn:aws:ssm:ap-northeast-2:123456789012:parameter/myapp/prod/smtp-password"
    }
  ]
}
```

## 시크릿 관리로 막을 수 있는 범위

EC2 인스턴스 자체가 장악되었다면 환경 변수 주입이든 IAM 역할이든 의미가 없다. 침해 상황에서는 **EC2 인스턴스 메타데이터** 가 기본적인 조회 경로가 되기 때문이다. Parameter Store 같은 서비스는 앱이 뚫리지 않았을 때 ==파일 복사나 배포 과정에서 민감정보가 새는 위험을 줄이는 수단== 으로 봐야 한다. 반대로 환경 변수로 주입해 두고도 디버깅 로그에 값을 찍거나 **Actuator 엔드포인트** 를 열어 두면 오히려 위험이 크다.

하나씩 챙기다 보니 아직도 밀린 숙제가 많다.

## 참고 자료

- [AWS Document - Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [AWS Document - Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS 기술 블로그 - 중앙 집중식 및 분산형 비밀 관리 방식 알아보기](https://aws.amazon.com/ko/blogs/tech/exploring-common-centralized-and-decentralized-approaches-to-secrets-management/)
