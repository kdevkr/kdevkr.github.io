---
  title: Best Vue
  date: 2020-06-24 00:00
  categories: [개발 이야기]
  tags: [Vue.js]
---

안녕하세요. `Vue.js`를 기반으로 애플리케이션을 개발하고 있는 잠만보입니다.
본 글에서는 어떻게 애플리케이션 코드를 작성하는 것이 좋은가에 대해서 알아봅니다.

> Vue.js 공식 스타일 가이드를 참고하여 작성하였음을 알려드립니다.

# ECMAScript Expression
Vue.js는 `Webpack`과 `Babel`을 사용하여 빌드할 수 있으므로 모던 브라우저에서 ES5 또는 ES6 문법을 사용할 수 있습니다. 본 섹션에서는 Vue.js 코드를 작성할 때 참고될 수 있는 자바스크립트 문법을 소개합니다.

> ECMAScript 자바스크립트 문법에 대한 더 자세한 내용은 타 블로그를 참고하시기 바랍니다.

## ES5
ES5는 [IE8 이상의 대부분의 모던 브라우저](https://caniuse.com/#feat=es5)에서 지원하는 ECMAScript 문법입니다. 단, IE9가 Strict 모드를 지원하지 않습니다.

Vue.js 공식 가이드 문서에 따르면 ES5 기능을 이용한다고 [명시](https://kr.vuejs.org/v2/guide/installation.html#%ED%98%B8%ED%99%98%EC%84%B1-%EC%A0%95%EB%B3%B4)하고 있습니다.

ES5의 주요 문법은 다음과 같습니다.  
- Array.forEach 또는 Array.filter와 같은 array helper method
  단, Array.forEach 보다는 `lodash.forEach`가 성능적으로 더 효율적이라고 합니다.  
- JSON.parse, JSON.stringify
- Date.now
- Object.freeze

```sh
@babel/preset-env
@babel/plugin-transform-classes
babel-plugin-transform-es2015-classes
```

Vue.js는 `Object.defineProperty`를 사용하여 속성에 대해 Getter/Setter로 변환합니다. 이 한계로 인하여 중첩된 속성이 변경되어도 데이터가 변경되었다는 것을 제대로 감지하지 못합니다.

이때, JSON.parse(JSON.stringify(obj))를 사용하여 Vue 인스턴스가 데이터 변경을 감지할 수 있도록 데이터 속성을 변경할 수 있습니다.

```js
const obj = {a: 1, items: [1, 2]}
let _obj = JSON.parse(JSON.stringify(obj))

// Object.assign를 이용하여 새로운 객체를 생성할 수 있습니다.
_obj = Object.assign({}, obj, {items: [3, 4]})

// Vue.set(object, key, value) 함수를 이용할 수 있습니다.
this.$set(obj, 'b', 2)
```

## ES2015 - ES6 🔥
ES6 부터는 [브라우저](https://caniuse.com/#feat=es6)에서 문법을 지원하지 않을 수 있기 때문에 `Babel`과 같은 자바스크립트 컴파일러를 이용하여 브라우저에서 읽을 수 있도록 변경하는 작업을 수행해야 합니다.

일반적으로 Vue.js 애플리케이션을 빌드하기 위하여 `Webpack`과 같은 모듈 번들러와 함께 `Babel`을 적용합니다.

- let, const
- Arrow Function
- Module System
- Template Literal
- Object Spread Operator
- Destructuring Assignment
- Promises

```sh
babel-plugin-transform-vue-jsx
babel-plugin-transform-object-rest-spread
```

ES6에서 지원하는 문법은 대부분 필수적으로 이해하고 있어야 Vue 애플리케이션 코드를 작성하는데 용이합니다.

### Arrow Function
화살표 함수 문법은 함수 선언을 좀 더 간결하게 표현할 수 있습니다. 또한, 일반적인 함수 선언 방식과는 달리 화살표 함수는 익명 함수로써 `Lexical this`를 가집니다.

따라서 Vue 인스턴스 내에서 화살표 함수로 함수를 정의하면 Lexical this로 인스턴스 스코프를 가져올 수 있습니다.

```js
// () => { ... }
module.exports {
  data() {
    return {
      name: 'mambo'
    }
  },
  methods: {
    greeting() {
      // this == vm
      let greeting = () => { console.log('Hello ' + this.name) }
      greeting()
    }
  }
}
```

### Template Literal
템플릿 리터럴은 문자열을 구성할 때 효율적인 방식을 제공합니다.

예를 들어, 다수의 변수를 통하여 하나의 문자열을 다음과 같이 구성할 수 있습니다.

```js
// Interpolate variable bindings
let name = "Mambo", time = "today";
`Hello ${name}, how are you ${time}?`
```

### Object Spread Operator
스프레드 연산자는 객체의 속성을 복사하거나 배열의 값들을 결합 또는 제거할 때 용이한 문법입니다.

```js
let arr1 = [1, 2, 3]
let arr2 = [4, 5, 6]
// spread instead of Array.concat
let arr = [...arr1, ...arr2]


let obj1 = { name: 'mambo' }
let obj2 = { age: 29 }

// spread instead of Object.assign
let obj = {...obj1, ...obj2 }
```

### Destructuring Assignment
구조 분해 할당은 객체 또는 배열을 변수로 분해할 수 있는 문법입니다. 또한, 구조 분해를 통해 함수의 매개변수가 많거나 기본 매개변수 값을 지정할 수 있습니다.

[Outsider - JavaScript 함수 파라미터에서 destructuring assignment 이용하기](https://blog.outsider.ne.kr/1348)

### Promises
프로미스는 비동기 수행을 위한 문법입니다.
Vue.js에서 HTTP 요청을 위한 클라이언트 라이브러리로 주로 프로미스 기반의 `axios`를 사용합니다.

> 프로미스에 대한 자세한 내용은 [Poiemaweb - Promise](https://poiemaweb.com/es6-promise)를 참고하십시오.

## ES2017
- Async Function 🔥

Async Function을 위한 async, await 지원으로 비동기 함수에 대해 더 간결하게 표현할 수 있습니다.

예를 들어, Vue는 데이터가 변경되고 DOM 업데이트 수행이 완료되었을때 호출되는 Vue.nextTick 콜백 함수를 제공합니다. Vue.nextTick는 프로미스를 반환하기 때문에 async, await으로 간결하게 표현할 수 있습니다.

```js
Vue.component('example', {
  template: '<span>{{ message }}</span>',
  data: function () {
    return {
      message: '갱신 안됨'
    }
  },
  methods: {
    updateMessage: async function () {
      this.message = '갱신됨'
      console.log(this.$el.textContent) // => '갱신 안됨'
      await this.$nextTick()
      console.log(this.$el.textContent) // => '갱신됨'
    }
  }
})
```

## ES2018
- Rest, Spread Properties
- Promise.prototype.finally 🔥

`Promise.finally` 지원으로 인하여 `Axios`와 같은 프로미스 기반의 API의 수행이 완료되었을때 동작을 수행할 수 있게 됩니다.

예를 들어, HTTP 요청을 수행하기 전에 로딩 컴포넌트를 렌더링한 후 HTTP 요청이 수행되었을때 로딩 컴포넌트를 제거하고 싶은 경우 다음과 같이 finally 함수를 이용할 수 있습니다.

```js
import axios from 'axios'

const loading = this.$loading()
axios.post('/api/posts', {...})
.then()
// .catch()
.finally(() => loading.hide())
```

## ES2020
- Dynamic import
- Nullish coalescing operator
- Optional chaining

```sh
@babel/plugin-syntax-dynamic-import
@babel/plugin-proposal-nullish-coalescing-operator
@babel/plugin-proposal-optional-chaining
```

Nullish coalescing operator와 Optional chaining 문법은 null 또는 undefined인 변수에 대한 속성을 접근하거나 대신할 값을 지정할 수 있습니다.

[tc39/nullish-coalescing](https://github.com/tc39/proposal-nullish-coalescing)  
[tc39/optional-chaining](https://github.com/tc39/proposal-optional-chaining)

# Code Style Convention
이번 섹션에서는 Vue.js 애플리케이션 코드를 작성하는 것에 대하여 살펴보겠습니다. 기본적인 자바스크립트 스타일 가이드처럼 Vue 개발자들이 선호하는 코드 작성 스타일을 따르는게 좋습니다.


## Naming Convention
먼저, 이름 규칙에 대해서 알아봅니다. 

### Multi-word component names

### Prop name casing

### Single-file component filename casing

### Single-instance component names

### Tightly coupled component names

### Full-word component names

## Code Convention

### Component data

### Prop definitions ⭐️

### Keyed v-for ⭐️

### Avoid v-if with v-for ⭐️

### Simple computed properties

## Communication

### Implicit parent-child communication ⭐️
부모-자식 컴포넌트간 커뮤니케이션

## Ordering  

### Component/instance options order

### Element attribute order
