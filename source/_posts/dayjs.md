---
title: Day.js
date: 2025-08-23T22:00+09:00
tags:
- Day.js
- JavaScript Date
---

모던 프론트엔드 프로젝트에서 [Day.js](https://day.js.org/)는 Moment.js 를 대체하기 위한 자바스크립트 Date 라이브러리다. [Moment.js가 더이상 관리되지 않기](https://momentjs.com/docs/#/-project-status/recommendations/) 때문에 Moment와 비슷하면서도 가벼운 패키지 사이즈 덕분에 대부분의 프로젝트에서 채택되어 사용되고 있을 것 같다. 회사 프로젝트는 Quasar 프레임워크를 사용하고 있기 때문에 [Date Utils](https://quasar.dev/quasar-utils/date-utils/)를 사용할 수도 있으나 Day.js 를 별도로 추가하여 활용하고 있다. 

#### TL;DR

- format : 타임존 오프셋이 포함된 문자열 또는 특정 패턴의 문자열이 필요한 경우
- toISOString : UTC(Z) 기반 문자열이 필요한 경우
- valueOf : 밀리초 기반 유닉스 타임스탬프가 필요한 경우
- toDate : 자바스크립트 Date 객체가 필요한 경우
- tz: 시간대가 설정된 날짜가 필요한 경우
- tz.setDefault: 기본 시간대를 설정하려는 경우

#### Setup with Vue 3

```js
import dayjs from 'dayjs'
import { createApp } from 'vue'
const app  = createApp(App)
    
app.config.globalProperties.$dayjs = dayjs
    
app.mount("#app')
```

> 본 글의 모든 예시 코드는 ECMAScript 2015(ES6)부터 사용할 수 있는 import, export 를 이용하는 ESM 방식으로 이루어집니다.

#### Day.js creates a wrapper for the Date object

Day.js 는 자바스크립트 Date 객체를 래핑한 객체를 만든다. [사파리 브라우저에서 Invalid Date 가 표시된 이슈](/dayjs-invalid-date/)도 브라우저의 자바스크립트 Date 객체에 의존하기 때문이다. 그리고 Day.js 객체는 immutable 하므로 변경사항은 새로운 객체에 적용되어 반환된다.

```js
import dayjs from 'dayjs'
dayjs() // Same as "dayjs(new Date())"
dayjs(1755874800000).format() // 2025-08-23T00:00:00+09:00
```

#### Day.js 기본 시간대 설정하기

Day.js 는 브라우저 타임존을 기반으로 날짜 객체를 생성한다. 만약, UTC 또는 사용자 계정의 타임존을 적용하려면 [UTC 와 TimeZone](https://day.js.org/docs/en/plugin/timezone) 플러그인을 추가해야한다. 시간대를 설정하면 자바스크립트에서 [Intl.RelativeTimeFormat](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) 를 사용하여 상대적인 시간 형식으로 표현할 수 있는 것 처럼 [RelativeTime](https://day.js.org/docs/en/plugin/relative-time) 플러그인을 추가하여 상대적인 시간을 표시할 수 있다. 상대적인 시간을 표시할 때에는 로케일 정보도 설정하는게 좋다.

```js
import { boot } from 'quasar/wrappers';

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

export default boot(({ app }) => {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(relativeTime);

    dayjs.tz.setDefault('Asia/Seoul')
    dayjs.locale('ko')

    app.config.globalProperties.$dayjs = dayjs
})
```

#### Day.js 객체를 날짜 데이터로 변환하기

Day.js 객체를 생성하는 방법은 자바스크립트의 Date 객체와 동일했다. ISO 8601 패턴의 문자열을 사용하여 만들거나 주로 서버와 데이터베이스 간에 시간 정보를 교환하기 위한 숫자 형태의 시간값인 숫자 형태의 [Unix Timestamp](https://day.js.org/docs/en/display/unix-timestamp-milliseconds)를 사용할 수도 있다. 이와 반대로 format 함수로 특정 패턴의 문자열로 변환하거나 서버 API 가 유닉스 타임스탬프 형태의 정보를 요구하도록 작성되어있다면 valueOf 함수로 가져와서 전달할 수 있다. 기본적으로 현재 타임존의 [타임 오프셋이 포함된 ISO 8601 형식으로 포맷팅](https://day.js.org/docs/en/display/format)을 지원하는데, 만약, UTC 기준의 ISO 8601 형식으로 변환하고자 하는 경우에는 [toISOString](https://day.js.org/docs/en/display/as-iso-string) 함수를 사용할 수 있다.

```js
const d = dayjs(1755874800000)
d.format() // 2025-08-23T00:00:00+09:00
d.toISOString() // 2025-08-22T15:00:00.000Z
d.valueOf() // 1755874800000
```
