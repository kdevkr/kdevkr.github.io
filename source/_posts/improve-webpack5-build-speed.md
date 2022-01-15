---
title: Webpack 5 빌드 속도 개선하기
date: 2022-01-15
tags:
 - Webpack5
 - Persistent cache
---

안녕하세요 Mambo 입니다.

현재 조직에서는 웹팩 4로 구성된 프로젝트를 웹팩 5를 사용할 수 있도록 업그레이드 작업을 수행하였고 많은 노력 끝에 최신 버전의 웹팩 구성으로 변경하는 것을 완료했습니다. 그러나 오히려 웹팩 5으로 전환하게 된 후 빌드 시간이 더 늘어남을 경험하게 되었는데 오늘은 왜 이런 문제가 발생했는지를 공유하고자 합니다.

## Webpack5
어떤 도구에 대한 최신 버전을 사용하려는 목적은 버그 개선 뿐만 아니라 구조적인 개선으로 인한 성능 향상에 있기도 합니다. 물론 반드시 최신 버전으로 업데이트하는 것이 성능 상으로 좋아짐을 보장할 순 없습니다. 웹팩에서 마이그레이션 가이드 문서를 제공한다고해도 많은 로더와 플러그인등을 사용하기 때문에 빌드 성능이 좋지 않다는 것을 검토하기에는 어려움이 많습니다.

### 느려진 재빌드 시간
웹팩 5로 전환하고나서 일부 시스템 환경에 따라 시간은 다르지만 다음과 같이 빌드 시간이 상당히 느려짐을 경험했습니다. 초기 빌드 시간은 그다지 차이가 발생하지 않았으나 웹팩 5가 조금은 빨랐습니다. 그러나, 젠킨스와 같은 CI 도구에서는 재빌드를 수행하기도 하므로 다음과 같이 재빌드에 대해서 검토한 결과 오히려 빌드가 느림을 확인했습니다. 

![](/images/posts/improve-webpack5-build-speed/wp5-build-02.png#full)

재빌드 시에만 웹팩 5에서 심각하게 느림을 보이는 이유는 **캐시**에 있었습니다. 웹팩 5에서는 영구 캐시(파일시스템 캐시)를 지원하기 위해서 캐시 방식을 변경하였습니다. 이전 웹팩 4에서는 캐시 방식이 없으므로 다음과 같이 로더와 플러그인에서 자체적인 캐시 파일을 만드는 것을 제한하지 않았습니다.

![](/images/posts/improve-webpack5-build-speed/wp5-build-03.png)

그러나 우측의 웹팩 5에서는 `terser-webpack-plugin` 과 `css-minimizer-webpack-plugin`에 대한 캐시 폴더가 생성되지 않았음을 확인할 수 있는데요. 이렇게 된 정확한 이유는 찾을 수 없었지만 예상하는 바는 캐시 구조 변경으로 인하여 웹팩 자체적으로 제공하는 로더와 플러그인에 대해서는 캐시 파일을 만들지않도록 수정된 것 같습니다.

#### 영구 캐시
영구 캐시(Persistent Cache)를 위해 파일시스템 캐시를 지정하면 어떻게 되는지 확인해보겠습니다. 

```js
module.exports = {
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename]
        }
    }
}
```

node_modules 하위의 캐시 폴더를 지운 상태에서 빌드를 수행하고 다시한번 재빌드를 수행한 결과를 비교해봅니다.

![](/images/posts/improve-webpack5-build-speed/wp5-build-04.png)

웹팩 5에서 지원하는 파일시스템 캐시를 적용하고나니 재빌드 시간이 무려 15초로 단축됨을 확인할 수 있습니다. 이처럼 웹팩 5로 변경하고나서 오히려 빌드 시간이 느려짐을 경험했던 분이라면 사용중인 로더와 플러그인에서 자체적인 캐시를 사용했는지 검토하고 **파일시스템 캐시**를 적용하셔야 할 수 있습니다.

### 로더 및 플러그인 대체
최신버전의 웹팩 구성을 위해서는 사용하는 로더와 플러그인들의 호환성을 위해 최신 버전으로 업데이트해야만 합니다. 로더와 플러그인들의 버전이 업데이트되면서 오히려 수행하는 일이 더 많아질 수 있음을 인지해야할 수 있습니다. 예를 들어, 바벨을 적용중이라면 더 많은 문법을 지원하거나 프리셋에 더 많은 플러그인이 기본적으로 포함될 수도 있습니다.

#### esbuild-loader
[esbuild-loader](https://github.com/privatenumber/esbuild-loader)는 esbuild를 통해 웹팩 빌드를 더 빠르게 수행하기 위한 로더 중 하나입니다. 이외에도 [swc-loader](https://github.com/swc-project/swc-loader)도 있습니다.

> esbuild와 swc는 떠오르는 자바스크립트 번들러입니다!

esbuild는 자체적으로 빠른 것도 있지만 Minification도 함께 지원한다는 장점도 있습니다. 기존에는 트랜스파일링을 위해 바벨 로더를 사용하고 자바스크립트 또는 CSS 파일 축소를 위해서 terser-webpack-plugin과 css-minimizer-plugin을 적용해야했습니다. esbuild 만으로도 위 기능을 대체할 수 있기 때문에 여러가지 로더와 플러그인을 수행하는 것보다는 더 좋을 수 있습니다.

> 웹팩 문서에서도 최대한 로더와 플러그인을 줄여야한다고 안내합니다.

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true
                }
            }
        ]
    },
    optimization: {
        mimimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        'default',
                        {
                            discardDuplicates: { removeAll: true },
                            discardComments: { removeAll: true }
                        }
                    ]
                }
            })
        ]
    }
}
```

이제 바벨을 esbuild-loader로 변경해보고 빌드를 해보겠습니다.

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'esbuild-loader',
                options: {
                    target: 'es2015'
                }
            }
        ]
    }
}
```

![esbuild-loader + teser + css-miminizer](/images/posts/improve-webpack5-build-speed/wp5-build-05.png)

초기 빌드 시 2분 54초라는 시간에서 **2분 21초**로 단축되었습니다.


#### TerserPlugin.esbuildMinify
terser-webpack-plugin은 esbuild로 자바스크립트에 대한 최적화를 수행할 수 있도록 `TerserPlugin.esbuildMinify`를 지원합니다.

```js
module.exports = {
    optimization: {
        mimimizer: [
            new TerserPlugin({
                minify: TerserPlugin.esbuildMinify
            }),
        ]
    }
}
```

![esbuild-loader + teser[esbuild] + css-miminizer](/images/posts/improve-webpack5-build-speed/wp5-build-06.png)

#### CssMinimizerPlugin.esbuildMinify
css-minimizer-webpack-plugin도 esbuild로 CSS에 대한 최적화를 수행할 수 있도록 `CssMinimizerPlugin.esbuildMinify`을 지원합니다.

```js
module.exports = {
    optimization: {
        mimimizer: [
            new CssMinimizerPlugin({
                minify: CssMinimizerPlugin.esbuildMinify
            }),
        ]
    }
}
```

![esbuild-loader + teser[esbuild] + css-miminizer[esbuild]](/images/posts/improve-webpack5-build-speed/wp5-build-07.png)

#### ESBuildMinifyPlugin
esbuild-loader에는 [ESBuildMinifyPlugin](https://github.com/privatenumber/esbuild-loader#css-assets)가 포함되어있으므로 굳이 terser-webpack-plugin과 css-minimizer-webpack-plugin을 사용할 필요가 없습니다. 두개의 플러그인으로 수행하는 것보다는 하나의 플러그인으로 처리하는게 더 효율적입니다. 최적화에 대한 벤치마크는 [JS minification benchmarks](https://github.com/privatenumber/minification-benchmarks)를 참고하시기 바랍니다.

```js
const { ESBuildMinifyPlugin } = require('esbuild-loader')
module.exports = {
    optimization: {
        mimimizer: [
            new ESBuildMinifyPlugin({
                target: 'es2015',
                css: true
            }),
        ]
    }
}
```

![esbuild-loader + esbuild-minify](/images/posts/improve-webpack5-build-speed/wp5-build-08.png)

### 빌드 결과 종합
기존에 사용하던 로더와 플러그인을 대체하면서 빌드 시간이 단축됨을 확인했습니다. 그러나 여러분의 프로젝트에서 요구하는 번들링 품질에 대해서도 검토하셔야만 합니다. 단순히 빌드 시간이 단축되었다고 더 좋다고 할 수는 없기 때문입니다. 예를 들어, esbuild에서 지원하는 문법의 한계가 있으므로 반드시 목표로하는 브라우저에서 동작하는지 검증해야합니다. 

|로더|플러그인|빌드시간|
|---|---|---|
|babel-loader|teser + css-minimizer|2 mins, 54.35 secs|
|esbuild-loader|teser + css-minimizer|2 mins, 21.11 secs|
|esbuild-loader|teser[esbuild] + css-minimizer|1 mins, 29.034 secs|
|esbuild-loader|teser[esbuild] + css-minimizer[esbuild]|1 mins, 19.44 secs|
|esbuild-loader|esbuild-minify|1 mins, 16.92 secs|

> 빌드 품질에 상관없으신 분들이라면 esbuild 도입을 검토해보시는 것도 나쁘지 않을 것 같습니다.

감사합니다.

