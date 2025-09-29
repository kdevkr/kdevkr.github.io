---
title: 뉴렐릭 인프라 에이전트 설치가 되지 않을때
date: 2024-08-01T22:00+09:00
tags:
- Newrelic CLI
- Infrastructure Agent
---

![](/images/posts/install-newrelic-infra-agent/01.png)

뉴렐릭은 무료 플랜을 제공하는 SaaS APM 솔루션으로 웹 UI에서 원하는 에이전트를 쉽게 설치할 수 있도록 명령어를 제공하고 있다. 그런데, 아래와 같이 gzip 관련 명령어가 수행될 때 오류가 발생하는 것을 경험할 수 있다.

```sh
curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash && sudo NEW_RELIC_API_KEY=NRAK-XXXX NEW_RELIC_ACCOUNT_ID=45XXXXX /usr/local/bin/newrelic install
Installing New Relic CLI v0.92.0

gzip: stdin: unexpected end of file
tar: Child returned status 1
tar: Error is not recoverable: exiting now
An error occurred installing the tool.
The contents of the directory /tmp/tmp.ROXuwOdosK have been left in place to help to debug the issue.
```

위와 같은 오류가 발생하는 경우의 원인은 루트 권한으로 수행하지 않았기 때문이며 루트 계정으로 사용자를 전환하여 설치하도록 하자.

```sh
sudo su -

curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash && sudo NEW_RELIC_API_KEY=NRAK-XXXX NEW_RELIC_ACCOUNT_ID=45XXXXX /usr/local/bin/newrelic install

Installing New Relic CLI v0.92.0
Installing to /usr/local/bin
...
```
