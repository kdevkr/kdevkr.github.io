---
title: GenAI SDK를 활용한 함수 호출과 RAG 도입
date: 2026-07-10T07:00+09:00
description: Google Gen AI SDK for Java 를 다룹니다.
tags:
    - Gemini
    - Function Calling
    - File Search
    - Java
---

# GenAI SDK

사내에 KDB+를 도입한 시니어가 1명뿐인 상황에서, KDB 레퍼런스 부족으로 AI마저 잘못된 문법을 추측하며 쿼리 조회에 실패하곤 해요. 이를 보완하기 위해 프로젝트의 검증된 조회 함수를 도구(Tool)로 제공하고, 공식 레퍼런스와 KDB 가이드 문서를 결합한 RAG를 구축하려 해요. [이전 KDB+ 소개글](/posts/kdb-plus)을 뼈대 삼아, **프로젝트 환경에 맞는 KDB 활용 AI 챗봇**을 구현하는 실무 시나리오를 알아볼게요.

## Function Calling & File Search

프로젝트 내 KDB 활용을 돕는 챗봇을 설계할 때는 KDB+ 서버 내부의 실시간 스키마 정보(동적 데이터)와 Q 언어 개발 매뉴얼 문서(정적 자료)를 모두 매끄럽게 처리해야 해요.

- **Function Calling**: 사용자가 "trade 테이블 구조가 어떻게 돼?"라고 물었을 때, AI가 직접 KDB 쿼리를 조합하는 대신 프로젝트에 이미 구현되어 있는 스키마 조회 함수(`getKdbTableSchema` )를 도구로 선택하여 안전하게 호출하도록 유도해요.
- **File Search**: KDB 레퍼런스 부족으로 AI가 잘못 추측하여 실패하는 문제를 방지하기 위해, 프로젝트용 KDB 활용 및 공식 레퍼런스 문서를 Gemini 파일 저장소에 업로드해 질문에 참고하게 만드는 RAG 기술이에요. [공식 문서](https://ai.google.dev/gemini-api/docs/file-search?hl=ko)에서 언급하듯 복잡한 임베딩 파이프라인이나 벡터 DB를 구축할 필요 없이, 파일 업로드와 스토어 지정만 해주면 Gemini가 청크 및 인덱싱을 자동 처리해 줘요.

## 의존성 설정 및 환경 준비

Java 프로젝트 빌드 파일에 다음과 같이 `google-genai` 라이브러리를 추가하고, API 호출을 위해 OS 환경 변수에 발급받은 Gemini API 키를 **`GOOGLE_API_KEY`** 라는 이름으로 등록해 주세요.

```groovy [build.gradle]
dependencies {
    implementation 'com.google.genai:google-genai:1.59.0'
}
```

## Function Calling을 위한 도구 정의

KDB+ 테이블 스키마 정보를 안전하게 조회하기 위해 프로젝트에 이미 정의된 자바 메소드를 Gemini가 인식할 수 있도록 도구(`Tool`) 스펙으로 구성해요. 자바 SDK에서는 `FunctionDeclaration` 빌더를 사용해 호출할 함수의 이름, 상세 설명, 그리고 인자 파라미터 스키마를 다음과 같이 명시적으로 선언할 수 있어요.

```java [ChatService.java]
public class ChatService {

  // KDB+ 서버에 질의하여 테이블 스키마를 가져오는 검증된 조회 함수예요.
  public static String getKdbTableSchema(String tableName) {
    Map<String, String> mockDb = new HashMap<>();
    mockDb.put("trade", "columns: time(time), sym(symbol), price(float), size(int)");
    mockDb.put("quote", "columns: time(time), sym(symbol), bid(float), ask(float), bsize(int), asize(int)");

    return mockDb.getOrDefault(tableName, "해당 테이블 스키마 정보를 찾을 수 없습니다.");
  }

  // getKdbTableSchema 메소드를 도구(Tool) 스펙으로 선언해요.
  public static Tool getKdbTool() {
    FunctionDeclaration declaration = FunctionDeclaration.builder()
        .name("getKdbTableSchema")
        .description("KDB+ 테이블의 이름을 받아 해당 테이블의 실시간 스키마 정보를 조회합니다.")
        .parameters(Schema.builder()
            .type(Type.OBJECT)
            .putProperty("tableName", Schema.builder()
                .type(Type.STRING)
                .description("조회할 테이블 이름 (예: trade, quote)")
                .build())
            .required(List.of("tableName"))
            .build())
        .build();

    return Tool.builder()
        .functionDeclarations(List.of(declaration))
        .build();
  }
}
```

## 파일 검색을 통한 RAG 도입

정적인 Q 언어 가이드 PDF 문서를 챗봇에 연동하기 위해 Gemini Files API로 업로드해야 해요. 단순히 문서를 등록하고 파일 검색에 연동할 목적이라면 Java SDK에서 제공하는 `client.files.upload` 메소드를 호출하고 `UploadToFileSearchStoreConfig` 설정을 지정하여 파일을 업로드하는 것만으로 충분해요.

다만, 원본 파일명을 보존하여 목록화하는 등 체계적인 문서 관리 기능이 필요하다면 SDK v1.59.0 기준 알려진 버그([GitHub Issue #821](https://github.com/googleapis/java-genai/issues/821))로 인해 **displayName** 필드가 누락되어 업로드되는 이슈가 있어요. 따라서 문서 관리의 고도화가 필요한 프로젝트 환경이라면 SDK 메소드 대신 별도로 AI 에이전트에게 REST API 호출 방식의 우회 업로드 로직 구현을 요청하여 활용해야 해요.

업로드된 매뉴얼 문서의 정보(URI)를 기반으로 Gemini 모델에 질문하기 위해, **Part.fromUri()** 를 사용하여 파일 객체의 레퍼런스를 텍스트 프롬프트와 함께 컨텍스트(Content)에 담아 전송하는 방식으로 RAG를 쉽게 연동할 수 있어요. 상세한 활용법과 사양은 공식 [Gemini API 파일 검색 가이드](https://ai.google.dev/gemini-api/docs/file-search?hl=ko) 를 참고해 주세요.

```java
// Part.fromUri()를 사용해 업로드한 파일의 이름(레퍼런스 URI)을 질문 파트와 함께 엮어 전달해요.
Content content = Content.fromParts(
    Part.fromText(userPrompt),
    Part.fromUri(fileUri, "application/pdf")
);
```

## 아직은 오류 투성이

아직은 도입 초기 단계라 오류 투성이이다 보니, 시스템 지침(Instruction)도 RAG으로 등록한 참고 문서도 많이 부족해 AI 에이전트가 사용자 요청을 처리하려 시도하다가 데이터를 제대로 가져오지 못하는 상황이 자주 보여요. 도구 호출을 여러 번 반복하다가 결국 최종 응답에 실패하는 식이죠. 또한, 단순히 KDB 함수를 호출하는 것만으로는 가져온 데이터를 사용자가 원하는 형태로 알아서 가공하고 조합해 반환하지 못하는 한계도 있어요. 특히 시계열 데이터와 연관된 상세 정보를 함께 제공하기 위해서는 관계형 DB(RDB)의 SQL 함수를 호출하는 도구(Tool)도 추가로 필요하다는 점을 느끼게 되었어요. AI는 정확하게 계산된 규칙이 아니라 통계적인 추측과 가정을 기반으로 동작하기 때문에, 모델이 의도에 맞춰 도구를 적절히 호출하고 데이터를 올바르게 해석할 수 있도록 시스템 지침(Instruction)을 구체화하고 가이드 자료를 지속적으로 보강하는 작업이 무엇보다 중요하다고 느껴요.
