---
title: 프리마커 템플릿
date: 2022-03-05
comments: true
---

> 본 글은 [프리마커 템플릿으로 이메일 발송하기](/sending-mail-with-freemarker-template/)에 이어서 프리마커 템플릿에 대해서 조금 더 학습해보고 정리하였습니다.
> 이 글에서 알아보는 내용을 코드로 확인하고 싶다면 [spring-demo-freemarker](https://github.com/kdevkr/spring-demo-freemarker)를 참고하세요.

## 프리마커 템플릿
[프리마커(FreeMarker)](https://freemarker.apache.org/) 템플릿 엔진은 스프링 부트에서 공식적으로 지원하는 템플릿 엔진 중 하나입니다. [템플릿 리터럴](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Template_literals)처럼 미리 정의된 템플릿 파일을 만들어서 어떠한 데이터 모델을 결합하여 동적으로 컨텐츠를 만들기 위해서 사용합니다. 여러가지 [템플릿 엔진과 비교](https://github.com/jreijn/spring-comparing-template-engines)해서도 준수한 렌더링 성능을 보여주고 있습니다.

![Template + data-model = output](https://freemarker.apache.org/images/overview.png)

### 템플릿 로더
프리마커 템플릿 엔진은 다양항 방식으로 템플릿을 관리할 수 있도록 [TemplateLoader](https://freemarker.apache.org/docs/api/freemarker/cache/TemplateLoader.html) 인터페이스를 사용합니다. 기본적으로 내장되어있는 구현체도 존재하며 프리마커 템플릿 엔진을 공식적으로 지원하는 스프링 프레임워크에는 SpringTemplateLoader라는 구현체를 포함하고 있습니다. 본 글에서 다루는 TemplateLoader는 아래와 같습니다.

- [SpringTemplateLoader](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/ui/freemarker/SpringTemplateLoader.html)
- [StringTemplateLoader](https://freemarker.apache.org/docs/api/freemarker/cache/StringTemplateLoader.html)
- [MultiTemplateLoader](https://freemarker.apache.org/docs/api/freemarker/cache/MultiTemplateLoader.html)

> 스프링 프레임워크에서 제공하는 SpringTemplateLoader는 ResourceLoader를 통해 템플릿을 로드합니다.

### 국제화
국제화(Internationalization)는 구글처럼 다양한 언어를 사용하는 서비스 사용자가 있다면 다국어 서비스를 위해서 필수적으로 지원해야하는 기능입니다. 스프링 프레임워크에서는 [메시지 소스](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/MessageSource.html)를 통해 다국어 메시지 처리를 지원합니다. 프리마커 템플릿 엔진은 스프링의 메시지 소스와는 연관성이 없으므로 스프링 프레임워크에서는 프리마커 템플릿에서 메시지 소스를 사용할 수 있도록 [spring.ftl](https://github.com/spring-projects/spring-framework/blob/main/spring-webmvc/src/main/resources/org/springframework/web/servlet/view/freemarker/spring.ftl)를 포함하고 있습니다. 

따라서, 프리마커 템플릿에서 스프링 메시지 처리하는 방법을 찾아보면 다음과 같이 해야한다는 정보를 확인할 수 있습니다.

```ftl
<#import "/spring.ftl" as spring/>
<@spring.message "messageKey"/>
```

> 단, 메시지 소스를 사용할 수 있도록 정의된 FTL 파일은 RequestContext를 필요로하기 때문에 사용자의 요청에 대해 응답하는 뷰가 아닌 경우에는 사용할 수 없습니다. 따라서, 백그라운드 작업의 스레드에는 RequestContext가 존재하지 않기 때문에 메시지 소스로 다국어 메시지 처리가 불가능합니다.

#### ResourceBundleModel
사용자의 요청에 대한 응답이 아닌 백그라운드 작업에서 프리마커 템플릿 엔진을 사용할 때 다국어 메시지를 제공하기 위해서는 프리마커 템플릿 엔진에서 지원하는 방법을 사용해야만 합니다. 프리마커 템플릿 엔진은 리소스 번들을 모델로 사용해서 다국어를 처리할 수 있는 **ResourceBundleModel**을 제공하고 있습니다.

예를 들어, 클래스패스에 리소스 번들을 구성하고 ResourceBundleModel로 변환하여 데이터 모델로 전달하면 메시지 처리가 가능해집니다.

![Resource Bundle](/images/posts/freemarker-template/resource-bundle.png)

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

> 기본적으로는 프로퍼티 파일로 리소스 번들을 만들지만 [XML](https://docs.oracle.com/javase/7/docs/api/java/util/ResourceBundle.Control.html) 또는 [YAML](https://github.com/akkinoc/yaml-resource-bundle)로 리소스 번들을 만들어서 사용할 수도 있습니다.

### 템플릿 체이닝
[MultiTemplateLoader](https://freemarker.apache.org/docs/api/freemarker/cache/MultiTemplateLoader.html)를 사용하면 여러가지 방식의 [템플릿 로딩](https://freemarker.apache.org/docs/pgui_config_templateloading.html)을 통해 템플릿 로더에 의해 로드되는 템플릿을 함께 사용할 수 있습니다. 또한, MultiTemplateLoader에 전달되는 템플릿 로더의 순서에 따라 SpringTemplateLoader로 기본 템플릿 레이아웃을 만들고 실제 템플릿 내용은 StringTemplateLoader로 재정의할 수도 있습니다.

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

> MultiTemplateLoader의 생성자에 전달되는 템플릿 로더의 순서대로 템플릿을 찾도록 위임한다는 것에 주의해야합니다.

사용자의 요청에 대한 응답을 뷰로 처리하기 위해서 템플릿 엔진을 적용하기도 하지만 이메일 발송과 같은 백그라운드 작업에서도 프리마커 템플릿 엔진을 다양한 방식으로 활용할 수 있다는 것을 알게되었습니다. 프리마커 템플릿을 동적으로 처리하는 방법에 대해서 고민하게 되면서 알아본 내용이지만 많은 분들에게 도움이 되었으면 합니다.

감사합니다.