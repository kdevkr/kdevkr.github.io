---
title: Webpack 5 기반의 Vue 개발 환경
date: 2021-12-28
tags:
- Webpack5
---

안녕하세요 Mambo 입니다.

오늘은 **Webpack 5 기반의 Vue 개발 환경**에 대해서 알아보는 시간을 가져보도록 하겠습니다.
본 글에서 설명한 내용에 대한 코드는 [kdevkr/webpack5](https://github.com/kdevkr/webpack5)에서 제공합니다.

## Webpack
반드시 그런 것은 아니지만 많은 분들이 [Create React App](https://create-react-app.dev/) 또는 [Vue CLI](https://cli.vuejs.org/)라는 도구를 통해서 프론트엔드 개발 환경에 대한 기본 프리셋을 기반으로 학습을 시작하거나 개발 환경을 구축합니다. 이 도구들은 여러가지 사항에 대한 웹팩 구성을 기본적으로 제공함으로써 웹팩에 대한 내용을 알지 못하더라도 쉽게 리액트 또는 뷰에 대한 학습을 진행할 수 있게 도와주는 유용한 도구입니다. 

그럼에도 불구하고, 실무 환경에서는 이 도구들을 사용하지 않고 직접 웹팩 설정에 대해 구성하여 사용합니다. 또한, Vue CLI는 안타깝게도 웹팩 4에 대한 구성을 제공하므로 이 도구로 만들어지는 환경은 무조건 웹팩 4로 제한되는 문제점을 가지고 있습니다. [2020년 10월에 릴리즈된 웹팩 5](https://webpack.js.org/blog/2020-10-10-webpack-5-release/) 기반의 개발 환경을 만들기 위해서는 직접 웹팩 구성을 수행할 수 있어야만 합니다.

### 요구사항
시작하기에 앞서, 웹팩 5는 노드 10.13.0 이상의 버전을 요구하며 함께 개발 프록시 서버로 활용할 수 있는 webpack-dev-server@4 에서는 노드 12.13.0 이상을 요구합니다. 

- Webpack5 required v10.13.0+
- webpack-dev-server@4 v12.13.0+

#### 프로젝트 노드 버전 제한
위 요구사항에 따라 프로젝트에서 사용할 수 있는 노드 버전을 제한하는 것이 좋습니다. 제가 이전에 공유한 [프로젝트의 노드 버전 제한하기](https://kdevkr.github.io/strict-nodejs-version-for-project/)를 참고하여 노드 엔진 버전을 12.13.0 이상으로 설정해두는 것을 추천하는 바입니다.

### 커밋별로 확인하는 구성
각 커밋 단위의 Browser Files를 통해 어떻게 구성이 변화하는지를 참고하시면 좋습니다.

#### [Add webpack.config.js for default configuration](https://github.com/kdevkr/webpack5/commit/3f858c2702720088b8647bdb55a9f830d54a8d91)
기본 구성을 위한 webpack.config.js 파일을 만들고 node-env 값에 따라 번들 파일명을 다르게 지정할 수 있음을 보여줍니다.

```sh
npx webpack --node-env production # 모드를 지정하지 않았지만 node-env 값에 의해 처리됩니다.
```

#### [Add vue-loader](https://github.com/kdevkr/webpack5/commit/3ca2fc1de5573ae339b0271ea482a73bf3dac397)  
Vue SFC 파일을 처리하기 위한 vue-loader를 추가하고 Vue 개발 환경을 준비하고 간단한 샘플 HTML 파일을 만들어서 Vue 코드가 정상적으로 변환되었음을 확인합니다.

#### [Add sass, postcss](https://github.com/kdevkr/webpack5/commit/68ffce2b18c64e67b944a383b216c2e6fe784396)  
Vue SFC의 스타일 블록의 언어를 SCSS로 사용하기 위해서 sass 및 postcss에 대한 설정을 추가합니다. 

#### [Add stylelint](https://github.com/kdevkr/webpack5/commit/7e1e00735738e9106033c6df675977846b159552)  
반드시 필요한 설정은 아니지만 CSS에 대한 린트를 적용하기 위해 stylelint를 postcss 플러그인으로 추가합니다.

#### [Add eslint](https://github.com/kdevkr/webpack5/commit/f7f566314fd675e18d3f7b3dd35283317c5891ae)  
자바스크립트에 대한 린트를 적용하기 위해 eslint를 추가합니다.

#### [Add babel](https://github.com/kdevkr/webpack5/commit/c5211b28ab8176e8c5c9fb39c755083679cb24df)  
ES6+ 문법을 지원하지 않는 브라우저를 위해 ES5 문법으로 변환하기 위한 babel을 추가합니다. babel 7 부터는 폴리필 적용 방식이 변경되었음을 주의해야합니다. 바벨 폴리필에 대해서는 다음의 두 링크를 참고하시면 좋습니다.

- [폐지된 @babel/polyfill 대신 @babel/plugin-transform-runtime을 사용해 폴리필 추가하기](https://poiemaweb.com/babel-polyfill)
- [Babel7과 corejs3 설정으로 전역 오염 없는 폴리필 사용하기](https://tech.kakao.com/2020/12/01/frontend-growth-02/)

#### [Add browserslist](https://github.com/kdevkr/webpack5/commit/c911ef73aa85ebde4d9c738c07999300c05bfaf8)  
postcss의 autoprefixer 또는 babel에서 참고할 타겟 정보를 위해 browserslist를 추가합니다.

#### [Add prettierrc](https://github.com/kdevkr/webpack5/commit/b5c8e20ebdb2224f1268b431aafb82a6b49e7b3a)  
불필요한 포맷팅을 방지하기 위한 prettier 옵션을 조정합니다.

#### [Add asset](https://github.com/kdevkr/webpack5/commit/1ba05ff066806fb2c7b59eace748e04e73756243)  
이미지 또는 폰트 등을 위한 에셋 모듈을 추가합니다.

#### [Apply strict npm engines](https://github.com/kdevkr/webpack5/commit/1b768c5881db9d8348d54f926a11e537a50050ac)  
지금까지 설치된 패키지에서 최소로 요구하는 노드 버전을 명시하고 제한되도록 설정합니다.

#### [Apply settings for vscode](https://github.com/kdevkr/webpack5/commit/9008824470873ce172e52294ddac7eee8304c256)  
VSCode를 사용하는 경우 저장될 때 ESLint가 동작하도록 설정합니다.

#### [Add project version in output filename](https://github.com/kdevkr/webpack5/commit/769171d627bb1f4bfbb4bacce62dc067ff9b617a)  
(Optional) package.json에 정의된 프로젝트 버전을 번들 파일명에 포함시킬 수 있음을 보여줍니다.

#### [Apply optimization](https://github.com/kdevkr/webpack5/commit/bab1505c643b4ae3ea5e7a86bdc90317f4afe470)  
프로덕션 환경을 위한 최적화 구성을 조정합니다.

#### [Add manifest](https://github.com/kdevkr/webpack5/commit/7d0cd27b85a8f1df757e16c3ddb6ad32b8f7b39e)  
매니페스트 파일이 생성할 수 있도록 플러그인을 추가합니다. 

```sh
npx webpack --node-env production --env manifest
```

#### [Add bootstrap-vue](https://github.com/kdevkr/webpack5/commit/c3da5f586c6ec368778e2c90478196e4af037a82)  
BootstrapVue를 추가해보고 [최신 버전의 Sass에서 출력되는 Deprecation 경고가 출력되지 않도록](https://kdevkr.github.io/no-emit-deprecation-warnings-of-dart-sass/) 설정합니다.

감사합니다.
