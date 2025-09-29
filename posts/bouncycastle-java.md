---
title: BouncyCastle Java로 X.509 인증서 만들기
date: 2023-07-30T14:00+0900
---

자바에서 암호화 또는 전자서명을 위한 기능을 JCA를 통해 제공하기는 하지만 실질적으로는 [Bouncy Castle](https://github.com/bcgit/bc-java)이라는 암호 관련 라이브러리를 활용한다. 본 글에서는 BouncyCastle에서 제공하는 여러 클래스들을 활용해서 사설 루트 인증서를 만들고 그것을 기반으로 클라이언트를 위한 X.509 인증서를 발급하기 위한 방법을 정리하고자 한다. 이렇게 만들어지는 X.509 인증서는 보안 레벨이 높은 시스템에서 Mutual TLS 인증을 수행할 수 있다.

```groovy build.gradle
dependencies {
    implementation 'org.bouncycastle:bcprov-jdk18on:1.75'
    implementation 'org.bouncycastle:bcpkix-jdk18on:1.75'
}
```

> X.509 인증서에 대한 표준은 [RFC5280](https://datatracker.ietf.org/doc/html/rfc5280)로 정의되어 있고 ASN.1 표기를 따르며 지금은 X.509 v3을 사용하고 있다.

#### BouncyCastleProvider
BouncyCastle 자바 라이브러리를 클래스 패스에 추가했더라도 BouncyCastleProvider를 JCE Provider로 추가해야한다. `$JAVA_HOME/lib/security/java.security`에 명시해도 되지만 애플리케이션을 구성하는 클래스에서 런타임 시점에 BouncyCastleProvider를 보안 프로바이더에 추가해도 된다.

```java
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
 
static {
    Security.addProvider(new BouncyCastleProvider());
}
```

#### Self signed CA 인증서 발급하기
일반적으로 X.509 인증서를 발급하는 경우 openssl 명령어를 사용해서 키 페어를 생성하고 그것을 기반으로 CSR과 X.509 인증서를 생성할 것이다. Bouncy Castle 자바 라이브러리르를 통해 만드려는 경우 Deprecated 선언된 X509V3CertificateGenerator를 사용해도 무방할 것 같지만 X509v3CertificateBuilder를 사용해서 X509Certificate를 만들어보려고 한다.

> X509V3CertificateGenerator에 대해서 Deprecated 처리한 사유는 딱히 알 수 없는 것 같다. 

JcaX509v3CertificateBuilder와 JcaContentSignerBuilder를 사용해서 X509CertificateHolder를 생성하고 JcaX509CertificateConverter를 이용하여 X509Certificate로 변환할 수 있다. 대략적인 코드는 아래와 같으니 참고해보도록 하자.

```java
String securityProvider = BouncyCastleProvider.PROVIDER_NAME;
JcaX509ExtensionUtils x509ExtensionUtils = new JcaX509ExtensionUtils();
JcaX509CertificateConverter x509CertificateConverter = new JcaX509CertificateConverter().setProvider(securityProvider);
String signatureAlgorithm = "sha256WithRSA";

KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA", securityProvider);
keyPairGenerator.initialize(4096, new SecureRandom());

KeyPair rootKeyPair = keyPairGenerator.generateKeyPair();

X500Name issuer = new X500NameBuilder()
    .addRDN(BCStyle.CN, "Mambo Org")
    .build();

BigInteger serialNumber = new BigInteger(128, new SecureRandom());

ZonedDateTime now = ZonedDateTime.now();
Date notBefore = Date.from(now.toInstant());
Date notAfter = Date.from(now.plus(30, ChronoUnit.YEARS).toInstant());
SubjectPublicKeyInfo publicKeyInfo = SubjectPublicKeyInfo.getInstance(rootKeyPair.getPublic().getEncoded());

X509CertificateHolder rootCertHolder = new JcaX509v3CertificateBuilder(issuer, serialNumber, notBefore, notAfter, issuer, publicKeyInfo)
                .addExtension(Extension.basicConstraints, true, new BasicConstraints(true))
                .addExtension(Extension.subjectKeyIdentifier, false, x509ExtensionUtils.createSubjectKeyIdentifier(rootKeyPair.getPublic()))
                .build(new JcaContentSignerBuilder(signatureAlgorithm).build(rootKeyPair.getPrivate()));

X509Certificate rootCert = x509CertificateConverter.getCertificate(rootCertHolder);
```

##### X500Name
자바에서 기본적으로 제공하는 X500Principal 대신에 BouncyCastle의 X500Name 클래스로 FQDN, 발급자와 소유자와 같은 주체(Subject) 정보를 기입할 수 있다. 또한, RDN(Relative Distinguished Names) 라고도 하는데 X500NameBuilder에서는 addRDN 이라는 함수를 제공한다. 더 자세한 내용은 [What is a Distinguished Name (DN)?](https://knowledge.digicert.com/generalinformation/INFO1745.html)를 참고해보자.

##### SubjectPublickeyInfo
X.509 인증서에 포함되는 SubjectPublickeyInfo에 대한 클래스로 DER 인코딩된 공개키를 의미한다. 

##### BasicConstraints
다른 인증서를 발급할 권한이 있는지를 나타내는 것으로 CA 인증서라는 것을 의미로 부여할 수 있다.

#### X.509 클라이언트 인증서 발급하기
앞서 루트 CA 인증서 발급을 이해하였다면 CA 인증서를 만드는데 사용된 비밀키를 사용해서 클라이언트를 위한 X.509 인증서를 만드는 것을 알아보도록 하자. 

```java
KeyPair clientKeyPair = keyPairGenerator.generateKeyPair();

X500Name client = new X500NameBuilder()
    .addRDN(BCStyle.CN, "Mambo")
    .build();

BigInteger clientSN = new BigInteger(128, new SecureRandom());
ZonedDateTime clientNow = ZonedDateTime.now();
Date clientNotBefore = Date.from(clientNow.toInstant());
Date clientNotAfter = Date.from(clientNow.plus(1, ChronoUnit.YEARS).toInstant());
SubjectPublicKeyInfo clientPublicKeyInfo = SubjectPublicKeyInfo.getInstance(clientKeyPair.getPublic().getEncoded());

X509CertificateHolder clientCertHolder = new JcaX509v3CertificateBuilder(issuer, clientSN, clientNotBefore, clientNotAfter, client, clientPublicKeyInfo)
    .addExtension(Extension.basicConstraints, true, new BasicConstraints(false))
    .addExtension(Extension.authorityKeyIdentifier, false, x509ExtensionUtils.createAuthorityKeyIdentifier(rootCert))
    .addExtension(Extension.subjectKeyIdentifier, false, x509ExtensionUtils.createSubjectKeyIdentifier(clientKeyPair.getPublic()))
    .addExtension(Extension.keyUsage, false, new KeyUsage(KeyUsage.digitalSignature))
    .build(new JcaContentSignerBuilder(signatureAlgorithm).build(rootKeyPair.getPrivate()));

X509Certificate clientCert = x509CertificateConverter.getCertificate(clientCertHolder);
```

BasicConstraints로 CA가 아니며 AuthorityKeyIdentifier로 발급자의 공개키를 식별할 수 있도록 하였다. 그리고 KeyUsage로 클라이언트에게 발급한 X.509 인증서가 전자서명 용도임을 확장(Extension)에 명시했다.

#### X509Certificate 인증서 검증하기
클라이언트가 요청 시 포함해서 전달한 X.509 인증서가 애플리케이션 혹은 시스템에서 발급한 것인지를 검증하는 과정이 필요하다. `java.security.cert.X509Certificate` 클래스에는 기본적으로 구현된 verify 함수를 제공하고 있기 때문에 아래와 같이 간단하게 루트 인증서의 공개키를 기반으로 클라이언트 인증서를 검증할 수 있다.

```java
clientCert.checkValidity();
clientCert.verify(rootCert.getPublicKey(), securityProvider);
```

#### X.509 인증서 및 키 페어 저장하기
일반적으로 X.509 인증서에 포함되는 공개키는 X509EncodedSpec에 따라 바이너리 형태의 DER로 인코딩되어 포함된다. 그러나 X.509 인증서와 키 페어를 교환할 때에는 PEM 파일 형식을 많이 사용하는 편으로 BouncyCastle 자바 라이브러리에 포함된  PemWriter와 PemObject를 활용해서 X.509 인증서와 비밀키를 PEM 파일로 저장할 수 있다.

```java

public class PemUtil {
    private PemUtil() {
    }

    public static String toPem(String type, byte[] encoded) throws IOException {
        try (StringWriter writer = new StringWriter();
             PemWriter pemWriter = new JcaPEMWriter(writer)) {
            pemWriter.writeObject(new PemObject(type, encoded));
            pemWriter.flush();
            return writer.toString();
        }
    }

    public static String toPem(PrivateKey privateKey) throws IOException {
        Assert.notNull(privateKey, "private key is required");
        return toPem("PRIVATE KEY", privateKey.getEncoded());
    }

    public static String toPem(X509Certificate certificate) throws IOException, CertificateEncodingException {
        Assert.notNull(certificate, "certificate is required");
        return toPem("CERTIFICATE", certificate.getEncoded());
    }
}


String rootCertPem = PemUtil.toPem(rootCert); //ca.pem
String clientCertPem = PemUtil.toPem(clientCert); //client.pem
String clientPrivateKeyPem = PemUtil.toPem(clientKeyPair.getPrivate()); //client.key
```

> PEM 형식으로 Base64로 구성된 문자열을 파일로 저장하는 방법은 본 글에서 다루지 않는다.

#### X.509 인증서 및 키 페어 불러오기
클라이언트의 X.509 인증서는 요청에 포함되어 HttpServletRequest로 부터 가져올 수 있지만 클라이언트 인증서 검증을 위한 CA 인증서와 비밀키는 별도의 파일이나 문자열로부터 불러와야한다. 공개키와 비밀키에 대해서는 JcaPEMKeyConverter를 사용해서 가져올 수 있다.

```java
public class PemUtil {
    private PemUtil() {
    }

    public static PemObject loadPem(byte[] encoded) throws IOException {
        try (StringReader reader = new StringReader(new String(encoded, StandardCharsets.UTF_8));
             PEMParser pemParser = new PEMParser(reader)) {
            return pemParser.readPemObject();
        }
    }

    private static Object loadObject(byte[] encoded) throws IOException {
        try (StringReader reader = new StringReader(new String(encoded, StandardCharsets.UTF_8));
             PEMParser pemParser = new PEMParser(reader)) {
            return pemParser.readObject();
        }
    }

    public static X509Certificate loadCertificate(byte[] encoded) throws IOException, CertificateException {
        PemObject obj = loadPem(encoded);
        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        return (X509Certificate) factory.generateCertificate(new ByteArrayInputStream(obj.getContent()));
    }

    public static PublicKey loadPublicKey(byte[] encoded) throws IOException {
        Object obj = loadObject(encoded);
        JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME);
        SubjectPublicKeyInfo publicKeyInfo = SubjectPublicKeyInfo.getInstance(obj);
        return converter.getPublicKey(publicKeyInfo);
    }

    public static PrivateKey loadPrivateKey(byte[] encoded) throws IOException {
        Object obj = loadObject(encoded);
        JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME);
        PrivateKeyInfo privateKeyInfo = PrivateKeyInfo.getInstance(obj);
        return converter.getPrivateKey(privateKeyInfo);
    }
}
```

본 글에서 다룬 예제 코드에 대한 보다 자세한 것은 [X509Test.java](https://github.com/kdevkr/spring-boot-security/blob/main/src/test/java/com/example/demo/x509/X509Test.java)를 통해 확인할 수 있다.

#### 참고 링크
- [Introduction to BouncyCastle with Java](https://www.baeldung.com/java-bouncy-castle)  
- [How to Read PEM File to Get Public and Private Keys](https://www.baeldung.com/java-read-pem-file-keys)  
- [RSA in Java](https://www.baeldung.com/java-rsa)  


