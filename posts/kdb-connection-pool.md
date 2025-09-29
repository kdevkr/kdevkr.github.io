---
title: KDB Connection Pool
date: 2022-12-10
tags:
- TCP
- Connection Pool
---

> TCP 소켓이 연결된 상태로 남아있는 [TCP 커넥션 누수 문제](https://github.com/kdevkr/mambo-box/blob/main/errors/2022-12-08.md)를 경험하고나서 커넥션 풀 기능 구현에 대해서 다시한번 학습해보고 정리하는 글입니다.

아마도 관계형 데이터베이스와 자주 사용되는 일부 데이터베이스들에 대한 커넥션 풀 기능은 직접 구현하지 않아도 되는 경우가 많습니다. 시스템에서 사용중인 시계열 데이터베이스는 [자바 클라이언트 라이브러리](https://github.com/KxSystems/javakdb/blob/master/javakdb/src/main/java/com/kx/c.java)를 제공하고 있지만 시계열 데이터베이스가 단일 요청을 순차적으로 처리하는 싱글 스레드 방식임에 따라서 커넥션 풀 기능은 자체적으로 내장하고 있지 않습니다. 커넥션 풀 기능이 반드시 필요한 것은 아니지만 TCP 연결에 대한 부하를 생각한다면 자주 TCP 소켓을 연결하므로 발생할 수 있는 레이턴시를 및 자원 낭비를 무시할 수 없습니다.

#### 자바 커넥션 풀 라이브러리
자바 애플리케이션은 대부분 [Apache Commons Pool2](https://commons.apache.org/proper/commons-pool/) 라이브러리를 활용해서 커넥션 풀 기능을 구현하는 경우가 많습니다. 대표적으로 레디스 클라이언트로 많이 사용중인 [Lettuce의 커넥션 풀 지원](https://github.com/lettuce-io/lettuce-core/blob/main/src/main/java/io/lettuce/core/support/ConnectionPoolSupport.java)을 확인할 수 있으며 [Apache Commons DBCP2](https://commons.apache.org/proper/commons-dbcp/)라고 하는 관계형 데이터베이스에 대한 대표적인 커넥션 풀 라이브러리도 Commons Pool로 구현되어있음을 확인할 수 있습니다.

> Apache Commons Pool2에서는 [간단한 PooledObjectFactory 예제](https://commons.apache.org/proper/commons-pool/examples.html)를 제공하고 있지만 자세한 설명이 없습니다.

커넥션 풀 구현 예제를 검색해보면 생각보다 관련된 글이 없었기에 직접적으로 커넥션 풀 기능을 구현하는 개발자는 많지 않을 것이라 생각됩니다. 커넥션 오브젝트에 대한 라이프 사이클을 관리하는 것은 PooledObjectFactory 인터페이스가 담당하므로 원하는 커넥션 풀 동작을 BasePooledObjectFactory를 상속하여 구현하면 됩니다. 다만, 커네션 풀 구현 시 중요하게 생각해야할 부분은 BasePooledObjectFactory에서 기본적으로 구현해두어서 구현을 강제하지 않는 함수 중 커넥션 풀에서 관리하는 오브젝트가 삭제되는 대상이 되는 경우 호출되는 destoryObject 함수 동작을 생략해버릴 수 있다는 점 입니다.

#### CPooledObjectFactory
커넥션 풀 기능을 처음 구현했을 당시에 고려하지 못한 미흡한 점을 인지하고 KDB 프로세스에 대한 커넥션의 라이프 사이클을 관리하는 CPooledObjectFactory를 다시 작성해보았습니다. 


```java
public class CPooledObjectFactory extends BasePooledObjectFactory<c> {

    private final String host;
    private final int port;

    public CPooledObjectFactory(String host, int port) {
        this.host = host;
        this.port = port;
    }

    @Override
    public c create() throws Exception {
        return new c(host, port);
    }

    @Override
    public PooledObject<c> wrap(c c) {
        return new DefaultPooledObject<>(c);
    }

    @Override
    public boolean validateObject(PooledObject<c> p) {
        try {
            c c = p.getObject();
            if(c.s == null || !c.s.isConnected()) {
                return false;
            }
            c.k("1");
        } catch (c.KException | IOException e) {
            return false;
        }
        return true;
    }

    @Override
    public void destroyObject(PooledObject<c> p) throws Exception {
        close(p.getObject());
    }

    private void close(c c) {
        if (c != null) {
            try {
                c.close();
            } catch (IOException e) {
                // ignored
            }
        }
    }
}
```

더 자세하게 PooledObjectFactory 구현에 대해서 고민하고 싶은 분들이라면 아래의 오픈소스들을 참고해보시기 바랍니다.

- [RedisPooledObjectFactory](https://github.com/lettuce-io/lettuce-core/blob/main/src/main/java/io/lettuce/core/support/ConnectionPoolSupport.java#L201)
- [PoolableConnectionFactory](https://github.com/apache/commons-dbcp/blob/master/src/main/java/org/apache/commons/dbcp2/PoolableConnectionFactory.java)

#### CObjectPool
이제는 커넥션 오브젝트를 관리할 방식에 대해서 설정하는 것을 고민해보아야 합니다. Apache Commons Pool에서 커넥션 오브젝트 라이프사이클에 따라 어떻게 관리할지 결정하기 위해서는 GenericObjectPoolConfig를 사용해야 합니다.

```java
public class CObjectPoolConfig extends GenericObjectPoolConfig<c> {
    public CObjectPoolConfig() {
        this.setMaxTotal(8);
        this.setMaxIdle(5);
        this.setMinIdle(1);
        this.setMaxWait(Duration.ofMinutes(3));
        this.setTimeBetweenEvictionRuns(Duration.ofMinutes(5));
        this.setTestWhileIdle(true);
        this.setJmxEnabled(false);
    }
}
```

커넥션 풀 라이브러리에서 제공하는 기본값 중에서 JMX 모니터링 기능을 사용하지 않으므로 비활성화 해두었으며 유휴 상태로 관리중인 커넥션에 대해서도 미리 커넥션 상태를 확인할 수 있도록 TestWhileIdle 옵션을 활성화하였습니다. MaxWait의 경우 사용중인 각 커넥션이 최대로 소요할 수 있는 임계치에 따라 3분 까지 기다릴 수 있도록 해두었습니다. 

> By default, kdb+ is single-threaded, and processes incoming queries sequentially.

커넥션 라이프 사이클에 따라서 커넥션 풀에서 커넥션 오브젝트가 삭제되는 사유에는 대표적으로 두가지가 있는데요. 하나는 유휴 상태에 있는 커넥션이 벨리데이션 쿼리를 수행하는 과정에서 소켓 통신 오류가 발생하거나 너무 오랬동안 커넥션이 사용되지 않아서 버려지고 새로운 커넥션을 만들어서 풀을 유지하는 상황입니다. 위 문구 내용처럼 시계열 데이터베이스는 빠르게 요청을 처리하기 위해서 싱글 스레드 방식을 통해서 단일 요청을 순차적으로 처리하는게 기본적인 기술 관점입니다. 이는 레디스에서 동시성을 구현하기 위해서 채택한 방법이기도 하므로 단순히 싱글 스레드여서 문제가 있다고 바라보면 안됩니다. 

```shell
exec 0 ms (481900 ns)
```

시계열 데이터베이스가 아무리 빠르다고 해도 긴 범위의 시계열 데이터를 조회하고 연산을 한다거나 TCP 소켓을 통해 전달해야할 데이터가 상당히 많은 경우라면 싱글 스레드의 단점으로 인하여 선행 요청에 의해 후행 요청이 기다리는 시간으로 인해 병목 현상이 발생할 수 있다는 점을 고려해야합니다. 만약, 그러한 상황이 자주 발생한다면 빠른 성능을 위해 싱글 스레드를 채택한 시계열 데이터베이스를 활용하는 방법이 잘못된 것일 수 있습니다.

KDB 시계열 데이터베이스와 커넥션 풀 동작에 대해서 확인하고 싶다면 아래의 링크들을 참고하시기 바랍니다.

- [Learning KDB+](https://github.com/kdevkr/kdb)
- [Spring Demo KDB](https://github.com/kdevkr/spring-demo-kdb)