---
title: 깃허브 작업을 구글 스페이스에 공유하기
date: 2026-05-31T07:36+09:00
description: Google Workspace CLI(gws)를 설치해서 깃허브 이슈로 작업한 내역을 간략하게 구글 스페이스에 공유하는 업무 흐름과 설정 방법을 소개합니다.
tags:
    - gcloud
    - gws
    - google chat
---

# 깃허브 작업을 구글 스페이스에 공유하기

현재 회사에서는 구글 워크스페이스(Google Workspace) 계정을 기반으로 업무를 수행하고 있어요. 저는 최근 회사에서 깃허브 이슈 작업 내용을 요약해서 **구글 스페이스 채팅(Google Workspace Chat)** 에 공유하고 있어요. 깃허브에서 팀원을 직접 멘션하더라도 메일 알림이 쌓여 즉시 확인하지 못하는 경우가 많은데, 스페이스 채팅을 함께 활용하면 팀원들이 훨씬 빠르게 인지하고 반응할 수 있기 때문이에요.

**전체적인 실무 협업 흐름은 다음과 같아요.**

- 이슈 생성 및 작업 방향 설계
- 작업 진행 및 댓글로 상세 내역 기재
- 작업 완료 후 요약 메시지를 스페이스 채팅에 공유

이 중 마지막 단계인 스페이스 채팅 요약 공유 과정을 자동화하기 위해, 구글에서 비공식적으로 제공하는 ==Google Workspace CLI(gws)== 도구를 도입하게 되었어요. `gws`는 구글 워크스페이스 제품군을 터미널로 제어할 수 있게 지원하는 CLI 도구인데, 그중에서 채팅(Google Chat) 기능도 함께 제공하고 있기 때문이에요. 덕분에 스페이스 정보 조회, 멤버십 목록 확인, 메시지 전송 등의 동작을 터미널 명령어로 손쉽게 처리할 수 있어요. 나아가 이 명령어를 활용하면 AI 에이전트가 스페이스 내 멤버십 목록을 직접 확인하여 누구에게 메시지를 공유할지 파악하고, 사용자에게 알맞은 선택지를 제시해 줄 수도 있게 돼요. 다만 구글의 공식 지원 제품이 아니기 때문에 향후 서비스 변경 가능성이 존재한다는 점은 유의해야 해요.

## 사전 요구사항 (Prerequisites)

- Node.js 18+
- Google Cloud 프로젝트
- Google Workspace 계정

## Google Cloud CLI 설정

구글 클라우드 콘솔에서 프로젝트를 생성하고 OAuth 인증을 직접 구성하려면 과정이 다소 번거로울 수 있어요. 기본 설정은 `gws` 도구의 가이드를 따라 진행하게 되지만, 몇 가지 세부적인 연동 작업은 구글 클라우드 콘솔에 접속해서 직접 설정해 주어야 해요.

특히 `gws` 도구를 정상적으로 구동하려면 **gcloud CLI** 가 로컬 환경에 반드시 먼저 설치되어 있어야 해요. 실제로 ==gws auth setup== 명령어를 실행하면 **gcloud CLI** 설치 여부를 검증하는 단계를 가장 먼저 수행합니다. 따라서 첫 단계로 `gcloud` 설치와 로그인 설정을 먼저 진행할게요.

```ps
> gcloud init
Welcome! This command will take you through the configuration of gcloud.

Your current configuration has been set to: [default]

You can skip diagnostics next time by using the following flag:
  gcloud init --skip-diagnostics

Network diagnostic detects and fixes local network connection issues.
Checking network connection...done.
Reachability Check passed.
Network diagnostic passed (1/1 checks passed).

You must sign in to continue. Would you like to sign in (selecting "Y" will open your browser to the sign-in page where you complete authentication) (Y/n)?

https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=xxx.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A8085%2F&scope=openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fappengine.admin+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fsqlservice.login+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcompute+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Faccounts.reauth&state=BOS1FxE6ttjrIQlBNiQapiZjCi52nh&access_type=offline&code_challenge=pR2zzs4XGiKMPhA8vSg0ElKrkeYAuQod0ZbCnMMAF7Y&code_challenge_method=S256
```

터미널에 출력된 인증용 링크 주소를 `Ctrl` 키를 누른 채 클릭하면 브라우저가 열리며 로그인을 진행할 수 있어요. 이때 스페이스 채팅을 사용할 **조직의 Google Workspace 계정** 으로 로그인하여 인증해야 한다는 점을 주의해 주세요.

로그인을 완료하고 나면 다음과 같이 성공적으로 인증이 완료되었다는 화면이 나타나요.

![gcloud CLI 인증 완료](/images/posts/gws-chat/001.png)

인증이 완료되면 터미널에 로그인된 계정 정보가 출력되며 이어서 사용할 **GCP 프로젝트** 를 선택하는 단계가 나타나요. 만약 연동할 기존 프로젝트가 없다면 새로 생성해 주면 돼요. (목록에서 `Create a new project` 옵션을 선택하여 터미널에서 바로 생성하는 것도 가능해요.)

```ps
You are signed in as: [kdevkr@gmail.com].

Pick cloud project to use:
 [1] project-1
 [2] gws-cli-xxxxxx
 [3] Enter a project ID
 [4] Create a new project
Please enter numeric choice or text value (must exactly match list item): 2

Your current project has been set to: [gws-cli-xxxxxx].

Not setting default zone/region (this feature makes it easier to use
[gcloud compute] by setting an appropriate default value for the
--zone and --region flag).
See https://cloud.google.com/compute/docs/gcloud-compute section on how to set
default compute region and zone manually. If you would like [gcloud init] to be
able to do this for you the next time you run it, make sure the
Compute Engine API is enabled for your project on the
https://console.developers.google.com/apis page.

Created a default .boto configuration file at [C:\Users\Mambo\.boto]. See this file and
[https://cloud.google.com/storage/docs/gsutil/commands/config] for more
information about configuring Google Cloud Storage.
The Google Cloud CLI is configured and ready to use!

* Commands that require authentication will use kdevkr@gmail.com by default
* Commands will reference project `gws-cli-xxxxxx` by default
Run `gcloud help config` to learn how to change individual settings

This gcloud configuration is called [default]. You can create additional configurations if you work with multiple accounts and/or projects.
Run `gcloud topic configurations` to learn more.

Some things to try next:

* Run `gcloud --help` to see the Cloud Platform services you can interact with. And run `gcloud help COMMAND` to get help on any gcloud command.
* Run `gcloud topic --help` to learn about advanced features of the CLI like arg files and output formatting
* Run `gcloud cheat-sheet` to see a roster of go-to `gcloud` commands.

❯ gcloud auth list
 Credentialed Accounts
ACTIVE  ACCOUNT
*       kdevkr@gmail.com

To set the active account, run:
    $ gcloud config set account `ACCOUNT`
```

Google Cloud CLI 설치 및 프로젝트 생성을 완료했어요. 이제 Google Workspace CLI를 설치해 볼게요.

```ps
# brew install googleworkspace-cli
❯ npm install -g @googleworkspace/cli

❯ gws -V
gws 0.22.5
This is not an officially supported Google product.
```

> `gws -V` 명령어로 버전을 확인해 보면, 이 도구가 구글의 공식 지원 제품이 아님(`This is not an officially supported Google product.`)을 터미널에서 명시적으로 알려줘요.

## Google Workspace CLI 초기 설정

### gws auth setup

`gws auth setup` 명령어를 입력하면 총 5단계에 걸쳐 연동 설정을 진행해요. 가장 먼저 `gcloud CLI` 설치 여부를 확인하며, 이어서 진행되는 인증 단계(Step 2)에서는 사용하고자 하는 조직 워크스페이스 계정을 선택하게 됩니다.

![gws auth setup 계정 선택](/images/posts/gws-chat/002.png)

> 이때 `gcloud CLI`로 로그인해 두었던 계정을 골라 선택해주세요.

계정 선택을 마치면 이어서 ==Step 3/5: GCP project== 단계가 진행되며, `gws`와 연동하여 사용할 GCP 프로젝트를 터미널 프롬프트 목록에서 지정해 줍니다.

![gws auth setup GCP 프로젝트 선택](/images/posts/gws-chat/003.png)

그다음 단계(==Step 4/5: Workspace APIs==)에서는 제어하고 사용하고자 하는 워크스페이스 제품 API들을 활성화해요. 터미널 대화형 목록에서 필요한 API들을 체크해 주면 되는데, 이때 **already enabled** (이미 활성화되어 사용 중)인 API는 터미널 프롬프트 상에서 직접 체크를 해제(비활성화)할 수 없어요. 만약 기존에 사용 중이던 API를 비활성화하고 싶다면, [구글 클라우드 콘솔](https://console.cloud.google.com/)에 직접 접속하여 해당 API의 '사용 중지'를 설정해 주어야 합니다.

선택을 완료하고 나면 아래와 같이 연동 인증에 필요한 **OAuth 스코프(Scopes)** 를 선택하는 단계로 넘어가게 돼요.

![gws auth setup API 활성화](/images/posts/gws-chat/004.png)

그리고 나서 마지막 단계(==Step 5/5: OAuth credentials==)에서는 OAuth 동의 화면과 사용자 인증을 위한 OAuth 2.0 클라이언트를 구성하게 돼요.

터미널 가이드에 나와 있는 **Step A** 링크를 눌러 ==OAuth 동의 화면== 설정으로 진입해 주세요. **외부(External)** 사용자 유형으로 선택하여 동의 화면 구성을 마친 후, 반드시 **테스트 사용자(Test users)** 항목에 본인의 **조직 워크스페이스 계정** 을 추가 등록해 주어야 해요.

![GCP OAuth 동의 화면 설정](/images/posts/gws-chat/005.png)

> 나만 사용할 것이므로 앱 게시할 필요 없이 테스트 상태로 두면 돼요.

이어서 터미널의 **Step B** 링크를 누르면 구글 클라우드 콘솔의 사용자 인증 정보 화면으로 이동해요.

![GCP OAuth 클라이언트 ID 만들기](/images/posts/gws-chat/006.png)

> 여기서 상단의 **사용자 인증 정보 만들기** ➡️ **OAuth 클라이언트 ID**를 차례대로 선택해 줍니다.

그다음 애플리케이션 유형을 터미널 가이드(Step B)의 안내와 마찬가지로 **데스크톱 앱(Desktop app)** 으로 선택해 줍니다. 이때 알맞은 **앱 이름** 도 지정해주면 돼요.

![GCP OAuth 데스크톱 앱 선택](/images/posts/gws-chat/007.png)

> 여기서 설정한 앱 이름이 구글 스페이스 채팅에 메시지를 전송할 때 발신인 정보로 함께 표시돼요.

생성이 완료되면 **OAuth 클라이언트 생성됨** 다이얼로그가 나타나요. 화면에 표시된 **클라이언트 ID** 와 **클라이언트 보안 비밀번호(Client Secret)** 를 복사하여 `gws auth setup`을 진행 중인 터미널 프롬프트에 각각 순서대로 입력해 주면 됩니다.

이렇게 클라이언트 ID와 클라이언트 시크릿을 차례대로 입력하고 나면, ==gws auth setup== 도구가 알아서 ==gws auth login== 명령어를 수행하여 활성화한 API에 부합하는 OAuth 스코프 권한들을 골라 인증하는 단계로 넘어가게 돼요.

![OAuth 스코프 선택](/images/posts/gws-chat/008.png)

일단 기본 추천하는 스코프 목록으로 로그인을 시도해 보면, 다음과 같이 **액세스 차단됨** 화면과 함께 **400 오류: access_not_configured** 오류가 발생할 수 있어요. 공식 가이드의 [API not enabled / accessNotConfigured](https://github.com/googleworkspace/cli#api-not-enabled--accessnotconfigured) 에 설명된 것처럼, 이 오류는 선택한 스코프에 해당하는 API가 Google Cloud 콘솔 프로젝트에서 활성화되지 않았음을 의미해요. 또한, [Too many scopes / Consent screen error](https://github.com/googleworkspace/cli#too-many-scopes--consent-screen-error) 에 명시된 것처럼 OAuth 동의 화면이 테스트 상태인 앱은 최대 25개 이내의 스코프만 선택할 수 있으므로, 사용하려는 목적에 맞는 최소한의 권한들만 선택해 주어야 해요.

![OAuth 스코프 불일치 에러](/images/posts/gws-chat/009.png)

아무튼, 위와 같은 오류가 발생하면 사용하고자 하는 API에 맞는 최소한의 스코프만 선택해야 해요. 예를 들어 구글 챗 스페이스 조회, 멤버 목록 확인, 메시지 전송 등의 기능을 원활하게 수행하려면 다음 스코프들만 찾아서 선택해 주면 됩니다.

- **chat.messages**
- **drive**
- **chat.memberships.readonly**
- **chat.spaces.readonly**
- **userinfo.profile**

저는 구글 드라이브와 구글 스페이스, 그리고 채팅 메시지를 보낼 수 있는 권한만 다시 선택했어요. 필요한 스코프들을 스페이스바(Space)로 체크하여 활성화하고 엔터(Enter)를 눌러 확정하면 본격적인 로그인을 시작하게 돼요. 만약 나중에 다른 권한이 필요해서 스코프를 변경해야 한다면, 처음부터 setup 과정을 거칠 필요 없이 `gws auth login` 명령어만 다시 수행해서 권한을 재선택하면 돼요.

```ps
❯ gws auth login
Open this URL in your browser to authenticate:

  https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/chat.messages%20https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/chat.memberships.readonly%20https://www.googleapis.com/auth/chat.spaces.readonly%20https://www.googleapis.com/auth/userinfo.profile%20https://www.googleapis.com/auth/cloud-platform%20openid%20https://www.googleapis.com/auth/userinfo.email&access_type=offline&redirect_uri=http://localhost:10902&response_type=code&client_id=525123409154-2pj8kjsgmfholj2jkcrjcjlp0ucqujdv.apps.googleusercontent.com&prompt=select_account+consent
```

스코프가 올바르게 선택되면, 브라우저가 열리면서 다음과 같이 **OAuth 데스크톱 앱** 에 로그인하는 화면이 나올 거예요. 여기서 계정을 선택하고 나면, 터미널에서 선택한 OAuth 스코프에 따라 구글 계정으로의 액세스 권한 허용을 요청하는 화면이 나타나요.

![Google Workspace CLI 서비스로 로그인](/images/posts/gws-chat/010.png)

![액세스 권한 허용 요청](/images/posts/gws-chat/011.png)

모든 권한 항목을 확인하고 하단의 **허용** 버튼을 눌러요. 최종적으로 브라우저 탭 타이틀에는 **Success** 가 표시되고 화면에는 **"You may now close this window."** 문구만 달랑 나타나게 돼요. 브라우저 창을 닫고 다시 터미널을 확인해 보면 성공 정보와 함께 암호화된 크레덴셜이 로컬 OS의 Keyring 등에 안전하게 저장되었다는 결과가 출력되어 있어요.

```ps
Using keyring backend: keyring
{
  "account": "kdevkr@gmail.com",
  "credentials_file": "C:\\Users\\Mambo\\.config\\gws\\credentials.enc",
  "encryption": "AES-256-GCM (key in OS keyring or local `.encryption_key`; set GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file for headless)",
  "message": "Authentication successful. Encrypted credentials saved.",
  "scopes": [
    "https://www.googleapis.com/auth/chat.messages",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/chat.memberships.readonly",
    "https://www.googleapis.com/auth/chat.spaces.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/cloud-platform",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email"
  ],
  "status": "success"
}
```

일단 `gws` 명령어에 대한 인증 설정은 완료되었어요. 다만, 로그인 시 선택한 스코프 권한 범위에 따라 특정 명령어를 수행할 때 오류가 발생할 수 있어요. 특히 Google Chat API의 경우, [Google Cloud 콘솔](https://console.cloud.google.com/) 화면에서 구성(Configuration) 정보를 입력해 주어야 해요. **API 및 서비스** ➡️ **Google Chat API** ➡️ **구성** 메뉴로 이동하여 애플리케이션 정보를 적절히 설정하고 하단의 **저장(Save)** 을 클릭해 줍니다.

![Google Chat API 구성 설정](/images/posts/gws-chat/012.png)

예를 들어, ==People API== 를 사용해 조직 연락처 목록을 조회(==gws people== 하위 명령어)하거나, ==Chat API== 를 사용해 특정 스페이스 혹은 개인 DM으로 메시지를 전송(==gws chat== 하위 명령어)할 수 있어요. 특히 Claude Code나 Antigravity 같은 AI 에이전트가 `gws` 명령어를 더 효율적으로 사용할 수 있도록 [gws-chat](https://www.skills.sh/googleworkspace/cli/gws-chat), [gws-people](https://www.skills.sh/googleworkspace/cli/gws-people), [gws-drive](https://www.skills.sh/googleworkspace/cli/gws-drive) 같은 스킬(Skills)들을 추가해 두면 큰 도움이 될 거예요. 이제 `gws chat` 명령어만으로도 스페이스 내 멤버십 목록을 조회해서 조직 사용자들을 확인하고 스페이스에 메시지를 보낼 수 있어요.

### 기존 인증 및 토큰 캐시를 초기화 하세요

`gws auth login` 명령어를 다시 수행했는데 이전에 인증했던 정보나 스코프 설정이 갱신되지 않고 남아있어서 지속적으로 권한(403) 오류가 발생할 수 있어요. 따라서, ==gws auth login== 명령어를 호출하기 전에 로컬에 저장된 자격증명 캐시 파일들을 완전히 삭제하고 다시 인증을 진행하는 게 좋습니다.

::: code-group

```ps [Windows (PowerShell)]
Remove-Item -Path "$HOME\.config\gws\credentials.enc", "$HOME\.config\gws\token_cache.json" -Force -ErrorAction SilentlyContinue
```

```bash [macOS / Linux (Bash)]
rm -f ~/.config/gws/credentials.enc ~/.config/gws/token_cache.json
```

:::

## Chat API 테스트

Google Workspace CLI 설정이 성공적으로 완료되었다면 ==chat== API를 통해 참여하고 있는 구글 챗 스페이스 목록을 조회하거나 직접 메시지를 전송해볼 수 있어요. 다만, `gws` 명령어는 JSON 형식으로 요청과 응답을 주고받아야 하기 때문에 직접 테스트하기에 다소 번거로울 수 있어요. AI 에이전트에게 ==--dry-run== 옵션을 활용해서 테스트를 요청하는 방법도 좋은 대안이 될 거예요.

### 스페이스 목록 조회해보기

==gws chat spaces list== 명령어가 정상적으로 호출되면 다음과 같은 응답 결과를 확인할 수 있어요.

```ps
❯ gws chat spaces list
Using keyring backend: keyring
{
  "spaces": [
    {
      "createTime": "2026-05-30T14:00:26.378125Z",
      "customer": "customers/C01xxxxxx",
      "displayName": "Google Workspace CLI",
      "lastActiveTime": "2026-05-30T14:00:26.378125Z",
      "membershipCount": {
        "joinedDirectHumanUserCount": 1
      },
      "name": "spaces/xxxxxxxxxx",
      "spaceHistoryState": "HISTORY_OFF",
      "spaceThreadingState": "THREADED_MESSAGES",
      "spaceType": "SPACE",
      "spaceUri": "https://chat.google.com/room/xxxxxxxxxx?cls=11",
      "type": "ROOM"
    }
  ]
}
```

### 스페이스에 메시지 전송해보기

다음은 AI 에이전트가 스페이스에 메시지를 전송할 때 사용하는 명령어와 그 응답 결과예요.

```ps
❯ gws chat spaces messages create `
    --params '{"parent": "spaces/xxxxxxxxxx"}' `
    --json '{"text": "Hello! Test message from Antigravity AI assistant. 🚀"}'
Using keyring backend: keyring
{
  "argumentText": "Hello! Test message from Antigravity AI assistant. 🚀",
  "createTime": "2026-05-30T14:07:23.542159Z",
  "formattedText": "Hello! Test message from Antigravity AI assistant. 🚀",
  "name": "spaces/xxxxxxxxxx/messages/yyyyyyyyyy.yyyyyyyyyy",
  "sender": {
    "name": "users/11794553xxxx",
    "type": "HUMAN"
  },
  "space": {
    "name": "spaces/xxxxxxxxxx"
  },
  "text": "Hello! Test message from Antigravity AI assistant. 🚀",
  "thread": {
    "name": "spaces/xxxxxxxxxx/threads/yyyyyyyyyy"
  }
}
```

위 테스트 예시를 보면 직접 `gws` 명령어를 수행하기엔 어렵다고 느껴지죠. 심지어 윈도우 환경에서는 **따옴표 문제** 가 자주 발생해서 에이전트도 여러 번 명령어 호출을 실패하곤 했어요. 아무튼, 성공적으로 메시지가 전송되면 아래와 같이 조직 스페이스 채널에 메시지가 정상적으로 나타나는 것을 확인할 수 있어요.

![스페이스 메시지 전송 완료](/images/posts/gws-chat/013.png)

### 스페이스 멤버(Members) 멘션

구글 스페이스 채팅 메시지에 조직 사용자를 멘션하려면 `users/123456789012345678901`와 같은 숫자 ID 형태로 전달해야 해요. 이때, 에이전트가 스페이스 멤버 목록을 조회해서 ID를 확인하려고 할 때 오류가 발생할 수 있어요. 멤버십 목록을 성공적으로 불러오려면 **OAuth 인증 로그인** 진행 시 Chat 멤버십 관련 스코프인 다음의 두 개 중 하나를 선택한 뒤 로그인을 수행해야 해요.

- https://www.googleapis.com/auth/chat.memberships.readonly
- https://www.googleapis.com/auth/chat.memberships

```ps
❯ gws chat spaces members list --params '{"parent": "spaces/xxxxxxxxxx"}'
Using keyring backend: keyring
{
  "memberships": [
    {
      "createTime": "2026-05-30T14:00:26.378125Z",
      "member": {
        "name": "users/11794553xxxx",
        "type": "HUMAN"
      },
      "name": "spaces/AAQAyYAkdZY/members/11794553xxxx",
      "role": "ROLE_MANAGER",
      "state": "JOINED"
    }
  ]
}
```

AI 에이전트 시대가 되었지만, 여전히 직접 문제를 겪으며 해결 방안을 찾아가는 과정이 필요한 것 같아요. 에이전트가 스스로 여러 번 시도하며 오류를 극복해 나가는 모습을 지켜보는 것도 참 인상 깊은 경험이었어요.

감사합니다.
