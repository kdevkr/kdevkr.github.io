---
  title: Docker - 프라이빗 도커 레지스트리 구성하기
  date: 2020-07-17
  tags:
    - Docker Registry
---

## 들어가며
일반적인 경우 도커 이미지는 `Docker Hub` 라는 공식 이미지 저장소를 통해 이미지를 받아오거나 공유할 수 있습니다. 하지만, 필요에 따라서는 공개적인 저장소에 이미지를 공유하는 것이 원하는 행위가 아닐 수 있습니다. 그래서 공개 저장소가 아닌 프라이빗 이미지 저장소를 구성해야할 필요성이 생깁니다. 도커 그룹은 프라이빗 이미지 저장소를 구성할 수 있는 `registry`라는 이미지를 제공하여 그것을 가능하게 하였습니다.

## Docker Registry
도커 엔진의 버전이 1.6+ 이상이면 [Docker Registry](https://hub.docker.com/_/registry) 이미지를 다운받아서 사설 레지스트리 서버를 실행할 수 있습니다.

```zsh
$ docker run -d --name registry -p 5000:5000 registry:2.7
Unable to find image 'registry:2.7' locally
2.7: Pulling from library/registry
cbdbe7a5bc2a: Already exists
47112e65547d: Pull complete
46bcb632e506: Pull complete
c1cc712bcecd: Pull complete
3db6272dcbfa: Pull complete
Digest: sha256:8be26f81ffea54106bae012c6f349df70f4d5e7e2ec01b143c46e2c03b9e551d
Status: Downloaded newer image for registry:2.7
eaa2c19257b64800e59d7f330b3e8ec6524ca4603a7bd4be6241da85c57b51c5
```

아주 간단하게 사설 레지스트리 서버를 실행하였습니다. 이제 사설 레지스트리 서버에 이미지를 등록하고 받아오도록 하겠습니다.

먼저, Dockerhub에서 알파인 리눅스 이미지를 가져옵니다.

```zsh
$ docker pull alpine
```

그리고 알파인 리눅스 이미지를 사설 레지스트리 서버에 등록하기 위하여 태그를 변경한 뒤 `push` 명령을 통해 사설 레지스트리 서버로 업로드합니다.

```zsh
$ docker tag alpine localhost:5000/alpine
$ docker push localhost:5000/alpine

The push refers to repository [localhost:5000/alpine]
50644c29ef5a: Pushed
latest: digest: sha256:a15790640a6690aa1730c38cf0a440e2aa44aaca9b0e8931a9f2b0d7cc90fd65 size: 528
```

태그를 변경하였던 이미지를 삭제하고 사설 레지스트리 서버에서 이미지를 받아옵니다.

```zsh
$ docker rmi localhost:5000/alpine
Untagged: localhost:5000/alpine:latest
Untagged: localhost:5000/alpine@sha256:a15790640a6690aa1730c38cf0a440e2aa44aaca9b0e8931a9f2b0d7cc90fd65

$ docker pull localhost:5000/alpine
Using default tag: latest
latest: Pulling from alpine
Digest: sha256:a15790640a6690aa1730c38cf0a440e2aa44aaca9b0e8931a9f2b0d7cc90fd65
Status: Downloaded newer image for localhost:5000/alpine:latest
localhost:5000/alpine:latest
```

### Deploy with SSL
사설 레지스트리 서버를 이용하려는 이유는 보안 부분도 있을 것입니다. 앞서 구성한 사설 레지스트리 서버는 단순 HTTP를 이용하므로 보안에 취약한 부분이 있습니다. Docker Registry 문서의 [Certificate](https://docs.docker.com/registry/deploying/#get-a-certificate) 부분을 참고하면 사설 레지스트리 서버가 SSL을 이용하도록 설정할 수 있습니다.

#### Generate certificate for localhost
SSL을 적용하기 위해서는 인증서가 필요합니다. 저는 로컬호스트에 대한 인증서를 [Let's Encrypt - localhost를 위한 인증서](https://letsencrypt.org/ko/docs/certificates-for-localhost/)를 참고하여 만들도록 하겠습니다.

```zsh
$ openssl req -x509 -out localhost.crt -keyout localhost.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <(printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
Generating a RSA private key
............................................................................+++++
................................................+++++
writing new private key to 'localhost.key'
-----
```

#### Deploy using certificate
로컬호스트 인증서를 사용하여 사설 레지스트리 서버를 실행하고 앞서 등록하였던 알파인 리눅스를 등록해봅니다.

```sh
$ docker run -d --name registry -v "$(pwd)"/certs:/certs -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/localhost.crt -e REGISTRY_HTTP_TLS_KEY=/certs/localhost.key -p 5000:5000 registry:2.7
294d71762d783c40d415cbbda369c21c35c9157e3c604880ce8244901276681d

$ docker push localhost:5000/alpine
The push refers to repository [localhost:5000/alpine]
50644c29ef5a: Pushed
latest: digest: sha256:a15790640a6690aa1730c38cf0a440e2aa44aaca9b0e8931a9f2b0d7cc90fd65 size: 528
```

## Private Docker Registry Project
사설 레지스트리 서버를 유연하게 관리하기 위한 오픈소스 프로젝트에는 다음과 같은 것들이 있습니다.

- [Harbor](https://goharbor.io/)  
- [Portus](http://port.us.org/)  

각 프로젝트별 특징을 살펴보고 목적에 맞는 것으로 사설 레지스트리 서버를 관리해보시기 바랍니다.

## 참고
- [Docker Registry](https://docs.docker.com/registry/)  
- [도커 레지스트리: 프라이빗 도커 이미지 저장소](https://www.44bits.io/ko/post/running-docker-registry-and-using-s3-storage)  
