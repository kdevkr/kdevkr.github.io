---
date: 2020-07-18
title: Vue Tutorial - Vue CLI
categories:
  - Vue
tags:
  - Vue Tutorial
  - Vue CLI
---

## 들어가며
Vue.js를 시작하기 위하여 프로젝트를 만드는 것은 생각보다 굉장히 복잡합니다. Vue CLI는 쉽게 Vue 프로젝트를 구성할 수 있도록 명령어를 제공합니다. 프로젝트를 위한 여러가지 플러그인을 선택할수도 있으며 프리셋을 지정할 수도 있습니다.

## Vue CLI  
Vue CLI를 이용하기 위해서는 `npm`이 설치되어 있어야 합니다.

```sh
$ npm install -g @vue/cli
$ vue --version
@vue/cli 4.4.6
```

### Create Vue Project  
Vue CLI `vue create` 명령어 또는 `vue ui`를 통해 Vue 프로젝트를 시작할 수 있습니다.

```zsh
$ vue create frontend
$ cd frontend
$ npm run serve
```

그런데 생성된 프로젝트에는 설정 파일이 보이지 않습니다. Vue CLI 프로젝트는 기본적으로 Vue CLI 에서 제공하는 설정 파일을 사용합니다. 우리의 애플리케이션에 맞는 구성을 하기 위해서는 어떻게 해야하는지 알아봅시다.

### Configure Vue Project  
Vue CLI 프로젝트는 다음과 같은 파일들로 구성할 수 있습니다.

- *vue.config.js*
- *.env*

#### vue.config.js  
Vue CLI 프로젝트는 `vue.config.js`로 Webpack 설정을 구성합니다. 기본으로 제공하는 구성에 `webpack-merge`와 `webpack-chain` 모듈을 통해 사용자 정의 구성을 적용합니다.

예를 들어, 다음과 같이 이미 적용된 로더에 대한 옵션을 수정하는 것이 가능합니다.

```js vue.config.js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
        .loader('vue-loader')
        .tap(options => {
          // modify the options...
          return options
        })
  }
}
```

현재 Vue 프로젝트가 어떤 규칙과 플러그인이 적용되어있는지 확인하려면 `vue inspect` 명령을 이용하면 됩니다.

```sh
vue inspect --rules
vue inspect --plugins
```

#### Environment Variables  
Vue CLI 프로젝트에서는 `.env` 파일로 환경 변수를 관리할 수 있습니다.

이 파일에 정의한 환경 변수 중 `NODE_ENV`, `BASE_URL` 그리고 `VUE_APP_`으로 시작되는 변수는 `webpack.DefinePlugin`에 의해 번들 파일에 추가됩니다.

```zsh
$ vue inspect --plugin define
/* config.plugin('define') */
new DefinePlugin(
  {
    'process.env': {
      NODE_ENV: '"development"',
      VUE_APP_TITLE: '"Frontend Application"',
      VUE_APP_VERSION: '"0.1.0"',
      BASE_URL: '"/"'
    }
  }
)
```

더 자세한 정보는 [Vue CLI - Environment Variables](https://cli.vuejs.org/guide/mode-and-env.html#environment-variables)에서 확인하시기 바랍니다.

### Disable Index Generation
Vue CLI 프로젝트는 기본적으로 `html-webpack-plugin`을 통하여 `index.html`을 생성하도록 설정됩니다. 만약, 백엔드 애플리케이션에서 자체적으로 index.html를 제공한다면 index.html를 생성하는 부분은 필요하지 않습니다. 따라서 다음과 같이 빌드 단계에서 관련 플러그인들을 제거할 수 있습니다.

```js vue.config.js
module.exports = {
  // disable hashes in filenames
  filenameHashing: false,
  // delete HTML related webpack plugins
  chainWebpack: config => {
    config.plugins.delete('html')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  }
}
```

## 참고
- [Vue CLI](https://cli.vuejs.org/)
