---
title: Antigravity 에서 AWS Aurora Postgres 에 접근하기
date: 2026-03-27T07:30:00+09:00
description: AI 에이전트 Antigravity에서 AWS Aurora PostgreSQL에 IAM 인증으로 접근해 스키마 조회와 쿼리 검증을 안전하게 수행하기 위한 환경 구성을 정리합니다.
tags:
- Antigravity
- AWS
- Aurora
- PostgreSQL
- Database
---

# Antigravity 에서 AWS Aurora Postgres 에 접근하기

AI 코딩 에이전트인 `Antigravity`를 사용하면서 데이터베이스 스키마를 조회하거나 쿼리를 실행하여 데이터를 확인하고, 때로는 복잡한 데이터 또는 SQL 저장 함수(Stored Functions)를 직접 검증하고 싶을 때가 많습니다. 하지만 기존의 MCP(Model Context Protocol) 서버를 사용하려고 하면 실제 엔터프라이즈 환경에서 몇 가지 한계에 부딪히게 됩니다.

## 사전 요구 사항

에이전트 스킬이 원활하게 작동하려면 로컬 환경에 다음 도구들이 설치되어 있어야 합니다.

- **AWS CLI**: IAM 인증 토큰 생성을 위해 필요합니다.
- **PostgreSQL Client (psql, pg_dump)**: 실제 데이터베이스 연결 및 스키마 추출을 위해 필요합니다.
- **Python 3.x**: 고도화된 인스펙터 스크립트 실행을 위해 필요합니다.

## 기존 MCP 서버의 한계

[crystaldba/postgres-mcp](https://github.com/crystaldba/postgres-mcp) 같은 유명한 서버들도 AWS Aurora의 IAM Database Authentication을 기본적으로 지원하지 않습니다. 또한, [awslabs/mcp](https://github.com/awslabs/mcp)에서 제공하는 기능조차 특정 사용자로 접속할 수 있는 방법이 없다는 [이슈(Issue #2505)](https://github.com/awslabs/mcp/issues/2505)가 있습니다.

AWS 공식 기술 블로그의 [AWS MCP로 Aurora PostgreSQL 데이터베이스 관리하기](https://aws.amazon.com/ko/blogs/tech/aws-mcp-aurora-postgresql/)와 같은 글을 참고해봐도, 실제 우리 조직에서 필수적으로 사용하는 [AWS IAM 데이터베이스 인증(IAM DB Auth)](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html) 방식과 [AWS Advanced Python Wrapper](https://github.com/aws/aws-advanced-python-wrapper)에서 제공하는 특정 사용자(`db-user`) 기반의 **Federated Authentication Plugin** 등 복잡한 실무 환경 설정은 충분히 지원하지 않는다는 한계를 확인했습니다.

이러한 제약 사항 때문에, 우리는 Antigravity의 숨겨진 기능인 **'에이전트 스킬(Agent Skills)'** 을 활용하여 우리만의 맞춤형 DB 접근 도구를 직접 구현하는 것이 더 나은 선택이 될 수 있습니다.

## Antigravity 에이전트 스킬로 해결하기

Antigravity는 현재 UI를 통한 에이전트 스킬 설정을 제공하지 않지만, 프로젝트 내 `.agents/skills` 폴더에 스킬 구조를 갖춰두면 에이전트가 자동으로 이를 인식하고 활용할 수 있습니다.

특히 '**워크플로우(Workflows)**'가 사용자의 직접적인 수행 지시가 있어야만 동작하는 것과 달리, '**에이전트 스킬(Agent Skills)**'은 사용자가 직접 어떤 도구를 쓰라고 언급하지 않아도 DB 조회나 스키마 확인이 필요한 맥락임을 에이전트가 판단하면 **스스로 필요한 스킬을 동원**하여 작업을 완수합니다.

### 1. 실전형 에이전트 스킬 구조

`.gemini/antigravity/skills/aurora-operator/` 폴더를 생성하고 다음과 같이 구성합니다.

```text
aurora-operator/
├── SKILL.md          <-- 에이전트에게 내리는 지침
└── scripts/
    └── query-helper.sh  <-- AWS CLI와 IAM 인증을 결합한 통합 실행 스크립트
```

### 2. 통합 쿼리 헬퍼 스크립트 (Bash)

에이전트가 런타임에 직접 호출하여 IAM 토큰 생성부터 쿼리 실행까지 한 번에 처리하는 스크립트입니다. `AWS_PROFILE`과 구체적인 접속 정보를 환경 변수로 관리하여 유연하게 대처할 수 있습니다.

```bash
#!/bin/bash
# scripts/query-helper.sh - AWS RDS PostgreSQL IAM Query Helper

SQL=$1
# 프로젝트 환경에 맞는 기본값 설정 (필요 시 에이전트가 환경 변수로 주입 가능)
DB_HOST=${DB_HOST:-"your-aurora-cluster.ap-northeast-2.rds.amazonaws.com"}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-"mambo_dev"}
DB_USER=${DB_USER:-"mambo_agent_user"}
AWS_REGION=${AWS_REGION:-"ap-northeast-2"}
AWS_PROFILE=${AWS_PROFILE:-"mambo-role-dev"}

if [ -z "$SQL" ]; then
  echo "Usage: $0 \"SQL_QUERY\""
  exit 1
fi

# 1. IAM 인증 토큰 생성
TOKEN=$(aws rds generate-db-auth-token \
    --hostname "$DB_HOST" \
    --port "$DB_PORT" \
    --region "$AWS_REGION" \
    --username "$DB_USER" \
    --profile "$AWS_PROFILE")

# 2. 토큰을 비밀번호로 사용하여 psql 실행
PGPASSWORD="$TOKEN" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "$SQL"
```

위와 같이 스크립트를 작성해두면, 에이전트가 `AWS CLI`와 **Assume Role**이 적용된 특정 프로파일을 지정하여 RDS 인증 토큰을 동적으로 발급받을 수 있습니다. 발급된 토큰을 비밀번호로 활용하여 `psql` 명령어로 데이터베이스 엔드포인트에 즉시 연결할 수 있으며, 이는 정적인 설정 파일에 의존하던 기존 MCP 서버들의 한계를 효과적으로 해결해줍니다.

### 3. SKILL.md 활용 가이드라인

에이전트에게 이 도구들을 언제, 어떻게 사용해야 하는지 명확한 가이드라인을 제공합니다. 에이전트는 이 정의를 바탕으로 대화 중 DB 작업이 필요하다고 판단되면 자율적으로 이 스킬을 호출합니다.

```markdown
---
name: aurora-operator
description: AWS CLI 기반 IAM 인증 및 특정 프로파일을 통한 DB 접근 전문 스킬
---

# Aurora Operator Skill

## 지침 (Instructions)
1. **쿼리 실행**: `scripts/query-helper.sh`에 실행할 SQL 문을 인자로 전달하여 호출합니다.
2. **권한 관리**: 특정 프로파일(`AWS_PROFILE`)이나 사용자(`DB_USER`)가 필요한 경우 환경 변수를 먼저 설정한 후 스크립트를 실행합니다.
3. **스키마 지정**: 특정 스키마 접근이 필요하다면 SQL 문 앞에 `SET search_path TO <schema>;`를 포함하여 전달합니다.
```

### 4. 고도화된 DB Inspector (Python)

단순히 목록만 조회하는 것을 넘어, `pg_dump`와 파이썬을 결합하여 전체 스키마 DDL을 추출하고 SQL 함수를 카테고리별로 분류하여 저장하는 고도화된 인스펙터 스크립트를 작성할 수 있습니다. 이를 통해 에이전트는 복잡한 비즈니스 로직이 담긴 저장 함수들을 체계적으로 학습할 수 있습니다.

```python
#!/usr/bin/env python3
# scripts/inspect-db.py
import subprocess
import os
import sys
import argparse

def get_token(host, port, region, user, profile):
    cmd = ["aws", "rds", "generate-db-auth-token", "--hostname", host, "--port", str(port), "--region", region, "--username", user, "--profile", profile]
    return subprocess.check_output(cmd).decode().strip()

def run_psql(host, port, user, db, token, sql):
    env = os.environ.copy()
    env["PGPASSWORD"] = token
    cmd = ["psql", "-h", host, "-p", str(port), "-U", user, "-d", db, "-t", "-A", "-c", sql]
    return subprocess.check_output(cmd, env=env).decode()

def run_psql_list(host, port, user, db, token, sql):
    env = os.environ.copy()
    env["PGPASSWORD"] = token
    cmd = ["psql", "-h", host, "-p", str(port), "-U", user, "-d", db, "-t", "-A", "-c", sql]
    return subprocess.check_output(cmd, env=env).decode().strip().split('\n')

def main():
    parser = argparse.ArgumentParser(description="Export RDS schema DDL and organize functions by category.")
    parser.add_argument("--schema", default="mambo_schema", help="PostgreSQL schema to export")
    parser.add_argument("--output", default="sql_output", help="Output directory")
    args = parser.parse_args()

    # 환경 변수 또는 직접 지정 (에이전트 스킬에서 제어 가능)
    DB_HOST = os.getenv("DB_HOST", "your-aurora-cluster.ap-northeast-2.rds.amazonaws.com")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "mambo_dev")
    DB_USER = os.getenv("DB_USER", "mambo_agent_user")
    AWS_PROFILE = os.getenv("AWS_PROFILE", "mambo-role-dev")
    AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")

    os.makedirs(args.output, exist_ok=True)
    
    print(f"Generating IAM token for {DB_USER}...")
    token = get_token(DB_HOST, DB_PORT, AWS_REGION, DB_USER, AWS_PROFILE)

    # 1. Tables & Constraints (pg_dump 활용)
    print(f"Exporting tables for schema '{args.schema}'...")
    table_output = os.path.join(args.output, "tables.sql")
    env = os.environ.copy()
    env["PGPASSWORD"] = token
    
    cmd_dump = [
        "pg_dump", "-h", DB_HOST, "-p", str(DB_PORT), "-U", DB_USER, "-d", DB_NAME, 
        f"--schema={args.schema}", "-t", f"{args.schema}.*", "-s", "--no-owner", "--no-privileges", "-f", table_output
    ]
    subprocess.check_call(cmd_dump, env=env)

    # 2. Functions (카테고리별 동적 분류)
    print(f"Fetching functions...")
    sql_list = f"SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = '{args.schema}' ORDER BY proname;"
    function_names = [f.strip() for f in run_psql_list(DB_HOST, DB_PORT, DB_USER, DB_NAME, token, sql_list) if f.strip()]

    categorized_funcs = {}
    for func in function_names:
        sql_def = f"SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = '{args.schema}' AND p.proname = '{func}';"
        ddl = run_psql(DB_HOST, DB_PORT, DB_USER, DB_NAME, token, sql_def).strip()
        
        # '$' 기호를 기준으로 카테고리 자동 분류 (예: category$function_name)
        cat = func.split('$')[0] if '$' in func else "misc"
        if cat not in categorized_funcs: categorized_funcs[cat] = []
        categorized_funcs[cat].append(ddl)

    for cat, ddl_list in categorized_funcs.items():
        output_path = os.path.join(args.output, f"{cat}.sql")
        with open(output_path, "w") as f:
            f.write(f"-- Category: {cat}\n\n" + "\n\n".join(ddl_list))
    
    print("Success: Database schema and functions exported.")

if __name__ == "__main__":
    main()
```

이 파이썬 스크립트를 통해 에이전트는 DB 구조를 문서화된 파일 형태로 확보하게 되며, 특히 복잡한 SQL 저장 함수를 용도별로 파악하여 비즈니스 로직을 훨씬 정확하게 이해할 수 있게 됩니다.

## 글로벌 설치 및 활용 팁

위에서 설명한 에이전트 스킬은 특정 프로젝트에만 국한되지 않고, 모든 프로젝트에서 공통으로 사용할 수 있도록 **글로벌하게 설치**할 수 있습니다.

오픈소스 리포지토리(예: `SuperAntigravity`, `antigravity-skills`)에서 가져온 설정들을 다음과 같이 사용자 홈 디렉토리 경로에 추가하면 됩니다.

- **스킬**: **`~/.gemini/antigravity/skills/`** 폴더 내에 위치시킵니다. 에이전트가 필요할 때 자동으로 로드합니다.
- **워크플로우**: **`~/.gemini/config/global_workflows/`** 폴더 내에 위치시킵니다. 

### 💡 알아두면 좋은 점
- 글로벌 워크플로우를 호출할 때는 일반적인 `/workflow` 형식이 아니라, 특이하게 **`global_`** 접두사가 붙어 **`/global_workflow`** 형태로 나타납니다.
- 설치 후에는 Antigravity 채팅창에 `/`(슬래시)를 입력하여, 작성한 워크플로우와 스킬이 정상적으로 인식되는지 확인하세요.

## 마치며

일반적으로 **MCP 서버를 활용하면 엄청나게 유용해요!** 라고 말하지만 모든 것을 커버하진 못합니다. Antigravity의 **에이전트 스킬**은 우리만의 커스텀 MCP를 가장 쉽게 만드는 방법이 될 수 있습니다.