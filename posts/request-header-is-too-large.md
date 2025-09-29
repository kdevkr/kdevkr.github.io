---
title: Request Header is Too Large
date: 2024-03-26T23:00+0900
---

> java.lang.IllegalArgumentException: Request header is too large

```java
@GetMapping("/by-ids")
List<User> getUsers(@RequestParam(name = "ids") String[] ids) {
    return List.of();
}
```

위와 같은 GET API는 ids 파라미터에 대한 길이 제한을 두지 않았으므로 Request header is too large 에 대한 취약점이 내재되어있는 상태로 볼 수 있다. 그렇다면 이에 대한 문제는 어떻게 처리하는 것이 좋을까?

#### 첫번째, 서버에서 처리하는 헤더 크기 사이즈를 늘리자

기본적인 해결방법은 생각보다 작게 설정되어있는 헤더 크기를 어느정도 늘리는 것이다. 다만, 여전히 예상할 수 없는 헤더 크기를 커버할 수 없으며 이에 대한 대응으로는 GET 요청이 아닌 POST 요청을 활용해야한다. 요청 헤더 크기에 대한 제한을 늘리는 방안은 임시 조치임을 잊지 말자.

```yml
server.max-http-request-header-size: 10MB
```

#### 두번째, URL 인코딩 방식의 폼 데이터를 전달하자

GET 요청 시 쿼리 파라미터가 너무 길어질 수 있다면 폼 데이터 형식으로 보낼 수 있도록 **POST 요청에 대해서도 지원**하면 된다.

```java
@GetMapping(path = "/by-ids")
List<User> getUsers(@RequestParam(name = "ids") String[] ids) {
    return List.of();
}

@PostMapping(path = "/by-ids", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE})
List<User> getUsersUsingFormData(@RequestParam(name = "ids") String[] ids) {
    return getUsers(ids);
}
```

#### 참고할만한 링크

- [Max-Http-Request-Header-Size in Spring Boot](https://www.baeldung.com/spring-boot-max-http-header-size)
- [Difference Between form-data, x-www-form-urlencoded and raw in Postman](https://www.baeldung.com/postman-form-data-raw-x-www-form-urlencoded)
- [Handling URL Encoded Form Data in Spring REST](https://www.baeldung.com/spring-url-encoded-form-data)