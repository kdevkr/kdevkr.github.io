---
title: 재부팅 시 Crontab에 의해 프로세스를 자동으로 실행하기
date: 2022-05-06
tags:
- Autorun
- Crontab
- Interactive Shell
---

> 🤪 재부팅 시 Crontab에 의해서 프로세스가 자동으로 실행되지 않은 이유

크론탭(Crontab)은 리눅스에서 일정된 시점이나 주기적으로 명령어 또는 쉘 스크립트를 실행할 수 있는 스케줄러 또는 타이머입니다. 이전에 작성한 [리눅스에서 프로세스 실행 유지하기](/maintaining-process-execution-in-linux)에서도 크론탭으로 프로세스를 실행하는 방법에 대해서 다루어본 적이 있습니다. 서버 시스템이 예기지 않은 상황에 의해서 재부팅되거나 종료되어 수동으로 실행될 수도 있으므로 Systemd 또는 Crontab으로 프로세스를 자동으로 실행할 수 있다고 공유했었습니다. 

그런데 얼마전에 특정 고객 환경의 서버들을 고객이 지진과 같은 예기치 않은 장애로 인해서 서버가 재부팅되는 상황에서 프로세스가 자동으로 실행될 수 있음을 테스트하던 중 서버가 재부팅될 때 자동으로 실행되었어야할 프로세스들이 시작되지 않는다는 피드백이 전달되었습니다. 실제로 시스템이 재부팅될 때 프로세스가 자동으로 실행되지 않았음을 확인하였고 크론탭과 쉘 스크립트에 대한 이해가 부족했다는 점을 확인했습니다.

저는 서버에 대한 부분을 전문적으로 관리하는 서버 엔지니어는 아니므로 필요한 부분을 검색한 후 정리된 바를 토대로 작업을 할 수 밖에 없습니다. Crontab에 의해서 프로세스가 자동으로 실행되기 위해서 검토하지 않은 부분이 무엇인지를 공유해보겠습니다.

## Crontab
크론탭에 대한 메뉴얼 페이지를 살펴보면 [EXTENSIONS](https://man7.org/linux/man-pages/man5/crontab.5.html#EXTENSIONS)으로 시스템이 재부팅되었을때 실행할 수 있도록 시간을 지정할 수 있는 별칭이 있다는 것을 확인할 수 있습니다. [Crontab Reboot: How to Execute a Job Automatically at Boot](https://phoenixnap.com/kb/crontab-reboot)와 같은 글에서도 간단하게 @reboot을 사용하면 시스템이 부팅되었을때 스크립트를 실행할 수 있다고 정리되어있습니다. 그래서 단순히 @reboot를 지정하기만 하면 시스템이 재부팅되었을때 정상적으로 쉘 스크립트가 실행될 것이라고 예상하였습니다.

### Interactive and Non-Interactive Shell
제가 검토하지 않은 부분은 쉘 스크립트가 실행되는 방식이 다양하다는 것에 있습니다. 일반적으로 SSH 접속으로 실행되는 쉘은 로그인 쉘입니다. 로그인 쉘 및 Bash로 실행되었을때는 다음과 같은 파일들이 자동으로 로드된다는 특징이 있습니다.

- /etc/profile
- ~/.bash_profile
- ~/.bashrc
- ~/.profile

일반적으로 쉘 스크립트를 작성하고 실행해보았을때는 로그인 쉘을 통해 실행하기 때문에 실행 스크립트에서 참조하는 많은 환경변수가 올바르게 지정되어있다는 것이 보장됩니다. 그러나 Crontab에 의해서 자동으로 실행되는 스크립트는 로그인 쉘에서 수행되는 것이 아니므로 환경변수가 제대로 지정된다는 것을 보장할 수 없는 문제를 간과한 것입니다.

### 사용자 기본 쉘
쉘 스크립트에 셔뱅(#!)을 Bash로 지정하더라도 크론탭에 의해서 실행되는 쉘 유형은 사용자의 기본 쉘로 고정됩니다. SSH 접속 후 로그인 쉘 상태로 스크립트를 실행하면 현재 쉘이 Bash인 것을 확인할 수 있습니다. 그러나, 리부트 명령을 수행하고나서 크론탭에 의해서 실행된 스크립트에 대한 로그를 확인하면 Bash가 아닌 기본 쉘이라고 기록되어있습니다.

```shell
./a.sh
SHELL: /bin/bash

# reboot with #!/bin/bash
tail a.log
SHELL: /bin/sh

# reboot with #!/bin/bash --login
tail a.log
SHELL: /bin/sh

# crontab -e && SHELL=/bin/bash
SHELL: /bin/bash
```

위 결과를 토대로 쉘 스크립트에서 셔뱅과 함께 로그인 쉘 옵션을 활성화하는 것과 상관없이 사용자의 기본 쉘을 변경하거나 크론탭 설정 시 쉘을 지정하도록 하여야한다는 것을 확인할 수 있습니다. 

### 환경변수 파일
쉘 스크립트에서 로그인 쉘 옵션(--login)을 지정하는 것은 정해진 환경변수 파일을 로드하기 위한 방법입니다. 다만, 로그인 쉘이 적용되었기에 다음과 같이 ~/.bashrc는 로드되지 않는 것을 확인할 수 있습니다.

```shell
#!/bin/bash --login

tail a.log
Loaded /etc/profile
Loaded .profile
SHELL: /bin/bash
```

> 크론탭에 의해서 쉘 스크립트가 실행될 때에는 Non-Interactive Shell 방식으로 동작한다는 점을 인지해야합니다. 이는 로그인 쉘 옵션을 지정해도 .bashrc 파일이 로드되지 않았음을 확인할 수 있습니다.

결과적으로, 재부팅시에도 크론탭에 의해서 쉘 스크립트를 통해 프로세스가 자동으로 실행되기 위해서는 다음의 방안 중에서 환경 변수가 올바르게 로드될 수 있도록 별도의 작업을 수행해야합니다.

1. .profile에 환경 변수를 지정한 경우 --login 옵션 고려
2. .bashrc 또는 .bash_profile에 환경 변수를 지정한 경우 파일을 직접 명시하여 로드
3. 프로세스 실행 시 필요한 환경변수를 수동으로 지정하는 스크립트 로드

크론탭에 의해서 쉘 스크립트가 정상적으로 실행되지 않는다면 알맞은 쉘과 환경변수가 올바르게 로드되는 방식을 취하였는지 검토하시기 바랍니다.

## 참고

- [Shell Scripting – Interactive and Non-Interactive Shell](https://www.geeksforgeeks.org/shell-scripting-interactive-and-non-interactive-shell/)
- [crontab(5) — Linux manual page](https://man7.org/linux/man-pages/man5/crontab.5.html)










