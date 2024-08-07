---
title: 유효성 검증
date: 2024-08-07T22:00+09:00
---

> 서버 애플리케이션에서 좋은 REST API를 설계하는 것에는 잘못된 요청에 대해 유효성 검사를 포함하여 올바르게 예외를 처리하는 것도 포함됩니다.

자바 애플리케이션에서 **유효성 검증(Validation)** 은 JSR-303 과 스프링 프레임워크에서 제공하는 추상화를 통해 쉽고 유연하게 유효성 검증을 수행할 수 있다. 아래의 스프링 부트 스타터를 추가하면 **hibernate-validator** 가 포함되어있다.

```groovy build.gradle
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

#### 올바르지 않은 요청에 대한 예외 목록

유효성 검사를 포함하여 잘못된 요청에 대해서 발생하는 예외는 아래와 같다.

- MissingPathVariableException - 경로 변수가 지정된 파라미터가 없거나 경로 변수에 빈 값이 주어진 경우
- MethodArgumentTypeMismatchException - 바인딩 데이터를 파라미터로 변환할 수 없는 경우
- HttpMessageNotReadableException - 요청 바디를 올바르게 처리할 수 없는 경우
- MissingServletRequestParameterException - 필수 파라미터가 포함되지 않은 경우
- MethodArgumentNotValidException - 폼 데이터 또는 요청 바디가 유효성 검사에 통과하지 못한 경우
- ConstraintViolationException - 경로 변수 또는 요청 파라미터가 유효성 검사에 통과하지 못한 경우
- HttpRequestMethodNotSupportedException - 지원하지 않는 HTTP 함수로 요청한 경우

> UnexpectedTypeException는 유효성 검사를 위해 잘못된 유형을 지정하였을 경우에 발생하므로 잘못된 요청이 아닌 서버 오류에 해당됩니다.
> 예를 들어, Integer 또는 Long과 같은 파라미터에 @NotBlank를 선언했을때 확인할 수 있습니다.

#### 유효성 검사 예외 메시지를 확인하는 속성

스프링 부트 애플리케이션에서 기본적인 오류 응답에 유효성 검사에 대한 메시지를 포함하여 확인하고 싶다면 아래와 같이 `server.error` 속성을 설정하면 된다.

```yml application.yml
server.error:
  include-exception: true
  include-binding-errors: always
  include-message: always
  include-stacktrace: never
```

#### Valid 그리고 Validated

기본적으로 JSR-303 표준의 유효성 검사를 위한 어노테이션은 @Valid 이다. REST API 뿐만 아니라 비즈니스 레이어에서도 유효성 검사를 수행하고 싶은 경우에는 @Validated를 활용하여야 한다. 또한, **@Validated**는 groups 속성을 통해 동일한 모델에 대해서 상황에 따라 유효성 검증 유무를 선택할 수 있어 더 유연하게 처리할 수 있다. **PathVariable** 과 **RequestParam** 에 대해서 유효성 검사를 수행하고자 하는 경우에는 @Validated를 컨트롤러 클래스에 추가해야한다.

#### Cascaded Validation

모델 빈 클래스에 하위 객체로 구성된 필드에 대해서 유효성 검증을 적용하고자하는 경우에는 필드에 **@Valid**를 선언하면 된다. 그렇지 않은 경우 하위 모델에 대해서는 기본적으로 유효성 검사를 자동으로 수행하지 않는다. 다음은 리스트로 구성된 필드에 개별 유효성 검사를 수행하는 케이스를 보여준다.

```java
@Data
public class Account {
    @NotBlank
    private String id;
    @NotBlank
    @Size(min = 10)
    private String password;

    private List<@Valid Contact> contacts = new ArrayList<>();

    @Data
    public static class Contact {
        @Size(max = 20)
        @NotEmpty
        private String name;
        @Email
        private String email;
        @Pattern(regexp = "^\\+?[1-9]\\d{0,2}[\\s\\d]{1,14}$") // NOTE: E.164
        private String phone;
    }
}
```

#### ConstraintValidator

JSR-303 또는 JSR-380 표준의 어노테이션으로 커버하지 못하는 입력값에 대한 유효성 검증을 위해서 **ConstraintValidator** 인터페이스를 구현하여 시스템 요구사항에 맞는 유효성 검증을 수행할 수 있도록 구현할 수 있다. 예를 들어, 앞선 예시에서는 전화번호 입력 필드에 대해서 E.164를 검증하기 위해서 정규식을 사용했지만 더 유연하게 입력할 수 있도록 지원하기 위해서 [google/libphonenumber](https://github.com/google/libphonenumber)에서 제공하는 유틸을 사용한 유효성 검증을 구현할 수 있다.

```java
@Documented
@Constraint(validatedBy = PhoneConstraintValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.CONSTRUCTOR, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Phone {
    String message() default "Invalid E.164 format: '${validatedValue}'";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

public class PhoneConstraintValidator implements ConstraintValidator<Phone, String> {
    @Override
    public void initialize(Phone constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
    }

    @Override
    public boolean isValid(String s, ConstraintValidatorContext context) {
        try {
            PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
            Phonenumber.PhoneNumber number = phoneUtil.parse(s, Phonenumber.PhoneNumber.CountryCodeSource.UNSPECIFIED.name());
            return phoneUtil.isPossibleNumber(number);
        } catch (NumberParseException e) {
            return false;
        }
    }
}
```

#### 유효성 검증 예외에 대한 오류 처리

유효성 검증 실패 시 데이터 바인딩 방식과 유효성 검증 어노테이션에 따라 예외가 발생한다. **ExceptionHandler**를 통해 공통 오류 응답을 구현하고자 한다면 최소한 **ConstraintViolationException**과 **MethodArgumentNotValidException** 에 대해서는 유효성 검사에 대한 메시지가 올바르게 포함되도록 작성하도록 하자.

- PathVariable, RequestParam + Validated → ConstraintViolationException
- RequestBody + Validated → MethodArgumentNotValidException

#### 참고 링크

- [Jakarta Bean Validation specification](https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html)
- [Validation 어디까지 해봤니?](https://meetup.nhncloud.com/posts/223)
- [Differences in @Valid and @Validated Annotations in Spring](https://www.baeldung.com/spring-valid-vs-validated)
- [Bean Validation 2.0 - you’ve put your annotations everywhere! by Gunnar Morling](https://www.youtube.com/watch?v=GdKuxmtA65I)
- [Java Bean Validation Basics](https://www.baeldung.com/java-validation)