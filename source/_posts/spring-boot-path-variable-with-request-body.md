---
title: PathVariable 값을 RequestBody 오브젝트에 주입하기
date: 2024-02-02T23:00+0900
tags:
- RequestBodyAdviceAdapter
- LocalVariableTableParameterNameDiscoverer
---

오늘 정리하고 공유하고자 하는 내용은 @PathVariable로 지정된 파라미터가 있을 경우 @RequestBody가 지정된 오브젝트 필드에 데이터를 주입할 수 있도록 하는 구현 방안이다. @PathVariable로 지정된 파라미터가 있을 경우 @ModelAttribute에 주입되도록 ServletModelAttributeMethodProcessor가 구현되어있는 반면에 @RequestBody에 대해서 변환을 담당하는 MappingJackson2HttpMessageConverter 에서는 ObjectMapper 에 의해 변환만 수행하도록 되어있다.

> 따라서, 기본적으로는 @PathVariable 파라미터 값이 @RequestBody 오브젝트에 주입되지 않는다.

#### RequestBodyAdviceAdapter

ChatGPT 에게 힌트를 얻어 `RequestBodyAdvice` 인터페이스를 구현하여 **RequestBody를 전후처리를 수행할 수 있다**는 것을 알아냈다. 대부분 @RestControllerAdvice와 함께 공통 오류처리를 위한 핸들러를 작성해왔을텐데 RequestBodyAdviceAdapter를 확장하여 ServletModelAttributeMethodProcessor 에서의 구현처럼 @PathVariable로 지정된 파라미터의 값을 RequestBody 오브젝트에 주입할 수 있지 않을까 시도해보았다.

```java PathVariableRequestBodyBinder
@RestControllerAdvice
public class PathVariableRequestBodyBinder extends RequestBodyAdviceAdapter {
    private static final ParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();

    @SuppressWarnings("unchecked")
    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage, MethodParameter methodParameter,
                                Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        Object object = super.afterBodyRead(body, inputMessage, methodParameter, targetType, converterType);
        Method method = methodParameter.getMethod();

        RequestAttributes requestAttributes = RequestContextHolder.currentRequestAttributes();
        Map<String, ?> pathVariables = (Map<String, ?>) requestAttributes.getAttribute(
            HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);

        if (method == null || pathVariables == null || pathVariables.isEmpty()) {
            return object;
        }

        Class<?> clazz = object.getClass();
        String[] parameterNames = parameterNameDiscoverer.getParameterNames(method);
        if (parameterNames != null && parameterNames.length > 0) {
            Parameter[] parameters = method.getParameters();
            for (int index = 0; index < parameterNames.length; index++) {
                String parameterName = parameterNames[index];
                Parameter parameter = parameters[index];

                // NOTE: Set PathVariable into RequestBody.
                if (parameter.isAnnotationPresent(PathVariable.class) && pathVariables.containsKey(parameterName)) {
                    try {
                        Field field = clazz.getDeclaredField(parameterName);
                        ReflectionUtils.makeAccessible(field);
                        Object o = ReflectionUtils.getField(field, object);
                        if (o == null) {
                            ReflectionUtils.setField(field, object, pathVariables.get(parameterName));
                        }
                    } catch (NoSuchFieldException ignored) {
                        // ignored
                    }
                }
            }
        }

        return object;
    }

    @Override
    public boolean supports(MethodParameter methodParameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        Method method = methodParameter.getMethod();
        if (method != null) {
            Parameter[] parameters = method.getParameters();
            for (Parameter parameter : parameters) {
                if (parameter.isAnnotationPresent(PathVariable.class)) {
                    return true;
                }
            }
        }
        return false;
    }
}
```

컨트롤러 핸들러 함수의 파라미터에 @PathVariable 이 존재한다면 처리하도록 `supports` 결과를 구현하였다. RequestBodyAdviceAdapter 자체가 RequestBody를 처리함으로 @PathVariable 파라미터가 존재하는지만 체크해도 무방해보인다. RequestBody가 오브젝트로 변환되고나서 주입을 시도하기 위해서 `afterBodyRead` 함수를 오버라이딩하여 구현하였는데 `HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE`로 PathVariable 값을 가져오고 파라미터 이름을 추론하기 위하여 `DefaultParameterNameDiscoverer`를 사용했는데 그 이유에는 `@PathVariable` 처럼 이름을 별도로 지정하지 않는 경우 `arg0` 과 같이 이름이 부여되기 때문에 기본적으로는 가져올 수 없다.

@RequestBody로 변환되어야하는 오브젝트 파라미터에 실제로 필드가 존재하는지에 대해서는 **리플렉션 API에 대해서 깊은 이해가 없는 관계로** 스프링 프레임워크에 포함되어있는 `ReflectionUtils` 클래스를 이용하였다. 자바에서 대부분의 오브젝트 필드에는 private 접근 제어자를 선언하므로 접근할 수 있도록 한 이후에 필드에 값이 없는 경우에 한해서만 PathVariable에 대한 값을 바인딩하였다. 결과적으로 아래의 이미지와 같이 요청 데이터에 아이디가 포함되지 않아도 PathVariable에 해당되는 **111** 값이 포함됨을 알 수 있다.

![](/images/posts/spring-boot-path-variable-with-request-body/01.png)

#### DefaultParameterNameDiscoverer

스프링 부트 3.2 부터는 `LocalVariableTableParameterNameDiscoverer`가 아닌 `StandardReflectionParameterNameDiscoverer`가 사용되므로 `-parameters` 컴파일 옵션을 활성해야한다. 스프링 부트 2.7.18 버전 기준의 `DefaultParameterNameDiscoverer`를 보면 아래와 같이 되어있음을 확인할 수 있다.

```java DefaultParameterNameDiscoverer
public class DefaultParameterNameDiscoverer extends PrioritizedParameterNameDiscoverer {
    public DefaultParameterNameDiscoverer() {
        if (KotlinDetector.isKotlinReflectPresent() && !NativeDetector.inNativeImage()) {
            this.addDiscoverer(new KotlinReflectionParameterNameDiscoverer());
        }

        this.addDiscoverer(new StandardReflectionParameterNameDiscoverer());
        this.addDiscoverer(new LocalVariableTableParameterNameDiscoverer());
    }
}
```
