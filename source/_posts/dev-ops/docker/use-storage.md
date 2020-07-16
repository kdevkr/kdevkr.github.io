---
  title: Docker - 스토리지 사용하기
  date: 2020-07-14
  tags:
    - Docker
    - Volume
---

## 들어가며
기본적으로 도커 컨테이너에서 발생하는 데이터는 컨테이너 공간에 저장되어 컨테이너가 삭제되는 순간 데이터가 같이 삭제되는 구조를 가지고 있습니다. 이에 도커는 볼륨이라는 매커니즘을 제공하여 컨테이너가 삭제되어도 데이터를 유지할 수 있도록 영속성을 제공합니다.  

## 스토리지
도커에서 데이터를 유지하기 위해 제공하는 스토리지 유형에는 볼륨과 마운트가 있습니다. 일반적으로 호스트 영역과 연결하는 것이 바인드 마운트이며 볼륨은 도커가 관리하는 영역에 데이터를 유지하는 공간을 만들어내는 것입니다.

![](https://docs.docker.com/storage/images/types-of-mounts.png)

`볼륨 영역`(리눅스에서 /var/lib/docker/volumes/)은 도커에서 관리하기 때문에 도커 프로세스가 아닌 경우 데이터를 수정할 수 없게 됩니다. 따라서, 도커에서 데이터를 유지하는 가장 좋은 방법은 볼륨을 사용하는 것일 수 있습니다.

`바인드 마운트`는 호스트 디렉토리를 사용하기 때문에 언제든지 영역에 접근하고 데이터를 수정할 수 있습니다. 단, 호스트 프로세스에서 해당 영역을 사용하거나 접근할 수 있기 때문에 이를 인지하고 사용해야 합니다.

`tmpfs 마운트`는 호스트 메모리 영역에 데이터를 저장합니다. 예를 들어, 쿠버네티스 스크릿의 경우 비밀번호, OAuth 토큰, SSH 키와 같은 민감한 정보들은 호스트 메모리에 저장합니다.

### 바인드 마운트 연습하기
도커 이미지로 구성한 [Docker KDB+](https://github.com/kdevkr/docker-kdb)는 KDB+를 우분투 컨테이너에서 구동하도록 되어있습니다. KDB+가 실행될 때 호출되는 `q.q`라는 q 스크립트 파일이 있습니다. 기본으로 이미지에 포함되어 있는 q.q 스크립트 대신에 실행할 스크립트를 바인드 마운트를 통해 연결할 수 있습니다.

`Hello Mambo!`라는 메시지를 KDB+ 실행할 때 출력하기 위하여 q.q 파일을 만들어 다음과 같이 스크립트를 작성합니다. 이 파일은 `/home/mambo/kdb` 경로에 있다고 가정합니다.

```q q.q
.system.out.println:{-1 raze[" "sv string`date`second$.z.P]," ",x;};
.system.out.println "Hello Mambo!";
```

그런 다음 도커 컨테이너를 실행할 때 `-v` 옵션으로 앞서 작성한 q.q 파일을 이미지에 존재하는 파일로 대체하도록 지정합니다.
```docker
docker run -d --name kdb -v /home/mambo/kdb/q.q:/root/q/q.q -e ON_STARTUP=/root/q/q.q -p 5000:5000 kdb
```

그러면 해당 스크립트 파일이 대체되어 다음과 같이 컨테이너 로그로 출력되는 것을 확인할 수 있습니다.

```zsh
$ docker logs kdb
0
Welcome to kdb+ 32bit edition
For support please see http://groups.google.com/d/forum/personal-kdbplus
Tutorials can be found at http://code.kx.com
To exit, type \\
To remove this startup msg, edit q.q
2020.07.15 12:14:13 Hello Mambo!
```

### 볼륨 마운트 연습하기
도커 컨테이너에 볼륨을 마운트하는 것을 해보겠습니다. 먼저 `docker inspect` 명령으로 컨테이너에서 사용중인 볼륨이 있는지를 확인합니다.

컨테이너에 대한 마운트 부분을 추출하기 위하여 [How do you list volumes in docker containers?](https://stackoverflow.com/questions/30133664/how-do-you-list-volumes-in-docker-containers)에서 알려주는대로 명령어를 실행합니다.

```sh
$ docker inspect -f '{{ .Mounts }}' kdb
[{bind  /home/mambo/kdb/q.q /root/q/q.q   true rprivate}]
```

현재 KDB 컨테이너는 바인드 마운트에 대한 정보는 있으나 볼륨에 대한 정보는 존재하지 않음을 확인할 수 있습니다. 결국 KDB+ 데이터는 컨테이너 영역에 존재하므로 데이터를 유지하기 위하여 볼륨을 사용해야 합니다.

우선 KDB 컨테이너에서 사용할 볼륨을 생성합니다.

```sh
$ docker create volume --name kdb-volume
$ docker volume ls
DRIVER      VOLUME NAME
local       kdb-volume
```

기존 KDB 컨테이너를 삭제한 후 앞서 생성하였던 KDB 볼륨을 마운트합니다.

```sh
$ docker stop kdb
$ docker rm kdb

$ docker run -d --name kdb -v kdb-volume:/root/q -v /home/mambo/kdb/q.q:/root/q/q.q -e ON_STARTUP=/root/q/q.q -p 5000:5000 kdb
```

다시 컨테이너에 대한 마운트 부분을 확인하면 다음과 같이 볼륨을 사용하고 있는 것을 알 수 있습니다.

```sh
$ docker inspect -f '{{ .Mounts }}' kdb                                                                                       
[{volume kdb-volume /var/lib/docker/volumes/kdb-volume/_data /root/q local z true } {bind  /home/mambo/kdb/q.q /root/q/q.q   true rprivate}]
```

## 참고
- [Manage data in Docker](https://docs.docker.com/storage/)
- [How do you list volumes in docker containers?](https://stackoverflow.com/questions/30133664/how-do-you-list-volumes-in-docker-containers)
