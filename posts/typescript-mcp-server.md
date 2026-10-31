---
title: AI의 도움으로 만들어본 첫 타입스크립트 MCP 서버
date: 2026-10-31T17:00+09:00
description: 사내 서비스 백엔드와 분리하여 AI 에이전트와 함께 타입스크립트로 구축한 독립 MCP 서버 이야기입니다.
tags:
  - TypeScript
  - MCP
  - Hono
  - AI 에이전트
---

# {{ $frontmatter.title }}

사내 제품에 MCP(Model Context Protocol)를 붙이려다 기존 스프링 부트 버전 문제로 **Spring AI** 도입이 어려웠습니다. 결국 타입스크립트 기반의 ==독립 MCP 서버== 로 분리했습니다.

## MCP 서버를 분리한 이유

서비스 제품에서 직접 MCP 엔드포인트를 제공할 수도 있었지만, 다음 이유로 별도 분리를 결정했습니다.

1. **기존 백엔드 버전 문제** : Spring AI를 온전히 쓰기에는 스프링 부트 버전이 낮았고, 프레임워크 업그레이드는 일정과 영향도 부담이 컸습니다.
2. **PoC 기능 포함의 부담** : 검증되지 않은 실험 기능이 메인 서비스 제품 코드에 섞이는 것은 피하고 싶었습니다.
3. **불명확한 니즈와 기획** : MCP 제공에 대한 시장이나 사내의 명확한 니즈와 구체적인 기획이 아직 정리되지 않았습니다.
4. **언제든 접을 수 있는 베타 서비스** : 반응이나 효과에 따라 언제든지 기능을 취소하거나 폐기할 수 있어야 했습니다.

마침 동료 개발자가 리포트 빌더 기능에 보안 관점으로 **샌드박스(MicroVM)** 환경을 시도하고 회의에서 공유해 준 것을 보았습니다. 그 내용을 참고해 기존 백엔드에 묶어두지 않고, 독립된 환경의 별도 프로세스로 가볍게 분리하기로 결정했습니다.

공식 SDK 지원과 참고할 예제가 많은 **타입스크립트** 를 선택했습니다. 사용자가 많아서 고성능이 요구되는 환경이었다면 Rust도 후보에 올랐겠지만, 평소 타입스크립트로 프로젝트를 만들어보고 싶었던 마음도 컸습니다.

## 기술 스택과 아키텍처

![독립 MCP 서버 아키텍처 및 기술 스택](/images/posts/typescript-mcp-server/001.svg)

- **Node 24** : Node 26도 고려했으나, 추후 AWS Lambda 배포를 감안해 공식 베이스 이미지가 있는 버전으로 선택했습니다.
- **Hono** : NestJS, Fastify, Hono를 검토했고, Lambda 배포를 고려한 AI의 추천으로 Hono를 선택했습니다.
- **Biome** : 빠른 속도의 Rust 기반 도구 중 린터와 포맷터를 한 번에 해결하기 위해 선택했습니다.

::: info NestJS를 후보에서 제외한 이유
AI가 제안한 선택지 중에는 NestJS도 있었어요. 하지만 일반적인 웹 서비스를 만들려는 목적이 아니었고, 다른 후보군에 비해 구조가 무겁다는 단점이 컸어요. 스프링 개발자에게 친숙한 구조라는 점도 이 프로젝트에서는 큰 장점으로 와닿지 않았어요.
:::

## 빠르게 구성된 프로젝트 저장소

한 번쯤 타입스크립트 프로젝트를 바닥부터 만들어보고 싶었지만 기회가 없었습니다. 예전에는 어떻게 시작해야 할지 몰라 이리저리 예제 저장소들을 찾아 헤맸겠지만, 지금은 ==AI 에이전트가 뼈대를 잡고 저장소까지 빠르게== 만들어줍니다.

초기에는 `@modelcontextprotocol/server`, `hono`, `zod` 세 가지만 넣고 시작했습니다.

```json [초기 package.json]
{
  "name": "sample-mcp",
  "version": "0.1.0",
  "dependencies": {
    "@modelcontextprotocol/server": "^2.4.0",
    "hono": "^4.13.14",
    "zod": "^4.6.7"
  }
}
```

::: warning Node2Shell / HTTP2Shell (CVE-2026-111497)
공교롭게도 최근 Node.js 생태계를 뜨겁게 달군 Brotli 압축 처리 결함 기반의 원격 코드 실행(RCE) 취약점이 터진 직후에 구성하게 된 프로젝트 저장소이기도 해요. 다행히 사용하는 도커 이미지는 해당 취약점이 해결된 버전([Node.js v24.22.1](https://nodejs.org/en/blog/release/v24.22.1) 이상)임을 확인했어요.
:::

## 개발 서버 배포와 늘어난 의존성

프로토타입을 거쳐 개발 서버 배포 단계로 가면서 실제 필요한 라이브러리들로 기능을 채워갔습니다.

- **인증 및 보안** : `oidc-provider`, `jose`
- **AWS 및 서버리스 연동** : `@hono/aws-lambda`, `@aws-sdk/client-s3`, `@aws-sdk/rds-signer`
- **데이터베이스 및 캐시** : `pg`, `redis`, `jkdb`
  - AI 에이전트의 초기 계획(DynamoDB) → 사내 표준에 맞춰 Redis로 선회 요청
- **도구 평가 및 부하 테스트** : `eval-tools.ts` (Anthropic Bedrock SDK), `k6`
- **코드 품질 관리** : `@biomejs/biome` (Rust 기반 린터 및 포맷터)

람다 환경 배포를 위한 멀티 스테이지 Dockerfile도 함께 구성했습니다. 인가 서버(`auth`)는 별도 빌드 타깃으로 분리하고, MCP 서버와 API Gateway 토큰 검증 람다(`authorizer`)는 같은 이미지에서 실행 명령(`CMD`)을 달리했습니다.

::: code-group

```json [package.json]
{
  "name": "sample-mcp",
  "scripts": {
    "dev": "TZ=UTC tsx watch src/local.ts",
    "inspect": "pnpm dlx @modelcontextprotocol/inspector@2.12.0 http://localhost:3000/mcp",
    "eval:tools": "TZ=UTC tsx scripts/eval-tools.ts",
    "load": "k6 run scripts/load-mcp.js",
    "build": "tsc",
    "lint": "biome check ."
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1159.0",
    "@aws-sdk/rds-signer": "^3.1159.0",
    "@hono/aws-lambda": "^1.0.1",
    "@modelcontextprotocol/server": "^2.4.0",
    "hono": "^4.13.14",
    "jkdb": "^1.4.0",
    "jose": "^6.2.13",
    "oidc-provider": "^9.13.2",
    "pg": "^8.23.1",
    "redis": "^6.3.0",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@anthropic-ai/bedrock-sdk": "^1.1.0",
    "@biomejs/biome": "2.6.4",
    "tsx": "^4.20.0",
    "typescript": "^7.0.2"
  }
}
```

```dockerfile [Dockerfile]
# 빌드 컨텍스트는 저장소 루트
#   MCP 서버·authorizer: docker buildx build -f docker/Dockerfile .  (authorizer는 CMD를 dist/authorizer.handler로 바꿔 씀)
#   인가 서버:           docker buildx build -f docker/Dockerfile --target auth .
FROM node:24-alpine3.22 AS build

WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
# 운영 의존성은 순수 JS라 alpine(musl)에서 설치한 node_modules를 Lambda 이미지로 그대로 옮김
RUN pnpm build && pnpm prune --prod

# 인가 서버: Koa 서버를 그대로 띄우고 Lambda Web Adapter가 Lambda 이벤트를 HTTP로 넘긴다
FROM node:24-alpine3.22 AS auth
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.1.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=8080 TZ=UTC NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/auth/main.js"]

FROM public.ecr.aws/lambda/nodejs:24

# RDS 인증서는 Node 기본 신뢰 목록에 없다
# ADD로 받은 파일은 600이라 root가 아닌 Lambda 실행 사용자가 읽지 못한다
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /opt/rds-ca.pem
ENV DB_SSL_CA=/opt/rds-ca.pem
# 기존 백엔드 JVM과 같이 UTC. 날짜를 지역 시간대로 바꿀 때는 시간대를 명시한다
ENV TZ=UTC

COPY --from=build /app/package.json ${LAMBDA_TASK_ROOT}/
COPY --from=build /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=build /app/dist ${LAMBDA_TASK_ROOT}/dist
CMD ["dist/lambda.handler"]
```

:::

::: info Oxlint vs Biome
Rust 기반 린터로 Oxlint도 고려할 수 있었지만, Biome은 포맷터까지 내장되어 있고 설정이 훨씬 간단해서 최종 선택했어요.
:::

## 테넌트와 샌드박스

AWS Lambda 기반으로 배포하여 함수 단위의 런타임 분리는 챙겼지만, 이것만으로 **진정한 멀티 테넌트 격리** 가 완성되는 것은 아닙니다.

실제 테넌트 구분은 인증 토큰(OIDC)에서 얻은 식별자와 데이터 필터링에 의존하고 있습니다. ==필터링에 결함이 생겼을 때 다른 테넌트의 데이터 접근까지 막을 수 있는지는 추가 검증이 필요== 합니다.

또한 사용자가 늘어나면 람다 환경의 DB 커넥션 관리나 **콜드 스타트** 문제가 오히려 독이 될 수도 있어 보입니다.

::: tip DB 커넥션 관리
람다 환경에서 늘어나는 DB 커넥션 부하는 향후 AWS RDS Proxy를 도입해 커넥션 풀을 공유하는 방식으로 완화를 검토할 수 있어요. 다만 애플리케이션의 쿼리 특성에 따라 연결 고정(Pinning)이 발생하면 풀링 효과가 제한될 수 있다는 점을 유의해야 해요.
:::

## 아직은 괜찮지만 — 믿을 수 있나?

프로토타입으로 개발 서버에 배포한 기능은 일단 잘 동작합니다.

하지만 이 프로젝트 코드를 온전히 이해하고 있는 상태는 아닙니다. 의존성에 추가된 `zod`나 `oidc-provider`도 처음에는 무엇인지 몰랐고, 복잡한 타입 정의도 여전히 낯섭니다.

AI 에이전트로 제품 기능을 빠르게 만들 수 있는 건 좋은데, 보안 사고가 빈번하게 발생하는 요즘이라 불안한 마음이 큽니다. 현재 GitHub에서 감지된 의존성 취약점은 0건이지만, ==코드 레벨에 숨어있을 결함을 스스로 다 파악하지 못하기== 때문입니다.

일단 돌아가기만 하면 괜찮은 것인지 여전히 확신이 서지 않습니다. 실제로 이 MCP 서버를 만드는 와중에도 다른 프로젝트에서 AI로 테스트 자동화를 진행했으나, 크리티컬한 결함을 끝내 찾지 못한 채 릴리즈되는 상황을 겪기도 했습니다.

개발 생산성이 높아진 만큼, 결국 코드를 검증하고 제품의 품질을 책임져야 하는 **엔지니어의 역할** 이 더 중요해졌습니다.
