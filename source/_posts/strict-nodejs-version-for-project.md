---
title: 프로젝트의 노드 버전 제한하기
date: 2021-12-26
tags:
- package.json
- npmrc
- engines
---

안녕하세요 Mambo 입니다.

오늘은 함께 일하는 개발자들이 프로젝트마다 사용해야하는 노드 버전을 제한하는 방법에 대하여 공유하려고 해요.

## 프로젝트 노드 버전 제한
프로젝트에서 사용하는 패키지마다 지원하는 최소 노드 버전이 다를 수 있습니다. 예를 들어, 다음과 같이 패키지 버전이 업데이트되면서 요구하는 노드 버전이 변경될 수 있습니다.

- [webpack@5.0.0](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#minimum-nodejs-version) minimum supported Node.js version is 10.13.0
- [style-loader@3.0.0](https://github.com/webpack-contrib/style-loader/releases/tag/v3.0.0) minimum supported Node.js version is 12.13.0
- [webpack-dev-server@4.0.0-beta.3](https://github.com/webpack/webpack-dev-server/blob/master/CHANGELOG.md#400-beta3-2021-05-06) minimum supported Node.js version is 12.13.0

### Package.json
Package.json 파일의 `engines` 속성으로 프로젝트에서 사용하는 NPM 또는 노드 버전을 명시할 수 있습니다.

```json
{
  "engines": {
    "npm": ">=6.4.1",
    "node": ">=12.13.0"
  }
}
```

### 엔진 제한 옵션 활성화
Package.json 파일에 노드 버전을 명시하더라도 사용자의 엔진을 제한할 수는 없습니다. 이를 별도로 제한하기 위해서는 프로젝트 폴더에 .npmrc 파일을 만들고 `engine-strict` 옵션을 활성화해야합니다.

```properties
engine-strict=true
```

### 노드 엔진 제한 여부 확인
노드 버전을 명시하고 엔진 제한 옵션을 활성화하였으므로 실제로 노드 엔진이 제한되는지 확인해보겠습니다.

```sh
npm i
npm ERR! code ENOTSUP
npm ERR! notsup Unsupported engine for @1.0.0: wanted: {"npm":">=6.4.1","node":">=12.13.0"} (current: {"node":"10.23.0","npm":"6.14.8"})
npm ERR! notsup Not compatible with your version of node/npm: @1.0.0
npm ERR! notsup Not compatible with your version of node/npm: @1.0.0
npm ERR! notsup Required: {"npm":">=6.4.1","node":">=12.13.0"}
npm ERR! notsup Actual:   {"npm":"6.14.8","node":"10.23.0"}
```

현재 사용중인 노드 버전은 10.23.0 이지만 프로젝트에서 요구하는 버전은 12.13.0 이상이므로 오류가 발생하였습니다.

이상으로 프로젝트에서 지원하는 최소 노드 엔진 버전을 명시하고 프로젝트에 참여하는 모든 개발자들이 알맞은 노드 버전을 사용하도록 안내할 수 있게 되었습니다.

감사합니다.

## 참고 
- [Force correct Node.js version with npm](https://medium.com/@fabian.illner/force-correct-node-js-version-with-npm-a2a57fd12fa)  
- [How to define the required Node.js version in package.json?](https://www.geeksforgeeks.org/how-to-define-the-required-node-js-version-in-package-json/)  
- [Specifying a required Node.js version in Package.json file](https://reactgo.com/specify-node-version/)  