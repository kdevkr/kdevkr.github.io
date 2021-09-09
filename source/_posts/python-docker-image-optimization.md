---
title: 파이썬 도커 이미지 최적화
date: 2021-09-09
tags:
- Python
- Docker
---

안녕하세요 Mambo 입니다.

오늘은 파이썬 도커 이미지에 대한 최적화에 대해서 알아봅니다. 회사에서 운영중인 서비스의 분석 서버는 파이썬으로 작성된 플래스크 기반의 웹 애플리케이션입니다. 여러가지 방식으로 배포하던 애플리케이션을 Elastic Beanstalk 환경을 통해 배포하는 구조로 통합하기 위해서 파이썬 애플리케이션을 Elastic Beanstalk의 도커 플랫폼으로 전환하기 위한 작업을 진행했습니다. 파이썬 플랫폼이 아닌 도커 플랫폼을 활용하는 이유는 도커 이미지로 구동하는 쿠버네티스 환경을 준비하고 있기 때문으로 동일하게 도커 이미지를 사용하여 애플리케이션을 배포하고자 결정하였습니다.

## 파이썬 도커 이미지
파이썬으로 작성된 애플리케이션을 도커 이미지화하는 과정에서 발견한 문제에 대하여 몇가지 개선 작업을 진행한 것을 공유하고자 합니다. 

### 로컬 환경의 Dockerfile
먼저, 로컬 환경에서 애플리케이션을 구동해보기 위해서 간단하게 작성하여 사용중이던 Dockerfile을 다시 만들어야 했습니다.

```docker Dockerfile
FROM python:3.7
ADD ./src /www
WORKDIR /www
EXPOSE 5000
ENV ENV "dev"
RUN python3 -m venv .venv
RUN chmod +x ./.venv/bin/activate
RUN ./.venv/bin/activate
RUN python3 -m pip install --upgrade pip
RUN pip3 install -r requirements.txt
RUN apt-get update
RUN pip3 install Flask
CMD gunicorn main:app -b 0.0.0.0:5000 -w 1 -t=50 -k gevent --preload
```

Dockerfile이 정리되어있지 않고 불필요한 명령어를 수행하는 것도 있지만 제일 크다고 생각한 문제점은 [Gunicorn WSGI 서버](https://gunicorn.org/)에 대해 다양한 옵션을 적용하기 힘들다는 점이었습니다. 웹 요청을 애플리케이션 마스터 프로세스에 전달하는 워커 프로세스의 개수를 지정하는 옵션 만큼은 이미지를 빌드하는 시점 이후에도 쉽게 변경할 수 있게 적용하는게 좋을 것 같았습니다.

```docker Dockerfile
FROM python:3.8

WORKDIR /app
RUN mkdir -p /app/logs

ARG PORT=8000
ARG MAIN=application
ARG MAIN_APP=application
ARG WORKERS=application
ARG WORKERS=2
ARG WORKERCLASS=gevent
ARG TIMEOUT=60

ENV PORT ${PORT}
ENV MAIN ${MAIN}
ENV MAIN_APP ${MAIN_APP}
# This number should generally be between 2-4 workers per core in the server.
ENV WORKERS ${WORKERS}
# one of sync, eventlet, gevent, tornado, gthread
ENV WORKERCLASS ${WORKERCLASS}
ENV TIMEOUT ${TIMEOUT}

COPY entrypoint.sh entrypoint.sh
COPY src/ .
RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn gevent

EXPOSE ${PORT}

# https://docs.gunicorn.org/en/stable/run.html
RUN ["chmod", "+x", "./entrypoint.sh"]
ENTRYPOINT "./entrypoint.sh"
```

다시 작성한 Dockerfile에서는 **ARG 키워드로 빌드 시점에 옵션을 적용**하고 **ENV 키워드를 사용하여 도커 컨테이너를 실행하는 시점**에 환경 변수로 다양한 옵션을 적용할 수 있도록 하였습니다.

### 터무니없는 빌드된 이미지 크기
Dockerfile을 다시 작성하면서 꽤 깔끔해졌지만 또 다른 문제가 내재되어있었습니다. 그것은 빌드된 이미지의 크기가 3.7GB라는 터무니 없는 크기를 가지고 있던 것이었습니다. 

![3.71GB](/images/posts/python-docker-image-optimization/python-docker-image-optimization-01.png)

분석 서버를 개발하시는 실장님도 파이썬을 전문으로 하는 개발자가 아니었기 때문에 이러한 이미지 크기가 정상적인 것 같다고 하셨으나 **requirements.txt에 정의된 패키지에 의해 설치된 용량이 무려 2.8GB**인 것을 확인하고 requirements.txt에 **정의된 패키지 중 사용하지 않는 패키지들을 제거**하는 작업을 수행하고보니 **97개의 패키지가 39개로 축소**되었습니다.

![1.28GB](/images/posts/python-docker-image-optimization/python-docker-image-optimization-02.png)

축소된 requirements.txt에 의해 설치된 패키지의 용량은 2.8GB에서 368MB로 줄어든 것으로 확인되었습니다.

### 파이썬 기반 이미지 변경
그럼에도 불구하고 아직 1.28GB라는 상당히 무거운 이미지 사이즈를 가지고 있었습니다. 그 이유는 기본 파이썬 이미지에서 이미 많은 패키지가 설치되기 때문입니다.

![](/images/posts/python-docker-image-optimization/python-docker-image-optimization-03.png)

일반적으로 도커 이미지를 줄이기 위해서 알파인 리눅스 기반으로 만들어진 이미지를 사용하는 것으로 변경합니다. 그런데 알파인 리눅스로 된 파이썬 이미지를 사용하면 [도커 이미지 잘 만드는 방법](https://jonnung.dev/docker/2020/04/08/optimizing-docker-images/)에서 확인할 수 있듯이 **빌드 소요시간이 15분 이상 걸리는 현상**을 보였습니다.

```docker Dockerfile
FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y \
 gcc libpq-dev

...
```

결국 알파인 리눅스 기반 이미지 대신에 `3.8-slim-buster`을 기반의 이미지로 변경하였고 PostgreSQL 모듈을 설치할 때 오류가 발생하여 gcc 와 libpg-dev 패키지를 설치하였습니다.

![](/images/posts/python-docker-image-optimization/python-docker-image-optimization-04.png)

**1.28GB의 도커 이미지가 655MB의 용량을 가지는 이미지로 축소**되었습니다. 결과적으로 약 3.14GB의 크기를 줄이게 되었고 **캐시되지 않은 상태에서 약 40초 정도의 시간이 소요됨**을 확인했습니다. 

### Dockerfile 키워드 순서 변경
**도커 이미지 잘 만드는 방법**을 참고하면 애플리케이션 소스는 패키지를 설치하고나서 복사하는 것이 빌드 시간을 단축한다는 것을 보고 COPY 키워드 순서를 변경하였습니다.

```docker Dockerfile
...
COPY src/requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn gevent

COPY entrypoint.sh entrypoint.sh
COPY src/ .
...
```

먼저, requirements.txt을 우선적으로 복사하고 패키지를 설치한 뒤 애플리케이션 실행을 위한 엔트리포인트 스크립트 파일과 애플리케이션 소스 폴더를 복사하도록 변경했습니다.

### Gunicorn 설정 개선
다시 작성한 Dockerfile을 살펴보니 ARG와 ENV 키워드가 많아 쓸데없이 파일이 지저분해보였습니다. ARG와 ENV 키워드들은 용량을 차지하지 않으므로 이미지 크기에 영향을 주지는 않으나 Gunicorn의 여러가지 옵션을 하나의 환경 변수로 지원하도록 추가 개선하였습니다.

```docker Dockerfile
FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y \
 gcc libpq-dev

WORKDIR /app
RUN mkdir -p /app/logs

# Build Arguments
ARG PORT=8000
ARG MAIN=application
ARG MAIN_APP=application
ARG GUNICORN_ARGS=--preload

# Environoment Variables
ARG PORT ${PORT}
ENV MAIN ${MAIN}
ENV MAIN_APP ${MAIN_APP}
ENV GUNICORN_ARGS ${GUNICORN_ARGS}

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn gevent

COPY gunicorn.conf.py gunicorn.conf.py
COPY entrypoint.sh entrypoint.sh
COPY src/ .

EXPOSE ${PORT}

# https://docs.gunicorn.org/en/stable/run.html
RUN ["chmod", "+x", "./entrypoint.sh"]
ENTRYPOINT "./entrypoint.sh"
```

다음과 같이 기본 옵션이 정의된 **gunicorn.conf.py** 파일을 적용하였습니다.

```py gunicorn.conf.py
# https://docs.gunicorn.org/en/stable/settings.html
import multiprocessing

bind = '0.0.0.0:8000'
workers = multiprocessing.cpu_count() * 2 + 1
worker_connections = 1000
worker_class = 'gevent'
threads = 1
max_requests = 0
timeout = 30
keepalive = 2
```

그리고 기본으로 적용된 옵션을 하나로 통합된 **GUNICORN_ARGS** 환경 변수를 통해 자유롭게 옵션을 재정의하도록 하였습니다.

**requirements.txt에 정의된 패키지 정리**하고 **slim-buster 기반의 이미지로 변경** 그리고 **Dockerfile 키워드 순서를 변경**함으로써 파이썬 애플리케이션에 대한 도커 이미지를 최적화하는 것을 알아보았습니다. 결과적으로 도커 이미지 사이즈를 많이 줄이게되어 이미지 용량에 대한 부담과 빌드 및 배포하기까지의 시간을 단축하게되어 다행이라고 생각합니다.

감사합니다.

## 참고
- [gunicorn 설정의 A to Z](http://blog.hwahae.co.kr/all/tech/tech-tech/5567/)
- [도커 이미지 잘 만드는 방법](https://jonnung.dev/docker/2020/04/08/optimizing-docker-images/)  
- [자주 변경되는 도커 이미지 빠르게 배포하기](https://kimeuichan.github.io/posts/deploy-docker-more-faster/)  