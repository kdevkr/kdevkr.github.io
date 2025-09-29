---
title: 젠킨스 프로젝트 빌드
date: 2023-02-23
---

![](/images/posts/jenkins/01.png)

젠킨스를 사용해서 프로젝트를 빌드하기 위해서는 아이템을 만들어야 한다. 아이템을 생성할 때에는 프로젝트 빌드 유형에 따라 웹 UI 방식의 프리스타일 또는 스크립트로 작성하는 파이프라인 등을 선택할 수 있게 지원하고 있다. 인터넷에 공유된 내용에 따라서는 파이프라인 스크립트를 작성하는 예제가 많이 보이지만 몸을 담고 있는 조직에서는 프리스타일 유형으로도 간단하게 원하는 빌드 결과를 구성하여 사용하고 있다.

본 글에서 사용될 프로젝트 : [kdevkr/beanstalk-deploy-sample](https://github.com/kdevkr/beanstalk-deploy-sample)  

위 리파지토리는 예전에 AWS Beanstalk Java SE Platform 으로 배포하기 위한 예제를 작성한 간단한 스프링 부트 프로젝트이다. 별다른 기능은 포함하고 있지 않으며 build.gradle에 몇가지 프로젝트 빌드를 위한 설정을 해둔 상태이다. 예를 들어, -Pversion 라는 프로젝트 속성을 통해서 빌드 버전을 적용할 수 있음을 알 수 있다.

```shell
./gradlew zipBeanstalk -Pversion='1.0.1'
# build/distributions/beanstalk-1.0.1.zip
```

- build/libs: .war 파일 및 Procfile이 생성되는 폴더
- build/distributions: Beanstalk 번들 파일이 생성되는 폴더

#### 빌드 시 매개변수로 깃 태그 선택하기
Parameterized Build 와 [Git Parameter](https://plugins.jenkins.io/git-parameter/) 플러그인을 사용해서 깃 커밋에 릴리즈를 위한 버전을 태그로 달아놓고 젠킨스에서 깃 태그를 필터하여 선택함으로써 원하는 기준의 소스 코드를 가지는 애플리케이션을 빌드할 수 있다. 아래와 같이 설정하면 프로젝트 빌드 시 깃 태그를 찾아서 선택할 수 있고 해당 태그가 있는 커밋의 소스를 기준으로 한다.

![](/images/posts/jenkins/02.png)
![](/images/posts/jenkins/03.png)
![](/images/posts/jenkins/04.png)

#### 프로젝트 빌드 버전 적용하기
위에서 [v1.0.0](https://github.com/kdevkr/beanstalk-deploy-sample/releases/tag/v1.0.0) 태그를 버전으로 선택할 수 있으며 이 버전을 빌드되는 애플리케이션 버전에도 적용하기 위해서는 그래들 프로젝트 빌드 시 프로젝트 속성으로써 지정되도록 해야한다. 빌드 단계에서 Invoke Gradle script의 고급 옵션을 열어보면 모든 잡 파라미터를 프로젝트 속성으로 전달하는 항목을 선택할 수 있다.

![](/images/posts/jenkins/05.png)

```shell
# 만약, 그래들 스크립트가 아닌 직접 쉘에서 빌드 명령어를 수행하고 싶다면 아래와 같이 선택한 태그 파라미터를 적용시킬 수 있다. 
./gradlew -Pversion=$version zipBeanstalk
```

#### 프로젝트 빌드 결과를 슬랙으로 보내기
프로젝트 규모에 따라 빌드 수행 시간이 상당히 소요될 수 있으므로 프로젝트 릴리즈를 담당하는 인원들이 릴리즈 버전 빌드에 성공 또는 실패 유무를 확인할 수 있도록 슬랙 메신저(구글 챗이나 이메일도 가능)로 메시지를 보내도록 알림 설정을 하는 것이 좋다. [Jenkins CI 슬랙 앱](https://kdevkr.slack.com/apps/A0F7VRFKN-jenkins-c) 그리고 [Slack Notification](https://plugins.jenkins.io/slack/) 플러그인과 함께 커스텀 메시지를 활용한다면 SFTP 서버를 사용해서 별도로 빌드된 애플리케이션을 전달하고 수동 배포를 해야한다면 업로드된 SFTP 경로를 메시지로 전달한다거나 애플리케이션 배포를 위해서 실행해야할 명령어를 안내하도록 구성할 수도 있다.

![](/images/posts/jenkins/06.png)
![](/images/posts/jenkins/07.png)

#### 빌드 파일을 원격 호스트로 전달하기
AWS Beanstalk 환경에 배포하기 위해서는 [AWS Elastic Beanstalk Publisher](https://plugins.jenkins.io/aws-beanstalk-publisher-plugin/) 플러그인을 사용하겠지만 보안 상의 문제로 애플리케이션 빌드 파일을 SFTP 서버로 업로드해야할 환경이라면 [Publish Over SSH](https://plugins.jenkins.io/publish-over-ssh/) 플러그인을 사용해서 PEM 인증서를 통해 빌드 파일을 원격 호스트로 전달하도록 구성할 수 있다.

- AWS Elastic Beanstalk Publisher
- S3 publisher
- Publish Over SSH

이에 대한 다양한 예제는 [kdevkr/mambo-box/jenkins](https://github.com/kdevkr/mambo-box/tree/main/jenkins)에 기록해놓고자 한다.

