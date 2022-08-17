---
title: 엘라스틱서치 업그레이드
date: 2022-08-17
tags:
- elasticsearch
- rolling upgrade
---

현재 조직의 기존 솔루션은 엘라스틱서치를 주 데이터베이스를 사용하고 있고 2015년에 릴리즈된 [엘라스틱서치 1.6.0](https://www.elastic.co/kr/blog/elasticsearch-1-6-0-released)을 기반으로 동작합니다. 저는 이 조직에서 기존 솔루션을 대체할 수 있는 신규 시스템을 개발하고 있으며 [엘라스틱서치 7.3.2](https://www.elastic.co/kr/blog/elastic-stack-7-3-0-released)를 기반으로 동작하고 있는데 엘라스틱서치는 많은 기업에서 필수적으로 사용하는 솔루션이지만 그동안 [많은 업데이트와 변화](https://www.elastic.co/kr/blog/moving-from-types-to-typeless-apis-in-elasticsearch-7-0)로 인하여 변경사항을 고려하여 프로젝트를 시작하던 당시에 최신 버전을 사용했을 것이라고 생각합니다.

> 신규 시스템을 개발하기 시작하던 시기에 저는 신입사원이었기에 왜 엘라스틱서치 7.3.2로 결정되었는지는 알 수 없습니다.

엘라스틱서치를 주로 사용하던 기존 솔루션과는 다르게 신규 시스템은 PostgreSQL를 관계형 데이터베이스와 함께  엘라스틱서치는 단순 로그 또는 시계열 데이터를 저장하기 위한 용도로 사용하고 있습니다. 다른 주요 기업들에서 구축하는 [ELK 스택](https://www.elastic.co/kr/what-is/elk-stack)이 아닌 엘라스틱서치를 단독으로 사용하고 있지만 기술적으로 굳이 Logstash 또는 Beats를 도입할 필요성은 없다고 생각됩니다.

## What's new in 7.x
개인적으로 시스템에서 사용중인 엘라스틱서치 7.3.2를 업그레이드할 필요성이 요구된다고 생각된 이유는 인덱스 매핑 관련 작업을 하다보니 엘라스틱서치 7.x에 대한 마이너 패치에 의해 추가된 기능과 성능 개선을 확인하였기 때문입니다.

- 7.6 : [Optimized sorting on long field types](https://www.elastic.co/guide/en/elasticsearch/reference/7.6/release-highlights-7.6.0.html#_optimized_sorting_on_long_field_types)
- 7.8 : [Composable index templates](https://www.elastic.co/guide/en/elasticsearch/reference/7.8/release-highlights.html#add-composable-index-templates)
- 7.10 : [Indexing speed improvement](https://www.elastic.co/kr/blog/save-space-and-money-with-improved-storage-efficiency-in-elasticsearch-7-10)
- 7.12 : [Elasticsearch and Kibana now support ARM](https://www.elastic.co/kr/blog/whats-new-elasticsearch-7-12-0-put-a-search-box-on-s3)

7.8 에서 추가된 인덱스 템플릿과 7.10 에서 인덱싱 성능 향상에 대한 패치가 이루어졌습니다. 심지어는 최근에 [AWS Graviton과 같은 ARM 아키텍처](/reason-for-replacing-ec2-instance-type/)를 비용 절감 목적으로 도입하므로 7.12 부터는 엘라스틱서치와 키바나가 ARM 아키텍처 기반의 빌드를 지원하기에 최소한 7.12.1로 업그레이드하는 것으로 결정합니다.

> 아쉽게도 Log4j2 취약점은 그대로 영향권에 있으므로 이에 대한 조치는 유지되어야합니다.

### 롤링 업그레이드
엘라스틱서치는 클러스터를 구성하는 각 노드에 대한 [롤링 업그레이드](https://www.elastic.co/guide/en/elasticsearch/reference/7.12/setup-upgrade.html)를 지원합니다. 엘라스틱서치 업그레이드 관련 글들을 찾아보니 대략적으로 아래와 같은 정보가 있습니다.

- [ElasticSearch 5.x에서 6.x로 업그레이드](https://brunch.co.kr/@alden/44)
- [Elastic Stack 롤링 업그레이드](http://kimjmin.net/2018/12/2018-12-elasticsearch-rolling-upgrade/)
- [Elastic Stack 7.0 업그레이드](https://videos.elastic.co/watch/itLLV1rwBjaWqZdpohQLd1?)

위 글들에서 엘라스틱서치 업그레이드 과정을 지켜보았다면 실제로 업그레이드를 수행할 때에는 공식 문서의 업그레이드 관련 부분을 참고해야합니다.

> 다행히도 메이저 버전을 업그레이드해야하는 상황은 아니었습니다.

#### 엘라스틱서치 7.12.1 다운로드
아마 대부분은 [패키지 매니저를 통해 서비스로 설치](https://www.elastic.co/guide/en/elasticsearch/reference/current/deb.html)하겠지만 조직에서 사용중인 엘라스틱서치는 압축 파일 형태로 된 번들로 되어있음을 확인하고 동일하게 압축 파일 형태의 7.12.1 버전을 다운로드 합니다.

```sh
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.12.1-linux-x86_64.tar.gz
wget https://artifacts.elastic.co/downloads/kibana/kibana-7.12.1-linux-x86_64.tar.gz
```

> 최신 버전이 아닌 릴리즈에 대해서는 [Past Releases](https://www.elastic.co/kr/downloads/past-releases#elasticsearch) 페이지에서 다운로드 할 수 있습니다.

#### config/elasticsearch.yml
기존 엘라스틱서치 7.3.2 에서 적용된 설정 정보를 그대로 유지해야 합니다.

```yml
cluster.name: cluster
node.name: node-1
path.data: /home/ec2-user/elasticsearch/data
path.logs: /home/ec2-user/elasticsearch/logs
bootstrap.memory_lock: true
network.host: 0.0.0.0
http.port: 9200
discovery.seed_hosts: ["127.0.0.1", "[::1]"]
cluster.initial_master_nodes: ["node-1"]
transport.profiles.default.port: 9300
xpack.security.enabled: false
```

#### config/jvm.options
메모리 설정 및 Log4j2 취약점에 대한 부분을 기존과 동일하게 설정합니다. 

```conf
-Xms5g
-Xmx5g
-Dlog4j2.formatMsgNoLookups=true
```

#### ES_JAVA_HOME
그리고 엘라스틱서치 버전에 맞는 JDK는 번들 파일에 포함되어있으므로 ES_JAVA_HOME 환경 변수를 지정합니다.

```shell
export ES_JAVA_HOME="/home/ec2-user/elasticsearch-7.12.1/jdk"
```

### 롤링 업그레이드 순서
단일 노드로 마스터와 데이터 노드를 모두 구성하는 단일 클러스터가 아니라면 클러스터를 구성하는 마스터와 데이터 노드를 하나씩 업그레이드 해야합니다. 결국 노드 단위로 아래의 동작을 반복해서 수행해야 한다는 의미입니다.

#### 샤드 할당 비활성화
```shell
curl -X PUT "localhost:9200/_cluster/settings?pretty" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.routing.allocation.enable": "primaries"
  }
}
'
```

#### 인덱싱 중지 및 동기 플러시
보다 빠른 샤드 복구를 위해서 인덱싱을 중지하고 동기화된 형태로 플러시하는게 좋다고 합니다.

```shell
curl -X POST "localhost:9200/_flush/synced?pretty"
```

#### 해당되지 않은 작업 생략
엘라스틱서치 플러그인 업그레이드 또는 머신러닝 작업에 대한 부분은 관련되지 않으므로 생략합니다.

#### 샤드 할당 활성화
엘라스틱서치를 다시 실행하고나서 샤드 할당 기능을 다시 활성화합니다. 

```shell
curl -X PUT "localhost:9200/_cluster/settings?pretty" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.routing.allocation.enable": null
  }
}
'
```

사실 엘라스틱서치를 단일 노드로 동작하는 클러스터로 구성하여 사용하고 있으므로 클러스터만 재시작하면 되었기에 어려운 작업은 아니었습니다. 시스템 규모가 커져서 고 가용성을 요구하는 경우에는 최소한 3개 이상의 노드로 클러스터를 구성하게 될 것이므로 여러 노드로 구성된 클러스터에 대해 업그레이드를 해보는 기회가 있기를 바랍니다. 

감사합니다.