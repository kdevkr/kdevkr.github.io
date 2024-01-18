---
title: 스프링 데이터소스
date: 2024-01-19T07:00+0900
tags:
- DataSourceBuilder
- DataSourceProperties
- AbstractRoutingDataSource
- TransactionSynchronizationManager
- LazyConnectionDataSourceProxy
---

소규모 시스템에서는 단일 데이터베이스에 의존하지만 조금씩 커지는 시스템에서는 데이터베이스 클러스터에 접근하거나 다수의 데이터베이스에 연결되는 것 같다. 본 글에서는 다중 데이터베이스 연결을 위한 데이터 소스를 어떻게 관리하는지를 다루어보고자 한다. 아래의 영상에서 스프링 개발자 Josh Long 이 데이터소스를 어떻게 다룰 수 있는지에 대해서 다양하게 설명하고 있다.

<iframe width="520" height="310" src="https://www.youtube.com/embed/rt_cUtb8LnQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

#### DataSourceBuilder

스프링 부트에서는 애플리케이션 프로퍼티 파일에 `spring.datasource` 로 시작하는 속성으로 데이터베이스 연결에 대한 정보를 설정하고 자동 구성을 제공한다. 직접 데이터소스를 생성하거나 다중 데이터베이스에 연결하기 위해서 서로 다른 데이터베이스 연결 정보를 가지는 데이터소스를 사용하고자 하는 경우에 `DataSourceBuilder` 와 `DataSourceProperties` 를 사용해볼 수 있다.

> 스프링 프레임워크에서 기본적으로 사용되는 커넥션 풀 라이브러리는 HikariCP 입니다.

#### AbstractRoutingDataSource

위 영상에서는 멀티-테넌시 구성으로 서로 다른 리전을 구성한다면 스레드 로컬 변수에 리전 정보를 관리하고 리전에 따른 데이터베이스에 연결하는 예시를 보여주고 있다. 데이터베이스 클러스터로 고가용성의 HA를 구성하는 인프라의 경우에는 AbstractRoutingDataSource 를 활용하여 쓰기 전용 클러스터 엔드포인트와 읽기 전용 엔드포인트를 나누어서 처리할 수 있는 라우터 방식의 데이터소스를 생성할 수 있다. 

```java
@AllArgsConstructor
@Configuration
public class DatabaseConfiguration {

    private final DataSourceProperties dataSourceProperties;

    @ConfigurationProperties(prefix = "spring.datasource")
    @Bean("writer")
    public DataSource writerDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean("reader")
    public DataSource readerDataSource() {
        return DataSourceBuilder.create()
                .type(dataSourceProperties.getType())
                .url(dataSourceProperties.determineUrl())
                .username(dataSourceProperties.determineUsername())
                .password(dataSourceProperties.determinePassword())
                .driverClassName(dataSourceProperties.determineDriverClassName())
                .build();
    }

    @Primary
    @Bean
    public DataSource dataSourceRouter() {
        ClusterDataSourceRouter dataSourceRouter = new ClusterDataSourceRouter();
        dataSourceRouter.setTargetDataSources(Map.of(ClusterType.WRITER, writerDataSource()
                , ClusterType.READER, readerDataSource()));
        dataSourceRouter.setDefaultTargetDataSource(writerDataSource());
        return dataSourceRouter;
    }

    public enum ClusterType {
        WRITER, READER
    }

    public static class ClusterDataSourceRouter extends AbstractRoutingDataSource {
        @Override
        protected Object determineCurrentLookupKey() {
            boolean readOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
            if (readOnly) {
                return ClusterType.READER;
            }
            return ClusterType.WRITER;
        }
    }
}
```

> 대부분 TransactionSynchronizationManager의 트랜잭션 읽기 속성에 따라 읽기 전용 엔드포인트에 연결되도록 예제를 공유하는 것 같네요.

#### LazyConnectionDataSourceProxy

스프링의 트랜잭션 처리는 @Transactional 에 진입하는 과정에서 커넥션 연결을 수행하므로 다중 데이터소스에 대한 구성에서는 LazyConnectionDataSourceProxy를 사용하여 커넥션 획득 시점을 늦추는 것이 일반적이다.

```java
@Primary
@Bean
public DataSource dataSourceRouter() {
    ClusterDataSourceRouter dataSourceRouter = new ClusterDataSourceRouter();
    dataSourceRouter.setTargetDataSources(Map.of(ClusterType.WRITER, writerDataSource()
            , ClusterType.READER, readerDataSource()));
    dataSourceRouter.setDefaultTargetDataSource(writerDataSource());
    return new LazyConnectionDataSourceProxy(dataSourceRouter);
}
```

> 반드시 커넥션 획득 시점을 늦추는 것이 좋은 방법은 아닐 것이기에 개발자가 시스템 환경에 대한 분석과 판단이 필요합니다.

