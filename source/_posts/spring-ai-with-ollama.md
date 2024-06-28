---
title: Spring AI + Ollama
date: 2024-06-28T23:00+09:00
tags:
- spring ai
- ollama
---

Spring AI 프로젝트에서 OpenAI의 ChatGPT 또는 Anthropic의 Claude를 지원하지만 로컬 머신에서 실행할 수 있는 Ollama도 지원하고 있다. 
내 컴퓨터에 Ollama를 설치하고 파라미터가 작은 모델을 선택해서 간단하게 AI 엔지니어링을 해보도록 하려고 한다. 

#### 윈도우 Ollama 설치

[Download for Windows (Preview)](https://ollama.com/download/windows)를 통해 윈도우 컴퓨터에 Ollama를 설치하고 사용가능한 [모델](https://ollama.com/library) 중에서 파라미터가 작은 모델 중 하나인 [phi3](https://ollama.com/library/phi3)를 선택해보자. 
일반적인 예시에서는 [mistral](https://ollama.com/library/mistral)를 설치해서 사용해보는 것 같다. 아무튼, `ollama run phi3` 명령어로 모델을 설치할 수 있다.

```ps
PS C:\Users\Mambo\ollama> ollama run phi3
pulling manifest
pulling b26e6713dc74... 100% ▕████████████████████████████████████████████████████████▏ 2.4 GB
pulling fa8235e5b48f... 100% ▕████████████████████████████████████████████████████████▏ 1.1 KB
pulling 542b217f179c... 100% ▕████████████████████████████████████████████████████████▏  148 B
pulling 8dde1baf1db0... 100% ▕████████████████████████████████████████████████████████▏   78 B
pulling f91db7a2deb9... 100% ▕████████████████████████████████████████████████████████▏  485 B
verifying sha256 digest
writing manifest
removing any unused layers
success
```

#### Open WebUI 설치

Spring AI와는 상관없지만 ChatGPT와 같은 AI 서비스처럼 Ollama와 연동이 가능한 [Open WebUI](https://openwebui.com/)를 설치해보았다. 

```yml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    ports:
      - "3000:8080"
    environment:
      OLLAMA_BASE_URL: http://host.docker.internal:11434
      WEBUI_AUTH: False
    volumes:
      - open-webui:/app/backend/data
    extra_hosts:
      - host.docker.internal:host-gateway
    restart: unless-stopped

volumes:
  open-webui: {}
```

> 저는 컴퓨터 호스트에 Ollama를 설치하고 실행하였기에 host.docker.internal로 접근했습니다.
> Ollama를 도커 컴포즈로 실행하기 위한 설정은 [docker-compose.yaml](https://github.com/open-webui/open-webui/blob/main/docker-compose.yaml)를 참고하세요.

#### Spring AI Ollama Chat

[OllamaChatModel](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html)

```groovy build.gradle
repositories {
    maven { url 'https://repo.spring.io/milestone' }
    maven { url 'https://repo.spring.io/snapshot' }
}

dependencies {
    implementation 'org.springframework.ai:spring-ai-ollama-spring-boot-starter'
}

dependencyManagement {
    imports {
        mavenBom "de.codecentric:spring-boot-admin-dependencies:$springBootAdminVersion"
        mavenBom "org.springframework.ai:spring-ai-bom:1.0.0-M1"
    }
}
```

```yml application.yml
spring:
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        options:
          model: phi3
          temperature: 0.9

    retry:
      max-attempts: 1
```

```java
@RequiredArgsConstructor
@RestController
public class ChatApi {
    private static final String TEMPLATE = """
            Hello ai, How many hours does {timezone} differ by UTC?.
            """;
    private final OllamaChatModel chatModel;

    @PostMapping("/ai/generate")
    public String generate(@RequestBody String timezone) {
        PromptTemplate promptTemplate = new PromptTemplate(TEMPLATE);
        promptTemplate.add("timezone", timezone);
        return chatModel.call(promptTemplate.createMessage());
    }
}
```

```txt AI Response
Seoul, South Korea operates on Korea Standard Time (KST), which is 9 hours ahead of Coordinated Universal Time (UTC+9). Therefore, the difference between UTC and KST in Seoul is 9 hours.

To calculate this for any specific time:
- If you're looking to convert a time from UTC to KST, add 9 hours.
- If you're converting a time from KST back to UTC, subtract 9 hours.
```

결제가 필요한 ChatGPT와 Claude API 대신에 로컬 머신에 Ollama를 설치하고 Spring AI를 간단하게 다루어보았다.
개인적으로 AI에 대한 인식은 아직 **설레발**이라고 생각이 되지만 AI가 성장할수록 [프롬프트 엔지니어링](https://www.promptingguide.ai/kr)도 개발자에게 필요한 역량이 되어갈 수 있어서 준비가 필요하다.
