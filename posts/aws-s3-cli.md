---
title: AWS S3 CLI
date: 2025-01-14T23:00+09:00
tags:
- S3
- CSV Backup
- GZIP
---

최근 고객사의 시계열 데이터베이스에 저장된 2~3년치의 데이터 중 일부를 CSV로 추출하고 GZIP으로 압축한 후 S3 버킷에 업로드하는 유지보수 작업을 진행하고 있습니다. 그동안 개발자로 일해오면서 AWS CLI 를 자주 활용하지는 않았던 것 같습니다. 유지보수 작업 과정에서 AWS S3 CLI 를 어떻게 활용했는지 남겨보도록 하려고 합니다. 이미 많은 블로그 글에서 공유된 내용이라서 흥미로운 정보는 아닐 것 같습니다.

#### 개별 CSV 파일을 GZIP 으로 압축하기

시계열 데이터베이스로부터 CSV 파일들은 `/data/main/prepare` 폴더 하위에  <u>{app_name}/{yyyyMM}/{yyyyMMdd}.csv</u> 패턴으로 저장되도록 추출되도록 미리 작업했는데요. 쉘 스크립트를 작성해야하나 싶었으나 ChatGPT의 도움을 받아 아래와 같이 find 명령어로 찾은 CSV 파일들을 gzip 명령어를 수행하였습니다.

```sh prepare.sh
find /data/main/prepare -type f -name "*.csv" -exec gzip {} +

# CPU 코어를 활용한 병렬 처리
find /data/main -type f -name "*.csv" | xargs -P "$(nproc)" gzip
```

압축을 진행할 때 `-exec gzip {} \;` 를 사용했었는데  <u>파일이 많은 경우에는</u> `-exec gzip {} +` 로 수행하는것이 더 효율적이라고 합니다. 이 글을 작성하기 위해서 정리하다보니 Bash 쉘에서는 CPU 코어를 최대한 활용해서 압축할 수 있는 두번째 방법도 있음을 알게되었네요. 

#### 압축된 CSV 파일을 S3 버킷으로 보내기

GZIP 으로 압축된 CSV 파일들을 고객사에서 제공해준 S3 버킷으로 업로드해야하는 작업을 진행해야 합니다.  <u>압축된 CSV 파일의 총 크기는 약 256GB이며 업로드해야할 파일의 개수는 4800개 이상</u>이었습니다.  이때 [sync 명령어를 수행할 때 업로드 성능을 위해](https://repost.aws/ko/knowledge-center/s3-improve-transfer-sync-command)   <u>max_concurrent_requests 설정값을 변경</u>할수도 있으나 복제된 서버의 인스턴스 사양의 네트워크 속도가 준수하여 굳이 변경하지 않아도   <u>30분 이내에 업로드가 완료</u>되었습니다.

```sh upload.sh
aws s3 sync /data/main/ s3://bucket_name/ --exclude "*" --include "*.gz"
```

> 고객사 인프라이기 때문에 AWS 웹 콘솔을 통해 서버 인스턴스의 모니터링 지표를 살펴볼 수 없어서 아쉬운 것 같습니다.

#### AWS S3 호출 시 인증서 발급자 이슈 🔥 

고객사 인프라 팀에서 유지보수 작업을 위해 시계열 데이터베이스에 대한 복제 서버를 제공해주었지만 AWS S3를 호출할 수 있기까지 생각보다 시간이 많이 소요된 정보를 공유해볼까 합니다. AWS S3 CLI 명령어를 수행하려고 보니 아래와 같이  <u>SSL CERTIFICATE_VERIFY_FAILED 오류</u>가 발생했었는데요. openssl 명령어를 통해 인증서 체인을 확인해보니 [Troubleshooting errors for the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-troubleshooting.html)에 나와있는 것처럼 인증서 체인이  `Fortinet` 이라고 하는 WAF에 사용되는 보안 솔루션이 발급자인 것을 알게되었고 이에 대한 정보를 고객사 담당자를 통해 인프라팀으로 전달했지만  <u>복제된 서버에서 S3 간 통신은 WAF 방화벽에서 제외된다</u>는 답변을 받았습니다.

```sh Terminal
ubuntu@hostname:/data$ aws s3 ls s3://[bucketname]

SSL validation failed for https://[bucketname].s3.ap-northeast-2.amazonaws.com/?list-type=2&prefix=&delimiter=%2F&encoding-type=url [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate in certificate chain (_ssl.c:1125)

# S3 버킷 주소에 대한 인증서 체인을 확인하는 방법
ubuntu@hostname:/data$ openssl s_client -showcerts -connect [bucketname].s3.ap-northeast-2.amazonaws.com:443

depth=1 C = US, ST = California, L = Sunnyvale, O = Fortinet, OU = Certificate Authority, CN = FGVM4VTM23003261, emailAddress = support@fortinet.com
verify error:num=19;self signed certificate in certificate chain
verify return:1
depth=0 CN = *.s3.ap-northeast-2.amazonaws.com
verify return:1
```

>  AWS S3 CLI 명령어 수행 시  <u>--no-verify-ssl 옵션</u>을 통해 인증서 검증을 무시해본 결과 전달받은  <u>액세스 키가 S3 버킷에 대한 권한(ListObject, GetObject, PutObject)이 없는 것으로 확인</u>되었으며, 고객사 인프라팀으로부터 해결되었다는 답변을 받았을 때 정확한 원인은 공유되지 않았기에 어떠한 사유로 포티넷의 인증서가 전달되었는지는 알 수 없습니다.

#### S3 버킷 동기화 결과 확인하기

AWS S3 CLI의 sync 명령어를 통해 업로드된 CSV 압축 파일의 최종 업로드 결과를 통해 제대로 전달되었는지를 검증해야합니다. 이 방법에 대해서도 찾아보니 [--summarize 과 --human-readable 옵션을 통해](https://support.bespinglobal.com/ko/support/solutions/articles/73000639030--aws-amazon-s3-%EB%B2%84%ED%82%B7-%ED%81%AC%EA%B8%B0-%EC%9A%A9%EB%9F%89-%ED%99%95%EC%9D%B8-%EB%B0%A9%EB%B2%95)  S3 버킷에 대한 스토리지 지표를 계산할 수 있었습니다.

```sh Terminal
aws s3 ls s3://[bucketname] --recursive --summarize --human-readable

Total Objects: 4895
    Total Size: 295.0 GiB
```

> 이번 유지보수 작업 시 리눅스 명령와 쉘 스크립트 작성 시 ChatGPT와 같은 생성형 AI를 최대한 활용하여 생각보다 쉽게 진행할 수 있었던 것 같습니다. 고객사에서 요구한 유지보수 작업은 아직 남아있으나 AI 에이전트 도움을 통해 예상보다 더 빠르게 완료될 것으로 생각됩니다.