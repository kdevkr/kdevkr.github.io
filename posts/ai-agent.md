---
title: AI 에이전트
date: 2025-03-22T15:00+09:00
tags:
  - AI 챗봇
  - 코드 에이전트
  - 개발 도구
---

#### 넘쳐나는 AI 에이전트 시대

ChatGPT와 같은 AI 챗봇 서비스를 넘어서 이제는 생각보다 많은 개발자들이 스스로 생산성 향상을 위해 Cursor와 Windsurf와 같은 AI 코드 에디터와 AI 에이전트를 도입해 반복적인 작업을 자동화하고 코드 품질을 개선하고 있습니다. 앤트로픽에서 [AI 어시스턴스를 위한 MCP 표준을 오픈소스로 공개](https://www.cio.com/article/3612472/%EC%95%A4%ED%8A%B8%EB%A1%9C%ED%94%BD-ai-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%97%B0%EA%B2%B0-%ED%91%9C%EC%A4%80-mcp-%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4%EB%A1%9C-%EA%B3%B5%EA%B0%9C.html)하면서 여러가지 [AI 에이전트들을 만들어서](https://www.anthropic.com/engineering/building-effective-agents) 공유하고 있습니다. [Awesome AI Agents](https://e2b.dev/ai-agents)와 [AI Agents List](https://aiagentslist.com/ai-agents-map) 사이트에서 여러가지 AI 에이전트들을 확인할 수 있었습니다.

#### 인텔리제이 IDEA를 사용한다면 🤦‍♂️

AI 어시스턴스에 대한 개발자 경험은 VSCode 기반의 Cursor, Windsurf, Cline 보다는 인텔리제이 IDEA가 현저하게 좋지 않습니다. 그래서 대부분의 개발자들은 Cursor와 Windsurf를 추천하는 것을 볼 수 있었습니다. 그런데, 스프링 부트 기반의 애플리케이션을 다루는 자바 개발자들은 VSCode에서의 개발자 경험이 좋지 않은 관계로 인텔리제이 IDEA 또는 이클립스 기반의 STS를 고수하여 사용할 가능성이 너무나도 높습니다. 

더구나, 저의 경우에는 조직 라이센스를 사용하고 있어 [조직에서 AI Assistant를 활성화](https://sales.jetbrains.com/hc/ko/articles/14753682583826-%EC%9C%A0%EB%A3%8C-JetBrains-AI-Pro-%EA%B5%AC%EB%8F%85%EC%9C%BC%EB%A1%9C-AI-Assistant-%EC%82%AC%EC%9A%A9%EC%9D%84-%EC%8B%9C%EC%9E%91%ED%95%98%EB%A0%A4%EB%A9%B4-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%B4%EC%95%BC-%ED%95%98%EB%82%98%EC%9A%94)하지 않으면 JetBrains AI Assistant 무료 평가판을 이용할 수 없었습니다. 또한 [Amazon Q Developer](https://aws.amazon.com/ko/q/developer)는 영어로만 대화가 가능하기 때문에, [Codeium(Windsurf)](https://codeium.com/jetbrains_tutorial), [Tapnine](https://www.tabnine.com/ai-code-assistant/)와 같은 선택지보다는 [이제는 무료](https://www.youtube.com/watch?v=RR7svLAPY7w)가 된 [Github Copilot](https://github.com/features/copilot)을 사용하다가 유료 플랜을 구매할 것 같습니다.

#### 코드 에이전트를 위한 AI 모델

OpenAI의 [GPT-4o](http://platform.openai.com/docs/models/gpt-4o) 모델보다는 앤트로픽의 [Claude Sonnet](https://www.anthropic.com/claude/sonnet) 모델을 주로 사용하게 되는 것 같으며 [Grok 3](https://x.ai/grok) 모델도 [많이 활용되고 있다](https://www.youtube.com/watch?v=kgTz7bPevsU)는 소식도 보입니다. [Cursor에서 Grok 모델을 지원하는 제안](https://github.com/getcursor/cursor/issues/2726)도 등록되어있는 상태인데 Cursor와 Windsurf 모두 [OpenRouter](https://openrouter.ai/) 기반의 모델 선택을 지원하고 있습니다.

끝으로, AI 코딩 에이전트에 대해 알아보고 정리하다 보니 마치 다양한 메뉴 앞에서 고민하는 것처럼 선택하기 어려워지는 것 같습니다. 😋
여러분은 어떤 AI 에이전트를 도입해서 사용중인가요?
