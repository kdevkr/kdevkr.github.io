---
title: SonarQube와 Github Action으로 수행하는 정적 분석
date: 2021-10-10
tags:
 - SonarQube
 - Github Action
---

안녕하세요 Mambo 입니다.

오늘은 SonarQube와 Github Action을 통해 정적 분석을 수행하기 위한 과정을 알아보려고 합니다.

## SonarQube
[소나큐브](https://www.sonarqube.org/)는 다양한 언어에 대한 코드 품질을 분석하고 취약점을 파악할 수 있는 정적 분석 도구입니다. 회사에서 정적 분석을 수행하고 싶다는 요구사항이 있어 제가 SonarQube를 도입하고 월요일과 금요일마다 프로젝트 코드에 대한 정적 분석을 수행하고 있습니다. 제가 정적 분석을 위해서 소나큐브를 도입한 이유는 다음과 같습니다.

![소나큐브 라이센스](/images/posts/sonarqube-and-github-action/sonarqube-00.png)

1. GPLv3 라이센스 기반의 오픈소스 버전 지원
2. IntelliJ 또는 VSCode와 같은 IDE를 위한 SonarLint 지원
3. 소나큐브에 대한 공식 도커 이미지 지원
4. 다양한 언어와 커뮤니티 기반의 규칙 지원

회사 개발자들이 주로 사용하는 인텔리제이 IDEA 또는 VSCode에서 사용할 수 있는 SonarLint를 제공하여 별도의 서버 없이도 간단하게 자체적으로 정적 분석을 수행하고 결과를 확인할 수 있으며 공식 도커 이미지를 통해 별다른 설정 없이도 간단하게 소나큐브 시스템을 구성할 수 있습니다.

### 소나큐브 시스템 구성
소나큐브는 [직접 설치](https://docs.sonarqube.org/latest/setup/install-server/)할 수도 있으며 도커 이미지와 함께 제공하는 도커 컴포즈 문서를 활용할 수 있습니다.

[sq-with-postgres/docker-compose.yml](https://github.com/SonarSource/docker-sonarqube/blob/master/example-compose-files/sq-with-postgres/docker-compose.yml)

```yaml
version: "3.8"

services:
  web:
    image: sonarqube:9.1.0-community
    restart: always
    depends_on:
      - db
    ports:
      - "9000:9000"
    networks:
      - sonarnet
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
      - sonarqube_temp:/opt/sonarqube/temp
      - sonarqube_bundled-plugins:/opt/sonarqube/lib/bundled-plugins
    ulimits:
      nproc: 65535
      nofile:
        soft: 262144
        hard: 262144
  db:
    image: postgres
    networks:
      - sonarnet
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
    volumes:
      - postgresql:/var/lib/postgresql
      - postgresql_data:/var/lib/postgresql/data

networks:
  sonarnet:
    driver: bridge

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  sonarqube_temp:
  sonarqube_bundled-plugins:
  postgresql:
  postgresql_data:
```

#### WSL vm.max_map_count
윈도우 환경에서 WSL로 도커 컨테이너를 실행하는 경우 vm.max_map_count로 인하여 소나큐브에서 실행하는 Elasticsearch가 실행되지 않을 수 있습니다. 이 경우 윈도우 터미널에서 WSL로 도커 컨테이너로 접속 후 다음의 명령어를 실행하여 Elasticsearch에서 요구하는 수치로 변경하시면 됩니다.

```sh
# Max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
wsl -d docker-desktop
sysctl -w vm.max_map_count=262144
```

> 소나큐브의 관리자 계정과 초기 비밀번호는 admin/admin 입니다.

### 소나큐브 프로젝트 생성
소나큐브에 접속하였다면 정적 분석을 수행할 프로젝트를 생성해야합니다. 저는 깃허브 리파지토리 이름을 그대로 사용하는 편입니다.

![spring5-web-example 프로젝트](/images/posts/sonarqube-and-github-action/sonarqube-01.png)

그리고 소나큐브에 로그인할 수 있는 토큰을 발행합니다. 

![](/images/posts/sonarqube-and-github-action/sonarqube-02.png)

토큰 용도를 구분하기 위한 이름을 지정하는데 저는 Github Action에서 사용할 예정이므로 GITHUB_ACTION을 지정하였습니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-03.png)

저는 로컬 컴퓨터에 소나큐브를 실행하였고 필요할때만 포트포워딩을 수행할 예정이므로 토큰을 공개하겠습니다. (어차피 학습 후에 지움...)

### 소나큐브 관련 코드 추가
소나큐브 시스템에 프로젝트를 생성하고 토큰을 발급하였기 때문에 소나큐브와 연계할 수 있도록 프로젝트 폴더에 소나큐브와 관련된 코드를 추가하겠습니다.

#### build.gradle
만약, 그래들을 통해 소나큐브와 연동하고 싶다면 build.gradle에 SonarQube 플러그인을 추가해야합니다.

```groovy
plugins {
    id "org.sonarqube" version '3.3'
    id 'jacoco'
}

sonarqube {
  properties {
    property "sonar.projectKey", "spring5-web-example"
  }
}
```

#### sonar-project.properties
sonar-project.properties 파일은 소나큐브에서 참조하게 되는 설정 파일입니다.

```yaml
sonar.projectKey=spring5-web-example
sonar.projectName=spring5-web-example
sonar.java.source=1.11
sonar.sources=src/main/java
#sonar.tests=src/main/test
sonar.java.binaries=build/classes/java/main/com/example
sonar.sourceEncoding=UTF-8
sonar.exclusions=
```

## Github Action
[SonarQube GitHub Action](https://github.com/kitabisa/sonarqube-action)은 Github Action을 통해 소나큐브로 정적 분석을 수행할 수 있도록 지원합니다.

### 소나큐브 워크플로우 코드 추가

**.github/workflows/sonarqube.yml**
```yaml
on:
  # schedule:
    # - cron: '0 * * * 1'
  workflow_dispatch:

name: SonarQube Workflow
jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up JDK 1.11
      uses: AdoptOpenJDK/install-jdk@v1
      with:
        version: '11'
        architecture: x64
        targets: 'JAVA_HOME'
    - name: Grant execute permission for gradlew
      run: chmod +x gradlew
    - name: Build with Gradle
      run: ./gradlew build -x test
    - name: Upload build artifact
      uses: actions/upload-artifact@v2
      with:
        name: build
        path: build/classes

  sonarQube:
    needs: build
    name: SonarQube
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Donwload build artifact
      uses: actions/download-artifact@v2
      with:
        name: build
        path: build/classes
    - name: SonarQube Scan
      uses: kitabisa/sonarqube-action@master
      with:
        host: ${{ secrets.SONAR_HOST }}
        login: ${{ secrets.SONAR_TOKEN }}
        projectBaseDir: '/github/workspace'
```

소나큐브 워크플로우 파일을 깃허브 리파지토리의 메인 또는 마스터 브랜치에 반영하면 깃허브에서 워크플로우를 등록합니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-04.png)

### 소나큐브 관련 시크릿 생성
소나큐브 워크플로우에서 사용하는 두가지 시크릿을 깃허브 리파지토리에 설정해야합니다.

- SONAR_HOST : 소나큐브 호스트 주소
- SONAR_TOKEN : 소나큐브에서 발급한 토큰 정보

![](/images/posts/sonarqube-and-github-action/sonarqube-05.png)

### 소나큐브 워크플로우 실행
소나큐브 워크플로우 설정이 완료되었으므로 메인 브랜치를 기준으로 워크플로우를 실행합니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-06.png)

프로젝트 코드에 대한 빌드가 정상적으로 수행되고 소나큐브 서버를 통해 정적 분석을 수행되었다면 다음과 같이 워크플로우가 정상적으로 완료됩니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-07.png)

## 정적 분석 결과

소나큐브 시스템에 접속하여 소나큐브 워크플로우를 실행한 프로젝트의 정적 분석 결과를 확인합니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-08.png)

빌드 테스트는 수행하지 않았기 때문에 코드 커버리지는 분석할 수 없었으나 10개의 코드 악취가 발견되었습니다.

### 코드 악취 검토 및 개선
정적 분석 결과로 검출된 코드 악취에 대한 내용을 검토하고 이를 개선해보겠습니다.

#### 코드 악취
![](/images/posts/sonarqube-and-github-action/sonarqube-09.png)

첫번째 검출 항목은 연속된 라인을 주석으로 처리한 부분을 제거해야한다는 것입니다. 

![](/images/posts/sonarqube-and-github-action/sonarqube-10.png)

만약, 이렇게 주석되어있는 것이 남아있어야 한다고 가정하면 다음과 같이 프로젝트에 대한 검출 규칙을 변경할 수 있습니다.

```properties
# Ignore Rules
sonar.issue.ignore.multicriteria=e1,e2
sonar.issue.ignore.multicriteria.e1.ruleKey=java:S125
sonar.issue.ignore.multicriteria.e1.resourceKey=**/*.java
sonar.issue.ignore.multicriteria.e2.ruleKey=java:S1192
sonar.issue.ignore.multicriteria.e2.resourceKey=**/*.java
```

java:S125는 블록으로 된 주석을 남기고 있다는 악취이며 java:S1192는 동일한 문자열을 상수로 취급하지 않는다는 악취입니다. 저는 이것을 악취로 보지 않기 위해서 위와 같이 설정하고 소나큐브 워크플로우를 다시 수행해보겠습니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-11.png)

기존에 검출되었던 코드 악취 중 java:S125와 java:S1192에 해당하는 부분이 제외되어 3개의 코드 악취가 줄어들었음을 확인할 수 있습니다. 이렇게 회사 또는 개발팀에서 프로젝트 코드에 대한 규칙을 검토하는 과정을 거쳐야합니다만 저희 회사는 정작 그러지 않고 있어 아쉬움이 많습니다. 체계가 없다보니 무언가 도입을 원하지만 실제로는 제대로 활용하지 않는게 많은 것 같아요.

아무튼 나머지 코드 악취에 대해서도 리팩토링을 수행하여 없애보도록 하면서 마치겠습니다.

![](/images/posts/sonarqube-and-github-action/sonarqube-12.png)

#### @SuppressWarnings
sonar-project.properties에서 제외되도록 정의한 규칙이 패턴에 의한 것이라면 특정 클래스 또는 함수 단위로 규칙을 제외하고 싶은 경우 @SuppressWarnings을 사용할 수 있습니다. 

```java
@SuppressWarnings({"squid:S125","squid:S1192"})
@Configuration
public class SecurityConfig {}
```

감사합니다.
