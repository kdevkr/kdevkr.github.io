---
title: OPENSSH-RSA 개인키를 RSA 개인키로 변경하기
date: 2023-04-23
---

OpenSSL 라이브러리를 통해 SSH 접속을 위한 키 페어를 발급하는 경우에 기본적으로 RSA 형식의 키 페어가 생성되어도 실제로는 OPENSSH PRIVATE KEY로 저장되게 된다. RSA PRIVATE KEY로 저장되기 위해서는 -m 옵션으로 PEM을 지정해야 한다.

```shell
# ----- OPENSSH PRIVATE KEY -----
ssh-keygen -t rsa -b 2048 -C "mambo" -N ""

# ----- RSA PRIVATE KEY -----
ssh-keygen -t rsa -b 2048 -m PEM -C "mambo" -N ""
```

일본 고객으로부터 자체적으로 구축한 서버에 접속하기 위한 계정과 개인키 PEM 파일을 받아보니 OPENSSH 형식으로 저장되어있음을 확인하였다. 그러나, SecureCRT를 사용해서 서버에 처음으로 연결하려고 했을때 키 형식이 올바르지 않다는 오류가 발생하며 접속에 실패하였다.

```txt
-----BEGIN RSA PRIVATE KEY-----
[KEY CONTENT]
-----END RSA PRIVATE KEY-----
```

OPENSSH PRIVATE KEY로 저장되어있는 것을 RSA PRIVATE KEY로 변경하고 시도해보니 정상적으로 연결이 되었으며 자세한 원인은 모르겠으나 2FA 인증을 설정하고 나서는 OPENSSH PRIVATE KEY로 저장되어있는 PEM 파일로도 연결이 정상적으로 연결을 할 수 있는 상황이 되었다.

#### OpenSSH 개인키를 RSA 개인키로 변환
아무튼, RSA PEM 형식으로 다시 만들어달라고 요청하기에는 시간이 많이 소요될 수 있으므로 OPENSSH 형식으로 되어있는 RSA 개인키를 RSA PEM 형식으로 변환해보도록 하자.

```shell
ssh-keygen -t rsa -b 2048 -C "mambo" -N "" -f openssh.pem

# cat ~/.ssh/id_rsa
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAw4o9aOfBCkCzsuz3hMJT/v058pMki16Ft56tim4r5mJRbBd0EQPJ
3gm1FiJmp0fqrnJo+H3o4hBH0LlCbeXiXHloPnTi1JZTSzWat1ItcBG+xezx8BdmtKqdTy
PWfYL9ujLse5AAXkvVHhYHJ7koV72X9whH94Tci4zAEHRypKbuz+9lj5P94u1n/nYAt2PT
JmdP/Y+62qFiSGhKEh/Jed5TVvIrabOi+qcHQ0VmcXkTGiOTXLTmHMbce26dqsGRRb4YPf
1alXECX28b8QpbarlXHPeGJyQ5d8dxEhsOz60LDoUEy/ytn0gIrP0+Ro2aS9N73JVdTXKu
FFQRyHMP0QAAA8DEFEvUxBRL1AAAAAdzc2gtcnNhAAABAQDDij1o58EKQLOy7PeEwlP+/T
nykySLXoW3nq2KbivmYlFsF3QRA8neCbUWImanR+qucmj4fejiEEfQuUJt5eJceWg+dOLU
llNLNZq3Ui1wEb7F7PHwF2a0qp1PI9Z9gv26Mux7kABeS9UeFgcnuShXvZf3CEf3hNyLjM
AQdHKkpu7P72WPk/3i7Wf+dgC3Y9MmZ0/9j7raoWJIaEoSH8l53lNW8itps6L6pwdDRWZx
eRMaI5NctOYcxtx7bp2qwZFFvhg9/VqVcQJfbxvxCltquVcc94YnJDl3x3ESGw7PrQsOhQ
TL/K2fSAis/T5GjZpL03vclV1Ncq4UVBHIcw/RAAAAAwEAAQAAAQA50f/UrGrtkDJS3zVV
wWy7AsAG1bHBsGKT6EzimS9MAZiYANtmSJuBl5c/g06demuPx+74Q6sAZdYGhzF4c7iapZ
/IkCGewRDCNYiZWqhq8iRaPHVSDGlnVOgNRcif9oL2cyZwZyVkvMG5EsRs35hpUXvFJWK6
c0QP07/bXcOkod+XlvWXwJ9hkwoakC3kKYSLsdil3rKqTapaNg3edcJb0/0Nx4gW24hO1m
0hevoN0rJuzoMf/uK0hwazyZbE4H1q39StWrFrGz+zp6yHkC3Els6W+ExOHUeTEaE+ya8F
R9MOcmrECgePxDFBnlPVumk0SIJ+NRQjH3ArpNvp1ZrdAAAAgQCc4jOZ9zBOpeP4ZyT2OF
Y7E9J8jA/nlsoI164TuJYK1fiv5WH2x3SN95vt1s8R9cUzznA2IWbCRs4Nei34STlTReBk
pfWyg3Skp3FcYIyR2lpQX/7utfPd3X8KpUYR01E1RPgequyyixDtJjguVsrimoz81vF9y7
Q0/ueO3iBmSgAAAIEA6nFTFA9oOzQyM3zgQgt8J9lW8/XjFIF3LZRhu0e0xlsmv54OsGag
17zAOR5cfj7hUzQcGTWJRSHv95gDLJmSgourNRUlPZcZ8AdZCGD8GEwXr1dh2d7Qk3UT2j
wDKS0IFNM6UX67CKSdYK/YFLAv3gtPEgrZ43ec1W6zlHUWmusAAACBANWFKfE3Ky1ubomZ
IovLa0XUs2h9rSUMDX3Su+Es/0x+qHP0bq2JKWTzVWoa0NgfnPAVJo/Fd8NVhIMs1od6iB
O3Kgz7A2Esg5sOtkK06nwSYMcfXMyuf+7fj0v0nBtjVH6EdOrU0muH4vvtxiYcw2N4cI+5
Fnns05+DCtL4o9kzAAAABW1hbWJvAQIDBAU=
-----END OPENSSH PRIVATE KEY-----
```

OPENSSH PRIVATE KEY로 저장되어있음을 확인하였으니 아래의 명령어들을 실행하여 변환되는지 확인해보면 된다.

```shell
# [1] OpenSSH
sudo ssh-keygen -p -m PEM -f openssh.pem

# [2] OpenSSL
openssl rsa -in openssh.pem -outform pem > openssh-rsa.pem

# [3] Putty
puttygen openssh.pem -O private-openssh -o openssh-rsa.pem
```

#### [1] OpenSSH
```powershell Windows Terminal
ssh-keygen -p -m PEM -f openssh.pem

Failed to load key openssh.pem: invalid format
```

첫번째 OpenSSH 명령어를 이용하는 방법은 가상 환경에 실행한 우분투 리눅스에서는 정상적으로 변환된 반면에 윈도우 터미널에서는 알 수 없는 형식이라는 오류 메시지와 함께 실패하였다.

#### [2] OpenSSL 💥
```shell
openssl rsa -in openssh.pem -outform pem > openssh-rsa.pem

unable to load Private Key
140038194394432:error:0909006C:PEM routines:get_name:no start line:../crypto/pem/pem_lib.c:745:Expecting: ANY PRIVATE KEY
```

두번째 OpenSSL 라이브러리를 이용하는 방법은 ChatGTP에서 알려준 것인데 OpenSSH는 OpenSSL 라이브러리를 활용하기는 하나 OpenSSH 프로그램에서 인식하는 형식이므로 변환하는 과정에서 오류가 발생하였다.

#### [3] Putty 🍀
```shell
# [Mac] brew install putty
# [Ubuntu] apt install putty-tools
puttygen openssh.pem -O private-openssh -o openssh-rsa.pem
```

세번째 방법은 PuTTYgen을 이용하는 것으로 윈도우 환경에서는 커맨드라인 옵션을 인식하지 못한 관계로 PuTTYgen(PuTTY Key Generator)을 실행한 후 Conversions 메뉴의 Import Key로 불러온 후 Export OpenSSH Key로 저장하면 RSA PRIVATE KEY로 변환할 수 있었으며 우분투 리눅스에서는 커맨드라인으로 별다른 문제없이 변환할 수 있다.

![Conversions > Import Key](/images/posts/convert-openssh-private-to-rsa/01.png)

![Conversions > Export OpenSSH Key](/images/posts/convert-openssh-private-to-rsa/02.png)

개인적으로는 오래된 내용이지만 한번 하고나서는 더이상 다루지 않는 정보이기에 잊어버릴 것 같아 기록으로 남기고자 공유한다.