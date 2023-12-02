---
title: 서버 시간 동기화
date: 2023-12-01T14:00+0900
tags:
- NTP
- chrony
---

오늘은 개발자에게도 중요한 서버 시간에 대한 동기화를 알아보도록 하자. AWS 클라우드에 의존하는 개발자들은 [Amazon Time Sync Service](https://aws.amazon.com/ko/blogs/korea/keeping-time-with-amazon-time-sync-service/)를 참조하도록 설정된 EC2 인스턴스를 활용하고 있기 때문에 시간 동기화에 대해 신경써야할 부분은 적다. 하지만, 클라우드 시대에 살고 있지만 많은 이유로 인하여 온-프레미스 환경에서 동작해야하는 시스템은 상당히 많다. 온-프레미스 인프라 구성에서는 인터넷 통신이 제한되는 경우가 많기 때문에 자체적인 타임 서버를 구성하고 의존하도록 되어있을 것이다.

신규 프로젝트를 마무리하기 위해 검수하는 과정에서 전달받은 피드백 중 하나는 기존에 사용하고 있던 시스템의 데이터 시간과 일치하지 않는다는 것이었는데 이것은 보안 상의 이유로 개발중인 시스템이 본래 시스템의 네트워크에 연결되도록 고려하거나 계약되지 않았기 때문이다. 따라서, 인터넷 통신이 되지 않으므로 공개적인 NTP 서버와의 통신이 불가능하므로 컴퓨터 메인보드에 존재하는 RTC(Real Time Clock) 에 의존하고 있을 것이기에 조금씩 시간 차이가 많이 나게 될 수 있다.

#### [Linux 인스턴스의 시간 설정](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/set-time.html#configure-amazon-time-service-ubuntu)

- `timedatectl`: 시간 정보
- `chronyc tracking`: 시간 동기화 지표
- `chronyc -a makestep`: 즉시 동기화

리눅스에서 어떻게 시간을 동기화하고 있는지 확인하고자 하는 경우 `timedatectl` 명령어를 사용할 수 있다. 아래와 같이 시스템 클럭에 동기화되며 NTP 서비스도 활성화되어있음을 알 수 있다. 만약, NTP 서버 주소를 추가하거나 변경했는데 반영되지 않는다면 즉시 동기화 명령어를 수행해보자.

```sh
# 시간 정보
$ timedatectl
               Local time: Fri 2023-12-01 11:57:48 UTC
           Universal time: Fri 2023-12-01 11:57:48 UTC
                 RTC time: Fri 2023-12-01 11:57:49    
                Time zone: Etc/UTC (UTC, +0000)       
System clock synchronized: yes                        
              NTP service: active                     
          RTC in local TZ: no

# 동기화 지표
$ chronyc tracking
Reference ID    : 0356046A (ec2-3-86-4-106.compute-1.amazonaws.com)
Stratum         : 5
Ref time (UTC)  : Fri Dec 01 12:04:57 2023
System time     : 0.000258254 seconds fast of NTP time
Last offset     : -0.000113504 seconds
RMS offset      : 0.002757813 seconds
Frequency       : 451.939 ppm slow
Residual freq   : +0.044 ppm
Skew            : 22.140 ppm
Root delay      : 0.185094610 seconds
Root dispersion : 0.001233191 seconds
Update interval : 16.5 seconds
Leap status     : Normal

# 즉시 동기화 수행
$ chronyc -a makestep


# chrony 설정 파일
$ cat /etc/chrony/chrony.conf
...
server time.aws.com prefer iburst minpoll 4 maxpoll 4
pool 1.kr.pool.ntp.org iburst
pool 1.asia.pool.ntp.org iburst
pool 2.asia.pool.ntp.org iburst
server time.bora.net iburst
server time.google.com iburst
...

```

#### [윈도우 서버 동기화하기](https://customer.gabia.com/manual/cloud/7700/7720)

만약, 윈도우 서버를 사용하고 있다면 `시간 및 날짜 설정` 기능에서 `인터넷 시간 서버`를 변경하도록 하자. 그리고 더 자세한 설정이 필요하다면 관련 레지스트리 설정을 검색해서 적용해야한다.

#### 시간 동기화 관련 깨알지식

컴퓨터 메인보드에는 하드웨어 시계를 위해 시간 정보를 저장하는 RTC(Real Time Clock) 배터리가 존재한다. 자동차 블랙박스에서도 RTC 배터리를 내장하고 있고 (GPS 연동이 없는 경우) 시간이 조금씩 맞지 않는 문제를 경험할 수 있다. 그리고 타임 서버 구성을 위한 시간 동기화용 GPS 서버도 있다.
