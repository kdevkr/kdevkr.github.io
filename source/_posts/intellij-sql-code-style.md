---
title: 인텔리제이 SQL 코드 스타일
date: 2023-12-02T14:00+0900
tags:
- SQL
- Code Style
---

인텔리제이 얼티메이트 버전에서는 데이터베이스 대한 기능을 내장하고 있고 [SQL 코드 서식](https://www.jetbrains.com/help/idea/settings-code-style-sql.html)에 대한 포맷팅 기능도 제공해주고 있다. 하지만, 기본적인 SQL 코드 스타일에서는 키워드나 컬럼 유형에 대해서는 대문자로 변경해주지 않는데 개인적으로 키워드들은 대문자로 표현하는 것을 선호하는 편이므로 이에 대한 설정 방법을 공유하고자 한다.

#### SQL 코드 스타일 설정하기

![Case → Word Case](/images/posts/intellij-sql-code-style/01.png)  

코드 스타일 설정 메뉴에서 [The Database Tools and SQL plugin](https://www.jetbrains.com/help/idea/configure-the-sql-code-style.html) 에 대한 코드 서식을 지정할 수 있다. `설정 → 에디터 → 코드 스타일 → SQL → 일반` 에서 키워드를 대문자로 설정하는 옵션을 찾아볼 수 있다. 위 이미지는 키워드를 대문자로 설정하고 컬럼 유형을 키워드로 인식될 수 있도록 변경한 것을 보여준다.

#### (Optional) SELECT 쿼리 시 콤마 위치 선택하기 🤔

![Queries → Place comma](/images/posts/intellij-sql-code-style/02.png)  

`Queries → Common → Place comma` 옵션으로 SELECT 쿼리 시 결과물이 되는 필드에 대해서 콤마 위치를 앞에 오도록 선택할 수 있다. 개발자마다 선호하는 스타일이 다를 수 있는데 개인적으로 콤마가 앞에 오는 경우 복사 및 붙여넣기 시 들여쓰기 이슈가 발생할 수 있어 콤마가 뒤에 오도록 작성하는 편이다.

SQL 코드 포맷팅을 많이 수행해왔지만 최근까지도 나는 대/소문자 변환 단축키를 사용해서 이쁘게 키워드 부분들을 변환해왔다. 나와 같은 개발자가 있었다면 불편함에서 벗어나길 바란다.
