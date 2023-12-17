---
title: Amazon Linux 2023 Docker Compose 플러그인 설치
date: 2023-12-17T19:00+0900
tags:
- AL2023
- Docker
- Docker Compose
---

Amazon Linux 2023 에서는 Extra를 제공하지는 않지만 Docker는 기본적으로 포함되어있다. Amazon Linux 2 에서와 동일하게 Docker Compose Plugin 은 별도로 포함해주지 않으므로 직접 수동으로 설치해야한다. 다만, docker-compose 명령어로 별도로 사용하기 보다는 최신 버전에 맞춰 Docker [Compose 플러그인](https://docs.docker.com/compose/install/linux/#install-the-plugin-manually)으로 설치해보도록 하자. [Docker Compose Releases](https://github.com/docker/compose/releases) 사이트에서 다운로드 받은 docker-compose 를 cli-plugins 폴더 아래에 복사하면 된다.

```sh Terminal
# Docker
sudo yum install -y docker
sudo usermod -aG docker ec2-user
sudo systemctl enable --now docker
exec bash

docker ps

# Compose Plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins/
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

docker compose version
```

#### Compose 플러그인을 docker-compose 명령어로 사용하기

Docker Compose 플러그인을 설치했으나 기존 스크립트가 docker-compose로 되어있어서 명령어 호환성을 맞추고 싶다면 docker-compose를 심볼릭 링크 또는 alias로 등록하면 된다.

```sh Terminal
# sudo ln -s /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
alias docker-compose='docker compose --compatibility "$@"'

docker-compose version
```
