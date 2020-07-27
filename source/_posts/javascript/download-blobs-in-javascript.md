---
title: 자바스크립트에서 블롭 데이터 다운받기
date: 2020-02-10
categories:
  - JavaScript
tags:
  - Blob
  - FileSaver
---

## 들어가며

### 일반

```js
const link = document.createElement('a');
link.href = $url;
link.click();
```

### Blob
프로젝트에서 지원하는 브라우저가 Blob 객체를 지원하나요? 그렇다면 Blob 객체를 통해 파일을 다운로드할 수 있습니다.

> https://developer.mozilla.org/en-US/docs/Web/API/Blob

_**(Optional) Polyfill for IE 9**_
Blob 객체는 IE 10부터 지원하므로 IE 9에서 사용하기 위해서는 폴리필을 적용해야합니다.

[Blob Polyfill](https://github.com/bjornstar/blob-polyfill)

#### Using window.URL

- ContentDisposition
- window.URL.createObjectURL
- window.URL.revokeObjectURL

```js
import ContentDisposition from 'content-disposition'
import { saveAs } from 'file-saver'

window.$download = function(url, params) {
    $axios({
        url: url,
        params: params,
        responseType: 'blob'
    }).then(res => {
        const contentDisposition = ContentDisposition.parse(res.headers['content-disposition'])
        const link = document.createElement('a');
        const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
        link.href = blobUrl
        link.setAttribute('download', contentDisposition.parameters.filename);
        link.target = '_blank'
        link.click();
        link.remove()
        window.URL.revokeObjectURL(blobUrl);
    })
};
```

#### Using FileSaver.js

- [FileSaver.saveAs](https://github.com/eligrey/FileSaver.js/)

```js
import ContentDisposition from 'content-disposition'
import { saveAs } from 'file-saver'

$axios({
    url: url,
    params: params,
    responseType: 'blob'
}).then(res => {
    const contentDisposition = ContentDisposition.parse(res.headers['content-disposition'])
    const blob = new Blob([res.data])

    saveAs(blob, contentDisposition.parameters.filename)
})
```


## 참고
- [Download files with AJAX (axios)](https://gist.github.com/javilobo8/097c30a233786be52070986d8cdb1743)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- [Blob Polyfill](https://github.com/bjornstar/blob-polyfill)
