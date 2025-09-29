---
title: QInput 에서 한글 입력 반영이 느린 경우
date: 2025-08-29T23:00+09:00
tags:
- Quasar
- IME
---

Quasar 프레임워크의 [QInput](https://quasar.dev/vue-components/input) 컴포넌트로 사용자 입력을 받을 때 한글이나 일본어와 같이 입력된 글자를 조합해서 변환해야하는 IME Composition 으로 인해 엔터키 또는 포커스가 해제되어야 정상적으로 반영되는 딜레이 문제가 있다. 이 문제를 벗어나기 위해 두가지의 트릭을 이용해볼 수 있다.

#### 첫번째 레슨 - Template Refs

```html
<template>
    <q-input ref="input" v-model="text" />
</template>
<script setup lang="ts">
    import {ref, onMounted} from "vue";
    const text = ref('')
    const input = ref(null)
    onMounted(() => {
        input.value.$el.addEventListener('input', (e) => text.value = e.target.value)
    })
</script>
```

Quasar 에서 제공하는 QInput 컴포넌트에서는 @Input 이벤트를 지원하지 않으므로 [Template Refs](https://vuejs.org/guide/essentials/template-refs)를 사용하면 DOM 엘리멘트(el)를 가져올 수 있으므로 input 이벤트 리스너를 수동으로 등록해서 입력된 값을 즉시 반영할 수 있다.

#### 두번째 레슨 - Field 컴포넌트

```html
<template>
    <q-field v-model="text">
      <template v-slot:control>
        <input :value="text" @input="e => text = e.target.value"/>
      </template>
    </q-field>
</template>
```

만약, QInput 컴포넌트를 반드시 사용해야하는게 아니라면 Quasar 에서 추가적으로 제공하고 있는 [QField](https://quasar.dev/vue-components/field) 컴포넌트의 [Control types](https://quasar.dev/vue-components/field#control-types) 을 이용하여 네이티브 input 엘리멘트를 직접 사용해서 [@Input 이벤트](https://vuejs.org/guide/essentials/forms#form-input-bindings)를 적용할 수 있다. QInput 컴포넌트를 사용하기 보다 검색 컴포넌트를 직접 만들어서 사용하는 것도 나쁘지 않다.