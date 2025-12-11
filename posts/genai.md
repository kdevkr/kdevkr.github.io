---
title: Google GenAI SDK for Java
date: 2025-12-11T12:00+09:00
tags:
- genai
- java
---

# Google GenAI SDK for Java

## TL;DR

- 2026년 6월 24일 [Vertex AI의 Generative AI 모듈](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/deprecations?hl=ko) 지원 종료
- Vertex AI SDK는 [Google GenAI SDK (Preview)](https://github.com/googleapis/java-genai)로 마이그레이션 필요
- [Spring AI](https://docs.spring.io/spring-ai/reference/api/chat/google-genai-chat.html) 에서 Google GenAI SDK 와의 통합 지원
- Gemini API 키는 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급

## Google Gen AI Java SDK

```kts [build.gradle.kts]
// implementation("com.google.cloud:google-cloud-vertexai:1.40.0") // Deprecated
implementation("com.google.genai:google-genai:1.30.0")
```

백엔드 자바 애플리케이션에서 [Gemini API](https://ai.google.dev/gemini-api/docs?hl=ko) 를 연동하려고 할때는 Vertex AI SDK 보다는 [Google Gen AI Java SDK](https://github.com/googleapis/java-genai)를 사용하는 것이 좋아요. Vertex AI SDK는 앞으로 지원 종료될 예정이므로 추천하지 않습니다. 위와 같이 Gen AI SDK에 대한 의존성을 ==build.gradle== 에 추가해주세요.

## Streaming content generation

공식 예제 코드는 깃허브 리파지토리의 [examples 폴더](https://github.com/googleapis/java-genai/tree/main/examples/src/main/java/com/google/genai/examples)에서 참고할 수 있어요. 저는 [models.streamGenerateContent](https://ai.google.dev/api/generate-content#method:-models.streamGenerateContent)를 사용해서 사용자에게 AI 응답을 실시간으로 전달하는 예제를 작성해볼게요.

```java [GenAIController.java]
@PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<String> streamGenAI(@RequestBody PromptRequest request) {
    Content content = Content.builder()
            .parts(Part.builder().text(request.getPrompt()).build())
            .build();

    GenerateContentConfig generateContentConfig = GenerateContentConfig.builder()
            .systemInstruction(Content.builder()
                    .parts(Part.builder().text("반드시 한국어로 답변합니다.").build())
                    .build())
            .build();

    Client client = Client.builder().build();
    ResponseStream<GenerateContentResponse> generateContentResponses = client.models.generateContentStream(request.getModel(), List.of(content), generateContentConfig);
    return Flux.fromIterable(generateContentResponses)
            .map(response -> {
                log.info("{} -> {}", response.text(), response.finishReason());
                return response.text();
            });
}
```

> [FinishReason](https://ai.google.dev/api/generate-content#FinishReason)이 STOP이면 응답이 끝났다는 의미에요!  
> 그리고 부분 응답이 올때에는 FINISH_REASON_UNSPECIFIED 입니다.

위 stream 엔드포인트의 응답은 ==text/event-stream;charset=UTF-8== 이에요. 이 stream 요청을 프론트엔드에서는 어떻게 처리해야할까요? 브라우저에서 [SSE(Server-Sent-Event)](https://developer.mozilla.org/ko/docs/Web/API/Server-sent_events)는 일반적으로 EventSource API를 사용하는데 Fetch 또는 Axios 로도 이벤트 스트림을 처리할 수 있어요.

```js [genai.js]
import axios from 'axios';
async function streamGenAI() {
  try {
    const response = await axios.post('http://localhost:8080/api/genai/stream', 
      { prompt: '안녕하세요! 간단한 인사말을 해주세요.' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream'
      }
    );

    // 스트림 데이터 처리
    response.data.on('data', (chunk) => {
      const text = chunk.toString();
      console.log('받은 청크:', text);
    });

    response.data.on('end', () => {
      console.log('스트리밍 완료');
    });

    response.data.on('error', (error) => {
      console.error('스트리밍 오류:', error);
    });

  } catch (error) {
    console.error('요청 실패:', error.message);
  }
}
```

Axios 에서는 ==responseType을 stream으로 설정==하면 됩니다.

## Spring AI - Google GenAI Chat

```kts [build.gradle.kts]
implementation(platform("org.springframework.ai:spring-ai-bom:1.0.0"))
implementation("org.springframework.ai:spring-ai-openai")
implementation("org.springframework.ai:spring-ai-starter-model-google-genai")
```

최신 스프링 부트 프로젝트라면 [Spring AI](https://docs.spring.io/spring-ai/reference/api/chat/google-genai-chat.html) 프로젝트를 사용하면 Gemini API를 더 쉽게 사용할 수 있지만 실무에서 다루는 스프링 부트 프로젝트 버전이 낮으면 Google GenAI SDK를 직접 사용해서 코드를 작성해야해요. 그리고 이렇게 SDK를 활용하면 WebClient를 사용해서 직접 HTTP 통신을 수행하는 것보다는 구현 과정에서의 실수를 줄일 수 있어요.

감사합니다.