---
title: AWS Bedrock Converse API
date: 2026-07-07T08:00+09:00
description: AWS Bedrock Converse API 기반으로 전력사용량 데이터를 분석하는 흐름을 다룹니다.
tags:
    - AWS Bedrock
    - Tool Use
    - Knowledge Base
    - Guardrail
---

# AWS Bedrock Converse API

기존 서비스 내 AI 분석 기능은 Claude RESTful API를 직접 호출하는 방식이었어요. 하지만 만료된 외부 API 키 관리 및 보안 유지 등의 한계가 있어, 클로드 모델 이외에도 다양한 파운데이션 모델을 유연하게 활용하고 IAM 권한 제어가 가능한 ==AWS Bedrock 기반으로의 전환== 을 결정하게 되었어요.

## AWS Bedrock 도입 이유

기존 분석 기능의 한계를 보완하기 위해 다음과 같은 이유로 Bedrock을 도입했어요.

- **동적 데이터 조회 필요**: 기존에는 질문과 무관하게 참조 데이터를 프롬프트에 정적으로 주입하는 형태였어요. 이로 인해 불필요한 토큰 소비가 많았고 유연한 조회도 불가능했죠.
- **보안 및 관리 편의성**: 외부 API 키 체계를 유지하는 대신 사내 인프라(AWS ECS)와 연동이 간편한 **IAM 자격 증명 통제**를 활용하는 것이 안전하다고 판단했어요.
- **모델 교체 및 인프라 연동**: Amazon Bedrock [Converse API](https://docs.aws.amazon.com/ko_kr/bedrock/latest/userguide/conversation-inference.html)를 사용하면 모델 전환이 간편하고, 완전관리형 RAG 솔루션인 **지식 베이스(Knowledge Base)**와 손쉽게 연동돼요.

결과적으로 [Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html)로 질문에 따른 데이터를 유연하게 조회하고, 지식 베이스로 도메인 지식을 보강하여 한층 나은 AI 분석 결과를 제공할 수 있게 되었어요.

## AWS SDK for Java v2 의존성 추가

```groovy [build.gradle]
dependencies {
    implementation platform('software.amazon.awssdk:bom:2.46.21') // 2.25.0+
    implementation 'software.amazon.awssdk:bedrockruntime'      // Converse API
    implementation 'software.amazon.awssdk:bedrockagentruntime' // Knowledge Base (지식 베이스 RAG)
}
```

### Converse API 호출 권한

`BedrockAgentRuntimeClient`를 사용해서 Converse 또는 ConverseStream 작업을 하려면 `bedrock:InvokeModel`과 `bedrock:InvokeModelWithResponseStream` 권한이 필요해요.

저는 테스트를 위해 임시로 `AmazonBedrockFullAccess` 권한을 부여했어요.

## Tool Use 기반 Functional Calling

Amazon Bedrock에서는 모델이 도구를 직접 호출하여 외부 네트워크 통신을 진행하지 않아요.
대신 메시지를 전송할 때 사용할 수 있는 도구 정의를 함께 보내면, 모델이 도구 사용이 필요하다고 판단하여 응답(stopReason이 'tool_use')을 보냈을 때 애플리케이션에서 직접 도구를 호출해 결과를 채워주는 **[Client Side](https://docs.aws.amazon.com/ko_kr/bedrock/latest/userguide/tool-use-client-side.html) 방식**으로 동작해요.

구체적인 흐름은 공식 [자바 코드 예시](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/java_bedrock-runtime_code_examples.html#scenarios) 중 'Tool use with the Converse API' 부분을 참고하면 도움이 될 거예요.

### ConverseRequest.toolConfig

Java SDK v2를 사용하여 Converse API에 도구(Tool)를 전달하기 위한 설정 예시예요.
`ToolSpecification`을 통해 도구의 이름, 설명 및 입력 파라미터 스키마를 정의하고 이를 `ToolConfig`에 담아 요청에 포함해요.

```java
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.model.*;
import java.util.List;
import java.util.Map;

// 공통으로 사용하는 모델 ID 및 리전 상수
private static final String MODEL_ID = "anthropic.claude-sonnet-5";
private static final Region REGION = Region.AP_NORTHEAST_2;

// 1. 도구(Tool) 명세 정의
ToolSpecification toolSpec = ToolSpecification.builder()
    .name("getPowerUsageData")
    .description("특정 사용자의 전력 사용량 및 분석 데이터를 조회합니다.")
    .inputSchema(Document.fromMap(Map.of(
        "type", "object",
        "properties", Map.of(
            "userId", Map.of("type", "string", "description", "조회 대상 사용자 ID"),
            "date", Map.of("type", "string", "description", "조회 날짜 (YYYY-MM-DD)")
        ),
        "required", List.of("userId", "date")
    )))
    .build();

// 2. ToolConfig 구성
ToolConfig toolConfig = ToolConfig.builder()
    .tools(Tool.builder().toolSpec(toolSpec).build())
    .build();

// 3. ConverseRequest 생성 시 toolConfig 추가
ConverseRequest request = ConverseRequest.builder()
    .modelId(MODEL_ID)
    .messages(messages)
    .toolConfig(toolConfig)
    .build();
```

## S3 기반 지식 베이스

AI 모델은 국내 전력 요금제가 어떻게 바뀌는지와 같은 최신 도메인 정보를 자체 학습 데이터만으로는 실시간으로 파악하기 어려워요.
이처럼 정보가 부재한 한계를 극복하기 위해 완전관리형 RAG인 `Bedrock Knowledge Base`를 지식 레이어로 활용해요.

Gemini의 File Search 기능처럼 복잡한 데이터 파이프라인이나 임베딩 로직을 직접 구현할 필요 없이, ==S3 버킷에 관련 문서 파일 업로드== 하여 연동하는 방식의 ==S3 벡터 스토어== 형태로 지식 베이스를 구성해 두면 `BedrockAgentRuntimeClient`를 통해 손쉽게 관련 문서(Retrieve)를 조회할 수 있어요.

지식 베이스 조회를 위해서는 대상 지식 베이스 리소스(`arn:aws:bedrock:...:knowledge-base/...`)에 대해 `bedrock:Retrieve` 작업을 허용하는 IAM 정책이 해당 API를 호출하는 Identity에 부여되어 있어야 해요. 권한이 없을 경우 아래와 같은 예외가 발생합니다.

```
software.amazon.awssdk.services.bedrockagentruntime.model.AccessDeniedException: User: arn:aws:iam::123456789012:user/my-user is not authorized to perform: bedrock:Retrieve on resource: arn:aws:bedrock:ap-northeast-2:123456789012:knowledge-base/YOUR_KNOWLEDGE_BASE_ID (Service: BedrockAgentRuntime, Status Code: 403, Request ID: ...)
```

```java
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockagentruntime.BedrockAgentRuntimeClient;
import software.amazon.awssdk.services.bedrockagentruntime.model.RetrieveRequest;
import software.amazon.awssdk.services.bedrockagentruntime.model.RetrieveResponse;
import software.amazon.awssdk.services.bedrockagentruntime.model.KnowledgeBaseQuery;

// 1. BedrockAgentRuntimeClient 초기화
BedrockAgentRuntimeClient agentRuntimeClient = BedrockAgentRuntimeClient.builder()
    .region(REGION)
    .build();

// 2. RetrieveRequest 구성 (지식 베이스 ID 및 검색 쿼리 지정)
RetrieveRequest retrieveRequest = RetrieveRequest.builder()
    .knowledgeBaseId("YOUR_KNOWLEDGE_BASE_ID")
    .retrievalQuery(KnowledgeBaseQuery.builder()
        .text("한국전력 주택용 전기요금 누진제")
        .build())
    .build();

// 3. 지식 베이스 조회 및 결과 수집
RetrieveResponse retrieveResponse = agentRuntimeClient.retrieve(retrieveRequest);
retrieveResponse.retrievalResults().forEach(result -> {
    System.out.println("검색 문맥: " + result.content().text());
    System.out.println("출처 S3 URI: " + result.location().s3Location().uri());
});
```

## Converse API 요청 시 가드레일 추가

`ConverseRequest`에 `GuardrailConfiguration`을 추가하면, Converse API 호출 시 실시간으로 가드레일 필터링이 작동하여 응답에서 민감한 정보가 포함되지 않도록 방어할 수 있어요. 본 글에서 반드시 필요한 건 아니지만 혹시나 모를 누출을 방지하기 위해서 알아두면 좋을 것 같아요.

가드레일을 적용하여 모델을 호출하기 위해서는 대상 가드레일 리소스(`arn:aws:bedrock:...:guardrail/...`)에 대해 `bedrock:ApplyGuardrail` 작업을 허용하는 IAM 정책이 부여되어 있어야 해요. 권한이 없을 경우 아래와 같은 예외가 발생합니다.

```
software.amazon.awssdk.services.bedrockruntime.model.AccessDeniedException: User: arn:aws:iam::123456789012:user/my-user is not authorized to perform: bedrock:ApplyGuardrail on resource: arn:aws:bedrock:ap-northeast-2:123456789012:guardrail/YOUR_GUARDRAIL_ID (Service: BedrockRuntime, Status Code: 403, Request ID: ...)
```

```java
import software.amazon.awssdk.services.bedrockruntime.model.GuardrailConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.GuardrailStreamBehavior;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;

// 1. GuardrailConfiguration 구성
GuardrailConfiguration guardrailConfig = GuardrailConfiguration.builder()
    .guardrailIdentifier("YOUR_GUARDRAIL_ID")
    .guardrailVersion("1") // 설정한 가드레일 버전
    .streamProcessingMode(GuardrailStreamBehavior.SYNC) // 스트림 처리 방식 설정
    .build();

// 2. ConverseRequest 생성 시 guardrailConfig 추가
ConverseRequest request = ConverseRequest.builder()
    .modelId(MODEL_ID)
    .messages(messages)
    .guardrailConfig(guardrailConfig)
    .build();
```

## AI 기본 분석 예상 시나리오

AWS SDK의 [BedrockScenario 예제 코드](https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javav2/example_code/bedrock-runtime/src/main/java/com/example/bedrockruntime/scenario/BedrockScenario.java)를 참고해서 전체적인 분석 처리 시나리오는 다음과 같이 예상해볼 수 있어요.

### 1. BedrockAgentRuntimeClient 로 지식 베이스 검색

지식 베이스에서 사용자의 질문에 부합하는 관련 문서를 검색해요.

### 2. BedrockRuntimeClient 로 Converse API 호출

사용자의 전력 사용 패턴을 알기 위해서 전력사용량을 조회할 수 있는 도구 명세를 함께 전달하여 Converse API를 호출해요.

### 3. Application 서비스 로직에서 도구 호출

모델의 응답 결과(`stopReason`이 `tool_use`)를 확인하고, 실제 전력사용량 데이터를 수집하기 위해 해당 도구를 실행해요.

### 4. BedrockRuntimeClient 로 Converse API 로 최종 결과 생성

지식 베이스에서 가져온 문서 정보와 조회한 전력사용량 데이터를 프롬프트에 조합해 넣어서 Converse API를 다시 호출하고, 최종 요금 분석 답변을 사용자에게 전달해요.

다만 흐름을 보면 알겠지만 ==AI가 알아서 도구를 스스로 실행하는 구조는 아니에요==. 모델은 어떤 도구를 실행해야 하는지 가이드만 줄 뿐이며, 실제 도구를 실행하여 데이터를 조회하고 전달하는 흐름은 애플리케이션(코드)이 직접 제어해 줘야 해요.

## AWS Bedrock 제약 사항

AWS Bedrock 으로 전환하면서 알게된 몇가지 제약사항에 대해 알아볼게요.

### Global inference ID

[Anthropic Claude Sonnet 5](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html) 모델처럼 서울 리전에서는 지원하지 않을 수 있어요. 이때는 글로벌 추론 ID (`global.anthropic.claude-sonnet-5`) 로 사용해야 해요. 반대로, **Anthropic Claude 3.5 Sonnet** 모델은 글로벌 추론 ID(Global inference ID)를 지원하지 않아서, `global.` 접두사(예: `global.anthropic.claude-3-5-sonnet-20240620-v1:0`)를 사용하여 호출할 수 없어요.

### Amazon Bedrock Mantle (OpenAI 호환 엔드포인트)

Amazon Bedrock Mantle 엔드포인트는 OpenAI 규격 에 대한 호환성을 제공하며 Project Mantle 추론 엔진으로 동작해요. Mantle 엔드포인트에서는 GPT 모델 뿐만 아니라 Gemma, Grok 등 오픈웨이트 모델에 대해서도 지원해요. 다만, 아직은 아시아 태평양 (서울, ap-northeast-2) 리전에서는 사용할 수 없어요. 그리고 가드레일 및 지식 베이스 등도 지원하지 않아요.

## 참고 자료

- [AWS Bedrock Converse API 공식 개발자 가이드](https://docs.aws.amazon.com/ko_kr/bedrock/latest/userguide/conversation-inference.html)
- [AWS SDK for Java v2 Bedrock Runtime 코드 예제](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/java_bedrock-runtime_code_examples.html#anthropic_claude)
- [AWS Bedrock IAM 자격 증명 기반 정책 예제](https://docs.aws.amazon.com/ko_kr/bedrock/latest/userguide/security_iam_id-based-policy-examples.html)
- [A Java Developer's Guide to Bedrock's New Converse API](https://builder.aws.com/content/2hUiEkO83hpoGF5nm3FWrdfYvPt/a-java-developers-guide-to-bedrocks-new-converse-api)
