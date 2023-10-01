---
title: Float32MLE (Byte Order)
date: 2023-10-01T09:00+0900
tags:
- Float32
- IEEE 754
- Byte Order
---

오래전 컴퓨터공학과에서 배웠던 개념이지만 실제로 고려할 필요가 없던 부분은 컴퓨터에서 데이터를 메모리에 저장할 때 [바이트 순서(Byte Order)](http://www.tcpschool.com/c/c_refer_endian)이다. 빅 엔디안과 리틀 엔디안 방식으로 나누어지는데 TCP 네트워크 상 패킷의 바이트 순서는 빅 엔디안이며 웹 애플리케이션에서 자주 활용되는 자바도 빅 엔디안을 기본적으로 사용하고 있다. 그러나, SCADA 또는 PLC 장비와 같은 일부 시스템에서는 빅 엔디안 방식이 아닌 리틀 엔디안 또는 미드 리틀 엔디안으로 바이트 순서를 구성하고 있다.

#### Mid Little Endian, MLE

미드 리틀 엔디안은 `AB CD`의 바이트 순서가 있을때 `CD AB`로 표현하는 것을 의미한다. 32비트로 구성되는 Float 형식을 미드 리틀 엔디안 방식으로 구성한 것을 `Float32MLE` 이라고 표기할 수 있다. 또한, IEEE 754로 부동소수점을 표기하는 것을 의미한다.

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

```java ByteBufUtil.java
@Slf4j
@UtilityClass
public final class ByteBufUtil {

    public static byte[] toBytes(float value) {
        ByteBuf byteBuf = Unpooled.buffer(4).writeFloat(value);
        return io.netty.buffer.ByteBufUtil.getBytes(byteBuf);
    }

    public static float toFloat32(byte[] bytes) {
        return PooledByteBufAllocator.DEFAULT.buffer()
                .writeBytes(bytes)
                .readFloat();
    }

    public static float toFloat32LE(byte[] bytes) {
        return PooledByteBufAllocator.DEFAULT.buffer()
                .writeBytes(bytes)
                .readFloatLE();
    }

    public static float toFloat32MLE(byte[] bytes) {
        return PooledByteBufAllocator.DEFAULT.buffer()
                .writeBytes(new byte[]{bytes[2], bytes[3]})
                .writeBytes(new byte[]{bytes[0], bytes[1]})
                .readFloat();
    }
}
```
