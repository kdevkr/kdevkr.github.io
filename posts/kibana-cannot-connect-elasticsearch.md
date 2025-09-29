---
title: 키바나에서 엘라스틱서치 클러스터로 연결할 수 없음
date: 2022-08-18
tags:
- Basic License
---

![](/images/posts/kibana-cannot-connect-elasticsearch/01.png)

AWS EC2 인스턴스에 설치된 엘라스틱서치에 대해 키바나를 설치하고 실행하니 위와 같이 엘라스틱서치 클러스터에 연결할 수 없다는 화면이 노출되었습니다. 회사에서 이 문제에 대해 머리를 싸매면서 여러가지를 시도해보았으나 해결되지 않았고 집에와서 쉬는 김에 이와 관련된 정보를 검색해보면서 여러가지 확인 끝에 원인을 찾아내어 이 글을 작성합니다.

## 키바나 응답 페이로드

> This Kibana installation has strict security requirements enabled that your current browser does not meet.

먼저, 웹 페이지 화면에서는 엘라스틱서치 클러스터에 연결할 수 없다는 내용의 메시지였지만 실제로 키바나로부터 받은 응답 페이로드를 확인해보니 [Content Security Policy](https://www.elastic.co/guide/en/kibana/current/Security-production-considerations.html#csp-strict-mode) 관련된 오류 내용이었습니다. 그리고 크롬 개발자 도구 콘솔에는 아래와 같은 오류 로그도 표시됨을 확인했습니다.

```shell
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'unsafe-eval' 'nonce-LQ+1u6/j7+lb3KNy'".
Either the 'unsafe-inline' keyword, a hash ('sha256-SHHSeLc0bp6xt4BoVVyUy+3IbVqp3ujLaR+s+kSP5UI='), or a nonce ('nonce-...') is required to enable inline execution.  
```

### CSP 비활성화 시도

```yaml
csp.strict: false
```

엘라스틱서치 클러스터에 연결할 수 없는 사유인지 다른 문제인지를 판단할 수 없어서 CSP를 비활성화 해보았습니다. 그러나, CSP 비활성화 후에도 키바나에서는 동일하게 엘라스틱서치 클러스터에 연결할 수 없다고 표시되었기에 이로 인한 문제는 아님을 확인할 수 있었습니다.

## 키바나 로그
사실 키바나에서 엘라스틱서치 클러스터에 연결할 수 없다는 메시지를 보고나서는 엘라스틱서치와 키바나의 설정 파일의 문제가 아닐까 여러가지 살펴보았지만 다른 환경에서 사용중인 설정과 다를바가 없었기에 키바나 로그를 확인해야 했습니다.

### Chromium with headless_shell
> Reporting plugin self-check generated a warning: Error: Could not close browser client handle

가장 먼저 의심스러운 위 로그에 대해 검색해보니 [kibana/issues/53829](https://github.com/elastic/kibana/issues/53829)에서 샌드박스 옵션을 설정한 것을 보고 시도해보았습니다.

```yml
xpack.reporting.capture.browser.chromium.disableSandbox: true
```

위 조치와 함께 EC2에 노드와 크로미움 패키지를 직접 설치까지 해보았지만 위 문제가 해소되지 않았습니다.

### 플러그인 로그

```shell
[error][status][plugin:xpack_main@7.3.2] Status changed from yellow to red - [data] Elasticsearch cluster did not respond with license information.
```

집에와서 키바나 로그를 좀 더 자세히 살펴보니 위와 같은 오류 로그가 발생하는 것을 확인하였습니다. 사실 회사에서는 플러그인 오류이므로 키바나에서 엘라스틱서치 클러스터에 연결할 수 없는 사유와는 상관없다고 판단했었습니다. 왜냐하면 엘라스틱서치에 키바나 관련 인덱스까지는 만들어지므로 엘라스틱서치 클러스터와 통신이 되는 상황이라고 생각할 수 밖에 없었을테니까요.

아무튼 위 로그에 대해서 검색해보니 [kibana/issues/36079](https://github.com/elastic/kibana/issues/36079)에 라이센스 정보를 확인하는 댓글이 눈에 들어왔고 라이센스 정보를 확인해보았습니다.

```shell
[ec2-user ~]$ curl http://localhost:9200/_xpack/license?pretty
{ }
```

> 사실 라이센스가 없다고 생각하지는 않았고 혹시나 트라이얼 라이센스인데 만료되어서 그런 것인가라고 생각되 [License Settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/license-settings.html)에 나와있는대로 베이직 라이센스 유형을 지정하고 클러스터를 다시 실행하였지만 증상을 동일했습니다. 

그러나, 정말로 엘라스틱서치에는 라이센스 정보가 없었고 [Start basic API](https://www.elastic.co/guide/en/elasticsearch/reference/current/start-basic.html)를 통해 베이직 라이센스를 시작할 수 있다고 하여 아래와 같이 라이센스를 추가하였습니다.

```shell
[ec2-user ~]$ curl -X POST http://localhost:9200/_license/start_basic?pretty
{
  "acknowledged" : true,
  "basic_was_started" : true
}
[ec2-user ~]$ curl http://localhost:9200/_xpack/license?pretty
{
  "license" : {
    "status" : "active",
    "uid" : "fb6a45f5-4f26-45fe-9889-2380b9ec8801",
    "type" : "basic",
    "issue_date" : "2022-08-18T14:51:26.602Z",
    "issue_date_in_millis" : 1660834286602,
    "max_nodes" : 1000,
    "issued_to" : "cluster",
    "issuer" : "elasticsearch",
    "start_date_in_millis" : -1
  }
}
```

![](/images/posts/kibana-cannot-connect-elasticsearch/02.png)

엘라스틱서치 클러스터에 베이직 라이센스 정보가 있으므로 키바나에서는 더이상 플러그인 오류가 발생하지 않았으며 키바나 주소로 다시 접속하니 엘라스틱서치 클러스터에 연결할 수 없다는 메시지는 더이상 표시되지 않았습니다. 이로써 키바나에서 엘라스틱서치 클러스터로 연결한다는 의미는 X-Pack 플러그인에 대한 라이센스 정보를 확인한다는 점으로 이해할 수 있을 것 같습니다. 엘라스틱서치 클러스터가 만료된 트라이얼 라이센스를 가지고 있더라도 키바나 또는 Start basic API를 통해 베이직 라이센스로 전환할 수 있습니다. 따라서, 키바나를 실행하고나서 엘라스틱서치 클러스터에 연결할 수 없다는 의미의 메시지를 확인하다면 클러스터에 라이센스 정보가 있는지 확인해보시기 바랍니다.

감사합니다.
