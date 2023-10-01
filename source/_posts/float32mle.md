---
title: Float32MLE (Byte Order)
date: 2023-10-01T09:00+0900
tags:
- Float32
- IEEE 754
- Byte Order
---

> [바이트 순서(Byte Order)](http://www.tcpschool.com/c/c_refer_endian)는 오래 전 컴퓨터공학과에서 배웠던 개념이지만 실무에서는 실제로 고려할 필요가 없었다.

컴퓨터에서 데이터를 메모리에 저장할 때의 바이트 순서는 빅 엔디안과 리틀 엔디방 식으로 나누어지는데 이것은 CPU 아키텍처에 따라 나누어진다고 한다. TCP 네트워크 스펙 상에는 패킷의 바이트 순서는 빅 엔디안으로 구성되며 웹 애플리케이션에서 자주 활용되는 언어인 자바도 이를 감안하여 빅 엔디안을 기본적으로 사용한다. CPU 아키텍처와 다르게 빅 엔디안으로 사용되는 이유는 JVM 이라는 별도의 스택을 기반으로 구동되기 때문이라고 한다. 그러나, SCADA 또는 PLC 장비와 같은 일부 시스템에서는 빅 엔디안 방식이 아닌 리틀 엔디안 또는 미드 리틀 엔디안으로 바이트 순서를 구성하고 있는데 이러한 시스템은 C 언어를 기반으로 만들어지기 때문이다.

> 일반적인 자바 웹 개발자들이 바이트 순서를 고려하여 비트 연산 또는 시프트 연산을 수행할 경우는 많지 않을 것 같다.

#### Mid Little Endian, MLE

빅 엔디안와 리틀 엔디안 뿐만 아니라 바이트 순서를 스왑하는 미드 리틀 엔디안은 `AB CD`의 바이트 순서가 있을때 `CD AB`로 표현하는 것을 의미한다. 32비트로 구성되는 Float 형식을 미드 리틀 엔디안 방식으로 구성한 것을 `Float32MLE` 이라고 표기할 수 있다.

[Base Convert: IEEE 754 Floating Point](https://baseconvert.com/ieee-754-floating-point)

#### Float32MLE Example

```java
@DisplayName("Endian Test")
class EndianTest {

    @DisplayName("Float32 Mid Little Endian")
    @Test
    void TestFloat32MLE() {
        String hexadecimal = "00004260"; // 00 00 42 60
        byte[] bytes = HexFormat.of().parseHex(hexadecimal);
        float originValue = PooledByteBufAllocator.DEFAULT.buffer()
                .writeBytes(new byte[]{bytes[2], bytes[3]}) // CD (42 60)
                .writeBytes(new byte[]{bytes[0], bytes[1]}) // AB (00 00)
                .readFloat();
        float value = BigDecimal.valueOf(originValue)
                .setScale(1, RoundingMode.HALF_UP)
                .floatValue();
        Assertions.assertEquals(56.0f, value);
    }

}
```

Netty의 ByteBuf 클래스에서는 빅 엔디안 방식의 `readFloat` 함수와 리틀 엔디안 방식의 `readFloatLE` 함수를 제공하고 있다. 그러나, 미드 리틀 엔디안 방식의 경우에는 별도로 제공하지 않으므로 위와 같이 버퍼에 `CD AB` 순으로 쓰고나서 빅 엔디안 방식으로 읽어야한다.
