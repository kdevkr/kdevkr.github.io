---
title: 최적화된 도커 이미지
date: 2022-09-16
tags:
- 도커 이미지
- 최적화
---

회사에서는 애플리케이션을 [아마존 웹 서비스의 Elastic Beanstalk Java SE 플랫폼 환경을 활용해서 배포](/deploy-application-to-the-aws-elastic-beanstalk-java-se-platform-enviroment/)하고 있어서 도커 이미지를 만들어볼 기회가 없는데 그럼에도 도커 이미지를 직접 만들어보면 생각보다 이미지의 크기나 빌드 시간이 오래걸려서 당황하게 된다.

- [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [How To Optimize Docker Images for Production](https://www.digitalocean.com/community/tutorials/how-to-optimize-docker-images-for-production)
- [Docker Image Optimization: from 1.16GB to 22.4MB](https://medium.com/the-agile-crafter/docker-image-optimization-from-1-16gb-to-22-4mb-53fdb4c53311)
- [도커 이미지 잘 만드는 방법](https://jonnung.dev/docker/2020/04/08/optimizing-docker-images/)
- [Language-specific getting started guides](https://docs.docker.com/language/)
- [GoogleCloudPlatform/golang-samples](https://github.com/GoogleCloudPlatform/golang-samples/blob/main/run/helloworld/Dockerfile)

많은 글에서 다루는 도커 빌드 이미지를 최적화하는 방향에 대해서 정리해보자면 다음과 같다.

```shell
첫째, 애플리케이션 언어에 적합한 경량의 베이스 이미지를 사용하라.
둘째, 애플리케이션 실행 및 운용에 필요한 필수 패키지만 설치하라.
셋째, COPY 그리고 RUN 등의 레이어를 만드는 명령어를 최소화하라.
넷째, 멀티 스테이지로 빌드와 런타임 환경의 이미지를 분리하라.
```

#### 오픈소스 솔루션으로 확인하는 Dockerfile 예시
- [promethues/Dockerfile](https://github.com/prometheus/prometheus/blob/main/Dockerfile)
- [grafana/Dockerfile](https://github.com/grafana/grafana/blob/main/Dockerfile)
- [uptime-kuma/docker](https://github.com/louislam/uptime-kuma/tree/master/docker)
