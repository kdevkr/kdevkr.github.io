---
title: 인텔리제이 개발 환경 설정 (feat. Code Style)
date: 2024-01-21T17:00+0900
tags:
- Code Style
- Checkstyle
- EditorConfig
---

#### EditorConfig 에서 K&R 스타일 강제하기

개발자 커뮤니티의 글들을 참고해보니 자바 언어에서의 기본 K&R 코드 스타일이 아닌 BSD 스타일로 바꾸어서 개발하는 사람들이 있나보다. 프로젝트에서 EditorConfig를 사용하고 인텔리제이에서 **EditorConfig 에 의해 IDE 코드 스타일 설정을 오버라이드할 수 있도록 활성화** 했다면 아래와 같이 강제할 수 있다.

```toml .editorconfig
[*.java]
ij_java_block_brace_style = end_of_line
ij_java_class_brace_style = end_of_line
ij_java_method_brace_style = end_of_line

ij_java_line_comment_add_space = true
ij_java_line_comment_add_space_on_reformat = true
ij_java_line_comment_at_first_column = false
```

> 이외에도 수 많은 규칙을 설정할 수 있게 제공하므로 프로젝트에서 강제해야할 필요성이 있는 규칙이 무엇인지 체크해보는게 필요합니다.

##### 주석에 대한 들여쓰기 기본 옵션 비활성화

![](/images/posts/intellij-java-code-style/01.png)

위 예시에서 `ij_java_line_comment_at_first_column` 은 라인 단위 주석에 대해 들여쓰기 기본 옵션으로 선택되어있는 첫번째 열에 주석을 추가하는 것을 비활성화하도록 하는 옵션 설정이다. 체크스타일에서 들여쓰기 규칙이 있어도 인텔리제이 기본값이 첫번째 열에 추가하는 것이기에 들여쓰기 규칙에 올바르지 않은 형태로 만들어질 수 있다. 따라서, 위와 같이 명시적으로 비활성화한다면 인텔리제이 IDE 자바 코드 스타일 설정 중 `Code Generation → Comment Code → Line comment at first column` 이 선택되어있어도 라인 중 코드가 시작되는 곳부터 주석이 되는 걸 확인할 수 있다.

> Line comment at first column 을 비활성화하는 건 꽤나 많은 조직에서 유용할 것 같습니다.
> 그래도 무의미한 주석인지에 대한 유무는 리뷰 단계에서 검출하는게 좋겠죠?

#### Checkstyle 및 프로젝트 코드 스타일 설정 공유하기

![](/images/posts/intellij-java-code-style/02.png)

프로젝트 폴더 내에 Checkstyle에 대한 구성 파일이 포함되어있더라도 인텔리제이에서 Checkstyle 플러그인에서 사용되도록 수동으로 설정하고 코드 스타일에 체크스타일 설정을 스키마로 임포트하는 과정은 개발자마다 수행해야하는 작업이다. 대부분 자바 프로젝트를 보면 .idea 와 같은 인텔리제이에서 참조하는 폴더를 .gitignore로 추적되지 않도록 해두었을 가능성이 높다. 프로젝트에서 체크스타일을 사용하고 있다면 아래의 3가지 파일에 대해서는 프로젝트에서 관리되도록 추가하는 게 좋을 수도 있다.

아래와 같이 이미 무시되는 규칙에 대해서도 .gitignore 규칙에서 제외되는 패턴을 둘 수 있다.

```toml .gitignore
### IntelliJ IDEA ###
.idea
!.idea/codeStyles/codeStyleConfig.xml
!.idea/codeStyles/Project.xml
!.idea/checkstyle-idea.xml
```

> 이미 .idea 폴더가 제외되어있다면 수동으로 3개의 파일을 오른쪽 마우스를 눌러 Git → Add 기능으로 추적이되도록 추가해야합니다. 
> 신규 프로젝트를 시작할때 프로젝트 단위의 설정을 공유하는 걸 고려하시는게 좋아보입니다.

![](/images/posts/intellij-java-code-style/03.png)

끝으로, 이렇게 하더라도 개발 환경 설정에 대한 가이드 문서를 남기고 정말로 설정이 동일한지 체크해주는 과정은 필요하다. 프로젝트 코드를 받아도 개발자마다 사용하는 IDE 설정이 완전히 동일하게 맞춰지진 않기 때문에 메인 브랜치에 커밋하는 업무 방식은 지양하고 [작업 브랜치와 PR을 통해 강제로 검증하는 프로세스](github-pr-status-checks)가 필요할 수 밖에 없다.

인텔리제이와 이클립스를 혼용하는 조직이라면 GG... 😅

---

#### Checkstyle로 일관되지 않을 수 있는 코드 스타일

앞서 다룬것 처럼 Checkstyle을 사용하더라도 일관되지 않을 수 있는 코드 스타일이 있을 수 있다. 예를 들어, 함수 파라미터가 많아지는 경우 어떤 방식으로 관리할 것이냐에 따라 개발자마다 관점이 다를 수 있지만 인텔리제이 기본 포맷터와 체크스타일 규칙에 따라 일관되게 포맷팅되지 않을 수 있다. 아래와 같은 코드 스타일 중에서 마지막 D 스타일은 **Method declaration parameters** 와 같은 규칙을 수동으로 설정하거나 아래와 같이 EditorConfig 규칙으로 강제하여 일관되게 만들 수 있다. 

```java
// A 스타일
@GetMapping("/")
public String index(HttpServletRequest request, HttpServletResponse response, HttpHeaders headers, Principal principal) {
    return "ok";
}

// B 스타일
@GetMapping("/")
public String index(HttpServletRequest request, HttpServletResponse response, 
                    HttpHeaders headers, Principal principal) {
    return "ok";
}

// C 스타일
@GetMapping("/")
public String index(HttpServletRequest request,
                    HttpServletResponse response,
                    HttpHeaders headers,
                    Principal principal) {
    return "ok";
}

// D 스타일
@GetMapping("/")
public String index(
    HttpServletRequest request,
    HttpServletResponse response,
    HttpHeaders headers,
    Principal principal
) {
    return "ok";
}
```

```toml .editorconfig
[*.java]
ij_java_call_parameters_new_line_after_left_paren = true
ij_java_call_parameters_right_paren_on_new_line = true
ij_java_method_parameters_new_line_after_left_paren = true
ij_java_method_parameters_right_paren_on_new_line = true
```

개인적으로는 A 스타일로 개발하다가 파라미터가 많아질수록 B 스타일 그리고 C 스타일로 변경하는 것 같고 D 스타일은 마음에 들지 않는데 **자동으로 검출할 수가 없는 케이스**라 PR 리뷰 단계에서 체크가 필요해보인다.
