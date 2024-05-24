---
title: 젠킨스 도커 멀티 플랫폼 빌드
date: 2024-05-24T20:00+0900
tags:
- Jenkins
- Docker
- Buildx
---

젠킨스에서 Docker Plugin 을 사용해서 Dockerfile을 통해 쉽게 도커 이미지를 빌드할 수 있다. 아마존 웹 서비스와 같은 클라우드 서비스에서는 x86_64(AMD64) 아키텍처 뿐만 아니라 ARM64 아키텍처 기반의 더 저렴하고 성능이 좋은 서버를 활용할 수 있다. 기본적인 도커 이미지 빌드 명령어는 빌드를 시도하는 서버와 동일한 아키텍처에 대한 이미지만 만들 수 있으므로 [멀티 플랫폼 이미지](https://docs.docker.com/build/building/multi-platform/)를 만들기 위해서는 [Buildkit](https://docs.docker.com/reference/cli/docker/buildx/)을 이용해야한다.

#### Jenkins 사용자 도커 그룹에 추가

젠킨스가 설치된 서버에 실행되어있는 도커 엔진으로 빌드할 수 있도록 도커 그룹에 젠킨스 사용자를 포함시켜야한다. 젠킨스 사용자를 도커 그룹에 추가하고나서는 도커와 젠킨스 모두 재실행을 수행하여야 한다.

```sh
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sudo systemctl restart docker
```

#### QEMU 설치

윈도우와 맥 환경에서 사용하는 도커 데스크탑에는 QEMU 을 포함하고 있어 쉽게 멀티 플랫폼 이미지를 빌드할 수 있다. 하지만, 일반적으로 젠킨스를 설치하는 리눅스 서버에서는 [QEMU](https://docs.docker.com/build/building/multi-platform/#qemu-without-docker-desktop)의 도움을 받기 위해서 직접 설치해야한다.

```sh
docker run --privileged --rm tonistiigi/binfmt --install all
```

#### Docker Build Cloud 를 빌더로 이용하기

[Docker Build Cloud](https://docs.docker.com/build/cloud/)를 이용하여 빌드하기 위해서는 cloud 드라이버를 지원하는 buildx 버전을 설치해야한다. [buildx-desktop](https://github.com/docker/buildx-desktop) 에서 리눅스 서버에 맞는 바이너리 파일을 다운받아서 젠킨스 계정에서 바라보는 도커 경로에 docker-buildx 플러그인으로 추가하자.

```sh
# 젠킨스 사용자로 전환
sudo su jenkins -s /bin/bash

# cloud 드라이버를 지원하는 Buildx 설치
wget https://github.com/docker/buildx-desktop/releases/download/v0.14.0-desktop.1/buildx-v0.14.0-desktop.1.linux-amd64
mv buildx-v0.14.0-desktop.1.linux-amd64 ~/docker/cli-plugins/docker-buildx
chmod a+x ~/.docker/cli-plugins/docker-buildx

# Buildx 버전 확인
docker buildx version
github.com/docker/buildx v0.14.0-desktop.1 7b0470cffd54ccbf42976d2f75febc4532c85073

# Docker Build Cloud 빌더 추가
docker buildx create --driver xxxinc/builder --use
docker buildx ls
NAME/NODE               DRIVER/ENDPOINT                          STATUS    BUILDKIT       PLATFORMS
cloud-eipgridinc-ddd*   cloud
 \_ linux-amd64          \_ cloud://xxxinc/builder_linux-amd64   running   v0.13.1        linux/amd64*, linux/amd64/v2, linux/amd64/v3, linux/amd64/v4, linux/386
 \_ linux-arm64          \_ cloud://xxxinc/builder_linux-arm64   running   v0.13.1        linux/arm64*, linux/arm64/v6, linux/arm64/v7
default                 docker
 \_ default              \_ default                              running   v0.8+unknown   linux/amd64, linux/arm64, linux/riscv64, linux/ppc64le, linux/s390x, linux/386, linux/arm/v7, linux/arm/v6
```

> Docker Build Cloud 환경에서 빌드하므로 --bootstrap 옵션으로 빌더 초기화를 수행할 필요가 없습니다.

#### Jenkins 에서 빌드하기

Docker Plugin 에서는 buildx 명령어를 선택할 수 없기 때문에 Execute Shell 을 선택해서 직접 buildx 명령어를 사용하는 스크립트를 작성해야한다. 아래의 스크립트에서 도커 계정에 로그인하기 위해서 젠킨스 사용자의 config.json 을 이용하게 했다.

```sh
# Log in to Docker Hub
echo "Logging into Docker Hub..."
docker login

BUILDER_NAME="cloud-xxxinc-builder"

# Check if the builder already exists
BUILDER_EXISTS=$(docker buildx ls | grep "$BUILDER_NAME" || true)

if [[ -z "$BUILDER_EXISTS" ]]; then
  echo "Creating new builder instance..."
  docker buildx create --name "$BUILDER_NAME" --driver cloud xxxinc/builder --use
else
  echo "Using existing builder instance..."
  docker buildx use "$BUILDER_NAME"
fi

# List the builder instances
docker buildx ls

# Install QEMU emulators for building multi-architecture images
docker run --rm --privileged tonistiigi/binfmt --install all

# build
echo "Building Docker image using Buildx with Docker Build Cloud..."
docker buildx build --platform linux/amd64,linux/arm64 -t xxxinc/testapp:${version}-buildx --push .
```

#### (Optional) HDF5 for ARM64

ARM64 아키텍처로 빌드하는 경우에만 `ValueError: did not find HDF5 headers` 가 발생하는 것을 경험했다. 검색 결과 아래의 세개의 패키지를 설치하는 것으로 해결이 되었다.

- libhdf5-serial-dev
- netcdf-bin
- libnetcdf-dev

```dockerfile Dockerfile
FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y \
    gcc  \
    libpq-dev \
    libhdf5-serial-dev \
    netcdf-bin \ 
    libnetcdf-dev
```

#### 문제 해결에 도움이 된 글

- [jenkins(image) 에서 docker buildx를 사용하고 싶어요!](https://hotfoxy.tistory.com/114)
- [Docker buildx "failed to find driver"](https://forums.docker.com/t/docker-buildx-failed-to-find-driver-cloud/141238/4)
- [https://stackoverflow.com/a/36165209](https://stackoverflow.com/a/36165209)