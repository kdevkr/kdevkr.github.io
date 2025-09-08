---
title: Quasar 프로젝트에서 프리텐다드 폰트 사용하기
tags:
- Quasar
- Pretendard
---

Quasar CLI 프로젝트에서 [프리텐다드 폰트](https://github.com/orioncactus/pretendard)를 사용하는 방법에 대해 알아보자. 프린텐다드 폰트는 SIL 오픈 폰트 라이선스로 상업적으로도 이용할 수 있으며 크로스 플랫폼에 적합한 가변 폰트를 제공한다.

#### Pretendard 폰트 설치하기

프리텐다드 폰트를 설치하는 방법을 찾아보면 CDN 를 사용하는 예시가 많지만 pnpm 과 같은 명령어로 패키지로써 설치할 수 있다. [Fontsource](https://fontsource.org/) 에 프리텐다드 폰트가 등록되어 있으므로 아래와 같이 설치할 수 있다.

```sh
pnpm add @fontsource/pretendard
```

#### Pretendard 폰트 로드하기

프리텐다드 폰트를 불러오기 위해서는 quasar.config.ts 파일에 정의된 css 파일 또는 quasar.variables.scss 파일에서 Impot 구문으로 추가하면 된다. 일반적으로 quasar.variables.scss 는 변수를 관리하는 파일로 사용되므로 아래와 같이 app.scss 에 추가했다.

```scss /src/css/app.scss
import '@fontsource/pretendard';
```

#### $typography-font-family 설정하기

[Sass/SCSS Variables](https://quasar.dev/style/sass-scss-variables/#variables-list) 중에서 $typography-font-family 는 폰트를 지정하는 변수로 정의되어있다. Quasar CLI 에서는 src/css/quasar.variables.scss 파일로 커스텀 설정이 가능하도록 지원하고 있다. 이제 앞서 추가했던 Pretendard 폰트를 기존 설정값에 포함시키면 반영된다.

```scss /src/css/quasar.variables.scss
$typography-font-base: 'Roboto', '-apple-system', 'Helvetica Neue', Helvetica, Arial, sans-serif !default;
$typography-font-family: "Pretendard Variable", Pretendard, $typography-font-base;
```

#### Pretendard 폰트 확인하기

프로젝트를 실행해보면 $typography-font-family 변수에 설정한 값은 body 태그를 기준으로 설정되어있음을 확인할 수 있다.

![](/images/posts/quasar-add-custom-font/01.png)

