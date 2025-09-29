---
title: 그래들 빌드 라이프사이클
date: 2021-10-30 00:00
tags:
- Gradle
- Lifecycle
---

안녕하세요 Mambo 입니다.

오늘 알아볼 내용은 그래들 빌드의 라이프사이클입니다. 

얼마전에 단일 애플리케이션 프로젝트에서 다양한 배포 환경에 대한 기능을 별도로 지원해야하는 요구사항으로 인하여 그래들 멀티 모듈 프로젝트로 전환하게 되면서 배포 과정에서 문제가 발생하였었는데요. 그 문제는 크리티컬한 이슈는 아니지만 태스크 수행 후 만들어진 압축 파일에 프로젝트 버전이 포함되지 않는 상황이었습니다. 이러한 문제가 발생한 이유는 그래들 태스크를 정의할 때 **그래들 빌드 라이프사이클**을 고려하지 않았기 때문입니다.

## 그래들 태스크
먼저 기존에 정의된 태스크는 [beanstalk-deploy-sample의 build.gradle에 정의된 zipBeanstalk 태스크](https://github.com/kdevkr/beanstalk-deploy-sample/blob/main/build.gradle)와 같이 Zip 유형의 태스크로 작성되어있습니다.

```groovy
task zipBeanstalk(type: Zip, dependsOn: 'procfile') {
    from ('.ebextensions') { into '.ebextensions' }
    from ('.platform') { into '.platform' }

    from ('build/libs') {
        println bootWar.archiveName
        include(bootWar.archiveName)
        include("Procfile")
    }
    baseName = 'beanstalk'
}
```

위 샘플 태스크처럼 단일 애플리케이션 프로젝트에서 정의된 태스크는 문제가 발생할 가능성이 적습니다. 그 이유는 배포를 위해서 여러가지 태스크를 정의하지 않기 때문인데요. 그러면 위 태스크를 수행하면 어떤 결과를 제공하는지 한번 확인해볼까요?

### 태스크 결과
프로젝트 폴더에 있는 Gradle Wrapper를 사용하여 zipBeanstalk 태스크를 수행하면서 프로젝트 버전을 명시해보겠습니다.

```sh
./gradlew clean zipBeanstalk -x test -Pversion=1.0.0-hotfix.11
```

![](/images/posts/gradle-build-lifecycle/gradle-01.png)

패키징된 WAR 파일과 zipBeanstalk 태스크에 의해 만들어지는 아카이브 파일에 프로젝트 버전이 포함됨을 확인할 수 있습니다.

### 수동 배포 환경을 위한 태스크
사실 zipBeanstalk 태스크는 아마존 웹 서비스의 빈스톡 환경으로 배포하기 위한 애플리케이션 번들 파일을 만드는 태스크입니다. 만약, 수동으로 배포하여야하는 환경이 추가된다면 빈스톡 환경에서 사용하는 Procfile과 환경 구성 파일들은 포함할 필요가 없으며 특정 환경을 위한 프로퍼티 파일만 별도로 추가하면 됩니다.


```groovy
task zipManually(type: Zip, dependsOn: 'bootWar') {
    println 'Build Version: ' + project.version

    from ('.conf') { into 'application-prod.yml'}
    from ('build/libs') {
        include(bootWar.archiveName)
    }

    baseName = 'app-bundle'
}
```

zipManually 태스크에는 application-prod.yml을 패키징된 애플리케이션 WAR 파일과 함께 포함시키도록 정의했습니다. 아시는 분들도 있겠지만 스프링 부트 애플리케이션은 **WAR 파일과 동일한 위치에 있는 애플리케이션 프로퍼티 파일**을 읽을 수 있습니다. 만약, 모르시는 분들이라면 프로퍼티 구성 우선 순위에 대한 문서를 확인하시기 바랍니다.

동일하게 zipManually 태스크를 실행해보도록 하겠습니다.

```sh
./gradlew clean zipManually -x test -Pversion=1.0.0-hotfix.11

> Configure project :
JDK info: 11
Build Version: 1.0.0-hotfix.11
Build Version: 1.0.0-hotfix.11

> Task :bootBuildInfo
> Task :compileJava UP-TO-DATE
> Task :processResources UP-TO-DATE
> Task :classes
> Task :bootWarMainClassName
> Task :bootWar
> Task :procfile
> Task :zipManually
```

![](/images/posts/gradle-build-lifecycle/gradle-02.png)

zipManually 태스크 결과는 정상으로 보입니다만... 이상한 부분을 눈치채신분들이 있으시겠죠? **바로 Build Version이 두번 출력되었다는 점**인데요. 우리는 분명히 별도의 태스크로 정의하고 태스크 블록 내에서 현재 Build Version을 출력하도록 작성했습니다. 이렇게 Build Version 버전이 두번 출력되는 이유는 이 글의 주요 내용인 그래들 빌드 라이프사이클에 대한 개념과 관련이 있습니다.

## 그래들 빌드 라이프사이클
사실 상 이러한 문제를 경험하는 이유는 그래들의 빌드 라이프사이클에 대한 개념을 모르기 때문인데요. 20년차이신 팀장님 조차도 잘 모르는 부분이었다고 할 수 있습니다. 빌드 라이프사이클 존재를 모르는 상황이었기에 이렇게 되는 이유를 검색하고 팀장님께서 [Gradle executes all tasks?](https://stackoverflow.com/a/23485085)이라는 스택오버플로우 질문을 공유해주셨습니다.

이 질문에 대한 답변에서는 그래들에는 configuration 단계와 execution 단계가 있고 이것은 중요한 개념이라고 설명하고 있었습니다. 그러면 그래들 공식 문서에 있는 [Build Lifecycle](https://docs.gradle.org/current/userguide/build_lifecycle.html)를 살펴보도록 하겠습니다.

> Gradle builds the complete dependency graph before any task is executed.
> ... Your build scripts configure this dependency graph.

그래들은 태스크를 수행하기 전에 의존성 그래프를 빌드하고 빌드 스크립트는 의존성 그래프를 구성한다고 설명하며 빌드 단계에 대해서 설명합니다.

### 빌드 단계
그래들의 빌드 단계는 3가지로 구분된다고 하며 초기화(Initialization), 구성(Configuration), 수행(Execution)입니다. 

> **Initialization**
> Gradle supports single and multi-project builds. During the initialization phase, Gradle determines which projects are going to take part in the build, and creates a Project instance for each of these projects.
> 
> **Configuration**
> During this phase the project objects are configured. The build scripts of all projects which are part of the build are executed.
> 
> **Execution**
> Gradle determines the subset of the tasks, created and configured during the configuration phase, to be executed. The subset is determined by the task name arguments passed to the gradle command and the current directory. Gradle then executes each of the selected tasks.

세가지의 단계 중 구성 단계에서는 모든 프로젝트의 빌드 스크립트가 실행된다는 설명이 있습니다. 이 부분이 제가 경험한 문제의 원인이라고 할 수 있는데 태스크 내에서 작성하는 코드는 구성 단계에 포함되며 doFirst와 doLast 블록이 수행 단계에 포함되기 때문입니다.

저도 모르는 부분이었고 생각보다 많은 블로그에서는 그래들 태스크 정의를 설명할 때 구성 단계에 해당되는 곳에 println을 작성하는 예시를 보여주는데요. 생각보다 많은 분들이 이 개념에 대해서 모른다고 할 수 있습니다. 물론 단일 애플리케이션 프로젝트에서는 몰라도 상관없다고 할 수 있겠네요.

### 테스트를 위한 태스크
그러면 어떻게 하였기에 프로젝트 버전이 포함되지 않았을 지 다음의 태스크를 살펴보도록 하겠습니다.

```groovy
task zipBeanstalk(type: Zip, dependsOn: 'procfile') {}
task zipManually(type: Zip, dependsOn: 'bootWar') {}

task k8sbuild(dependsOn: bootWar) {
    project.version ''
}
```

추가한 k8sbuild 태스크는 쿠버네티스 배포 환경 테스트를 위해 패키징된 애플리케이션 WAR 파일에 포함되는 프로젝트 버전을 생략하기 위해서 project.version을 빈 값으로 설정하도록 작성한게 화근이었습니다. 이 상태로 zipManually 태스크를 다시 한번 수행하면 어떻게 되는지 확인해봅시다.

```sh
./gradlew clean zipManually -x test -Pversion=1.0.0-hotfix.11
```

![](/images/posts/gradle-build-lifecycle/gradle-03.png)

k8sbuild 태스크에 작성된 project.version을 설정하는 행위는 구성 단계에 해당하기 때문에 모든 태스크를 수행하기 이전에 적용되어 zipManually 태스크를 수행했음에도 불구하고 프로젝트 버전이 포함되지 않았음을 보여줍니다.

### 해결방안
그러면 어떻게 해결하는게 좋을지 방안을 찾아보도록 하겠습니다. 

#### 프로젝트 버전 재정의하는 경우
k8sbuild 태스크처럼 특정 태스크에서 프로젝트 버전을 재정의 하고싶은 경우에는 doFirst와 같은 클로저를 활용해야합니다.

```groovy
task k8sbuild(dependsOn: bootWar) {
    doFirst {
        project.version ''
    }
}
```

#### 프로젝트 버전을 확인하고 싶은 경우
zipBeanstalk와 zipManually 태스크처럼 애플리케이션을 WAR로 패키징하는 경우 현재 프로젝트 버전을 출력하고 싶은 경우 gradle.taskGraph.whenReady를 활용함으로써 해결할 수 있습니다.

```groovy
task zipBeanstalk(type: Zip, dependsOn: 'procfile') {
    from ('.ebextensions') { into '.ebextensions' }
    from ('.platform') { into '.platform' }

    from ('build/libs') {
        include(bootWar.archiveName)
        include("Procfile")
    }
    baseName = 'beanstalk'
}

task zipManually(type: Zip, dependsOn: 'bootWar') {
    from ('.conf') { into 'application-prod.yml'}
    from ('build/libs') {
        include(bootWar.archiveName)
    }

    baseName = 'app-bundle'
}

gradle.taskGraph.whenReady { graph ->
    if (graph.hasTask(bootWar)) {
        println 'Build Version: ' + project.version
    }
}
```

#### 불필요한 파일을 제거해야하는 경우
경우에 따라서는 프로젝트 빌드 시 패키징된 애플리케이션 WAR 파일에 포함되지 않도록 해야할 수 있습니다. 예를 들어, 로컬 환경에서 사용하는 애플리케이션 프로퍼티 파일이나 특정 도메인에 대한 인증서 또는 인증키를 포함하지않도록 제외해야할 수 있습니다.

```groovy
gradle.taskGraph.whenReady { graph ->
    if (graph.hasTask(build_for_customer)) {
        processResources {
            exclude('**/config/**.yml')
            exclude('**/certs/**')
        }
    }
}
```

위 예시는 구성 단계에서 의존성 그래프 구성이 완료된 이후에 build_for_customer 태스크가 수행되는 경우에 고객 환경으로 배포하는 애플리케이션 WAR 파일에 자체적으로 사용하는 애플리케이션 프로퍼티 파일들과 인증서를 포함하지 않도록 processResources를 재정의함을 보여줍니다.

그래들 빌드 라이프사이클 개념과 함께 경험하였던 문제에 대하여 어떻게 해결할 수 있는지 알아보았습니다. 어떤 기술을 사용함에 있어서 주요 개념을 이해하고 있는 것이 중요함을 다시한번 깨닫게 되는 좋은 경험이었습니다. 여러분의 그래들 빌드 스크립트에서도 수행 단계에서 수행되어야할 코드를 구성 단계에서 동작하도록 작성되지 않았는지 검토해보시기를 바랍니다.

감사합니다.















