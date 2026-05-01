---
title: About
layout: doc
sidebar: false
aside: false
---

<script setup>
import { ref, onMounted } from 'vue'

const careerYear = ref('')
const careerTitle = ref('')

onMounted(() => {
  const start = new Date('2017-04-01T00:00:00+09:00')
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  careerYear.value = `${years + 1}년 차`
  careerTitle.value = `${years}년 ${remMonths + 1}개월`
})
</script>

# 잠만보처럼 푸근하고 수달처럼 귀염뽀짝한 개발자

![](/images/about/fighting.png)

<span :title="careerTitle">{{ careerYear || '10년 차' }}</span>, 백엔드 개발자로 일하고 있으며 Java와 Spring Boot 기반의 애플리케이션 서버 개발과 유지보수를 담당하고 있습니다. **문제에 대한 원인을 찾아가며 분석하고 해결하는 것**을 좋아하기 때문에 시스템 전반적으로 발생하는 다양한 문제들을 해결하는데 집중하여 기여해오고 있습니다. 지금보다 더 나은 시스템을 만들어가기 위하여 백엔드 뿐만 아니라 프론트엔드와 인프라 지식까지 **풀스택 관점으로 다양하게 학습**하여 시스템 요구사항과 이슈들을 적절한 방법으로 해결하고 있습니다. 단순하게 기술 트렌드를 바라보기보다 적정 엔지니어링에 더 관심을 가지고 있으며 오버 엔지니어링이 되지 않도록 **동료들과 함께 적절한 해결방안을 고민**하고 있습니다.

### 맘보는 어떤 사람인가요?

맘보라는 닉네임은 **[잠만보](https://www.youtube.com/watch?v=0GZ32821pf8)** 를 모티브로 하여 **푸근한 이미지**를 떠오르게 합니다. 실제로는 수달(Otter)을 닮은 부분이 많아 **생각보다 귀여운 부분이 있다**고 누군가는 말합니다. [잠만보처럼 잠을 자는 것을 좋아](https://www.youtube.com/watch?v=T3UjbNIuqQY)하지만 업무에 있어서는 문제 해결을 위해 상세한 원인 분석을 토대로 더 나은 해결책이 무엇인지 고민하고 오버엔지니어링이 되지 않도록 노력합니다. 스스로 문서화 및 정리를 잘하는 스타일은 아니라고 생각하기 때문에 **업무 히스토리 파악과 이슈 관리에 더욱 신경쓰고** 있습니다.

- 시스템 전반적인 문제를 해결할 수 있는 풀스택 엔지니어를 목표로 합니다.
- 적정 엔지니어링 관점에서 시스템 요구사항과 이슈들을 해결합니다.
- 시스템 문제를 해결하기 위해 업무 히스토리 파악과 동료의 의견을 중요시합니다.

### 동료들은 저를 이렇게 바라봅니다.

::: info :woman_technologist: 메리(Merry)
정교한 두뇌 회전과 빠른 손을 가진 독특한 잠만보 🙂

마음도 참 따뜻한 사람이에요. 스스로 탐구하고 더 나은 개발자가 되기 위한 노력을 하는 모습이 멋져요.

리더로 성장하는 맘보를 응원합니다. 💪
:::

::: info :man_technologist: 오웬(Owen)
이름에서부터 느껴지는 중후한 매력의 소유자 😊

조용하게 먼저 다가와주고 편안하고 온화한 모습에 회사에 익숙해지는데 많은 도움이 되었어요.

부족한 기술을 꾸준히 탐구하고 맡은 일은 미루지 않고 항상 최선을 위한 합리적인 선택과 결정으로 업무에 임하는 모습이 멋있는 맘보입니다. 😄
:::

::: info :woman_technologist: 웬디(Wendy)
묵묵히 자기 일을 열심히 하는 맘보는 자신의 업무에 집중하면서도 항상 주변 사람들에게 친절함을 잃지 않아요.

모르는 것을 물어보면 이해하기 쉽게 설명해 주고 함께 일하는 사람들이 편안하게 만들어주는 센스가 있으며, 동료들에게 없어서는 안 될 존재예요.

맘보와 함께 일하면 언제나 기분 좋게 일을 마무리할 수 있답니다 🤗
:::

### 연락처

- 깃허브 : [github.com/kdevkr](https://github.com/kdevkr)
- 이메일 : <a href="mailto:kdevkr@gmail.com">kdevkr@gmail.com</a>
