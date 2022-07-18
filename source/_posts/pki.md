---
title: PKI(Public Key Infrastructure)
date: 2022-07-17
tags:
- PKI
- X.509
- PKCS#8
- PKCS#12
---

> 정보보안 전문가의 수준은 아닐지라도 웹 애플리케이션에서 사용되는 보안 기술에 대해서 어느정도 이해하고 있어야합니다. 이 글은 [SSL 인증서](/ssl-certificate/)와 [Mutual TLS](/mutual-tls/)에서 언급하거나 다루어본 X.509 인증서와 함께 공개키 기반 인증 구조라고 하는 PKI와 관련된 용어와 개념에 대해서 간단하게 알아봅니다.

## X.509 Certificate
_A public key infrastructure (PKI) is a set of roles, policies, hardware, software and procedures needed to create, manage, distribute, use, store and revoke digital certificates and manage public-key encryption._

X.509는 [RFC5280](https://datatracker.ietf.org/doc/html/rfc5280)로 정의되어있는 디지털 인증서(공개키 인증서)의 표준 형식입니다. 대부분의 웹 애플리케이션에 적용하는 HTTPS 프로토콜에서 TLS 핸드쉐이크를 위해서 사용되는 가장 일반적인 인증서 형식이기도 하듯이 전세계적으로 디지털 인증서라 함은 ITU-T X.509 표준 방식으로 작성된 X.509 인증서라고 할 수 있습니다. 국내에서 사용되던 [공동인증서(공인인증서)](https://ko.wikipedia.org/wiki/%EA%B3%B5%EB%8F%99%EC%9D%B8%EC%A6%9D%EC%84%9C)도 공개키 기반 인증 기술을 활용해서 만든 디지털 인증서이지만 한국에서만 사용할 수 있는 인증서 형식이라는 점입니다.

```bash
ubuntu@ubuntu:~/x509$ openssl x509 -in local.dev+1.pem -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            e5:29:9a:ba:66:...
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: O = mkcert development CA, OU = ubuntu@ubuntu, CN = mkcert ubuntu@ubuntu
        Validity
            Not Before: Jul 12 21:55:43 2022 GMT
            Not After : Oct 12 21:55:43 2024 GMT
        Subject: O = mkcert development certificate, OU = ubuntu@ubuntu
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:d8:c2:77:4f:4f:9d:1c:c2:70:b2:00:52:4f:e7:
                    ...
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage:
                TLS Web Server Authentication
            X509v3 Authority Key Identifier:
                keyid:3B:31:5D:2F:7C:D6:E6:E2:F5:9B:66:1D:E5:75:5C:11:C6:85:8C:6D

            X509v3 Subject Alternative Name:
                DNS:local.dev, DNS:localhost
    Signature Algorithm: sha256WithRSAEncryption
         43:e1:81:18:d5:04:ca:d4:73:68:85:4d:1d:d4:79:cb:02:0d:
         ...
```

위 예시는 로컬 호스트에서 사용할 수 있는 사설 인증서를 만드는 오픈소스 도구인 [mkcert](https://github.com/FiloSottile/mkcert)를 통해 만들어진 X.509 인증서에 대한 정보를 openssl 도구로 인증서에 포함된 정보를 확인해본 것입니다. 인증서에 포함될 수 있는 필드들은 RFC5280 문서에 설명되어있는데 발급자(Issuer), 서명 알고리즘(Signature Algorithm), 소유자(Subject), 소유자의 공개키(Subject Public Key Info) 그리고 신원을 확인할 수 있는 부가 정보(Extensions)입니다. 

HTTPS 프로토콜 통신에서 TLS 핸드쉐이킹 과정 중 클라이언트는 서버에서 제공한 X.509 인증서 정보를 확인하여 부가 정보 중 SAN(X509v3 Subject Alternative Name)에 입력된 정보를 토대로 브라우저에서 도메인이나 IP 주소에 대한 신원을 추가적으로 검증합니다. 예를 들어, 위 예시에서는 localhost와 local.dev라는 호스트를 신뢰할 수 있다고 판단할 수 있습니다.

> X.509 인증서는 상위 기관에서 소유자의 공개키를 전자서명한 것으로 암호화가 목적이 아닌 공개키에 대한 소유자의 신원을 검증하고자 함에 있습니다.

### PEM Format
```bash
ubuntu@ubuntu:~/x509$ openssl x509 -in local.dev+1.pem
-----BEGIN CERTIFICATE-----
MIIEDDCCAnSgAwIBAgIRAOUpmrpmzWKOajX3U1ze1McwDQYJKoZIhvcNAQELBQAw
VzEeMBwGA1UEChMVbWtjZXJ0IGRldmVsb3BtZW50IENBMRYwFAYDVQQLDA11YnVu
dHVAdWJ1bnR1MR0wGwYDVQQDDBRta2NlcnQgdWJ1bnR1QHVidW50dTAeFw0yMjA3
MTIyMTU1NDNaFw0yNDEwMTIyMTU1NDNaMEExJzAlBgNVBAoTHm1rY2VydCBkZXZl
bG9wbWVudCBjZXJ0aWZpY2F0ZTEWMBQGA1UECwwNdWJ1bnR1QHVidW50dTCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANjCd09PnRzCcLIAUk/nr27i2uvz
tXSF1vbwUby3dPWQcZuR3cLRvIeNv6oOMLnf9uGbI/pjlRcCoZwk+ETUZtVrsFsv
NZGCir34QbXkNb96/M8HSM3ZC9soeijU8NqoWDjr4LGtU+FX8pOOHbsjJoiyIH7l
g76EpOUrasnVmx6T8xoUlye2si0A+VbV/J6tlJXKix0qidliIiBIY2HWktN+HBIY
bttuRwXOK22i7KPwT/jURgZlcAq5Lmfu9+pTs5ak2jXSaneWLkKF0/9RxMy2jGKf
dTwYqU4ZjbZz1zXs+UeI7hgsPqprhnVBkDAejNrXNJ1O390IbwtgboJ/V6cCAwEA
AaNpMGcwDgYDVR0PAQH/BAQDAgWgMBMGA1UdJQQMMAoGCCsGAQUFBwMBMB8GA1Ud
IwQYMBaAFDsxXS981ubi9ZtmHeV1XBHGhYxtMB8GA1UdEQQYMBaCCWxvY2FsLmRl
doIJbG9jYWxob3N0MA0GCSqGSIb3DQEBCwUAA4IBgQBD4YEY1QTK1HNohU0d1HnL
Ag3Pm9bUJxGWw2bOAO+0Dgdau3Fn+72JPz7ZYGX3Deny01TYDEoeno7VOY+gq2u0
F4L1SBNWdXhdxxfj/4JK3r1FpmgmEpPOVyrO2KMWgPlNu4JV8jUc/OIOeKYe8S9V
ddM7VyRjZSCNKsI4kneeu/fZFXLMtWS8lcj/hubQdGYXuSaSZHihpTPvCR2XP6z+
NbeDndqo4YemGIUS2eyp4MQCwlR910FUv3NNgk43iJw368ma8p/jigQeUx9reyYK
ijxd/rbwmg9k5Mks+CgK7pi0Bd8uJxD5i9KgitDBetjoPbw8xIazDUbhtPofs3y8
HTGqR4kszm4JZMh0310Ff3hkqjXwT1oVEMrBUUUZrSBjuUEy7bujgu1JBV1f/j5l
LzS5dMOM68x7my7YVSUG+hbjeB9w9eZWLx/YZ707ssvAfKVvWoyKrwwlZTQRs7mI
HRcM9stz0/k/ZQZH0IBerjuPJ93BKH0wRYxU33i3htQ=
-----END CERTIFICATE-----
```

위 결과는 X.509 인증서가 실제로 파일에 저장된 형태를 보여주고 있습니다. 이와 같이 구성되는 방식을 PEM(Privacy Enhanced Mail)이라고 하는데 X.509 인증서를 저장하는 가장 일반적인 형식입니다. 바이너리 데이터로 저장되는 DER(Distinguished Encoding Representation)로도 저장할 수 있으나 시스템 간 안전하게 전달될 수 있도록 [Base64](/base64/)로 인코딩되어 아스키 코드형태로 되어있는 PEM 형식이 선호되는 것 같습니다.

### Certificate Profiles


```bash
ubuntu@ubuntu:~/x509$ openssl s_client -showcerts -connect naver.com:443 </dev/null
ubuntu@ubuntu:~/x509$ openssl x509 -in naver.com.pem -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            07:f2:85:21:53:b1:50:67:e3:c6:77:aa:3a:83:be:dd
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = US, O = DigiCert Inc, CN = DigiCert TLS RSA SHA256 2020 CA1
        Validity
            Not Before: May 23 00:00:00 2022 GMT
            Not After : Jun  7 23:59:59 2023 GMT
        Subject: C = KR, ST = Gyeonggi-do, L = Seongnam-si, O = NAVER Corp., CN = www.naver.net
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00...
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Authority Key Identifier:
                keyid:B7:6B:A2:EA:A8:AA:84:8C:79:EA:B4:DA:0F:98:B2:C5:95:76:B9:F4

            X509v3 Subject Key Identifier:
                F5:3C:13:14:C9:7B:15:36:50:8C:3E:89:40:EE:2C:E0:22:2F:9E:61
            X509v3 Subject Alternative Name:
                DNS:www.naver.net, DNS:www.naver.asia, DNS:www.naver.co, DNS:www.naver.kr, DNS:www.naver.co.kr, DNS:naver.com, DNS:naver.net, DNS:naver.asia, DNS:naver.co, DNS:naver.kr, DNS:naver.co.kr
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage:
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 CRL Distribution Points:

                Full Name:
                  URI:http://crl3.digicert.com/DigiCertTLSRSASHA2562020CA1-4.crl

                Full Name:
                  URI:http://crl4.digicert.com/DigiCertTLSRSASHA2562020CA1-4.crl

            X509v3 Certificate Policies:
                Policy: 2.23.140.1.2.2
                  CPS: http://www.digicert.com/CPS

            Authority Information Access:
                OCSP - URI:http://ocsp.digicert.com
                CA Issuers - URI:http://cacerts.digicert.com/DigiCertTLSRSASHA2562020CA1-1.crt

            ...
    Signature Algorithm: sha256WithRSAEncryption
         2e...
```

네이버 사이트의 서버 인증서를 전달받은 후 X.509 인증서 정보를 조회해보면 네이버의 인증서를 발급한 기관은 DigiCert 이며 네이버 인증서에 포함되는 공개키를 sha256WithRSAEncryption 서명 알고리즘을 사용해서 전자 서명을 한 것을 확인할 수 있습니다.

- 인증서 발급 기관(Issuer)
- 인증서 만료 기한(Validity) 
- 공개키 소유자(Subject) 
- 공개키(Subject Public Key Info)
- 서명 알고리즘(Signature Algorithm)
- 소유자 대체 이름(Subject Alternative Name)

## PKCS
PKCS(Public key Cryptography Standard)는 공개키 기반 인증 구조에서 안전하게 정보를 교환하기 위한 프로토콜입니다.

### PKCS#8
[RFC5208](https://datatracker.ietf.org/doc/html/rfc5208)로 정의된 PKCS#8은 공개키 기반 인증 구조에서 사용되는 개인키를 표현하고 저장하기 위한 표준으로 앞서 X.509 인증서와 같이 PEM 형식으로 저장합니다. 지난 [Mutual TLS](/mutual-tls/)에서는 자바 애플리케이션에서 PEM 형식의 클라이언트 인증서와 개인키를 통해 키 스토어를 만드는 과정에서 PKCS8EncodedKeySpec 이란 것을 사용했다는 것을 알 수 있습니다.

```bash
ubuntu@ubuntu:~/x509$ openssl pkey -in local.dev+1-key.pem
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDYwndPT50cwnCy
AFJP569u4trr87V0hdb28FG8t3T1kHGbkd3C0byHjb+qDjC53/bhmyP6Y5UXAqGc
JPhE1GbVa7BbLzWRgoq9+EG15DW/evzPB0jN2QvbKHoo1PDaqFg46+CxrVPhV/KT
jh27IyaIsiB+5YO+hKTlK2rJ1Zsek/MaFJcntrItAPlW1fyerZSVyosdKonZYiIg
SGNh1pLTfhwSGG7bbkcFzittouyj8E/41EYGZXAKuS5n7vfqU7OWpNo10mp3li5C
hdP/UcTMtoxin3U8GKlOGY22c9c17PlHiO4YLD6qa4Z1QZAwHoza1zSdTt/dCG8L
YG6Cf1enAgMBAAECggEAIehp2ZJOtY0FLBM4zR8lJmd+b6K0JAI72m1FnAvm0/NA
kmGDG1LL9ziJXwTRQoJykGBAhI7HZ84VkeOGot3HKGOsNtdvvc95/LW1Mcr9TXLj
0U8GaI0neaUfVvvYoZvsERt1DtZaZMnpPIPiyr9467FRvAgTT95YHTFphyFPHr0k
VlAd4qAbyIzOSiGmoBg2Krjk5dXW9Cg7YIxKNUXlxMHNlP3c9zxKyy7Cd3qcp4tF
zKxqiTXPEdOxw3b66P/2+RQWi6kCQfu2RINZLjzPBajjEYJ8/o8sVXDs1Bl6pPnp
YzMLjHapX8V+NuuG8r9O8Y28siO0NT+tpVnyJHUE4QKBgQDdTb7KJySyUYk+xySC
Pv3lpBucfnJDy7veWNdiu4KIMVtqnenPJATVE9ovdWFNNrr+1cLJG/uvM3AOSTLH
JRXHcFewm2ipxovgr6SKx65zevHbbVMcaDir3hdvh6h7qG/naURQlNz1xups68g8
9xvbBnFp/X4fTDto+QQUIR5hRQKBgQD6vlcYJUcG7rr6nOEacUtxvhE59qX5sWDC
AvrfP/IUjitsqiH9YRTkuUfYQXGQMMfpXCViZ/UVQEsiI4LMY3wM4pquWplZVn9C
eyrbgZn/QP2Bp1nExmL21HWGooBG6l2lxGM18lMIzY7vE5GMzGGkH8rRHqgkIAku
TIC5G/sl+wKBgQCGvXUyY87F+zrSzDEAVBYGIXrmN16exIaoA/Nvm7cH8PU13tui
UM3YZfPr/U2202HbEo88HxuIOos5R3vxIDU4bsAVOSnqZIZ50LcgAB/JE8v5y4BU
xWfrzJb8Qt5kG9O2U7NSVLCLvAazNoN+Cv4cxrl6zOpjZ+isKyE+mEOE+QKBgQC5
M1l09iOuFSp57OG+/CtzSaXDoFAbS05iPn055CtTz2Z3jnoogkpCXi+YpU3R6JXf
4TWjp5E4LxLPllcHy/tWMRF68mQNvnukiQCwvNsX09Lqrsb5NmbmVSqxVNlWh8i/
pXx53hBCkkGeiF+bFWKRLQJKz0/1zsu5LLxu/SHVfQKBgGuldPS/1zqt1eblPAeo
bBot1LMCxS8Bk6n1dMiWDM0+yANwh+tkA+MFyZTbdPjjf2e+RAXwUtsKLSvJha0E
XLEZPSQL7WDIleYVJ5oAX4nfHS4eNZzvxnL7bblcWtekrBNnHinKS+Cqd+ATLixL
nDpi0w+DTfQu93eKXg1NCYrg
-----END PRIVATE KEY-----

ubuntu@ubuntu:~/x509$ openssl pkey -in local.dev+1-key.pem -text -noout
RSA Private-Key: (2048 bit, 2 primes)
modulus:
    00...
...
```

### PKCS#12
[RFC7292](https://datatracker.ietf.org/doc/html/rfc7292)로 정의된 PKCS#12는 인증서와 개인키 등 공개키 기반 인증 구조에서 사용되는 다양한 항목들을 하나로 통합하여 교환하기 위한 정보 교환의 표준입니다. 

```bash
ubuntu@ubuntu:~/x509$ openssl pkcs12 -in local.dev+1.pkcs12
Enter Import Password: mambo
Bag Attributes
    localKeyID: 16 CC 2D CE 9F D0 52 C9 72 97 90 DC EC AB DF 28 0B EA B6 AA
subject=O = mkcert development certificate, OU = ubuntu@ubuntu

issuer=O = mkcert development CA, OU = ubuntu@ubuntu, CN = mkcert ubuntu@ubuntu

-----BEGIN CERTIFICATE-----
MIIEDDCCAnSgAwIBAgIRAOUpmrpmzWKOajX3U1ze1McwDQYJKoZIhvcNAQELBQAw
VzEeMBwGA1UEChMVbWtjZXJ0IGRldmVsb3BtZW50IENBMRYwFAYDVQQLDA11YnVu
dHVAdWJ1bnR1MR0wGwYDVQQDDBRta2NlcnQgdWJ1bnR1QHVidW50dTAeFw0yMjA3
MTIyMTU1NDNaFw0yNDEwMTIyMTU1NDNaMEExJzAlBgNVBAoTHm1rY2VydCBkZXZl
bG9wbWVudCBjZXJ0aWZpY2F0ZTEWMBQGA1UECwwNdWJ1bnR1QHVidW50dTCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANjCd09PnRzCcLIAUk/nr27i2uvz
tXSF1vbwUby3dPWQcZuR3cLRvIeNv6oOMLnf9uGbI/pjlRcCoZwk+ETUZtVrsFsv
NZGCir34QbXkNb96/M8HSM3ZC9soeijU8NqoWDjr4LGtU+FX8pOOHbsjJoiyIH7l
g76EpOUrasnVmx6T8xoUlye2si0A+VbV/J6tlJXKix0qidliIiBIY2HWktN+HBIY
bttuRwXOK22i7KPwT/jURgZlcAq5Lmfu9+pTs5ak2jXSaneWLkKF0/9RxMy2jGKf
dTwYqU4ZjbZz1zXs+UeI7hgsPqprhnVBkDAejNrXNJ1O390IbwtgboJ/V6cCAwEA
AaNpMGcwDgYDVR0PAQH/BAQDAgWgMBMGA1UdJQQMMAoGCCsGAQUFBwMBMB8GA1Ud
IwQYMBaAFDsxXS981ubi9ZtmHeV1XBHGhYxtMB8GA1UdEQQYMBaCCWxvY2FsLmRl
doIJbG9jYWxob3N0MA0GCSqGSIb3DQEBCwUAA4IBgQBD4YEY1QTK1HNohU0d1HnL
Ag3Pm9bUJxGWw2bOAO+0Dgdau3Fn+72JPz7ZYGX3Deny01TYDEoeno7VOY+gq2u0
F4L1SBNWdXhdxxfj/4JK3r1FpmgmEpPOVyrO2KMWgPlNu4JV8jUc/OIOeKYe8S9V
ddM7VyRjZSCNKsI4kneeu/fZFXLMtWS8lcj/hubQdGYXuSaSZHihpTPvCR2XP6z+
NbeDndqo4YemGIUS2eyp4MQCwlR910FUv3NNgk43iJw368ma8p/jigQeUx9reyYK
ijxd/rbwmg9k5Mks+CgK7pi0Bd8uJxD5i9KgitDBetjoPbw8xIazDUbhtPofs3y8
HTGqR4kszm4JZMh0310Ff3hkqjXwT1oVEMrBUUUZrSBjuUEy7bujgu1JBV1f/j5l
LzS5dMOM68x7my7YVSUG+hbjeB9w9eZWLx/YZ707ssvAfKVvWoyKrwwlZTQRs7mI
HRcM9stz0/k/ZQZH0IBerjuPJ93BKH0wRYxU33i3htQ=
-----END CERTIFICATE-----
Bag Attributes
    localKeyID: 16 CC 2D CE 9F D0 52 C9 72 97 90 DC EC AB DF 28 0B EA B6 AA
Key Attributes: <No Attributes>
Enter PEM pass phrase: mambo
Verifying - Enter PEM pass phrase: mambo
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIUCWpIEy8DAECAggA
MAwGCCqGSIb3DQIJBQAwFAYIKoZIhvcNAwcECAwP9e11T4W6BIIEyP1XL6GHaVmq
cgu+jiWoeopRciYOLS0MWB8Yzb/8Rslyx1l1MAluW+QP30qCbVhhO6l7ulziGC0h
RNNNittmdSrZKPbNtch8ZY0G/dWoMY9VfjJSdndbWwXv8zulRXMYiXeVME8MsmG5
HPTZyc785dVpeCYaFt6muWw2ABnP97ShSLdIRAeY2G6HDLnEz3/hjbYfE2UFF68i
k/wEEtK5f48XxM+PuyDKk4b3+qFfqVSRS6QbdCnrKVQfGqeiWQKOdt/FQZ82/xIq
lu3kVuXPmEaN8W62MK1vCocjm/AXJ6l01gUqL00a6ntdTdsCXA6g0qpcwZDd6/1g
VgsEK0Y1mbzfq1YS52zw+obHp6nIJpA7Fnllf6irT3mSyEIzorIZ4z4As6CA91Em
M4DjFJ6FlLpmVIofe0JlzGxTZ1yueWLZjGf+3sEImikF6ndzh+dCV0ox73h6g8Vs
D79MHkaZfuBL0ZrxyGSOomRO9WhRrjUihlgILLtMHStWDDTp4F194SiD2T+xC25L
uvpfQAmLYYL+otb9n2cv1thik/MjZCDk5duYcRDLUJ3G23MaHk6DC13JaDk925zF
hbnFCt1PTzvWZ+HjE1GEFiDr88YJkyLdI7VKTsMC/bcfAE7SrpaqX0cLVjnmlIQK
5ScNYvB+PxCJj95YZsVpZ8cw9V/NlkWT1kpSX//G8Wl4YKW0vM25aBCca2hFqbCD
C3/6vqqx4z8D+r3K8KRVV/7y94JaMoHjrvd1fjUDOQfuilh3bgfCmhuFS8IV/HjB
bkuPY/O8O8abcb16wTMReKqahpmFsdOwIC/2gqoTQbKp2xbtY+gcvcObsWQRMcMH
mrHx2vMO4Tr4BKgNBxz4Gv5KAE/Pa2Gvqs0O5xsLNxF1kMUyT5CkrAuUayvysGHv
Y98p7ORHFKfA+tFOxgf7jBrs6/BpQmZHrbOU4v4WplpcbUe9e31l11n8BkQ/qhcO
rtsxqcYub3PRXwpm68LhDacKTdtyVv/j6yYba/RbfSn8ZwZAiwS6oW69qa/JCtEC
iw0058pNxHujA/A4Ceb7G9uFPhNb2UfgwzmID5tzxOhQype0vi02Vc1sMZHAsmII
iIpJUmh37Td1VkxUg+3FspeOmw00z4WNkrf1SMpFabpySw4BXcJMDIOxYhQI/ij6
mPglTjvJHF6eMw53l84MJIUHFkQDGTX2eLZBW91lDxVxmMkt74G7rD9j6pfm/Eo5
gezjc9DcX3ot1T6Gv0rk0ilF3Vfuw5+f46ZtZBQqYlFalKgYVpelidv2y5kC7gEn
fabH93l9GFHU4OKT1IESwPt4E0pJttVfTAwx3dBT/h8BgfN3bOqM1EdZF0/KIoc1
NLl1H2o/EZ94Jig25N3jqJ7w0riNE3dE891Fu715nfEjfSxIpMKC78FR/J9qTXgu
6sUwNgCs/DdVqruOjwFKupNgQcj7fwSJtnyQGY9fpZjAG+e5MiPxNFDjaoLu8M7k
5+CGelITcwbq2U8InZIpZTOCLif3zuHg0hkf3GXCsAapfQnmovR/xjtJBWEZVw+Z
2otgK9OruIMuEwxzxX2awqI5zDN2yBCnP62eEYoJ+HKM21i/hexMF4jIh9H+H99W
oFgNCNUwDw6RXPEUEqnTzQ==
-----END ENCRYPTED PRIVATE KEY-----
```

#### Convert PEM to PKCS#12
```bash
ubuntu@ubuntu:~/x509$ openssl pkcs12 -export -in local.dev+1.pem -inkey local.dev+1-key.pem -out local.dev+1.pkcs12
Enter Export Password: mambo
Verifying - Enter Export Password: mambo
```

#### Convert PKCS#12 to JKS
```bash
ubuntu@ubuntu:~/x509$ keytool -importkeystore -srckeystore local.dev+1.pkcs12 -srcstoretype PKCS12 -deststoretype JKS -destkeystore local.dev+1.jks
Importing keystore local.dev+1.pkcs12 to local.dev+1.jks...
Enter destination keystore password: mambo
Re-enter new password: mambo
Enter source keystore password: mambo
Entry for alias 1 successfully imported.
Import command completed:  1 entries successfully imported, 0 entries failed or cancelled

Warning:
The JKS keystore uses a proprietary format. It is recommended to migrate to PKCS12 which is an industry standard format using "keytool -importkeystore -srckeystore local.dev+1.jks -destkeystore local.dev+1.jks -deststoretype pkcs12".
```

Java KeyStore API에서는 PKCS#12를 기본 형식으로 사용하고 있습니다. 그래서 PKCS#12로 되어있는 파일을 그대로 KeyStore로 불러올 수 있으므로 굳이 JKS 형식의 파일로 변환할 필요는 없습니다. 오히려 마지막 경고 문구에서 알려주는 것처럼 JKS 형식으로 되어있는 키스토어 파일을 PKCS#12로 변환하는 방법을 아는게 좋습니다.

```bash
ubuntu@ubuntu:~/x509$ keytool -importkeystore -srckeystore local.dev+1.jks -destkeystore local.dev+1.jks -deststoretype pkcs12
Enter source keystore password: mambo
Entry for alias 1 successfully imported.
Import command completed:  1 entries successfully imported, 0 entries failed or cancelled

Warning:
Migrated "local.dev+1.jks" to PKCS12. The JKS keystore is backed up as "local.dev+1.jks.old".
```

## Links
- [Public Key Infrastructure PKI Concepts](https://www.youtube.com/watch?v=t0F7fe5Alwg)
- [Using openssl to get the certificate from a server](https://stackoverflow.com/a/7886248)
- [Converting PKCS#12 certificate into PEM using OpenSSL](https://stackoverflow.com/a/15144560)
- [JCA로 이해하는 암호화와 보안](https://d2.naver.com/helloworld/197937)
- [JCA로 이해하는 암호화와 보안 2](https://d2.naver.com/helloworld/227016)
- [호다닥 공부해보는 x509와 친구들](https://gruuuuu.github.io/security/what-is-x509/)