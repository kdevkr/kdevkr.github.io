---
title: 스프링 부트 액세스 로그를 엘라스틱서치에 기록하기
date: 2022-02-10
tags:
- Spring Boot
- Elasticsearch
- Access Log
---

안녕하세요 Mambo 입니다.

애플리케이션 서버로 요청되는 정보를 기록하는 [액세스 로그](https://d2.naver.com/helloworld/3585246)는 애플리케이션 운영과 장애 대응에 있어서 상당히 중요한 정보입니다. 아마존 웹 서비스에서도 [Amazon S3 서버 액세스 로깅 활성화](https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/enable-server-access-logging.html)처럼 액세스 로그를 기록할 수 있는 기능을 제공하죠. 스프링 부트는 **톰캣(Tomcat)** 이나 **언더토우(Undertow)** 와 같은 WAS에 대하여 액세스 로그를 파일로 저장할 수 있는 기능을 기본적으로 포함하고 있습니다.

만약, 언더토우를 사용하고 있다면 다음과 같이 액세스 로그를 활성화하고 패턴을 지정할 수 있습니다.

```properties
server.undertow.accesslog.enabled=true
server.undertow.accesslog.pattern=common
```

## 스프링 부트 로깅
스프링 부트는 기본적으로 Slf4j 기반의 [로그백(Logback)](https://logback.qos.ch/)을 로깅 프레임워크로 사용합니다. 그래서 애플리케이션의 로그를 엘라스틱서치에 기록하기 위해서는 [Logstash Logback Encoder](https://github.com/logfellow/logstash-logback-encoder)와 같이 로그백으로 기록되는 로그를 엘라스틱서치로 전달할 수 있게 구현해야합니다.

### Logback Elasticsearch Appender
[Logback Elasticsearch Appender](https://github.com/internetitem/logback-elasticsearch-appender)는 ELK 스택이 아니더라도 로그백으로 기록되는 로그를 엘라스틱서치로 전달하는 기능을 제공합니다. 오늘은 이것을 활용하여 스프링 부트 애플리케이션에서 발생하는 액세스 로그를 엘라스틱서치에 기록해보고자 합니다. 

![](/images/posts/spring-boot-accesslog-with-elasticsearch/logback-elasticsearch-appender-01.png)

그리고 위 처럼 [Logback Access](https://logback.qos.ch/access.html)에 대한 Appender를 포함하고 있으므로 액세스 로그를 쉽게 엘라스틱서치로 전달할 수 있게 됩니다.

### Logback Access Spring Boot Starter
[logback-access-spring-boot-starter](https://github.com/akkinoc/logback-access-spring-boot-starter)는 로그백 엑세스 설정에 대한 스프링 부트 스타터입니다. 언더토우까지 지원하므로 언더토우에 대해 로그백 엑세스 설정을 위한 [커스터마이저](https://gist.github.com/cdmatta/2a4536ab687bf7a92482faf031e8a0b5)를 직접 구현하지 않아도 됩니다.

### 따라하기
스프링 부트 프로젝트를 만들고 저는 언더토우를 선호하므로 톰캣 모듈을 제외하고 언더토우 스타터를 추가했습니다.

```groovy
configurations.all {
    exclude module: 'spring-boot-starter-tomcat'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-undertow'
    implementation 'com.internetitem:logback-elasticsearch-appender:1.6'
    implementation 'dev.akkinoc.spring.boot:logback-access-spring-boot-starter:3.2.1'
}
```

> 로그백 엑세스 스타터는 언더토우 뿐만 아니라 톰캣도 지원하므로 설정에 대한 차이는 없습니다.

그리고 다음과 같이 로그백 엑세스를 위한 설정 파일을 클래스패스에 추가합니다. 설정 파일을 불러오는 [우선순위](https://github.com/akkinoc/logback-access-spring-boot-starter#priority-order)에 따라 설정 파일명은 logback-access-spring.xml 이라고 생성하겠습니다.

**logback-access-spring.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProperty scope="context" name="elasticsearch_uris" source="spring.elasticsearch.uris" defaultValue="http://localhost:9200"/>
    <appender name="ELASTIC" class="com.internetitem.logback.elasticsearch.ElasticsearchAccessAppender">
        <url>${elasticsearch_uris}/_bulk</url>
        <index>application-accesslog-%date{yyyy-MM-dd}</index>
        <headers>
            <header>
                <name>Content-Type</name>
                <value>application/json</value>
            </header>
        </headers>
    </appender>
    <appender-ref ref="ELASTIC"/>
</configuration>
```

스프링 부트 애플리케이션을 실행하고 브라우저 또는 클라이언트 도구를 통해 액세스 기록을 남겨보고 엘라스틱서치에 잘 저장되는지 확인해봅니다.

![](/images/posts/spring-boot-accesslog-with-elasticsearch/elasticsearch-devtools-01.png)

인덱스는 생성되었지만 액세스 로그에 대한 정보가 없습니다. 액세스 로그 정보를 기록하기 위해서는 [Logback Access conversion words](https://logback.qos.ch/manual/layouts.html#logback-access)를 참고해서 프로퍼티를 설정해야합니다. 앞서 생성한 로그백 엑세스 설정 파일에 다음과 같이 프로퍼티 항목을 추가로 정의하겠습니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProperty scope="context" name="elasticsearch_uris" source="spring.elasticsearch.uris" defaultValue="http://localhost:9200"/>
    <appender name="ELASTIC" class="com.internetitem.logback.elasticsearch.ElasticsearchAccessAppender">
        <url>${elasticsearch_uris}/_bulk</url>
        <index>application-accesslog-%date{yyyy-MM-dd}</index>
        <properties>
            <property>
                <name>contentLength</name>
                <value>%b</value>
            </property>
            <property>
                <name>remoteHost</name>
                <value>%h</value>
            </property>
            <property>
                <name>protocol</name>
                <value>%H</value>
            </property>
            <property>
                <name>referer</name>
                <value>%i{Referer}</value>
            </property>
            <property>
                <name>userAgent</name>
                <value>%i{User-Agent}</value>
            </property>
            <property>
                <name>requestMethod</name>
                <value>%m</value>
            </property>
            <property>
                <name>statusCode</name>
                <value>%s</value>
            </property>
            <property>
                <name>elapsedTime</name>
                <value>%D</value>
            </property>
            <property>
                <name>date</name>
                <value>%t{yyyy-MM-dd'T'HH:mm:ss}</value>
            </property>
            <property>
                <name>user</name>
                <value>%u</value>
            </property>
            <property>
                <name>queryString</name>
                <value>%q</value>
            </property>
            <property>
                <name>requestURI</name>
                <value>%U</value>
            </property>
        </properties>
        <headers>
            <header>
                <name>Content-Type</name>
                <value>application/json</value>
            </header>
        </headers>
    </appender>
    <appender-ref ref="ELASTIC"/>
</configuration>
```

> 미리 정의된 패턴인 combined를 참고하여 리퍼러와 유저 에이전트 헤더를 포함하도록 프로퍼티를 설정했습니다.

![](/images/posts/spring-boot-accesslog-with-elasticsearch/elasticsearch-devtools-02.png)

위 처럼 프로퍼티를 설정하였으므로 요청된 액세스에 대한 로그를 통해 유저 에이전트가 포스트맨이며 요청된 경로는 액추에이터인 것을 확인할 수 있게 되었습니다. 따라하시는 여러분은 다양한 항목에 대해서도 기록해보시면 좋을 것 같습니다.

#### 액세스 로그 인덱스 템플릿
생성된 액세스 로그에 대한 인덱스 매핑 정보를 조회하면 동적 매핑에 의해서 엘라스틱서치가 필드 유형을 임의대로 지정한 것을 확인할 수 있습니다. 동적 매핑은 저장되는 도큐먼트의 필드 정보를 알기 어려울 때는 편리한 기능이지만 지금처럼 액세스 로그에 저장되는 필드가 고정되어있고 필드 유형을 파악할 수 있다면 정적 매핑을 정의해두는 것이 좋습니다.

![](/images/posts/spring-boot-accesslog-with-elasticsearch/elasticsearch-devtools-03.png)

액세스 로그에 기록되는 정보가 명확하므로 동적 매핑을 수행하지 않고 미리 정의된 매핑을 사용하도록 인덱스 템플릿을 정의해두겠습니다. 

```json
{
  "index_patterns": [
    "applicaiton-accesslog-*"
  ],
  "template": {
    "settings": {
      "analysis": {
        "analyzer": {
          "path_analyzer": {
            "tokenizer": "path_hierarchy"
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "contentLength": {
          "type": "long"
        },
        "date": {
          "type": "date",
          "format": "date_hour_minute_second || epoch_millis"
        },
        "elapsedTime": {
          "type": "integer"
        },
        "protocol": {
          "type": "keyword"
        },
        "referer": {
          "type": "keyword"
        },
        "remoteHost": {
          "type": "ip"
        },
        "requestMethod": {
          "type": "keyword"
        },
        "requestURI": {
          "type": "text",
          "analyzer": "path_analyzer"
        },
        "statusCode": {
          "type": "short"
        },
        "user": {
          "type": "keyword"
        },
        "userAgent": {
          "type": "keyword"
        }
      }
    }
  }
}
```

> 현재 조직에서는 엘라스틱서치에 애플리케이션의 로그 및 액세스 로그를 기록하지는 않고 있습니다만, 엘라스틱서치를 학습하기 위한 샘플 데이터가 없어서 간단하게나마 액세스 로그를 기록해보면 어떠할까 생각해서 시도해보았습니다. 현재 대량의 [랜덤 액세스 로그](https://github.com/kdevkr/elasticsearch/blob/main/sample/access.q)를 만들기 위해서 컬럼형 시계열 데이터베이스인 KDB를 활용해보고는 있습니다만 쉽지는 않네요. 이 부분에 대해서는 많이 시도해보고 정리하여 공유해보겠습니다.

감사합니다.