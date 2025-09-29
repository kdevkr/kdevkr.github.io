---
title: 비밀번호 재설정 절차
date: 2024-03-22T22:00+0900
---

비밀번호 찾기는 대부분의 시스템에서 사용자에게 반드시 요구되는 기능이다. 오래된 레거시 시스템이 아닌 이상 사용자 계정에 대한 비밀번호는 복호화가 불가능하도록 단방향 암호화된 값으로 데이터베이스에 저장된다. 그래서 실질적으로 **비밀번호 찾기 자체의 요구사항은 구현할 수 없다.** 회원가입 시 입력한 비밀번호를 찾을 수는 없으므로 대부분 비밀번호 없이 본인 인증을 통해 로그인할 수 있게 하거나 비밀번호를 재설정할 수 있는 방법을 제공한다.

- https://github.com/password_reset
- https://account.samsung.com/accounts/odchb/resetPasswordGate
- https://sslmember2.gmarket.co.kr/FindPW/FindPW
- https://www.jobplanet.co.kr/users/password/new

#### 비밀번호 재설정 또는 초기화

비밀번호 재설정 절차에 대해서 더 자세하게 알아보도록 하자.

1. 비밀번호를 찾고자하는 사용자에게 아이디 또는 이메일 입력을 요구
2. (Optional) 무분별한 요구를 제한하기 위해서 캡차 또는 [요청 제한량](https://www.baeldung.com/spring-bucket4j)을 구현
3. 사용자에게 **인증**할 수 있는 **[URL 토큰](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html#url-tokens)** 링크를 제공
4. (Optional) URL 토큰과 함께 인증 코드 입력을 요구
5. 사용자가 비밀번호 변경을 **완료**했다면 URL 토큰은 즉시 **만료**
6. 사용자에 의해 비밀번호가 변경되었음을 별도 **알림** 제공

> URL 쿼리스트링에 포함되는 인증 정보는 JWT 토큰을 사용하지 않는게 일반적입니다.

유튜브 [제미니의 개발실무](https://www.youtube.com/watch?v=b5xWS8MYl0Q)에서 개발 요구사항에 대해 그대로 구현하는게 아니라 개발자 입장에서 필요하거나 고려되어야할 부분에 대해서 체크하는 것도 개발자의 역량이라는 부분을 이야기하는 것을 보고 대부분의 시스템에서 요구하는 **비밀번호 찾기**에 대해서 살펴보았다.
