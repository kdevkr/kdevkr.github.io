---
title: Jackson 마스킹 처리
date: 2024-09-02T24:00+09:00
tags:
- Masking
- Sensitive Data
---

> ■ 개인정보의 기술적관리적 보호조치 기준 제10조
> 정보통신서비스 제공자등은 개인정보 업무처리를 목적으로 개인정보의 조회, 출력 등의 업무를 수행하는 과정에서 개인정보보호를 위하여 개인정보를 마스킹하여 표시제한 조치를 취할 수 있다.

위와 같이 개인정보 또는 보안 이슈로 인하여 일부 민감한 데이터 항목을 전체가 아닌 일부만을 표시해야할 요구사항이 있을 수 있다. [Jackson AnnotationIntrospector 이슈](https://github.com/kdevkr/mambo-box/blob/main/errors/2024-09-02.md)를 경험한 김에 [AnnotationIntrospector](https://github.com/FasterXML/jackson-docs/wiki/AnnotationIntrospector)를 사용하여 REST API에서 응답되는 일부 필드를 마스킹하는 방법을 이해해보도록 하자.

#### Annotation 기반 마스킹 처리

기본적으로 별도의 Getter 함수로 만들어서 마스킹한 결과를 반환하는 필드를 만들어내도 된다. 그러나, 마스킹을 위한 어노테이션을 만들고 AnnotationIntrospector를 확장해서 어노테이션이 선언된 필드에 대해서 마스킹된 결과로 직렬화(Serialize)를 수행하도록 작성하면 마스킹 되어야하는 항목에 따라서 **다양한 마스킹 패턴을 전략적으로 적용**할 수 있다.

```java MaskedField
@Target({ElementType.ANNOTATION_TYPE, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotation
public @interface MaskedField {
    String expression() default "****";
    MaskedType type() default MaskedType.COMMON;
    String[] fields() default {}; // NOTE: If metadata
}
```

```java MaskedFieldAnnotationIntrospector
public class MaskedFieldAnnotationIntrospector extends NopAnnotationIntrospector {

    @Override
    public Object findSerializer(Annotated annotated) {
        MaskedField annotation = annotated.getAnnotation(MaskedField.class);
        if (annotation != null) {
            return MaskedFieldSerializer.class;
        }
        return null;
    }

    public static class MaskedFieldSerializer extends StdSerializer<Object> implements ContextualSerializer {
        private final boolean isMask;
        private final MaskedField annotation;

        public MaskedFieldSerializer(MaskedField annotation, boolean isMask) {
            super(Object.class);
            this.isMask = isMask;
            this.annotation = annotation;
        }

        @Override
        public void serialize(Object value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            // NOTE: MaskedType 에 따른 마스킹 패턴 구현은 생략
            ObjectMapper mapper = (ObjectMapper) gen.getCodec();
            String s = mapper.writeValueAsString(value);
            if (isMask) {
                JSONParser parser = new JSONParser(DEFAULT_PERMISSIVE_MODE);
                try {
                    Object o = parser.parse(s);
                    if (o instanceof JSONAwareEx ex) {
                        DocumentContext doc = JsonPath.parse(ex.toJSONString());
                        Map json = doc.json();
                        for (String field : annotation.fields()) {
                            if (json.containsKey(field)) {
                                doc.set(field, annotation.expression());
                            }
                        }
                        gen.writeRawValue(doc.jsonString());
                    } else {
                        gen.writeString(annotation.expression());
                    }
                } catch (ParseException e) {
                    e.printStackTrace();
                }
            } else {
                gen.writeRawValue(s);
            }
        }

        @Override
        public JsonSerializer<?> createContextual(SerializerProvider serializerProvider, BeanProperty beanProperty) throws JsonMappingException {
            MaskedField maskedField = null;
            if (beanProperty != null) {
                maskedField = beanProperty.getAnnotation(MaskedField.class);
            }
            return new MaskedFieldSerializer(maskedField, true);
        }
    }
}
```

```java AnnotationIntrospector.pair
@Bean
public ObjectMapper objectMapper() {
    ObjectMapper objectMapper = Jackson2ObjectMapperBuilder.json().build();
    AnnotationIntrospector introspector = objectMapper.getSerializationConfig().getAnnotationIntrospector();
    AnnotationIntrospector annotationIntrospector = AnnotationIntrospector.pair(introspector, new MaskedFieldAnnotationIntrospector());
    objectMapper.setAnnotationIntrospector(annotationIntrospector);
    return objectMapper;
}
```

- 다양한 마스킹 패턴 대응을 위한 MaskedType Enum 만들기
- NopAnnotationIntrospector 를 확장한 MaskedFieldAnnotationIntrospector 클래스 작성하기
- objectMapper에 AnntationIntrospectorPair로 MaskedFieldAnnotationIntrospector 등록하기

#### 마스킹 전략

이름과 주민등록번호 그리고 휴대폰 번호와 같이 민감한 데이터에 대해서는 기본적으로 **마스킹**이 고려되어야한다. 마스킹 전략에는 뒤에서 N개의 문자 또는 데이터 형식에 따라 중간의 N개의 문자를 별표(asterisk)로 치환한다. 경기대학교 전산정보원의 [개인정보 노출 조치 방법 안내](https://www.kyonggi.ac.kr/comcenter/contents.do?key=6883)에서 여러가지 예시를 잘 나타내고 있는 것 같다.

> 민감한 데이터에 대한 마스킹 처리를 반드시 애플리케이션 서버에서 이루어져야합니다. 또한, 서로 다른 시스템에서 개인정보를 공유하는데 각 시스템에서의 마스킹 전략이 다르다면 이것도 개인정보 처리와 보호 조치에 대한 문제의 소지가 있을 수 있습니다.

그러면, 애플리케이션 **로그에 포함될 수 있는 민감한 정보**는 어떻게 [마스킹](https://www.baeldung.com/logback-mask-sensitive-data) 해야하지? 🤔