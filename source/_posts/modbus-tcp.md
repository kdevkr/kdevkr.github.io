---
title: 모드버스 TCP
date: 2022-09-04
tags:
- Modbus
- TCP/IP
---

대부분의 IoT 디바이스의 통신에는 MQTT 메시징 프로토콜을 사용하고 있지만 에너지 분야 산업에서 사용하는 필드버스들에서는 Modbus 라는 통신 프로토콜을 사용하여 장비 간 제어를 수행하는데 사용되고 있습니다. 에너지 분야에서 사용하기 위한 시스템인 만큼 각종 산업 장비들이 보유하고 있는 데이터를 시스템으로 수집하기 위해서는 모드버스 TCP 프로토콜을 통해 데이터를 가져와서 더 높은 레벨의 통신 프로토콜인 REST API 또는 MQTT를 사용해야 합니다.

## Modbus TCP/IP
모드버스 프로토콜은 일반적으로 자동화 설비 산업에서 사용되므로 웹 개발자들이 경험할 수 있는 범용적인 통신 프로토콜은 아닙니다. 모드버스 TCP에서는 MBAP(MODBUS Application Protocol) 헤더와 Function Code 그리고 데이터 프레임을 하나로 전달하게 되며 일반적인 소켓 통신과 동일합니다. 

모드버스 프로토콜은 마스터/슬레이브 구조이므로 마스터는 슬레이브에서 정의한 메모리 맵 정보를 토대로 데이터를 읽거나 원하는 명령을 수행하도록 메모리의 데이터를 변경할 수 있습니다. 미리 정의된 몇가지의 기능 코드 중에서 03(0x03, Read Holding Registers)과 16(0x10, Wrtie Multiple Registers)를 주로 사용하는 편입니다. 

```groovy
implementation 'com.ghgande:j2mod:3.1.1'
```

[steveohara/j2mod](https://github.com/steveohara/j2mod)는 모드버스 TCP에 대해서 마스터와 슬레이브 구성을 모두 지원하는 자바 라이브러리이며 모드버스 [테스트 예제](https://github.com/steveohara/j2mod/tree/master/src/test/java/com/ghgande/j2mod/modbus)를 제공하므로 모드버스 통신을 구현하는 것은 그다지 어렵지 않을 것입니다.

### Example
다음은 간단하게 슬레이브에 모드버스 맵을 이미지로 정의하고 마스터에서 정의된 모드버스 맵에 대해서 읽어보는 테스트 예시입니다. 

```java
@Slf4j
public class ModbusTCP {
    public static final int TCP_UNIT_ID = 1;

    public static void main(String[] args) throws Exception {
        // Define slave memory map.
        SimpleProcessImage image = new SimpleProcessImage();
        ObservableRegister register = new ObservableRegister();
        register.setValue(1);
        image.addRegister(register);

        // Run slave.
        ModbusSlave tcpSlave = ModbusSlaveFactory.createTCPSlave(502, 5, false);
        tcpSlave.addProcessImage(TCP_UNIT_ID, image);
        tcpSlave.open();

        // Run master and connect to slave
        ModbusTCPMaster modbusTCPMaster = new ModbusTCPMaster("127.0.0.1", 502);
        modbusTCPMaster.connect();
        if (modbusTCPMaster.isConnected()) {
            Register[] registers = modbusTCPMaster.readMultipleRegisters(TCP_UNIT_ID, 0, 1);
            log.info("registers, {}", registers);
            modbusTCPMaster.disconnect();
        }

        // Closes all slaves
        ModbusSlaveFactory.close();
    }
}
```

> 현재 시스템에서는 AWS IoT 및 SQS 그리고 OpenAPI를 통하여 데이터를 수집할 수 있도록 제공하고 있습니다. 모드버스 통신 프로토콜을 통해 데이터를 수집할 수 있는 애플리케이션을 담당하고 있지는 않으나 간단하게 정리해보았습니다. 

## 참고
- [MODBUS Messaging on TCP/IP Implementation Guide V1.0b](https://modbus.org/docs/Modbus_Messaging_Implementation_Guide_V1_0b.pdf)
- [모드버스 프로토콜 11부 - 모드버스 TCP(더 넓은 세상으로)](https://www.youtube.com/watch?v=eb8iophBMLs)