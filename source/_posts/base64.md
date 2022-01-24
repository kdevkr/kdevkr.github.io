---
title: Base64
date: 2022-01-22
tags:
- Base64
---

![](/images/posts/base64/base64-01.png)

위와 같이 어떤 서비스에 대한 회원가입을 수행하거나 비밀번호 찾기와 같은 기능을 수행했을경우 인증 관련 메일이 발송되는 것을 자주 확인할 수 있습니다. 그러나 위와 같이 인증확인 버튼을 클릭했을때 어떠한 동작을 하는지 궁금하시지 않으신가요? 위와 같은 인증 버튼은 링크 엘리먼트로 되어있으며 일반적인 GET 요청입니다. 그리고 그 URI에는 다음과 같은 어떠한 형태의 문자열이 포함되게 됩니다.

> a2RldmtyQGdtYWlsLmNvbTp5Rm5iTUtrblZrRW85ckdxTVlmTGtWNE03UUtMTldXWg==

위와 같이 구성된 문자열은 Base64로 인코딩된 데이터이며 크롬 개발자도구의 콘솔을 통해 이 아스키 문자열을 디코딩하면 다음과 같은 문자열 데이터를 확인할 수 있습니다.

```js
atob("a2RldmtyQGdtYWlsLmNvbTp5Rm5iTUtrblZrRW85ckdxTVlmTGtWNE03UUtMTldXWg==")
'kdevkr@gmail.com:yFnbMKknVkEo9rGqMYfLkV4M7QKLNWWZ'
```

제 이메일 주소와 함께 어떠한 문자열을 포함하고 있습니다. 아마도 저 알수없는 문자열은 암호화된 인증 정보일 것입니다. 인증 정보와 GET 요청에 포함된 이메일 주소가 동일한지를 내부적으로 검증하겠죠. 이러한 인증 정보를 왜 Base64로 인코딩하여 전송하게 되는 것일까요? **안전한 형태로 데이터를 전달하고자하는 목적**에 있습니다.

## 아스키 코드
사람들은 수 많은 문자의 형태를 읽고 구분할 수 있지만 0과 1로 이루어진 컴퓨터 시스템은 시스템에 따라 0과 1을 읽고 구분하는 방식이 다를 수 있습니다. 시스템의 발전에 따라 아스키 코드부터 유니코드 그리고 여러가지 문자 조합이 확장되고 있습니다. 대부분의 문자 형식은 아스키 코드를 기초로 만들어지기 때문에 아스키 코드 중 일부 문자 집합은 거의 모든 시스템에서 공통으로 사용되는 문자입니다. 그러한 문자들을 모아 만들어지는게 Base64 인코딩입니다.

### Base64 이미지
브라우저에서는 바이너리 데이터 뿐만 아니라 Base64로 이루어진 이미지 데이터를 표현할 수 있습니다. 

```html
<img data-src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAA+VJREFUeF7tnclu4zAUBEf//9EeYG6SAhUKTdJUpnMV1663kbKd4/P5fP70bxsFjgLZhsW/hRTIXjwKZDMeBVIguymw2XqaQwpkMwU2Ww56yHEcS5d8PRZd56djU9p+9mZx/XQOKZCxiAoELiK+bXBX3A1ZXw7JMRByOevgFPNTC6b10vx2PzeBL8BxPTaH0IB2AyRIgVwUJcEsAGtBBVIgqY2d+luD1kmdzgm0G+pPIdF6jB2P1jd9f2kOSQXSFiSrogIBEyILtAJai52dw+L91UPOV0MkqDUAHQHeBsRaOAlIgi0PyQVSD4nKwnoIHP1Xu3SBfBkIxfgUEI2/2uC2PxiSYAVyeb8w24IKRN5lFchZMDrH4ME3LXupzqfn5AH2+XU+FEC+r6D9xCG0QJ7PIRZAgcBlYz1EmpQNSRSj/7uQJfXWzUnw2c/1gmUH9FibQ+T8uvlswWl8vWDZoUAG3zRI/W/NC+S3AUktIu1PST8tM9P1je6Pd1mjJ7TjFYhVbHL7ApkssB2+QOBykQTFKkKerNPLS8oxtJ/0oKn7jz6HFMjzF5xQnwJxPoKCyghw8+ACeTkQunqwFmTHG53kR49HOQv1sR5iBbQLJIHo+ej57Hhx+wJxL6hGG0ScQ+ohkwFaD6G62p4baDxKuWSxuz+PPYQELJDz78GRQRQIfK7MhmQSnJ4XyNuBUBlnQxjV4TZnUPt0Ptr/8PEpqdOCCmTsb4jqF1SUtG0MJgu3BkEGYuej+eshg7+FawHZJK3Hp5A1egGph5EH0Pir+1sPwpBVIM82PjpEF8ji77tQCCuQtwEhorOfz84JFOPT+a0+6CF2wNHtU0Gof4FIYiRoWjUVSIE8KoAhy1qo1PvWPLXYtAxN9xvPbw+GqeDUv0BAgdRiCADlALpLov72YJvutx5yIRILIu/KhhuEDVkUUqxHkAXTc/KgFNDy8QvEvc8gA6HnZLC6yqqHuB88s3oViPyvgeQB9Hy6h9iqZHVMtzkABQu/REoeE3tIgTx/DouqsJvBpEm9QArkZFQ2Ztv2NuSRgf66kDVaUAopJDDlHALw+pBVIGFVYS2QLKpACoSi0uNzMrDXhSyK4bRh8igaP6LxQ2dc7+5lLwmGGxzs4SkgXG+BfPc/mTZkhZ/D2t5D0gXaGD/6LowOfrQ/CkHUf7iH2AlJACs4AbXro5xFZbydr0BAsQKRVZD1IGuxrwNiN2jbW8GtgGnIsSFSt7dlrxXYti+QzT+XRRZWD7EmL9vXQ0YX0hJAm58VwHfqFWytAgWyVm+crUBQorUNCmSt3jhbgaBEaxsUyFq9cbYCQYnWNvgLqC4vPjN7siAAAAAASUVORK5CYII=" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAA+VJREFUeF7tnclu4zAUBEf//9EeYG6SAhUKTdJUpnMV1663kbKd4/P5fP70bxsFjgLZhsW/hRTIXjwKZDMeBVIguymw2XqaQwpkMwU2Ww56yHEcS5d8PRZd56djU9p+9mZx/XQOKZCxiAoELiK+bXBX3A1ZXw7JMRByOevgFPNTC6b10vx2PzeBL8BxPTaH0IB2AyRIgVwUJcEsAGtBBVIgqY2d+luD1kmdzgm0G+pPIdF6jB2P1jd9f2kOSQXSFiSrogIBEyILtAJai52dw+L91UPOV0MkqDUAHQHeBsRaOAlIgi0PyQVSD4nKwnoIHP1Xu3SBfBkIxfgUEI2/2uC2PxiSYAVyeb8w24IKRN5lFchZMDrH4ME3LXupzqfn5AH2+XU+FEC+r6D9xCG0QJ7PIRZAgcBlYz1EmpQNSRSj/7uQJfXWzUnw2c/1gmUH9FibQ+T8uvlswWl8vWDZoUAG3zRI/W/NC+S3AUktIu1PST8tM9P1je6Pd1mjJ7TjFYhVbHL7ApkssB2+QOBykQTFKkKerNPLS8oxtJ/0oKn7jz6HFMjzF5xQnwJxPoKCyghw8+ACeTkQunqwFmTHG53kR49HOQv1sR5iBbQLJIHo+ej57Hhx+wJxL6hGG0ScQ+ohkwFaD6G62p4baDxKuWSxuz+PPYQELJDz78GRQRQIfK7MhmQSnJ4XyNuBUBlnQxjV4TZnUPt0Ptr/8PEpqdOCCmTsb4jqF1SUtG0MJgu3BkEGYuej+eshg7+FawHZJK3Hp5A1egGph5EH0Pir+1sPwpBVIM82PjpEF8ji77tQCCuQtwEhorOfz84JFOPT+a0+6CF2wNHtU0Gof4FIYiRoWjUVSIE8KoAhy1qo1PvWPLXYtAxN9xvPbw+GqeDUv0BAgdRiCADlALpLov72YJvutx5yIRILIu/KhhuEDVkUUqxHkAXTc/KgFNDy8QvEvc8gA6HnZLC6yqqHuB88s3oViPyvgeQB9Hy6h9iqZHVMtzkABQu/REoeE3tIgTx/DouqsJvBpEm9QArkZFQ2Ztv2NuSRgf66kDVaUAopJDDlHALw+pBVIGFVYS2QLKpACoSi0uNzMrDXhSyK4bRh8igaP6LxQ2dc7+5lLwmGGxzs4SkgXG+BfPc/mTZkhZ/D2t5D0gXaGD/6LowOfrQ/CkHUf7iH2AlJACs4AbXro5xFZbydr0BAsQKRVZD1IGuxrwNiN2jbW8GtgGnIsSFSt7dlrxXYti+QzT+XRRZWD7EmL9vXQ0YX0hJAm58VwHfqFWytAgWyVm+crUBQorUNCmSt3jhbgaBEaxsUyFq9cbYCQYnWNvgLqC4vPjN7siAAAAAASUVORK5CYII=" data-loaded="true">
```

![Base64로 표시된 QR코드 이미지](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAA+VJREFUeF7tnclu4zAUBEf//9EeYG6SAhUKTdJUpnMV1663kbKd4/P5fP70bxsFjgLZhsW/hRTIXjwKZDMeBVIguymw2XqaQwpkMwU2Ww56yHEcS5d8PRZd56djU9p+9mZx/XQOKZCxiAoELiK+bXBX3A1ZXw7JMRByOevgFPNTC6b10vx2PzeBL8BxPTaH0IB2AyRIgVwUJcEsAGtBBVIgqY2d+luD1kmdzgm0G+pPIdF6jB2P1jd9f2kOSQXSFiSrogIBEyILtAJai52dw+L91UPOV0MkqDUAHQHeBsRaOAlIgi0PyQVSD4nKwnoIHP1Xu3SBfBkIxfgUEI2/2uC2PxiSYAVyeb8w24IKRN5lFchZMDrH4ME3LXupzqfn5AH2+XU+FEC+r6D9xCG0QJ7PIRZAgcBlYz1EmpQNSRSj/7uQJfXWzUnw2c/1gmUH9FibQ+T8uvlswWl8vWDZoUAG3zRI/W/NC+S3AUktIu1PST8tM9P1je6Pd1mjJ7TjFYhVbHL7ApkssB2+QOBykQTFKkKerNPLS8oxtJ/0oKn7jz6HFMjzF5xQnwJxPoKCyghw8+ACeTkQunqwFmTHG53kR49HOQv1sR5iBbQLJIHo+ej57Hhx+wJxL6hGG0ScQ+ohkwFaD6G62p4baDxKuWSxuz+PPYQELJDz78GRQRQIfK7MhmQSnJ4XyNuBUBlnQxjV4TZnUPt0Ptr/8PEpqdOCCmTsb4jqF1SUtG0MJgu3BkEGYuej+eshg7+FawHZJK3Hp5A1egGph5EH0Pir+1sPwpBVIM82PjpEF8ji77tQCCuQtwEhorOfz84JFOPT+a0+6CF2wNHtU0Gof4FIYiRoWjUVSIE8KoAhy1qo1PvWPLXYtAxN9xvPbw+GqeDUv0BAgdRiCADlALpLov72YJvutx5yIRILIu/KhhuEDVkUUqxHkAXTc/KgFNDy8QvEvc8gA6HnZLC6yqqHuB88s3oViPyvgeQB9Hy6h9iqZHVMtzkABQu/REoeE3tIgTx/DouqsJvBpEm9QArkZFQ2Ztv2NuSRgf66kDVaUAopJDDlHALw+pBVIGFVYS2QLKpACoSi0uNzMrDXhSyK4bRh8igaP6LxQ2dc7+5lLwmGGxzs4SkgXG+BfPc/mTZkhZ/D2t5D0gXaGD/6LowOfrQ/CkHUf7iH2AlJACs4AbXro5xFZbydr0BAsQKRVZD1IGuxrwNiN2jbW8GtgGnIsSFSt7dlrxXYti+QzT+XRRZWD7EmL9vXQ0YX0hJAm58VwHfqFWytAgWyVm+crUBQorUNCmSt3jhbgaBEaxsUyFq9cbYCQYnWNvgLqC4vPjN7siAAAAAASUVORK5CYII=)

> 웹팩의 [url-loader](https://v4.webpack.js.org/loaders/url-loader/)는 위와 같은 Base64 형식의 URI로 변환합니다. 

### HTTP 기본 인증
사용자 이름과 비밀번호를 Authorization 헤더에 포함하여 전달하는 HTTP 기본 인증의 경우에도 Base64 인코딩을 사용합니다. 이는 HTTP 헤더의 값이 **아스키 코드**로 인코딩되어야하기 때문입니다. 따라서, 아스키 코드로 표현할 수 없는 데이터도 전달할 수 있도록 Base64 인코딩을 사용하는 것입니다.

> Authorization: Basic bWFtYm86cGFzc3dvcmQ=

### JWT Base64Url
최근 사용자 인증을 위해 많이 도입하는 JWT(JSON Web Token)는 페이로드와 시그니처 부분을 **Base64Url(URL Safe Base64)** 로 인코딩합니다. JWT를 Base64로 인코딩하는 이유는 토큰이 URL 파라미터로 전송될 수 있기 때문입니다. 

## 끝마치며
Base64를 사용하는 이유에 대해서 간단하게 알아보았습니다. Base64가 단순히 인코딩 중 하나라고만 알고 계셨던 분들에게도 도움이 되었으면 합니다.

> Base64에 대해서 자세한 내용을 알고 싶다면 [RFC4648](https://datatracker.ietf.org/doc/html/rfc4648)을 참고하세요.