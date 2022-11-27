---
title: 쿼츠 스케줄러
date: 2022-11-27
tags:
- Quartz
- ShedLock
---

> 예제 코드 : [kdevkr/spring-demo-quartz](https://github.com/kdevkr/spring-demo-quartz)

소프트웨어 엔지니어인 개발자는 반복적으로 정해진 시간에 수행되어야할 작업을 예약해두는 스케줄링 기능을 자주 사용하게 되는 편이다. 리눅스 서버에서는 배시 스크립트를 작성하여 크론탭(crontab)에 등록하여 실행될 수 있도록 하며 시스템을 구성하는 애플리케이션에는 스케줄링 기능을 활용해서 애플리케이션에서 필요한 반복적인 작업을 수행하도록 구현하게 된다. 쿼츠 스케줄러는 스프링 부트 애플리케이션에서 쉽게 사용할 수 있도록 지원하는 라이브러리이므로 반복적인 작업을 수행하기 위한 스케줄 기능을 적용할 수 있다.

#### 인메모리 독립 스케줄러
QuartzAutoConfiguration에 의해 자동으로 SchedulerFactoryBean가 등록되고 RAMJobStore가 기본값이기에 별다른 설정없이도 쿼츠 스케줄러를 사용할 수 있다.

```yaml
spring:
  quartz:
    scheduler-name: QuartzScheduler
    job-store-type: memory
    properties:
      org.quartz.scheduler.instanceName: QuartzScheduler
      org.quartz.scheduler.instanceId: AUTO

      org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
      org.quartz.threadPool.threadCount: 100
      
      org.quartz.jobStore.class: org.quartz.simpl.RAMJobStore
```

#### JDBC 분산 스케줄러
실무에서 쿼츠 스케줄러를 사용하고 있지만 쿼츠 팀에서 제공하는 JDBC 기반의 클러스터링 기능을 사용하고 있지는 않다. 비슷하게 스케줄 상태에 대해서 데이터베이스 락을 이용하여 분산 애플리케이션에서 스케줄이 중복하여 실행되지 않도록 구현된 상태이다. 아무튼 이 글에서는 쿼츠에서 제공하는 JDBC 클러스터링으로 스케줄을 관리해보도록 하자.

[쿼츠 스케줄러용 데이터베이스 생성](https://github.com/quartz-scheduler/quartz/wiki/How-to-Setup-Databases#postgresql-database)
[쿼츠 스케줄러 데이터베이스 스키마 생성](https://github.com/quartz-scheduler/quartz/blob/master/quartz-core/src/main/resources/org/quartz/impl/jdbcjobstore/tables_postgres.sql)
[JDBC 기반 JobStoreTX 구성](http://www.quartz-scheduler.org/documentation/2.4.0-SNAPSHOT/configuration.html#configuration-of-jdbc-jobstoretx-store-jobs-and-triggers-in-a-database-via-jdbc)

```sql
CREATE USER quartz WITH ENCRYPTED PASSWORD 'quartz123' CONNECTION LIMIT 100;
CREATE DATABASE quartz OWNER quartz;
```

```sql
-- Run tables_postgres.sql
```

```yaml
spring:
  quartz:
    scheduler-name: QuartzScheduler
    job-store-type: jdbc
    properties:
      org.quartz.scheduler.instanceName: QuartzScheduler
      org.quartz.scheduler.instanceId: AUTO

      org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
      org.quartz.threadPool.threadCount: 100

      org.quartz.jobStore.class: org.quartz.impl.jdbcjobstore.JobStoreTX
      org.quartz.jobStore.driverDelegateClass: org.quartz.impl.jdbcjobstore.PostgreSQLDelegate
      org.quartz.jobStore.dataSource: quartzDS
      org.quartz.jobStore.isClustered: true
      org.quartz.jobStore.clusterCheckinInterval: 20000

      org.quartz.dataSource.quartzDS.provider: hikaricp
      org.quartz.dataSource.quartzDS.driver: org.postgresql.Driver
      org.quartz.dataSource.quartzDS.URL: jdbc:postgresql://localhost:5432/quartz
      org.quartz.dataSource.quartzDS.user: quartz
      org.quartz.dataSource.quartzDS.password: quartz123
      org.quartz.dataSource.quartzDS.maxConnections: 10
```

> org.quartz.dataSource.quartzDS.provider를 hikaricp로 지정하지 않으면 c3p0 커넥션 풀을 기본적으로 의존하므로 주의하자.

#### 스케줄 잡 및 트리거 등록
많은 블로그 글에서 쿼츠 스케줄러로 동작하는 스케줄 정보와 트리거를 등록하는 방법을 어렵게 설명하지만 생각보다 간단하다. 스케줄 잡을 구현할 때에 JobDetail과 Trigger를 함께 빈으로 등록할 수 있도록 아래와 같이 관리하면 편리하게 등록할 수 있다.

```java
package com.example.demo.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SampleJob extends QuartzJobBean {
    public static final String JOB_NAME = "SampleJob";
    public static final String JOB_DETAIL_NAME = JOB_NAME + "Detail";

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        log.info("{}, {}, {}", context.getTrigger().getKey().toString(), context.getJobInstance().toString(), context.getFireTime());
    }

    @Bean(JOB_DETAIL_NAME)
    public JobDetail jobDetail() {
        return JobBuilder.newJob().ofType(SampleJob.class)
                .storeDurably()
                .withIdentity("SampleJobDetail")
                .withDescription("Invoke Sample Job...")
                .build();
    }

    @Bean
    public Trigger simpleTrigger(@Qualifier(JOB_DETAIL_NAME) JobDetail job) {
        return TriggerBuilder.newTrigger().forJob(job)
                .withIdentity("SampleJobTrigger")
                .withDescription("Sample trigger with interval")
                .withSchedule(SimpleScheduleBuilder.simpleSchedule().repeatForever().withIntervalInSeconds(5))
                .build();
    }

    @Bean
    public Trigger cronTrigger(@Qualifier(JOB_DETAIL_NAME) JobDetail job) {
        return TriggerBuilder.newTrigger().forJob(job)
                .withIdentity("SampleJobTrigger")
                .withDescription("Sample trigger with cron")
                .withSchedule(CronScheduleBuilder.cronSchedule("* * * * * ?"))
                .build();
    }
}
```

#### 스프링 스케줄링 분산 동기화
쿼츠 스케줄러를 도입하는 이유는 스프링에서 제공하는 @Scheduled를 통한 스케줄링 기능은 클러스터링을 지원하지 않기 때문에 분산된 애플리케이션에서 독립적으로 실행되기 때문이다. 쿼츠 스케줄러와 동일하게 JDBC 기반으로 동기화를 수행할 수 있도록 [ShedLock](https://github.com/lukas-krecan/ShedLock) 라이브러리를 사용하면 동기화된 스케줄이 동작되도록 할 수 있다. 스프링에서 제공하는 스케줄링 기능은 애플리케이션마다 실행해도 상관없는 작업에 간단하게 적용하는 것이 좋다고 생각되므로 동기화된 스케줄이 필요한 경우라면 쿼츠 스케줄러를 사용하는게 좋다고 생각된다.

#### 참고
- [Quartz Configuration Reference](http://www.quartz-scheduler.org/documentation/2.4.0-SNAPSHOT/configuration.html)
- [Scheduling in Spring with Quartz](https://www.baeldung.com/spring-quartz-schedule)