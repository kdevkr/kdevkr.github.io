---
title: EdDSA
date: 2023-07-31T18:00+0900
tags:
- Ed25519
- RFC8410
---

[EdDSA(Edwards-curve Digital Signature Algorithm)](https://datatracker.ietf.org/doc/html/rfc8032)는 `Edwards-Curve` 곡선에 의한 전자 서명 알고리즘을 의미한다. 과거에 [ED25519](/ed25519)에 대해서 정리한 것과 같이 ECDSA와 혼동이 될 수 있다. [RFC8410](https://datatracker.ietf.org/doc/html/rfc8410)에서는 Internet X.509 Public Key Infrastructure 에서 Ed25519과 같은 Algorithm Identifiers에 대한 표준을 설명하고 있다.

#### Curve25519 and Curve448 Algorithm Identifiers

BouncyCastle의 `ECNamedCurveTable.getNames()`에는 기본적인 EC 곡선이 포함되어있고 `curve25519`는 CustomNamedCurves에 포함되어 있고 CustomBamedCurvse로 제공받은 X9ECParameters를 아래와 같이 ECParameterSpec으로 변경할 수 있다.

```java
public static AlgorithmParameterSpec curve25519Spec() {
    // NOTE: Ed25519 not contains in ECNamedCurveTable.getNames()
    X9ECParameters ecP = CustomNamedCurves.getByName("curve25519");
    return new ECParameterSpec(ecP.getCurve(), ecP.getG(), ecP.getN(), ecP.getH(), ecP.getSeed());
}
```

#### Ed25519 키 페어 생성
`Ed25519KeyPairGenerator`와 함께 `ECKeyGenerationParameters`를 사용하면 Ed25519 키 페어를 생성할 수 있다. 그런데 이미 Ed25519KeyGenerationParameters를 제공하고 있으므로 굳이 ECParameterSpec를 사용하는 코드를 작성할 필요가 없어진다.

```java
@Test
void TestKeyPairUsingECParams() {
    ECParameterSpec curve25519Spec = (ECParameterSpec) curve25519Spec();
    ECDomainParameters ecParams = new ECDomainParameters(curve25519Spec.getCurve(), curve25519Spec.getG(), curve25519Spec.getN(), curve25519Spec.getH());
    ECKeyGenerationParameters ecKeyGenerationParameters = new ECKeyGenerationParameters(ecParams, new SecureRandom());

    Ed25519KeyPairGenerator keyPairGenerator = new Ed25519KeyPairGenerator();
    keyPairGenerator.init(ecKeyGenerationParameters);

    AsymmetricCipherKeyPair keyPair = keyPairGenerator.generateKeyPair();
    Assertions.assertNotNull(keyPair);
}

@Test
void TestKeyPairUsingEd25519Generator() {
    Ed25519KeyPairGenerator keyPairGenerator = new Ed25519KeyPairGenerator();
    keyPairGenerator.init(new Ed25519KeyGenerationParameters(new SecureRandom()));

    AsymmetricCipherKeyPair keyPair = keyPairGenerator.generateKeyPair();
    Assertions.assertNotNull(keyPair);
}
```

#### Ed25519PrivateKeyParameters를 PrivateKey로 변환
클라이언트의 X.509 인증서를 만드는 경우 서명을 위한 PrivateKey가 필요한데 직접적으로 변환할 수가 없으므로 `KeyFactorySpi.Ed25519`와 `PrivateKeyInfoFactory`를 사용해서 Ed25519PrivateKeyParameters로 되어있는 비밀키를 PrivateKey 클래스로 변경해야 한다.

```java
// NOTE: AsymmetricCipherKeyPair keyPair
Ed25519PrivateKeyParameters privateKeyP = (Ed25519PrivateKeyParameters) keyPair.getPrivate();

KeyFactorySpi.Ed25519 keyFactory = new KeyFactorySpi.Ed25519();
PrivateKey privateKey = keyFactory.generatePrivate(PrivateKeyInfoFactory.createPrivateKeyInfo(privateKeyP));
```

#### 공개키를 SubjectPublicKeyInfoFactory로 변환
Ed25519PublicKeyParameters로 되어있는 공개키를 SubjectPublicKeyInfo로 변환하는 것은 `SubjectPublicKeyInfoFactory` 클래스에서 제공하고 있다. 앞서 비밀키처럼 KeyFactorySpi.Ed25519를 사용해서 PublicKey로 변환할 필요는 없을 것 같다.

```java
// NOTE: AsymmetricCipherKeyPair keyPair
Ed25519PublicKeyParameters publicKeyP = (Ed25519PublicKeyParameters) keyPair.getPublic();
SubjectPublicKeyInfo publicKeyInfo = SubjectPublicKeyInfoFactory.createSubjectPublicKeyInfo(publicKeyP);
```

#### EdDSA Signatures
Curve25519와 Curve448를 사용한 EdDSA는 각각 `Ed25519`와 `Ed448` 이라는 서명 알고리즘으로 표현한다. 앞서, PrivateKey와 SubjectPublickKeyInfo로 변환한 상태이므로 X.509 인증서를 만드는 것은 어렵지 않을 것이다.

```java
X500Name issuer = new X500Name("CN=Mambo");
BigInteger serialNumber = new BigInteger(128, new SecureRandom());
ZonedDateTime now = ZonedDateTime.now();
Date notBefore = Date.from(now.toInstant());
Date notAfter = Date.from(now.plus(1, ChronoUnit.YEARS).toInstant());

ContentSigner contentSigner = new JcaContentSignerBuilder("Ed25519").setProvider(BouncyCastleProvider.PROVIDER_NAME).build(privateKey);
X509CertificateHolder certificateHolder = new JcaX509v3CertificateBuilder(issuer, serialNumber, notBefore, notAfter, issuer, publicKeyInfo).build(contentSigner);
X509Certificate certificate = new JcaX509CertificateConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME).getCertificate(certificateHolder);

certificate.checkValidity(new Date());
```

더 자세한 코드는 [EdDSATest.java](https://github.com/kdevkr/spring-boot-security/blob/main/src/test/java/com/example/demo/x509/EdDSATest.java)에서 확인할 수 있다.