---
title: 파이썬
date: 2025-08-03T20:00+09:00
tags:
- Python
---

개인적으로 파이썬을 좋아하지 않는다. 그러나, AI 시대에 있어 파이썬을 언제까지나 기피할 수 없다. 비록 파이썬으로 개발하지 않더라도 파이썬 코드를 보고 이해할 수 있는 역량을 키워보자. 파이썬은 개발자 보다는 DevOps 엔지니어 또는 QA 엔지니어 그리고 데이터 분석 엔지니어가 많이 활용한다. 

#### 파이썬 인터프리터

파이썬은 컴파일 단계를 거치지 않고 코드를 한줄씩 그대로 파이썬 인터프리터에 의해 코드가 실행된다. 기본적인 파이썬 인터프리터는 CPython 이며, pip 또는 uv 는 파이썬에서 사용할 수 있는 패키지 매니저이다. 파이썬 개발자가 아니기 때문에 파이썬 인터프리터가 정확히 어떤 과정으로 코드를 실행하는지는 자세히 알 필요는 없어보인다. 

#### 모듈 디렉토리

파이썬은 변수 또는 함수 그리고 클래스 등을 하나의 .py 파일에 정의하여 다른 파일에서 불러올 수 있도록 모듈화한다. 웹 애플리케이션 작성을 위해 FastAPI 패키지를 설치하면 모듈을 가져와서 실행하게 된다. 모듈 파일이 존재하는 디렉토리에 `__init__.py` 파일이 존재하면 해당 폴더는 패키지로 취급된다. [Best Practices](https://github.com/zhanymkanov/fastapi-best-practices) 프로젝트 코드를 찾아보면 파일 구조 상에 이 파일이 없을 수 있는 걸 볼 수 있는데 생략이 가능한 것으로 보인다.

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def index():
    return {"Hello": "World"}
```

#### 데코레이터

파이썬에서 [데코레이터](https://refactoring.guru/ko/design-patterns/decorator/python/example)는 다른 함수를 래핑하는 패턴이다. FastAPI에서 라우터를 등록할 때 사용하거나 [Cache를 통해 파이썬 성능을 향상시키는데](https://devocean.sk.com/blog/techBoardDetail.do?ID=165900) 사용할 수 있다. 다음과 같은 타이밍 데코레이터는 함수의 실행 시간을 측정하여 성능 이슈가 내재된 구간을 찾는데 도움이 된다.

```python
import functools
import time

def timing_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"함수 '{func.__name__}' 실행 시간: {end_time - start_time:.4f} 초")
        return result
    return wrapper

@timing_decorator
def example_function(n):
    total = 0
    for i in range(n):
        total += i
    return total

if __name__ == '__main__':
    example_function(10000000)
```

#### SQLAlchemy vs SQLModel

[SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)은 파이썬에서 사용할 수 있는 ORM 라이브러리로 SQLite 와 같은 데이터베이스와 통신할 수 있다 . FastAPI 에서 제공하는 [SQLModel](https://sqlmodel.tiangolo.com/) 은 SQLAlchemy 기반에서 Pydantic 이 결합된 기능을 지원한다. SQLModel 을 제대로 사용하기 위해서는 SQLAlchemy 를 먼저 학습하는 것이 좋을 것 같다.  다음은 AWS IoT Core 에서 발급받은 IoT 클라이언트 인증서를 저장할 수 있는 테이블을 정의해본 것이다.

```python
from datetime import datetime
from sqlmodel import Field, Session, SQLModel, create_engine, Column, LargeBinary
from sqlalchemy.dialects.sqlite import insert


class IoT(SQLModel, table=True):
    __tablename__ = "iot"
    __table_args__ = {"sqlite_autoincrement": True, "comment": "AWS IoT Thing"}

    id: int = Field(default=None, primary_key=True)
    client_id: str = Field(nullable=False, unique=True)
    private_key: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    cert_pem: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    ca_cert_pem: bytes | None = Field(sa_column=Column(LargeBinary, nullable=True))
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)


engine = create_engine(
    "sqlite:///./db/app.db", echo=True, pool_size=5, pool_recycle=3600
)
SQLModel.metadata.create_all(engine)
session = Session(engine)

stmt = (
    insert(IoT)
    .values(client_id="asdf", private_key=b"", cert_pem=b"")
    .on_conflict_do_nothing()
)
session.exec(stmt)
session.commit()
```

#### Pandas vs Polars

파이썬 프로젝트에서 데이터 처리 및 분석을 위해 데이터 프레임을 다루는 라이브러리로 전통적으로 [판다스](https://pandas.pydata.org/)가 사용되었지만 최근에는 판다스에 단점인 성능 이슈를 보완하기 위해 Rust로 작성된 [폴라스](https://pola.rs/)로 대체되어 사용되는 것 같다. 젯브레인스 블로그에서 공유한 [Polars와 pandas 비교: 어떻게 다를까요?](https://blog.jetbrains.com/ko/pycharm/2025/02/polars-vs-pandas/)를 읽어보자.

#### Seaborn vs Plotly

데이터 분석에서 차트 시각화는 [Matplotlib](https://matplotlib.org/), [Seaborn](https://seaborn.pydata.org/), [Plotly](https://plotly.com/python/) 중 하나를 사용하는 것 같다. 다음과 같이 Polars DataFrame 을 [Visualization](https://docs.pola.rs/user-guide/misc/visualization/#plotly)할 수 있다.

```python
import polars as pl
import plotly.express as px

if __name__ == "__main__":
    df = pl.DataFrame({"category": ["A", "B", "C", "D"], "value": [10, 25, 15, 30]})

    fig = px.bar(
        df, x="category", y="value", title="Polars DataFrame with Plotly Express"
    )
    fig.show()
```

