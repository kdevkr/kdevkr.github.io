---
title: 엘라스틱서치 인덱스
date: 2022-08-21
---

현재 조직의 주요 솔루션은 엘라스틱서치 1.6을 기반으로 동작하며 여러개의 노드로 구성되는 엘라스틱서치 클러스터로 운용하고 있습니다. 그러나, 제가 담당하여 개발중인 신규 시스템은 시계열 데이터를 저장하기 위한 시계열 데이터베이스를 사용중이므로 엘라스틱서치에 시계열 데이터와 같은 대규모 데이터 및 안전하게 운용되어야하는 가용성이 요구되지 않으므로 단일 노드 클러스터로 사용하고 있습니다.

싱글 노드 클러스터로 운용되는 엘라스틱서치에는 시스템에서 발생하는 특정 정보에 대한 로그 데이터를 개별 단일 인덱스에 저장하고 있으며 엘라스틱서치로부터 정해진 인덱스에 저장되는 도큐먼트를 조회하기 때문에 엘라스틱서치가 지원하는 여러가지 쿼리를 활용할 경험은 많지 않은 것은 아쉬운 부분이긴 합니다.

> 시계열 데이터는 엘라스틱서치가 아닌 별도의 [시계열 데이터베이스](https://kx.com/developers/)에 저장하고 통계 정보를 쿼리하고 있습니다.

## 인덱스 관련 트러블슈팅
대규모 노드로 구성된 엘라스틱서치 클러스터를 운용하지 않더라도 인덱스와 관련된 여러가지 문제들을 간간히 경험해보긴 했습니다. 오히려 엘라스틱서치가 고 가용성으로 운영되지 않아서 발생하는 문제로 봐야할 것 같습니다. 

### 동적 매핑 필드 제한
조직의 기존 솔루션이 엘라스틱서치를 주요 데이터베이스로 활용했더라도 주 개발자들이 현재 개발중인 시스템에 참여한 것은 아니고 저는 조직의 신입일 때 참여했으므로 엘라스틱서치에 대해 대략적인 개념조차 모르던 시기였습니다. 시스템의 요구 사항과 설계가 명확하지 않았기에 엘라스틱서치에서 기본적으로 제공하는 [동적 필드 매핑](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#mapping-dynamic)을 통해 개발자가 별도로 관리하지 않아도 도큐먼트에 대한 각 필드들을 자동으로 매핑하는 상태로 시스템에서 발생하는 일부 정보의 변화들을 로그로 저장하였습니다.

> limit of total fields 1000 has been exceeded

위 문제는 동적 필드 매핑으로 만들어지는 인덱스에 여러가지 필드가 저장되어질때 확인할 수 있는 오류입니다. 엘라스틱서치에 저장되도록한 로그 중에서 다양하게 필드가 변경될 수 있는 메타데이터 오브젝트가 포함되었고 점점 다양한 키 값이 추가되면서 엘라스틱서치는 동적 매핑에 의해 메타데이터 키에 대한 필드 매핑을 추가하여 매핑 정보가 점차 늘어나서 제한량까지 넘어서게 되는 상황이 발생한 것 입니다.

이 문제에 대해서는 임시적으로 [인덱스에 대해 필드 제한 수를 조정](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#mapping-limit-settings)하여 조치할 수 있으나 메타데이터 오브젝트가 다양하게 추가되면 다시 발생할 수 있으므로 근본적인 해결책은 아닙니다. 그래서 해당 현상이 발견되는 인덱스에 대해서는 동적 매핑에 의해 추가된 매핑 정보를 확인하여 계속해서 매핑 정보가 만들어질 수 있는 필드를 [단순히 저장만하도록](https://www.elastic.co/guide/en/elasticsearch/reference/current/enabled.html) 매핑 정보를 부여하고 재 인덱스를 수행해야만 했습니다.

### 도큐먼트 삭제
단일 노드의 엘라스틱서치 클러스터이므로 단일 인덱스에 너무 많은 도큐먼트가 저장되면 성능에 문제가 될 수 있습니다. 심지어는 엘라스틱서치 7부터 인덱스에 대한 프라이머리 샤드의 기본값이 1 이었던 부분으로 인하여 인덱스의 하나의 샤드가 너무 많은 도큐먼트를 저장하고 있는 구조가 되어버렸습니다.

특정 인덱스에 저장되는 도큐먼트가 너무 많아졌고 심지어는 오래된 도큐먼트가 불필요하게 남아있었기에 일정 기간이 지난 도큐먼트는 지우도록 [_delete_by_query](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete-by-query.html)를 사용해서 스케줄에 의해 엘라스틱서치 클러스터에 지우도록 요청해두었습니다. 그러나, [Elasticsearch의 색인 별명 활용 팁](https://ridicorp.com/story/index-aliases/)에 나와있는 것처럼 엘라스틱서치 클러스터에서는 도큐먼트를 실제로 삭제하는 것은 아닌 부분으로 인하여 오히려 엘라스틱서치 클러스터의 인덱스의 용량이 일시적으로 늘어나게 되는 문제를 가져가게 됩니다. 

> 디스크 볼륨을 증설할 수 있다고 해도 서버 용량에 민감할 수 밖에 없습니다.

### 일자별 인덱스 조회
도큐먼트 삭제가 용이하지 않은 단일 인덱스의 문제를 해소하기 위해서 특정 로그에 대해서는 일자별로 저장되도록 적용해야했습니다. 단일 인덱스로 저장하던걸 일자별로 저장하는 것은 인덱스 명에 저장되는 시점의 날짜 포맷(yyyyMMdd)을 추가하면 되기에 어려움은 없었습니다. 해당 작업에 대해 검토하던 중 인덱스에 대한 조회 기능에 일부 사이드 이펙트가 발생할 수 있음을 확인하였습니다.

[Search API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)에 대해서는 인덱스 패턴에 대해서 조회할 수 있도록 지원합니다만, 특정 도큐먼트에 대한 아이디를 기준으로 [Get API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html#docs-get-api-request)를 사용하기 위해서는 인덱스 명을 알아야만 합니다. 심지어는 여러개의 인덱스에 대해서 조회할 수 있는 [Mget API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-multi-get.html)도 조회하고자 하는 인덱스들의 이름을 나열해야했기에 인덱스 패턴에 대해 인덱스 목록을 조회하고 여러개의 인덱스에 걸쳐 병렬 조회할 수 있도록 아래와 같이 변경해야 했습니다.

```java
// NOTE: 인덱스 패턴에 의한 실제 인덱스 목록 조회
GetIndexRequest getIndexRequest = new GetIndexRequest("oauth_log*");
GetIndexResponse getIndexResponse = highLevelClient.indices().get(getIndexRequest, RequestOptions.DEFAULT);
String[] indices = getIndexResponse.getIndices();

// NOTE: 여러개의 인덱스에 걸쳐 병렬 조회
MultiGetRequest multiGetRequest = new MultiGetRequest();
for (String index : indices) {
    multiGetRequest.add(index, "c70e49fa-d0f4-4278-a271-a46f688349f6");
}

MultiGetResponse multiGetResponse = highLevelClient.mget(multiGetRequest, RequestOptions.DEFAULT);
MultiGetItemResponse[] responses = multiGetResponse.getResponses();
for (MultiGetItemResponse response : responses) {
    if (!response.isFailed() && response.getResponse().isExists()) {
        String index = response.getIndex();
        String id = response.getId();

        log.info("{} in {}, {}", id, index, response.getResponse().getSource());
    }
}
```
> 일자별 인덱스에 있는 도큐먼트의 아이디가 충돌하지 않는다는 것을 보장할 때를 기준으로 합니다.

최근 인덱스와 관련된 작업을 하고 있어서 여태까지 경험했던 문제에 대해서 작성해보았습니다. 인덱스 관리와 관련해서 사용중이던 엘라스틱서치 버전을 7.3.2에서 7.12.1로 변경하는 작업을 진행하고 있으며 이와 더불어 엘라스틱서치와 함께 키바나를 활용해서 더 효율적으로 인덱스를 관리할 수 있는 방안에 대해서 공부해보고 있습니다.

감사합니다.
