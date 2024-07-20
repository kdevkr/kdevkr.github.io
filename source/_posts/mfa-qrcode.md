---
title: 2차 인증 설정을 위한 QR 코드
date: 2024-07-20T12:00+09:00
tags:
- 2FA
- TOTP
- QRCode
---

오늘은 2차 인증 설정 과정에서 OTP 앱으로 스캔할 수 있도록 코드 대신에 제공하는 QR 코드에 대해서 알아보려고 한다.

#### RFC 6238

Google Authenticator, Microsoft Authenticator 그리고 Authy와 같은 OTP 인증 앱들은 [RFC6238](https://datatracker.ietf.org/doc/html/rfc6238)로 정의된 TOTP 표준에 따라 구현되어있고 QR 코드에 포함되는 텍스트는 [Key Uri Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)로 구성되어야 읽을 수 있다.

```sh
# otpauth://TYPE/LABEL?PARAMETERS
otpauth://totp/Mambo:kdevkr@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=Mambo&algorithm=SHA1&digits=6&period=30
```

#### TOTP QR 코드 이미지 만들기

QR 코드 이미지를 만들기 위해서 [java-totp](https://github.com/samdjstevens/java-totp) 라이브러리를 사용하려고 한다. 이 라이브러리는 비밀키 발급부터 QR 코드를 HTML에서 사용하기 위한 [Data URI](https://developer.mozilla.org/ko/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)로 변환하는 **Utils.getDataUriForImage** 함수도 제공해주고 있다.

```groovy
dependencies {
    implementation 'dev.samstevens.totp:totp:1.7.1'
    implementation 'com.google.zxing:javase:3.5.3'
}
```

```java
SecretGenerator secretGenerator = new DefaultSecretGenerator();
String secret = secretGenerator.generate();

QrData qrData = new QrData.Builder()
        .label("kdevkr@gmail.com")
        .secret(secret)
        .issuer("Mambo")
        .algorithm(HashingAlgorithm.SHA1)
        .digits(6)
        .period(30)
        .build();

ZxingPngQrGenerator qrGenerator = new ZxingPngQrGenerator();
qrGenerator.setImageSize(250);
byte[] qrImageBytes = qrGenerator.generate(qrData);
String qrDataUri = Utils.getDataUriForImage(qrImageBytes, qrGenerator.getImageMimeType());
System.out.println(qrDataUri);
```

> [Zxing Decoder Online](https://zxing.org/w/decode.jspx)을 사용하여 올바르게 이미지가 만들어졌는지 [확인](https://zxing.org/w/decode?u=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAPoAAAD6AQAAAACgl2eQAAACoUlEQVR4Xu2YTW6rUAyFHWXAMEtgJ2VjSInExmAnLIEhA4Tf%2BWzy01bqNNZT7oCSm68Sdo6PfTH%2Fe432c%2BfH%2BgC5PkCuKsBmWn1r3WLWTD7MPl5uLZttIUB%2Fl6sLuHrjPrhPeccXdQA7LX27fumxAeZmWnQ3KrJygJ3c57VbevPdFEVFAClsFsBql6EegB7m9eQ302UzfXf%2BLZg3A1lZUsHr5XfpvRU4lhFFArvK%2F9itAiiK7v7Y%2Bm5rV7OzjOqphxJAM17c49mRwuyUv4IaHlEUAMLoW98vnvYkQB4wLedSQIPHW6fPbIuSMpDHPdUFAPSq8pcHqG86yvhS5uVW9yhqAOth9NE8e4xqwKOeUbwf2BCAcbnOyrcyrwlEqWavEKDcantCFNyF5Tsf6wCuZ9dvv3YYAeUVyojmWQjgt48x04%2Fmia96Wn4VQG5%2FH%2BNU%2Fsj3tDDaXfjfMkDLrG7olfKXVEd1J%2F82JpUATGOS9CoV6E5B6fKt9AoAWVm7nl1ZPmP56pumvUqASkktfY9SypYUHVRoGSBWDkf4vkQxUWih4TLAlueLzK2kKqPSIUhBvfwWFYBOzytAJ0ltM3wModxnFG8HnAmz51Sh8uqUatyeDnU30hqAKn8gt7c8nVNZNKdKQNonwxF6yPIy7h56KADQgzzOFzGGKBTyrQurCrCR2z67OVNxNCdmpUpABDAwK13x0A1RXOVWGpILATPdkntewfAeYcQDYq8OwNrIMlKV5TuhHPKtAuQTZ6p9j6kuPOrZWCsArfNGS41IY2aHPTGBMHqWAjjzkuDjjZGOFvSlh2jLAL0uhzPNAegrhVINUF%2B6GaMn5s9oVwzwtE9CifJXm%2FfmpbIqABbb0kO8wDTGpBtttBLw5%2FoAuT5Arv8E%2BAcOAIqU2Few9gAAAABJRU5ErkJggg%3D%3D)해볼 수 있습니다.

#### 보안 이슈

2차 인증 설정을 위해서 제공하는 QR 코드에는 암호화되지 않은 상태의 보안키가 포함되어있다. 서드 파티인 OTP 앱은 QR 코드를 스캔하여 포함된 텍스트에서 정보를 추출해야하므로 보안키를 암호화 할수는 없다. 아래와 같이 [two-factor-auth](https://github.com/j256/two-factor-auth/blob/d28c4da7cbe593774a7420a86257b803b67c8f5a/src/main/java/com/j256/twofactorauth/TimeBasedOneTimePasswordUtil.java#L474-L480)처럼 QR 코드 이미지 생성을 위해서 외부 주소에 의존하는 것은 좋지 않다.

```java
public static String qrImageUrl(String keyId, String secret, int numDigits, int imageDimension) {
    StringBuilder sb = new StringBuilder(128);
    sb.append("https://chart.googleapis.com/chart?chs=" + imageDimension + "x" + imageDimension + "&cht=qr&chl="
            + imageDimension + "x" + imageDimension + "&chld=M|0&cht=qr&chl=");
    addOtpAuthPart(keyId, secret, sb, numDigits);
    return sb.toString();
}
```

> 구글에서 QR 이미지 생성을 제공했던 주소는 제거되었고 대체할 수 있는 주소가 있지만 외부 주소에 보안키를 전달하는 것은 권장하지 않습니다.
