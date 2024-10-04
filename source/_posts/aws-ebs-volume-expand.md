---
title: AWS EC2 볼륨 크기 확장하기
date: 2024-10-04T22:00+09:00
tags:
- AWS
- Elastic Block Storage
---

Amazon Aurora PostgreSQL 처럼 관리형 데이터베이스 서비스를 이용하지 않고 데이터베이스와 같이 대량의 데이터를 저장하기 위한 서버를 EC2 인스턴스에서 직접 운용하는 경우에는 데이터를 저장할 볼륨의 사용량을 모니터링하고 임계치를 넘어서는 경우 디스크 볼륨의 크기를 변경하고 파일 시스템을 확장하여야 한다.

시계열 데이터를 저장하기 위해 KDB+ 시계열 데이터베이스를 EC2 인스턴스에 직접 설치하여 운용하고 있어 데이터가 저장되는 규모에 따라 볼륨에 대한 모니터링을 주기적으로 수행하고 볼륨 크기를 관리하는 작업을 수행해야 한다. 최근에는 [Amazon FinSpace를 통해 관리형 KDB Insight를 지원](https://aws.amazon.com/ko/finspace/features/managed-kdb-insights/)하기는 합니다만 라이센스와 인프라 비용 문제로 관리형 서비스로 전환하여 사용중이지는 않는다.

아무튼, Amazon EBS의 탄력적 볼륨은 서버에 연결된 볼륨을 해제하거나 EC2 서버를 재시작하지 않고도 변경된 볼륨을 반영할 수 있게 제공해주지만 AWS CLI 또는 웹 콘솔에서 볼륨의 크기를 변경하더라도 리눅스 파일 시스템에서 사용중인 볼륨을 자동으로 확장해주지는 않는다.

#### XFS 파일 시스템 확장

볼륨의 파일 시스템에 따라 xfs_growsfs 또는 resize2fs 명령어를 사용해서 볼륨의 크기만큼 확장할 수 있다. KDB+ 시계열 데이터베이스에서 사용하는 데이터 볼륨을 /data 경로로 마운트되어있어 아래와 같이 파일 시스템을 확장할 수 있다.

```sh Terminal
sudo df -hT /data
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/nvme2n1   xfs   500G  349G  152G  70% /data

sudo xfs_growfs -d /data
```

#### EBS 볼륨 수정 시 주의사항

- 볼륨 크기를 변경하고나서 최소한 6시간 이내에 재수정이 불가능하다.
- 볼륨 수정 후에도 optimizing 상태와 같은 볼륨 수정 상황을 모니터링 해야한다.
- 볼륨을 수정하기 전에 스냅샷을 생성하여 예상하지 못한 상태에 대비하자.

---

그동안 볼륨 크기를 변경하고 확장하는 작업이 자주 일어나지 않았으나 시간이 된다면 AWS CLI 또는 Lambda 를 이용하여 볼륨 임계치에 따라 자동으로 볼륨의 크기가 조정되는 방법을 적용해봐도 좋을 것 같다. GPT에 물어보니 대충 아래와 같이 배시 스크립트를 작성할 수 있나보다.

```sh
#!/bin/bash

INSTANCE_ID=$(cat /var/lib/cloud/data/instance-id)
VOLUME_ID="vol-xxxxxxxxxxxxx"
VOLUME_PATH="/data"
USAGE=$(df -h $VOLUME_PATH | grep / | awk '{ print $5 }' | sed 's/%//g')

THRESHOLD=80 # %
EXPAND_SIZE=100 # GB

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "[EBS] USAGE: $USAGE"

  CURRENT_SIZE=$(aws ec2 describe-volumes --volume-ids $VOLUME_ID --query "Volumes[0].Size")
  NEW_SIZE=$(($CURRENT_SIZE + $EXPAND_SIZE))
  echo "[EBS] CURRENT: $CURRENT_SIZE, NEW: $NEW_SIZE"

  aws ec2 modify-volume --volume-id $VOLUME_ID --size $NEW_SIZE
  sudo xfs_growfs -d $VOLUME_PATH
  echo "[EBS] completed"
fi
```
