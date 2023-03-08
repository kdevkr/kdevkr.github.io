---
title: 프리마커 템플릿
date: 2023-03-08
comments: true
---

스프링 부트 프로젝트에 대한 예제를 살펴보면 대부분 템플릿 엔진으로 타임리프를 선택하여 사용함을 알 수 있다. 대부분 타임리프에 대해서 설명하므로 프리마커 템플릿 엔진에 대해서 정리한 글은 생각보다 많지 않다. 나는 타임리프라는 템플릿 엔진 보다는 프리마커의 문법이 더 간단하고 느끼기에 더 선호하는 편이다. [여러가지 템플릿 엔진과 비교](https://github.com/jreijn/spring-comparing-template-engines)해서도 준수한 렌더링 성능을 보여주고 있다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-freemarker'
}
```

#### FreeMarkerAutoConfiguration
스프링 부트의 자동 구성은 FreeMarkerAutoConfiguration로 시작되며 FreeMarkerServletWebConfiguration에서 뷰 리졸버가 등록되며 FreeMarkerNonWebConfiguration으로 FreeMarkerConfigurationFactoryBean가 등록되어 이메일 내용 처리와 같은 웹 요청과 관련되지 않은 곳에서도 템플릿 처리가 가능하도록 지원한다. 스프링 프레임워크에서는 SpringTemplateLoader로 클래스패스에 존재하는 템플릿을 불러올 수 있도록 지원하며 프리마커에서는 StringTemplateLoader를 통해 문자열로 정의된 템플릿을 만들 수 있게 제공한다.

#### Internationalization
스프링 프레임워크에서는 프리마커 템플릿을 사용해서 다국어 메시지를 처리할 수 있도록 [spring.ftl](https://github.com/spring-projects/spring-framework/blob/main/spring-webmvc/src/main/resources/org/springframework/web/servlet/view/freemarker/spring.ftl)라는 매크로가 포함된 템플릿 파일을 제공하고 있으며 아래와 같이 프리마커 템플릿에서 스프링 메시지를 처리할 수 있다. 프리마커 템플릿 파일에 직접 명시하거나 애플리케이션 프로퍼티로 auto_import 옵션을 사용해서 추가할 수도 있다.

```ftl index.ftlh
<#import "/spring.ftl" as spring/>
<@spring.message "messageKey"/>
```

```yml application.yml
spring:
  freemarker:
    settings:
      auto_import: spring.ftl as spring
```

> 다만, 위 spring.ftl 파일에 정의된 메시지 처리는 웹 요청에 의한 스레드 내에서만 사용될 수 있기 때문에 이메일 내용 처리와 같이 웹 요청이 아닌 백그라운드 작업에서 사용할 순 없다.

#### 백그라운드 작업 시 다국어 메시지 처리
사용자의 웹 요청에 의한 템플릿 처리가 아닌 백그라운드 작업에서 프리마커 템플릿 엔진을 사용하는 경우에 다국어 메시지를 제공하기 위해서는 프리마커 템플릿 엔진에서 리소스 번들을 모델로 메시지 보간을 처리할 수 있는 **ResourceBundleModel**를 사용해야 한다. 다음은 스프링 부트 자동 구성에 의해 등록되는 FreeMarkerConfigurationFactoryBean과 ResourceBundleModel을 통해 메시지를 처리할 수 있는 방법에 대한 예시이다.

```java
Locale locale = Locale.ROOT;

Configuration configuration = configurationFactoryBean.createConfiguration();
StringTemplateLoader stringTemplateLoader = new StringTemplateLoader();
stringTemplateLoader.putTemplate("template", "${bundle(\"application.name\")}");
configuration.setTemplateLoader(stringTemplateLoader);
Template template = configuration.getTemplate("template", locale);

ResourceBundle resourceBundle = ResourceBundle.getBundle("messages", locale);
Map<String, Object> model = new HashMap<>();
model.put("bundle", new ResourceBundleModel(resourceBundle, new BeansWrapperBuilder(Configuration.DEFAULT_INCOMPATIBLE_IMPROVEMENTS).build()));
String content = FreeMarkerTemplateUtils.processTemplateIntoString(template, model);
```

#### 템플릿 체이닝
프리마커 템플릿 엔진에서 지원하는 [MultiTemplateLoader](https://freemarker.apache.org/docs/api/freemarker/cache/MultiTemplateLoader.html)를 사용하면 여러가지 방식의 [템플릿 로딩](https://freemarker.apache.org/docs/pgui_config_templateloading.html)을 통해 템플릿 로더에 의해 로드되는 템플릿을 함께 사용할 수 있다. 또한, MultiTemplateLoader에 전달되는 템플릿 로더의 순서에 따라 SpringTemplateLoader로 기본 템플릿 레이아웃을 만들고 실제 템플릿 내용은 StringTemplateLoader로 재정의하는 것도 가능하다.

```java
StringTemplateLoader stringTemplateLoader = new StringTemplateLoader();
stringTemplateLoader.putTemplate("email.ftlh", "${bundle(\"application.name\")}");
stringTemplateLoader.putTemplate("template", "<#include \"email.ftlh\" >");

Configuration configuration = configurationFactoryBean.createConfiguration();
SpringTemplateLoader springTemplateLoader = new SpringTemplateLoader(resourceLoader, "classpath:/templates/");
MultiTemplateLoader multiTemplateLoader = new MultiTemplateLoader(new TemplateLoader[]{stringTemplateLoader, springTemplateLoader});
configuration.setTemplateLoader(multiTemplateLoader);
Template template = configuration.getTemplate("template", locale);
```

> MultiTemplateLoader의 생성자에 전달되는 템플릿 로더의 순서대로 템플릿을 찾도록 위임한다는 것에 주의해야한다.

