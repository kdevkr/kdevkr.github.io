---
title: XML로 다국어 메시지 관리하기
date: 2019-01-26
---

> 본 글은 [스프링 벨리데이션 이야기](/spring-validation)를 작성하면서 보완되었습니다.

## 다국어 메시지
스프링이나 스프링 부트에서 다국어 메시지를 적용하기 위해서는 Properties를 기본으로 사용해야합니다. 그러나, messages-en.properties 또는 messages-ko.properties와 같이 언어별로 프로퍼티 파일을 구분하여 메시지를 관리해야만 합니다. 이처럼 프로퍼티 파일로 메시지를 관리하다보면 해당 언어에서 특정 메시지를 키를 사용했는지 파악하는게 상당히 어렵습니다. 현재 조직처럼 회사 내 프로젝트를 진행할 때 메시지 키에 대해 정의된 문서가 없는 경우에는 개발자가 메시지 코드를 관리해야하므로 매번 검색해서 사용하고 있는지 파악해야만 합니다.

### 대안 방식
프로퍼티 파일로 다국어 메시지를 관리하는 것을 보완하기 위한 방법은 다양합니다.

#### YAML
애플리케이션 프로퍼티 파일을 야믈(Yaml) 파일로 대체하는 것처럼 YAML 파일을 사용해서 다국어 메시지를 관리하는 방법은 [기억하기 위한 개발노트:스프링부트에서 다국어 기능 사용하기](https://jmlim.github.io/spring/2018/11/28/spring-boot-Internationalization/)를 통해 확인할 수 있습니다. 그러나 이 방식은 파일만 대체할 뿐 메시지를 관리하기 위한 YAML 파일은 언어별로 만들어야함으로 프로퍼티의 문제점을 동일하게 가지고 있습니다.

> ISO-8859-1 인코딩 형식으로 저장되는 프로퍼티와는 다르게 한글이 유니코드로 표시되지 않는다는 장점은 존재합니다.

#### XML
현재 조직에서는 프로젝트에서 사용하는 다국어 메시지를 XML 파일로 구성하여 관리하고 있습니다. 다음은 다국어 메시지를 관리하기 위한 XML 파일의 간단한 예시입니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>

<messages>
    <entry key="btn.signIn">
        <ko_KR><![CDATA[로그인]]></ko_KR>
        <en_US><![CDATA[Login]]></en_US>
    </entry>
</messages>
```

### 커스텀 리소스 번들
프로퍼티 파일 대신에 XML로 메시지 소스를 만들기 위해서는 리소스 번들부터 만들어야합니다. ResourceBundle 클래스의 getBundle 함수를 사용해서 XML 파일을 읽어 리소스 번들로 변환할 수 있습니다. 리소스 번들로 메시지 소스를 만드는 구조는 [XML 기반의 Resource Bundle, PropertyPlaceHolder 사용하기](https://firstboos.tistory.com/entry/XML-%EA%B8%B0%EB%B0%98%EC%9D%98-Resource-Bundle-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)에서 확인할 수 있습니다.

#### XmlResourceBundle
그러나 앞서 알아본 다국어 메시지에 대한 XML 파일은 프로퍼티 구조를 따르지 않습니다. 그래서 **Properties.loadFromXML** 함수를 통해 XML을 프로퍼티 기준으로 읽으면 안됩니다. 다음처럼 XML 구성에 따라서 메시지 정보를 만들어야합니다.

```java
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

public class XmlResourceBundle extends ResourceBundle {

    private Map<String, Map<String, String>> messages;
    private Locale i18n;

    public XmlResourceBundle(InputStream is, Locale i18n) throws IOException, ParserConfigurationException, SAXException {
        try (is) {
            this.i18n = i18n;
            messages = new HashMap<>();

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(is);
            doc.getDocumentElement().normalize();

            NodeList entries = doc.getElementsByTagName("entry");

            for (int i = 0; i < entries.getLength(); i++) {
                Element entry = (Element) entries.item(i);
                String key = entry.getAttribute("key");
                NodeList childNodes = entry.getChildNodes();
                for (int j = 0; j < childNodes.getLength(); j++) {
                    Node n = childNodes.item(j);
                    if (n.getNodeType() == Node.ELEMENT_NODE) {
                        String locale = n.getNodeName();
                        String message = n.getTextContent();

                        if (!messages.containsKey(locale)) {
                            messages.put(locale, new HashMap<>());
                        }

                        messages.get(locale).put(key, message);
                    }
                }
            }
        }
    }

    @Override
    protected Object handleGetObject(String key) {
        return messages.get(i18n).get(key);
    }

    @Override
    public Enumeration<String> getKeys() {
        Set<String> handleKeys = messages.keySet();
        return Collections.enumeration(handleKeys);
    }

    public void setLocale(Locale locale) {
        this.i18n = locale;
    }

    public Map<String, Map<String, String>> getMessages() {
        return messages;
    }

    public Map<String, String> getMessages(Locale locale) {
        return messages.get(locale.toString());
    }
}
```

> 기존의 handleGetObject 함수는 키 파라미터만 받도록 되어있기 때문에 메시지를 가져올 경우에 언어를 지정할 수 없으므로 리소스 번들을 생성하는 시점에 언어를 지정할 수 있게 하였습니다.

#### XmlResourceBundleLoader
XmlResourceBundle를 로드하기 위한 클래스를 만들기 위해서 [The Strings.xml Resource Bundle](http://www.java2s.com/Tutorial/Java/0220__I18N/XMLresourcebundle.htm)을 참고하여 코드를 작성합니다.

```java
import lombok.extern.slf4j.Slf4j;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;

@Slf4j
public class XmlResourceBundleLoader extends ResourceBundle.Control {

    private static final List<String> formats = Collections.singletonList("xml");

    @Override
    public List<String> getFormats(String baseName) {
        return formats;
    }

    @Override
    public ResourceBundle newBundle(String baseName, Locale locale, String format, ClassLoader loader, boolean reload) throws IllegalAccessException, InstantiationException, IOException {
        ResourceBundle resourceBundle = null;

        String bundleName = toBundleName(baseName, locale);
        String resourceName = toResourceName(bundleName, format);

        URL url = loader.getResource(resourceName);
        if (url == null) {
            return null;
        }

        URLConnection connection = url.openConnection();
        if (connection == null) {
            return null;
        }
        if (reload) {
            connection.setUseCaches(false);
        }
        InputStream stream = connection.getInputStream();
        if (stream == null) {
            return null;
        }
        try (BufferedInputStream bis = new BufferedInputStream(stream)) {
            if (locale == Locale.ROOT) {
                locale = Locale.getDefault();
            }
            resourceBundle = new XmlResourceBundle(bis, locale);
        } catch (SAXException | ParserConfigurationException e) {
            log.error(e.getMessage());
        }

        return resourceBundle;
    }
}
```

### 메시지 소스
준비된 리소스 번들을 사용하기 위해서 메시지 소스로 변환해야합니다. 사용자 정의 메시지 소스를 만들기 위해서는 **AbstractMessageSource**를 상속하면 됩니다.

```java
package com.example.springboot.i18n;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.AbstractMessageSource;
import org.springframework.stereotype.Component;

import java.text.MessageFormat;
import java.util.*;

@Slf4j
@Component
public class CustomMessageSource extends AbstractMessageSource {

    private final Map<String, Map<String, MessageFormat>> formats = new HashMap<>();
    private Map<String, Map<String, String>> messages = new HashMap<>();

    @Autowired
    public CustomMessageSource() {
        try {
            load();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void load() {
        ResourceBundle resourceBundle = ResourceBundle.getBundle("messages", Locale.ROOT, new XmlResourceBundleLoader());

        XmlResourceBundle xmlResourceBundle = (XmlResourceBundle) resourceBundle;
        this.messages = xmlResourceBundle.getMessages();
    }

    // 메시지 소스에서 지원하는 언어 목록
    public List<String> getLocales() {
        return new ArrayList<>(messages.keySet());
    }

    @Override
    protected MessageFormat resolveCode(String code, Locale locale) {
        synchronized (formats) {
            // 언어 포맷이 없을 경우 메시지 포맷을 새로 생성
            if (!formats.containsKey(locale.toString())) {
                formats.put(locale.toString(), new HashMap<>());
            }

            Map<String, MessageFormat> map = formats.get(locale.toString());

            // 언어 포맷에 메시지 코드가 없으면 메시지 정보를 통해 포맷을 저장
            if (!map.containsKey(code)) {
                if (!messages.containsKey(locale.toString())) {
                    locale = Locale.getDefault();
                }
                Map<String, String> msgs = messages.get(locale.toString());
                map.put(code, new MessageFormat(msgs.getOrDefault(code, code), locale));
            }
            return map.get(code);
        }
    }

    public String getMessage(String code) {
        try {
            return getMessage(code, new Object[0], LocaleContextHolder.getLocale());
        } catch (NoSuchMessageException e) {
            return code;
        }
    }

    public String getMessage(String code, Object[] args) {
        try {
            return getMessage(code, args, LocaleContextHolder.getLocale());
        } catch (NoSuchMessageException e) {
            return code;
        }
    }

    public String getMessage(String code, Object[] args, String defaultMessage) {
        try {
            return getMessage(code, args, defaultMessage, LocaleContextHolder.getLocale());
        } catch (NoSuchMessageException e) {
            return code;
        }
    }

    public String getMessage(String code, Locale locale) {
        try {
            return getMessage(code, new Object[0], locale);
        } catch (NoSuchMessageException e) {
            return code;
        }
    }
}
```

#### 메시지 소스 갱신
로컬 환경에서 애플리케이션을 개발하는 동안에는 메시지 소스 정보가 계속 변경되어야하는 요구사항이 있습니다. 스프링 부트를 사용하고 있다면 **spring-boot-devtool**을 사용해서 애플리케이션이 다시 실행할 수 있게 변경할 수 있습니다. 그러나, 메시지 정보가 변경되는 것이 애플리케이션 자체에 특별한 영향을 미치지는 않습니다. 애플리케이션을 다시 실행하지 않고 변경된 메시지 정보를 반영할 수 있도록 하는 것이 좋습니다.

> 우리가 구현해야할 동작은 ReloadableResourceBundleMessageSource가 변경된 프로퍼티 파일을 다시 로드하는 것과 비슷합니다.

```java
@Repository
public class CustomMessageSource extends AbstractMessageSource {

    @Autowired
    public CustomMessageSource(Environment environment) {
        instance = this;
        try {
            load();
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!ArrayUtils.contains(environment.getActiveProfiles(), "production")) {
            reload();
        }
    }

    public void reload() {
        new Thread(() -> {
            try {
                File file = new ClassPathResource("messages.xml").getFile();
                long lastModified = -1;
                while (true) {
                    try {
                        if (lastModified < file.lastModified()) {
                            load();
                            log.info("Reload MessageSource - {}", System.currentTimeMillis());
                            lastModified = file.lastModified();
                        }
                    } catch (Exception e) {
                        log.error(e.getMessage());
                    }
                    Thread.sleep(5000);
                }

            } catch (Exception e) {
                log.error(e.getMessage());
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
            }
        }).start();
    }
}
```

> 위 처럼 파일 수정일을 비교하지 않아도 [자바 7의 WatchService를 활용](https://www.baeldung.com/java-nio2-watchservice)해도 파일을 감시할 수 있습니다.

## 참고

-   [Installing a Custom Resource Bundle as an Extension](https://docs.oracle.com/javase/tutorial/i18n/serviceproviders/resourcebundlecontrolprovider.html)
-   [XML resource bundle](http://www.java2s.com/Tutorial/Java/0220__I18N/XMLresourcebundle.htm)
-   [XML 기반의 Resource Bundle, PropertyPlaceHolder 사용하기](https://firstboos.tistory.com/entry/XML-%EA%B8%B0%EB%B0%98%EC%9D%98-Resource-Bundle-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)
-   [\[자바\] XML 파싱 예제 - DocumentBuilder](http://www.fun25.co.kr/blog/java-xml-parser-example-documentbuilder)
