회사에서 개발중인 시스템은 모놀리식 아키텍처를 기반으로 하고 있지만 사용자의 요청을 직접적으로 처리하거나 주 기능을 제공하는 메인 애플리케이션은 자바로 작성되어있으며 메인 애플리케이션과 상호 통신을 통해서 특정 기능에 대한 동작을 수행하는 애플리케이션이 파이썬으로 작성되어있다. 자바 언어로 메인 애플리케이션을 개발하고 일부 기능을 별도로 수행할 애플리케이션을 파이썬으로 작성하게 된 이유는 자바 보다는 파이썬이라는 언어가 데이터 분석과 예측을 위한 라이브러리들이 많으며 활용성이 많기 때문이라고 볼 수 있다.

> 사실 나는 파이썬을 선호하지 않는 사유로 인해 이 애플리케이션을 직접적으로 담당하지 않는다.  
> 조직 내에서 파이썬에 관심있느냐고 물었을때 나는 싫다고 답을 했다.

## 도커 이미지
파이썬으로 작성된 이 애플리케이션을 배포 및 운영할 때에는 도커 이미지를 빌드하여 내가 별도로 구축해놓은 Harbor(프라이빗 도커 레지스트리 서버)에 이미지를 등록해놓고 EC2 인스턴스 환경에서는 사설 레지스트리 서버에 있는 이미지를 받아와서 배포하도록 하는 구성을 취하고 있다. 

도커 허브가 아닌 별도의 프라이빗 레지스트리 서버를 구축해놓고 사용하는 이유는 여러가지가 있겠지만 도커 허브의 무료 정책에 대한 제한이나 유료 플랜에 대한 비용적인 면을 감안할 때 별도로 만들어서 사용하는게 낫다는 판단이었다. 개발자 입장에서는 Amazon ECR 서비스를 이용하는게 편리했겠지만 Harbor를 직접적으로 구축하여 사용해보는 경험도 나쁘지 않다고 생각한다.

> 도커 허브의 대안은 [Harbor](https://goharbor.io/) 그리고 [Amazon ECR](https://aws.amazon.com/ko/ecr/) 또는 [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry)이 있다.

아마도 파이썬 애플리케이션에 대해서만 도커 이미지를 등록하고 있으므로 도커 레지스트리 서버에 대한 사용량이 많지 않지만 시간이 흐르게되어 도커 레지스트리 서버에 대한 관리 문제가 발생한다면 Amazon ECR로 대체하지 않을까 싶다.

### 이미지 최적화 이슈
도커 이미지를 사용해서 애플리케이션을 배포하고 있는 많은 조직이나 개발자들이 경험하는 문제인데 만들어지는 도커 이미지에 대해서 크게 신경쓰지 않으면 생각보다 이미지의 크기가 커지게 되면서 용량이나 빌드 시간이 늘어나는 현상이 생긴다. 실제로 이 애플리케이션을 아마존 웹 서비스의 Beanstalk Docker 플랫폼 환경으로 배포하기 위한 테스트를 하고자 했을때 마주치게된 것은 터무니 없이 큰 이미지 크기였다.

```dockerfile
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

파이썬으로 작성된 애플리케이션에서 사용중이던 Dockerfile 이었는데 [Gunicorn WSGI 서버](https://gunicorn.org/)에 대한 옵션도 고정되어있고 도커 이미지에 대한 레이어 방식의 고민없이 명령어를 사용한 것을 볼 수 있다. 이미지 빌드에 앞서 웹서버에 대한 옵션을 빌드 시점 이후에도 변경할 수 있도록 다음과 같이 변경하였다.

```dockerfile
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

![초기 빌드 이미지 : 3.71GB](/images/posts/python-docker-image-optimization/python-docker-image-optimization-01.png)

개발 과정에서 여러가지의 패키지를 추가하고 사용하지 않게되면서 requirements.txt에 정의되어있던 패키지들로 인해서 무려 2.8GB 만큼의 용량을 가지는 이미지를 가지게 되었다. 현재 사용중이지 않은 패키지들을 제거하고보니 패키지의 수가 97개에서 39개로 줄었고 패키지의 용량은 2.8GB에서 368MB으로 줄어들었다.

![패키지 최적화 후 이미지 : 1.28GB](/images/posts/python-docker-image-optimization/python-docker-image-optimization-02.png)

### 도커 이미지 최적화
좋은 도커 이미지를 만드는 방법에 대한 많은 글들을 참고해보면서 다시한번 Dockerfile 내용을 개선해보기로 하였고 베이스 이미지 변경 및 명령어 순서를 바꾸게 되었다.

```dockerfile
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

#### gunicorn.conf.py

```py
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

![](/images/posts/python-docker-image-optimization/python-docker-image-optimization-04.png)

일단은 도커 이미지가 많이 최적화되었으니 도커 플랫폼을 사용해서 애플리케이션을 배포해보기로 하자.