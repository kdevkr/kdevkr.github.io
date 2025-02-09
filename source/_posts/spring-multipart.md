---
title: 스프링 멀티파트
date: 2025-02-05T22:00+09:00
tags:
- MultipartFile
- MultipartResolver
- RequestPart
---

AWS S3에 파일을 저장하기 위해서 멀티파트 업로드를 수행하는 것처럼 웹 애플리케이션에서 바이너리 데이터를 전달하기 위해  <u>멀티파트 폼 데이터 형식</u>으로 사용자가 선택한 파일을 전달합니다. 스프링 프레임워크를 통해 백엔드 애플리케이션을 작성하는 경우 알아야할  <u>멀티파트</u>에 대해서 간단히 정리해보려고 합니다.

#### MultipartFile 와 RequestPart

스프링 컨트롤러 핸들러 함수의  <u>MultipartFile</u> 파라미터는  <u>RequestParam, ModelAttribute 그리고 RequestPart 어노테이션을 선언</u>하여 바인딩을 수행할 수 있습니다. 대부분 RequestParam 과 ModelAttribute를 사용하지만 개인적으로  <u>코드 가독성을 더 명확하게 하기 위해</u> 멀티파트를 위한 목적으로 추가되어있는  <u>RequestPart</u>로 선언하여 사용하는 편입니다.

```java
@RestController
public class FileController {
    @RequestMapping(value = "/file", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<String> upload(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(file.getOriginalFilename());
    }
}
```

#### StandardServletMultipartResolver

멀티파트 폼 데이터(multipart/form-data) 요청에 대해서  <u>StandardServletMultipartResolver</u>가 멀티파트에 포함되어있는 바이너리를  <u>StandardMultipartFile</u>로 변환됩니다. 이때, 멀티파트에 포함된 바이너리는 임시 폴더에 저장되며 요청이 처리된 이후에  <u>MultipartFiler</u>에 의해 임시로 저장된 파일은 최종적으로 삭제됩니다.

#### MaxUploadSizeExceededException 💥

스프링 멀티파트 기본값 설정에 의해 파일 당 1MB 또는 요청 당 10MB 제한으로  <u>MaxUploadSizeExceededException</u>이 발생할 수 있습니다. 따라서, 파일 업로드 기능이 필요한 경우 예상되는 파일 최대 사이즈에 따라 설정해두는 것이 좋습니다.

```properties application.properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.mulitpart.max-request-szie=100MB
```

#### Multipart Temp Directory

멀티파트 파일이 저장되는 경로를 지정하지 않으면  <u>운영체제의 임시 디렉토리를 사용</u>하게 됩니다. 실행중인 애플리케이션에서 오랫동안 파일이 업로드되지 않아서 애플리케이션이 생성했던 경로를 리눅스와 같은 운영체제에서 정리해버리는 경우  <u>파일 업로드를 실패</u>하는 사유가 있었습니다. [언더토우 임시 디렉토리 삭제 방지](/undertow-temp-dir/)와 같이 임시 디렉토리를 복구하거나 멀티파트 바이너리를 임시 저장하기 위한 경로를 별도로 지정하는 것이 좋습니다.

```properties
spring.servlet.multipart.location=/home/ec2-user/tmp
```