---
title: 특정 디펜던시에 대한 Dart Sass의 Deprecation 경고 제외하기
date: 2021-12-27
tags:
- Dart Sass
- quietDeps
---

안녕하세요 Mambo 입니다.

오늘은 특정 디펜던시에 대한 Dart Sass의 Deprecation 경고를 제외하는 방법에 대해서 공유하려고 합니다.

## Deprecation Warnings
최신 웹팩에서 사용하는 sass-loader에서는 sass(Dart Sass)를 사용하는 것을 권장합니다. 다만, Dart Sass 버전에 따라 다음과 같이 Dart Sass 2.0에서부터 지원되지 않는 문법에 대한 경고 로그가 출력될 수 있습니다.

_Deprecation Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0_

### Bootstrap
부트스트랩의 변수를 오버라이딩하여 테마를 구성하고자 하는 경우 여러분의 SCSS 파일에서 부트스트랩에서 제공하는 SCSS 파일을 불러오게되면 아래처럼 경고 로그가 출력될 수 있습니다.

```ps
LOG from ./node_modules/sass-loader/dist/cjs.js sass-loader ./node_modules/css-loader/dist/cjs.js??clonedRuleSet-2[0].rules[0].use[1]!./node_modules/postcss-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js??clonedRuleSet-2[0].rules[0].use[4]!./src/scss/bootstrap.scss
<w> Deprecation Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0.
<w>
<w> Recommendation: math.div($b-custom-control-indicator-size-lg, 2) or calc($b-custom-control-indicator-size-lg / 2)
<w>
<w> More info and automated migrator: https://sass-lang.com/d/slash-div
<w>
<w> node_modules\bootstrap-vue\src\_variables.scss 33:46  @import
<w> node_modules\bootstrap-vue\src\index.scss 7:9         @import
<w> src\scss\bootstrap.scss 11:9                          root stylesheet
<w>
<w> Deprecation Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0.
<w>
<w> Recommendation: math.div($b-custom-control-indicator-size-sm, 2) or calc($b-custom-control-indicator-size-sm / 2)
<w>
<w> More info and automated migrator: https://sass-lang.com/d/slash-div
<w>
<w> node_modules\bootstrap-vue\src\_variables.scss 34:46  @import
<w> node_modules\bootstrap-vue\src\index.scss 7:9         @import
<w> src\scss\bootstrap.scss 11:9                          root stylesheet
<w>
<w> Deprecation Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0.
<w>
<w> Recommendation: math.div($font-size-lg * $line-height-lg - $b-custom-control-indicator-size-lg, 2) or calc(($font-size-lg * $line-height-lg - $b-custom-control-indicator-size-lg) / 2)
<w>
<w> More info and automated migrator: https://sass-lang.com/d/slash-div
<w>
<w> node_modules\bootstrap-vue\src\components\form-checkbox\_form-checkbox.scss 10:10  @import
<w> node_modules\bootstrap-vue\src\components\form-checkbox\index.scss 1:9             @import
<w> node_modules\bootstrap-vue\src\components\index.scss 5:9                           @import
<w> node_modules\bootstrap-vue\src\index.scss 14:9                                     @import
<w> src\scss\bootstrap.scss 11:9                                                       root stylesheet
<w>
<w> Deprecation Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0.
<w>
<w> Recommendation: math.div($font-size-lg * $line-height-lg - $b-custom-control-indicator-size-lg, 2) or calc(($font-size-lg * $line-height-lg - $b-custom-control-indicator-size-lg) / 2)
<w>
<w> More info and automated migrator: https://sass-lang.com/d/slash-div
<w>
<w> node_modules\bootstrap-vue\src\components\form-checkbox\_form-checkbox.scss 18:10  @import
<w> node_modules\bootstrap-vue\src\components\form-checkbox\index.scss 1:9             @import
<w> node_modules\bootstrap-vue\src\components\index.scss 5:9                           @import
<w> node_modules\bootstrap-vue\src\index.scss 14:9                                     @import
<w> src\scss\bootstrap.scss 11:9                                                       root stylesheet
<w>
<w> Deprecation Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0.
<w>
<w> Recommendation: math.div($font-size-sm * $line-height-sm - $b-custom-control-indicator-size-sm, 2) or calc(($font-size-sm * $line-height-sm - $b-custom-control-indicator-size-sm) / 2)
<w>
<w> More info and automated migrator: https://sass-lang.com/d/slash-div
<w>
<w> node_modules\bootstrap-vue\src\components\form-checkbox\_form-checkbox.scss 33:10  @import
<w> node_modules\bootstrap-vue\src\components\form-checkbox\index.scss 1:9             @import
<w> node_modules\bootstrap-vue\src\components\index.scss 5:9                           @import
<w> node_modules\bootstrap-vue\src\index.scss 14:9                                     @import
<w> src\scss\bootstrap.scss 11:9                                                       root stylesheet
<w>
<w> 17 repetitive deprecation warnings omitted.
<w>
<w> null
```

부트스트랩에서 사용중인 문법을 어떻게 바꾸라고 안내하지만 의존성에서 제공하는 파일을 수정할 수는 없습니다. 그래서 위 경고 로그를 출력하지 않게 하는 방법이 필요합니다.

### Dart Sass - quietDeps
다행스럽게도 Dart Sass 에서는 [quietDeps](https://sass-lang.com/documentation/cli/dart-sass#quiet-deps)옵션을 제공하여 의존성에 대한 Deprecation 경고 출력을 하지 않도록 지원합니다.
만약, 웹팩에서 sass-loader를 사용한다면 다음과 같이 **sassOptions** 속성으로 위 옵션을 적용할 수 있습니다.

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // ...
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sassOptions: {
                quietDeps: ["node_modules/bootstrap/**/*.scss"],
              }
            }
          }
        ]
      }
    ]
  }
};
```

이제 부트스트랩의 SCSS 파일을 임포트하더라도 더이상 경고 로그는 출력되지 않게 되었습니다. 
감사합니다.


## 참고
- [Dart Sass - quiet-deps](https://sass-lang.com/documentation/cli/dart-sass#quiet-deps)