---
title: 모드버스 TCP
date: 2023-09-10T21:00+0900
tags:
- Modbus
- TCP/IP
---

모드버스(Modbus) 프로토콜은 PLC와 같은 자동화 제어 설비가 포함되는 산업에서 공식적인 표준은 아니지만 거의 표준처럼 사용되고 있는 통신 프로토콜이다. 모드버스 프로토콜에 대한 스펙은 [Modbus_Messaging_Implementation_Guide_V1_0b.pdf](https://modbus.org/docs/Modbus_Messaging_Implementation_Guide_V1_0b.pdf)로 공개되어있다. 본인은 에너지 분야 도메인에서 일하고 있는 개발자로 각종 에너지 관련 설비에서도 모드버스 프로토콜을 지원하는 제품을 사용하기 때문에 설비들에서 발생하는 다양한 시계열 데이터들을 수집하기 위하여 모드버스 프로토콜을 사용하고 있다. 자동화 제어의 목적이 아니므로 시리얼 통신이 아닌 SCADA, RTU, PLC와 같은 설비와 TCP/IP 방식으로 통신한다.

## Modbus TCP/IP
모드버스 프로토콜은 자동화 설비 산업에서 사용되기 때문에 일반적인 웹 개발자들이 경험할 수 있거나 알아야할 범용적인 통신 프로토콜은 아니다. 모드버스 TCP에서는 MBAP(MODBUS Application Protocol) 헤더와 Function Code 그리고 데이터 프레임을 하나로 전달하게 되며 일반적인 소켓 통신과 동일하다. 또한, 모드버스 프로토콜은 마스터 • 슬레이브 구조로 동작하며 마스터(클라이언트)는 슬레이브(서버)에서 정의한 메모리 맵 정보를 토대로 메모리에 저장되어있는 데이터를 읽거나 원하는 명령을 수행하도록 메모리 데이터를 변경할 수 있다.

#### MBAP 헤더
MBAP 헤더를 구성하는 Unit Identifier는 모드버스 TCP 에서는 IP 주소로 식별하기 때문에 Unit Identifier는 사용되지 않는 항목이지만 255(0xFF)를 사용하는 것을 추천한다. ※ [LS 산전의 상담품질 향상 교육 문서](https://sol.ls-electric.com/uploads/document/16419540742910/20130809_%EA%B9%80%EC%A7%80%EC%9A%A9D_iS7%20MODBUS-TCP.pdf)를 참고해봐도 0xFF로 고정한다고 한다.

#### Function Code
![Functional codes of Modbus registers](https://miro.medium.com/v2/resize:fit:640/format:webp/0*lOma7y90Hjtdc88d.jpg)

일반적인 측정값을 표현하는 **아날로그**와 0과 1로 구성되는 상태값을 표현하는 **디지털**로 나누어서 기능 코드를 사용한다. 주소 범위에 따라 01(0x01, Read Coil)과 02(0x02, Read Discrete Inputs)를 사용하며 아날로그는 주로 03(0x03, Read Holding Registers)를 사용하는 편이다. ※ 기능 코드표를 살펴보면 02(0x02, REad Discrete Inputs)와 04(0x04, Read Input Registers)는 읽기만 수행하는 메모리 범위에서 사용하게 된다는 것을 알아챌 수 있다.

#### Example
네티 기반의 [digitalpetri/modbus](https://github.com/digitalpetri/modbus) 라이브러리가 있으나 [steveohara/j2mod](https://github.com/steveohara/j2mod)라는 자바 라이브러리를 통해 모드버스 TCP 통신을 구현하는게 간단할 것 같다. 다음의 코드는 간단하게 슬레이브에 모드버스 맵을 이미지로 정의하고 마스터에서 정의된 모드버스 맵에 대해서 읽어보는 샘플이다.


```groovy
implementation 'com.ghgande:j2mod:3.1.1'
```

```java
@Slf4j
public class ModbusTCP {
    public static final int TCP_UNIT_ID = 255; // 0xFF

    public static void main(String[] args) throws Exception {
        DefaultProcessImageFactory imageFactory = new DefaultProcessImageFactory();
        ProcessImageImplementation memoryMap = imageFactory.createProcessImageImplementation();

        memoryMap.addDigitalOut(imageFactory.createDigitalOut(true));

        ObservableRegister register = new ObservableRegister();
        register.setValue(1024);
        memoryMap.addRegister(register);

        ModbusSlave tcpSlave = ModbusSlaveFactory.createTCPSlave(Modbus.DEFAULT_PORT, 5, false);
        tcpSlave.addProcessImage(TCP_UNIT_ID, memoryMap);
        tcpSlave.open();

        ModbusTCPMaster modbusTCPMaster = new ModbusTCPMaster("127.0.0.1", Modbus.DEFAULT_PORT);
        modbusTCPMaster.connect();
        if (modbusTCPMaster.isConnected()) {
            BitVector bitVector = modbusTCPMaster.readCoils(TCP_UNIT_ID, 0, 1);
            boolean[] bools = new boolean[bitVector.size()];
            for (int i = 0; i < bitVector.size(); i++) {
                bools[i] = bitVector.getBit(i);
            }
            Register[] registers = modbusTCPMaster.readMultipleRegisters(TCP_UNIT_ID, 0, 1);

            log.info("booleans, {}", bools);
            log.info("registers, {}", registers);
            modbusTCPMaster.disconnect();
        }

        ModbusSlaveFactory.close();
    }
}
```

> 슬레이브 이미지 구성 시 10001-20000은 DigitalIn를 사용하며 30001-40000은 InputRegister로 만들 수 있다. 읽기 뿐만 아니라 쓰기도 가능한 DigitalOut과 Register에 대해서는 슬레이브에서 변경에 대해 감지할 수 있는 ObservableDigitalOut과 ObservableRegister를 제공한다.

#### PLC Simulator
[ModRSsim2](https://sourceforge.net/projects/modrssim2/) 프로그램을 통해 TCP/IP 기반의 PLC 슬레이브에 대한 시뮬레이터를 실행할 수 있다. 위 코드에서 슬레이브 메모리 맵 정보를 만들기보다 시뮬레이터 프로그램으로 메모리 데이터를 쉽게 정의하고 모드버스 마스터인 클라이언트 로직 구현에 집중할 수 있을 것이다. 

## 참고
- [MODBUS Messaging on TCP/IP Implementation Guide V1.0b](https://modbus.org/docs/Modbus_Messaging_Implementation_Guide_V1_0b.pdf)
- [모드버스 프로토콜 11부 - 모드버스 TCP(더 넓은 세상으로)](https://www.youtube.com/watch?v=eb8iophBMLs)
- [[모드버스 핸드북] 09강 모드버스 TCP 통신 예제](https://www.youtube.com/watch?v=ImVbnyqAqX4)