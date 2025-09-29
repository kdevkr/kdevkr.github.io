---
title: AWS IoT Device SDK v2 for Python
date: 2025-07-14T23:00+09:00
tags:
- Python
- AWS IoT Core
---

자바 언어가 IoT 디바이스를 위해 만들어진 것으로 알려져 있지만 실제로는 라즈베리파이와 같은 소형 디바이스에 파이썬 또는 C로 작성된 애플리케이션으로 작성되어 포함되는 것 같다. 예를 들어, 파이썬 언어로 AWS IoT 와 통신하는 애플리케이션을 만들때는 [AWS IoT Device SDK v2 for Python](https://github.com/aws/aws-iot-device-sdk-python-v2)를 사용할 수 있다. [basic-connect.py](https://github.com/aws/aws-iot-device-sdk-python-v2/blob/main/samples/basic_connect.py) 또는 [pubsub.py](https://github.com/aws/aws-iot-device-sdk-python-v2/blob/main/samples/pubsub.py) 샘플 코드를 참고하여 클라이언트 디바이스로 수집된 데이터를 AWS IoT를 통해 모니터링 시스템으로 전달할 수 있음을 테스트 해볼 수 있다. 파이썬 언어는 테스트 엔지니어도 사용하는 범용적인 언어이기 때문에 개발자와 QA 모두 사용할 수 있는 테스트 코드가 된다.

#### 파이썬 환경 준비하기

파이썬 코드를 실행하기 위해서는 `파이썬 가상 환경`을 준비해야한다. 파이썬의 가상 환경을 구성하는 건 생각보다 쉽지 않은 부분일 수 있기 때문에 파이썬을 주로 다루지 않는 개발자라면 [러스트로 작성된 UV](https://docs.astral.sh/uv/)를 파이썬 패키지 관리자로 설치하여 파이썬 가상 환경(.venv)를 쉽게 구성하는게 좋을 것 같다. 참고로, 여러가지 파이썬으로 작성된 MCP를 설치할 때에도 UV 명령어가 사용되고 있다.

```powershell Windows Terminal
PS C:\Users\Mambo> uv python install 3.12
Installed Python 3.12.9 in 7.79s
 + cpython-3.12.9-windows-x86_64-none

 PS C:\Users\Mambo> uv python pin 3.12
Pinned `.python-version` to `3.12`

PS C:\Users\Mambo> uv python dir
C:\Users\Mambo\AppData\Roaming\uv\python

PS C:\Users\Mambo> uv init --app awsiot
Initialized project `awsiot` at `C:\Users\Mambo\awsiot`

PS C:\Users\Mambo\awsiot> uv run main.py
Using CPython 3.12.9
Creating virtual environment at: .venv
Hello from awsiot!
```

> 일반적으로 PyCharm을 사용해서 파이썬 프로젝트를 열게 되면 Python 인터프리터를 설정해야 됩니다. 
> UV 를 사용하는 프로젝트는 파이썬 가상 환경이 자동으로 구성되었기 때문에 Python 인터프리터가 기본 설정됨을 확인할 수 있습니다.

#### 파이썬 패키지 설치하기

파이썬 코드에서 필수적으로 사용해야할 AWS IoT Device SDK v2 for Python (awsiotsdk)와 함께 환경 변수를 파일로 적용할 수 있는 python-dotenv 를 설치하자. python-dotenv 는 반드시 필요하지 않지만 AWS IoT Endpoint 와 ClientID 와 같은 일부 정보들을 하드코딩하는 것보다는 나을 것이다.

```powershell Windows Terminal
PS C:\Users\Mambo\awsiot> uv add awsiotsdk python-dotenv
Resolved 4 packages in 57ms
Installed 3 packages in 16ms
 + awscrt==0.27.4
 + awsiotsdk==1.24.0        
 + python-dotenv==1.1.1
```

#### mqtt_connection_builder 로 AWS IoT에 연결하기

예제 코드 중 [basic_connect.py](https://github.com/aws/aws-iot-device-sdk-python-v2/blob/main/samples/basic_connect.py)  를 보면 awsiotsdk 의 mqtt_connection_builder를 사용하며 MQTT 연결을 생성할 수 있음을 알 수 있다. 아래와 같이 코드를 작성하고 파이썬 코드를 실행해보면 AWS IoT 엔드포인트에 연결되고나서 종료됨을 알 수 있다.

```python main.py
import os

from awscrt import mqtt
from awsiot import mqtt_connection_builder
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("ENDPOINT")  # iot:Data-ATS endpoint
CLIENT_ID = os.getenv("CLIENT_ID")
TOPIC = os.getenv("TOPIC")
CERTIFICATE_PATH = os.getenv("CERTIFICATE_PATH")
PRIVATE_KEY_PATH = os.getenv("PRIVATE_KEY_PATH")
ROOT_CA_PATH = os.getenv("ROOT_CA_PATH")

if __name__ == '__main__':
    print("\nStarting MQTT PubSub sample...")

    # Create a MQTT connection
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint=ENDPOINT,
        ca_filepath=ROOT_CA_PATH,
        cert_filepath=CERTIFICATE_PATH,
        pri_key_filepath=PRIVATE_KEY_PATH,
        client_id=CLIENT_ID,
    )

    # Connect MQTT Broker...
    print(f"Connecting to {ENDPOINT} with client ID '{CLIENT_ID}'...")
    connect_future = mqtt_connection.connect()
    connect_future.result()  # Future.result() waits until a result is available
    print("Connected!")
```

```powershell Windows Terminal
(awsiot) PS C:\Users\Mambo\awsiot> uv run main.py

Starting MQTT PubSub sample...
Connecting to $prefix$-ats.iot.ap-northeast-2.amazonaws.com with client ID '$client_id$'...
Connected!
```

#### Topic 구독하고 MQTT 메시지 게시하기

예제 코드 중 [pubsub.py](https://github.com/aws/aws-iot-device-sdk-python-v2/blob/main/samples/pubsub.py) 를 참고하면 mqtt_connection 의 subscribe 함수로 메시지를 구독하고 publish 함수로 메시지를 게시하는 것을 알 수 있다.

```python main.py
import os
import time

from awscrt import mqtt
from awsiot import mqtt_connection_builder
from dotenv import load_dotenv

load_dotenv()

# AWS IoT Core
ENDPOINT = os.getenv("ENDPOINT")  # iot:Data-ATS endpoint
CLIENT_ID = os.getenv("CLIENT_ID")  # Recommended Thing ID
TOPIC = os.getenv("TOPIC")

# AWS IoT Core - Thing Certificate
CERTIFICATE_PATH = os.getenv("CERTIFICATE_PATH")
PRIVATE_KEY_PATH = os.getenv("PRIVATE_KEY_PATH")
ROOT_CA_PATH = os.getenv("ROOT_CA_PATH")  # Optional


def on_message_received(topic, payload):
    print(f"Received message from {topic}: \n<<< {payload.decode()}")


if __name__ == '__main__':
    print("\nStarting MQTT PubSub sample...")

    # Create a MQTT connection
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint=ENDPOINT,
        ca_filepath=ROOT_CA_PATH,
        cert_filepath=CERTIFICATE_PATH,
        pri_key_filepath=PRIVATE_KEY_PATH,
        client_id=CLIENT_ID,
    )

    # Connect MQTT Broker...
    print(f"Connecting to {ENDPOINT} with client ID '{CLIENT_ID}'...")
    connect_future = mqtt_connection.connect()
    connect_future.result()  # Future.result() waits until a result is available
    print("Connected!")

    # Subscribe
    print(f"Subscribing to topic '{TOPIC}'...")
    subscribe_future, packet_id = mqtt_connection.subscribe(
        topic=TOPIC,
        qos=mqtt.QoS.AT_LEAST_ONCE,
        callback=on_message_received)

    subscribe_result = subscribe_future.result()
    print(f"Subscribed with {subscribe_result}")

    # Publish
    print(f"Publishing message to topic '{TOPIC}'...")
    payload = "PING"
    mqtt_connection.publish(
        topic=TOPIC,
        payload=payload.encode('ascii'),
        qos=mqtt.QoS.AT_LEAST_ONCE)
    print(f"Published message to {TOPIC}: \n>>> {payload}")
    time.sleep(2)

    # Disconnect
    print("Disconnecting...")
    disconnect_future = mqtt_connection.disconnect()
    disconnect_future.result()
    print("Disconnected!")
```

```powershell Windows Terminal
(awsiot) PS C:\Users\Mambo\awsiot> uv run main.py

Starting MQTT PubSub sample...
Connecting to $prefix$-ats.iot.ap-northeast-2.amazonaws.com with client ID '$client_id$'...
Connected!
Subscribing to topic '$topic$'...
Subscribed with {'packet_id': 1, 'topic': '$topic$', 'qos': <QoS.AT_LEAST_ONCE: 1>}
Publishing message to topic '$topic$'...
Published message to $topic$:
>>> PING
Received message from $topic$: 
<<< PING
Disconnecting...
Disconnected!
```

메시지 게시와 동일한 토픽을 구독한 것으로 MQTT 메시지 브로커인 AWS IoT 에서 메시지를 전달됨은 확인했다. 다만, AWS IoT 로 게시된 메시지가 모니터링 시스템에서 요구하는 페이로드 형식에 맞는지는 알 수 없다. AWS IoT 의 `메시지 라우팅 규칙`에 맞는 주제에 메시지를 게시하고 (메시지를 SQS 대기열로 전송하도록 설정했다면) Amazon SQS 에 게시된 메시지가 전달되는지까지 확인해야한다. 또한, 게시한 메시지에 포함된 데이터가 모니터링 시스템에서 확인할 수 있는 간단한 웹페이지를 개발하는 것도 좋은 방법이다.

#### AWS IoT 루트 CA 인증서

테스트 코드에서 루트 CA 인증서가 반드시 필요한 것은 아니지만 컴퓨터 환경마다 신뢰 가능한 인증서 목록에 포함되어있지 않을 수 있기 때문에 `상호 인증(mTLS)`을 수행하기 위해서 명시적으로 지정할 필요가 있다. AWS IoT 에서 인증서를 다운로드 받게 되면 [Amazon Trust Services Repository](https://www.amazontrust.com/repository/) 에서 제공하는 [AmazonRootCA1.pem](https://www.amazontrust.com/repository/AmazonRootCA1.pem) 와 [AmazonRootCA3.pem](https://www.amazontrust.com/repository/AmazonRootCA3.pem)가 포함되는데 RSA 2048비트 키에 해당되는 AmazonRootCA1 가 일반적으로 사용된다. 회사 내 개발 환경으로 구성된 AWS IoT 에 연결해본 결과로는 ECC 256비트 키에 해당되는 AmazonRootCA3를 사용하니 `awscrt.exceptions.AwsCrtError: AWS_IO_TLS_ERROR_NEGOTIATION_FAILURE: TLS (SSL) negotiation failed` 라는 오류가 발생했다. 
