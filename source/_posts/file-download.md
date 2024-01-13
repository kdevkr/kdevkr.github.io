---
title: 스프링 파일 다운로드
date: 2024-01-13T22:00+0900
tags:
- File
- Content-Disposition
- application/octet-stream
---

스프링 프레임워크 기반의 웹 애플리케이션에서 파일 다운로드 예제를 찾아보면 대부분은 서블릿 스택의 HttpServletResponse의 OutputStream 에 파일의 내용을 쓰는 방식으로 설명하는 경우가 많다. 그러나, 스프링 프레임워크에서는 바이트 처리에 대한 추상화가 되어있기 때문에 더 쉽고 간결한 파일 다운로드 예제 코드를 작성할 수 있다. 이리저리 찾아보며 활용할 수 있는 클래스들을 통해 아래와 같이 코드를 작성해보았다.

```java FileController.java
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
public class FileController {
    @GetMapping("/files/sample.csv")
    public ResponseEntity<byte[]> download() throws IOException {
        Resource resource = new ClassPathResource("sample/file.csv");
        byte[] bytes = resource.getContentAsByteArray(); // NOTE: Use FileCopyUtils.copyToByteArray
        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename("한글파일명.csv", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }
}
```

```html src/main/resources/templates/index.html
<!DOCTYPE html>
<html>
<body>
<a href="/files/sample.csv">sample.csv</a>
</body>
</html>
```

#### Resource 와 ResponseEntity

ResponseEntity\<Resource\>도 가능하지만 더 명확한 표현을 위해서 `byte[]`를 명시하였다. ResponseEntity를 쓴 이유는 `Content-Disposition` 헤더를 통해 파일명을 지정하고 일반적인 바이너리 응답을 의미하도록 `application/octet-stream` 을 설정하기 위해서이다. HttpServletResponse를 핸들러 함수에 파라미터로 받아서 사용할 수도 있지만 굳이 필요하지 않음을 보여준다.

#### FileCopyUtils.copyToByteArray

스프링 프레임워크 6 부터는 오래전부터 제공하던 `FileCopyUtils.copyToByteArray` 를 사용하여 Resource를 바이트 배열로 바꾸는 함수를 제공한다. 만약, 스프링 프레임워크 5 이하의 버전이라면 Resource의 InputStream을 가져와서 FileCopyUtils.copyToByteArray를 직접 이용하면 된다.

#### ContentDisposition

일부 예제에서는 Content-Disposition 헤더를 지정하기 위해서 문자열을 입력하는 것을 볼 수 있다. 잘못된 것은 아니지만 사람이 입력하는데 실수를 할 수 있기 때문에 스프링 프레임워크에 포함된 `ContentDisposition` 클래스를 이용해서 실수를 방지할 수 있다. 심지어 한글로 된 파일명을 지정하기 위해서는 `URLEncoder`를 사용해야하는데 ContentDisposition 클래스 내부적으로 RFC 6266 와 RFC 2047 에 따라 URL 인코딩을 수행하므로 이에 대한 과정도 생략할 수 있다.

---

> 어떤가요? 여러분이 작성한 코드보다 간결해졌나요? [Downloading a file from spring controllers](https://stackoverflow.com/questions/5673260/downloading-a-file-from-spring-controllers) 에서 더 많은 예제 코드를 확인할 수 있습니다.
