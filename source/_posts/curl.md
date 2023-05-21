---
title: cURL
date: 2023-05-21
---
 
[cURL](https://curl.se/)은 리눅스와 맥 터미널에서 HTTP 요청을 수행해보기 위해서 많이 사용된다. 윈도우에서도 [마이크로소프트에서 제공하는 컬 프로그램](https://curl.se/windows/microsoft.html)이 내장되어있다. 그래서 명령 프롬프트(cmd)로 curl 명령어를 수행해보면 아래와 같이 정상적으로 사용할 수 있음을 알 수 있다. 하지만, 윈도우 터미널에서는 명령 프롬프트가 아니라 파워쉘(Powershll)을 사용하고 있으므로 __Invoke-WebRequest__ 으로 호출되어 기본적으로 알던 명령어가 수행되지 않는다.

```shell 명령 프롬프트
C:\Users\Mambo>curl -V
curl 8.0.1 (Windows) libcurl/8.0.1 Schannel WinIDN
Release-Date: 2023-03-20
Protocols: dict file ftp ftps http https imap imaps pop3 pop3s smtp smtps telnet tftp
Features: AsynchDNS HSTS HTTPS-proxy IDN IPv6 Kerberos Largefile NTLM SPNEGO SSL SSPI threadsafe Unicode UnixSockets
```

```powershell Windows Terminal
PS C:\Users\Mambo> curl

cmdlet Invoke-WebRequest(명령 파이프라인 위치 1)
다음 매개 변수에 대한 값을 제공하십시오. 
Uri: okky.kr

StatusCode        : 200
StatusDescription : OK
Content           : <!DOCTYPE html><html lang="ko" class="js-focus-visible h-full"><head><meta charSet="utf-8"/><title>
                    OKKY - All That Developer</title><meta name="robots" content="index,follow"/><meta name="descriptio
                    n"...
RawContent        : HTTP/1.1 200 OK
                    Transfer-Encoding: chunked
                    Connection: keep-alive
                    Vary: Accept-Encoding
                    Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
                    Content-Type: text/html; charset=utf...
Forms             : {}
Headers           : {[Transfer-Encoding, chunked], [Connection, keep-alive], [Vary, Accept-Encoding], [Cache-Control, p
                    rivate, no-cache, no-store, max-age=0, must-revalidate]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 22832
```

cURL의 [curl shipped by Microsoft](https://curl.se/windows/microsoft.html) 문서를 참고해보면 Powershell Alias에 대한 문제로 인해 curl.exe 로 프로그램을 지정하여 명령어를 수행하도록 안내한다.

```shell
PS C:\Users\Mambo> curl.exe -V
curl 8.0.1 (Windows) libcurl/8.0.1 Schannel WinIDN
Release-Date: 2023-03-20
Protocols: dict file ftp ftps http https imap imaps pop3 pop3s smtp smtps telnet tftp
Features: AsynchDNS HSTS HTTPS-proxy IDN IPv6 Kerberos Largefile NTLM SPNEGO SSL SSPI threadsafe Unicode UnixSockets
```

#### 파워쉘 Alias 제거하기
Remove-Item 명령어로 Alias를 제거할 수 있으며 명령어를 실행하고나서 상태를 유지할 수 있도록 현재 프로파일을 메모장으로 열어 curl에 대한 Alias를 삭제할 수 있도록 코드를 작성하여 저장하도록 하자. 이제는 굳이 curl.exe 라는 프로그램을 지정해서 호출할 필요가 없어진다.

```powershell Windows Terminal
PS C:\Users\Mambo> remove-item alias:\curl
PS C:\Users\Mambo> curl -V
curl 8.0.1 (Windows) libcurl/8.0.1 Schannel WinIDN
Release-Date: 2023-03-20
Protocols: dict file ftp ftps http https imap imaps pop3 pop3s smtp smtps telnet tftp
Features: AsynchDNS HSTS HTTPS-proxy IDN IPv6 Kerberos Largefile NTLM SPNEGO SSL SSPI threadsafe Unicode UnixSockets

notepad $profile

# 메모장 상단에 입력
if (Test-Path -Path alias:curl) { Remove-Item alias:curl }
```

#### [팁] 리눅스에서 cURL 명령어 출력이 개행되지 않을 경우
간혹 리눅스에서 cURL 명령어를 수행하면 출력 결과가 개행되지 않아서 다음 명령어를 호출할 때 불편함을 느낄 수 있다. [https://stackoverflow.com/a/14614203](https://stackoverflow.com/questions/12849584/automatically-add-newline-at-end-of-curl-response-body/14614203#14614203)에 나와있는 것처럼 사용자 디렉토리에 .curlrc 파일을 만들어서 개행이 동작하도록 작성해두면 된다.

```shell Terminal
vi ~/.curlrc
-w "\n"
```
