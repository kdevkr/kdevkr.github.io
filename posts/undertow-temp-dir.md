---
title: 언더토우 임시 디렉토리 삭제 방지
date: 2022-08-03
tags:
- MultiPartParserDefinition
- MultipartConfigElement
- UndertowDeploymentInfoCustomizer
---

> [Tomcat does not create temporary directory used to store file uploads when it does not exist](https://github.com/spring-projects/spring-boot/issues/9616)  
> [스프링 부트 파일 업로드 에러 The temporary upload location []  is not valid](https://adunhansa.tistory.com/209)

일반적으로 자주 발생하는 상황은 아니지만 아래와 같이 파일 업로드 시 임시 디렉토리에 대한 삭제 문제로 멀티파트 요청에 대해 임시적으로 저장하는 과정에서 `NoSuchFileException`이 발생할 수 있습니다. 리눅스 시스템에서 임시 디렉토리 경로에 존재하는 파일이나 디렉토리를 일정 기간 사용하지 않았을 경우 삭제하도록 되어있는 부분으로 인하여 애플리케이션 서버로 파일 업로드가 주기적으로 요청되지 않는 한 멀티파트에 대한 임시 파일이 만들어지지 않으므로 위 현상이 나타나게 됩니다.

언더토우에서는 MultiPartParserDefinition$MultiPartUploadHandler의 beginPart라는 함수에서 멀티파트 폼 데이터에 대해 임시 파일을 만들고 읽어들이도록 되어있습니다. 스프링 부트 기반의 애플리케이션 서버에서 멀티파트에 대한 로케이션 속성을 지정하지 않으면 언더토우는 서블릿 배포 시 시스템의 임시 디렉토리 경로에 멀티파트 업로드를 위한 폴더를 생성합니다.

[Spring Demo Undertow](https://github.com/kdevkr/spring-demo-undertow) 리파지토리를 클론하여 애플리케이션을 실행하면 다음과 같이 현재 실행중인 애플리케이션 서버에서 바라보는 파일 업로드 경로가 로그로 출력됩니다.

```java
Current temp dir: C:\Users\Mambo\AppData\Local\Temp\undertow.8080.5583604686546214060
```

위 로그를 출력하는 MultipartCustomizer는 UndertowDeploymentInfoCustomizer 인터페이스를 구현한 클래스로 시스템 기본 임시 디렉토리를 사용하는 경우에 주기적인 스케줄로 파일 업로드 경로가 삭제되었는지를 확인하고 복구합니다. 멀티파트 요청에 대한 파일 업로드 경로를 별도로 지정하지 않은 리눅스 환경에서는 파일 업로드를 시도하는 경우에 따라 리눅스 시스템에서 파일 업로드를 위한 폴더를 삭제할 가능성을 내재하고 있으므로 애플리케이션을 재실행하지 않아도 자동적으로 처리하거나 삭제를 방지하는 것을 도와주는 트릭을 구현할 수 있습니다.

> 멀티파트 요청이 정상적으로 수행하는 경우 만들어진 임시 파일이 자동적으로 삭제되므로 시스템 기본 임시 디렉토리를 사용하는 것보다는 별도의 파일 업로드 경로를 지정하고 주기적으로 삭제되지 않고 남아있는 파일들이 있는지 관리하는 것이 더 좋은 대안입니다.
