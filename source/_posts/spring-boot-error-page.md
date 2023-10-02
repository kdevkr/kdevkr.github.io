---
title: 스프링 부트 오류 페이지
date: 2023-10-02T12:00+0900
tags:
- ThymeleafViewResolver
- FreeMarkerViewResolver
- DefaultErrorViewResolver
- BasicErrorController
---

스프링 부트 프로젝트에서는 기본적인 오류 응답에 대한 처리와 화이트라벨 오류 페이지에 대한 자동 구성을 제공한다. 오류 처리에 대한 자동 구성은 ErrorMvcAutoConfiguration를 통해 제공하며 BasicErrorController 와 DefaultErrorViewResolver가 등록된다. 

#### Whitelabel Error Page

스프링 부트의 기본 화이트라벨 오류 페이지는 ErrorMvcAutoConfiguration의 StaticView로 HTML 파일이 아닌 자바 코드로 구현되어있다. 이것은 애플리케이션 프로퍼티로 비활성화할 수 있는데 기본적으로 사용되는 내장 웹 컨테이너인 톰캣의 경우 화이트라벨 오류 페이지를 사용하지 않으면 톰캣의 오류 페이지가 응답되는 것을 확인할 수 있다.

> 톰캣이 아닌 언더토우를 사용한다면 언더토우가 자체적인 오류 응답 페이지를 제공하지 않는다.  

#### Error Templates

화이트라벨 오류 페이지의 비활성화 여부와 상관없이 `error`라는 뷰를 처리하도록 템플릿 파일을 클래스패스에 추가하는 경우에는 FreeMarkerViewResolver 또는 ThymeleafViewResolver 에 의해 처리된다. ErrorTemplate가 존재하는 경우 화이트라벨 오류 페이지에 대한 빈 등록은 자동으로 비활성화된다.

> FreeMarkerViewResolver와 ThymeleafViewResolver가 동시에 존재하는 경우 프리마커와 타임리프에 대한 자동 구성 클래스의 구현 상 Order값에 의해 FreeMarkerViewResolver의 처리 순서가 더 높다.

```ftl error.ftlh
<!DOCTYPE html>
<html lang="${.lang}">
<head>
    <title>Error</title>
    <meta charset="UTF-8">
</head>
<body>
<h1>Oops!</h1>
<div>Error: ${error}</div>
<div>Path: ${path}</div>
<div>Status: ${status}</div>
<div>Timestamp: ${timestamp?datetime?iso_utc}</div>
<p><a href="/">Go to main</a></p>
</body>
</html>
```

#### Error Templates based HTTP Status Code

에러 페이지를 공통으로 처리할 수도 있고 DefaultErrorViewResolver는 error 디렉토리 하위에 HTTP Status Code 값으로 이루어진 템플릿 파일을 구성하는 경우에 더 상세하게 구분하여 처리할 수 있다. 공통 오류 페이지 내에서 템플릿 문법을 사용해도 무방하지만 명시적으로 나누어서 처리하게 하는 것도 나쁘지 않을 것이다.

```ftl error/404.ftlh
<!DOCTYPE html>
<html lang="${.lang}">
<head>
    <title>404 - Not Found</title>
    <meta charset="UTF-8">
</head>
<body>
<h1>Oops! Not Found</h1>
<div>Error: ${error}</div>
<div>Path: ${path}</div>
<div>Status: ${status}</div>
<div>Timestamp: ${timestamp?datetime?iso_utc}</div>
<p><a href="/">Go to main</a></p>
</body>
</html>
```

