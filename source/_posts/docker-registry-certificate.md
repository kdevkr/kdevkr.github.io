---
title: x509 certificate signed by unknown authority
date: 2022-02-26
tags:
- Docker Registry
- Harbor
- Certificate
---

> Error response from daemon: Get https:\/\/registry.domain.com/v2/: x509: certificate signed by unknown authority

생각보다 많은 조직에서 사내 정책이나 도커 허브의 [다운로드 제한량](https://docs.docker.com/docker-hub/download-rate-limit/)을 경험하고 도커에서 제공하는 [레지스트리 이미지](https://hub.docker.com/_/registry)로 사설 도커 레지스트리 서버를 구축하는 것 같습니다. 위 오류는 도커 레지스트리 서버에 로그인을 시도할 때 나타날 수 있습니다. 우리가 사용하는 도커 엔진이라고하는 클라이언트가 도커 레지스트리 서버가 전달해준 인증서를 신뢰할 수 없다는 의미입니다. 그러면 위와 같이 내 컴퓨터에 설치된 도커 엔진에서 사설로 구축한 도커 레지스트리 서버의 인증서를 신뢰할 수 없는 문제가 발생하면 어떻게 해결하는지를 알아보도록 하죠.

## 도커 레지스트리 인증서
도커 엔진에서 참조하는 레지스트리 서버에 대한 인증서 폴더는 **certs.d** 입니다.

- Windows: C:/ProgramData/Docker/certs.d/
- Linux: /etc/docker/certs.d/
- Mac: ~/.docker/certs.d/

```sh
    /etc/docker/certs.d/         <-- Certificate directory
    └── registry.domain.com:5000 <-- Hostname:port
       ├── client.cert           <-- Client certificate
       ├── client.key            <-- Client key
       └── ca.crt                <-- Certificate authority that signed the registry certificate
```

### 안전하지 않은 레지스트리
HTTPS로 실행된 도커 레지스트리 서버에 대해서 도커 엔진이 신뢰할 수 없는 인증서를 무시하도록 [insecure-registries](https://docs.docker.com/registry/insecure/)옵션을 지정할 수 있습니다. 다만, 이 방법은 해당 도메인 주소의 레지스트리 서버가 올바른 인증서를 사용하는지 검증하지 않기 때문에 보안적인 부분을 생각한다면 일반적으로 사용해서는 안되는 방법입니다.

### 신뢰할 수 있는 인증 기관
도커 엔진은 기본적으로 시스템에 등록된 신뢰할 수 있는 인증 기관의 인증서 목록으로 도커 레지스트리 서버의 클라이언트 인증서를 검증합니다. 이는 크롬과 같은 브라우저에서 HTTPS 통신 시 서버에서 전달하는 인증서가 유효한지를 확인하는 것과 다르지 않습니다. 저는 **신뢰할 수 있는 인증 기관으로부터 발급받은 도메인 인증서를 사용**하여 도커 레지스트리 서버를 구축하였는데도 불구하고 도커 엔진에서는 회사 도메인 주소로된 도커 레지스트리 서버에서 전달된 인증서가 올바르지 않다며 동일하게 `x509: certificate signed by unknown authority` 오류를 알려주었습니다.

### CA 인증서 체인
도커 엔진에서 레지스트리 서버의 인증서를 신뢰할 수 없다는 것은 몇가지 사항에 대한 의미를 가질 수 있습니다. 첫번째로, 도커 레지스트리 서버 구축 시 사용한 CA 인증서가 클라이언트 인증서와 인증 기관들에 대한 인증서가 연결된 CA 인증서 체인이 아닐 수 있다는 것입니다. 실제로 지금은 UI 기반의 사용자 및 이미지 관리를 위해 [Harbor](https://goharbor.io/)로 도커 레지스트리 서버를 재구축하였으나 기존 도커 레지스트리 서버에 사용된 CA 인증서 파일에는 클라이언트 인증서만 존재했던 문제가 있었습니다. 그래서 조직 내 개발자들에게 레지스트리 서버에서 사용된 CA 인증서 파일과 클라이언트 인증서 및 키를 전달하고 도커 레지스트리 인증서 폴더에 저장하여 사용해달라고 안내했었습니다. 결국은 도커 엔진이 도커 레지스트리 서버를 신뢰할 수 없으므로 CA 인증서 체인을 신뢰할 수 있는 인증서 목록에 포함시키면 됩니다.

예를 들어, [Mac용 키체인 접근을 사용하여 키체인에 인증서 추가하기](https://support.apple.com/ko-kr/guide/keychain-access/kyca2431/mac)에 따라 CA 인증서를 추가하면 다음과 같이 유효한 인증서임이 표시됨을 확인할 수 있었습니다.

![](/images/posts/docker-registry-certificate/trust-certificate.png)

```sh
docker login registry.domain.com -u 'username' -p 'password'
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
Login Succeeded
```

> 도커 레지스트리 서버의 CA 인증서 체인을 시스템 인증서로 등록하고나서는 도커 엔진이 신뢰할 수 있는 인증서 목록에 따라 인증서가 유효함을 확인함으로 정상적으로 HTTPS 통신이 이루어지고 로그인에 성공하였습니다. 레지스트리 서버에 대한 로그인 예시이므로 CLI 경고 문구는 무시해주세요.

#### 시스템 및 사용자 정의 CA 인증서 병합
_On Linux any root certificates authorities are merged with the system defaults, including the host’s root CA set. If you are running Docker on Windows Server, or Docker Desktop for Windows with Windows containers, the system default certificates are only used when no custom root certificates are configured._

[공식문서](https://docs.docker.com/engine/security/certificates/#understand-the-configuration)에 따르면 위와 같이 사용자 정의 인증서(certs.d)는 시스템 인증서와 CA 인증서가 합쳐져서 등록된다는 내용이 있습니다. 따라서, 도커 레지스트리 서버의 CA 인증서 체인을 **시스템 인증서 목록**이나 **certs.d** 폴더에 두면 된다는 이야기입니다. 실제로 시스템 인증서로 등록하지 않아도 certs.d 폴더에 ca.crt라는 이름으로 CA 인증서 체인을 두게되면 동일하게 동작함을 확인할 수 있었습니다.

> 한가지 흥미로운 점은 이 글을 작성하기 위해 Docker Desktop for Windows 에서도 테스트를 해본 결과 도커 레지스트리 서버의 CA 인증서 체인을 굳이 등록하지 않아도 정상적으로 로그인이 되었다는 점입니다. 이점으로 보았을때 모든 운영체제에서 동일하게 동작하지는 않는 것 같아보입니다. 따라서, 도커 엔진에서 레지스트리 서버를 신뢰할 수 없다고 한다면 레지스트리 서버 관리자에게 인증서 체인을 전달받아서 등록하는게 좋을 것 같습니다.

감사합니다.