---
title: JAXBContext는 단일 인스턴스로 사용하세요
date: 2019-10-30
tags:
  - Marshaller
  - JAXBContext
---

## 들어가며
전력 관련 프로젝트에서 OpenADR 프로토콜을 이용함으로써 XML으로 구성된 데이터를 자바 빈 클래스로 변환하거나 빈 클래스를 XML로 구성하기 위하여 XML Marshaller를 사용합니다. 가장 많이 사용되는 [JAXB](https://docs.oracle.com/javase/8/docs/api/javax/xml/bind/Marshaller.html)는 [벤치마크](https://dzone.com/articles/xml-unmarshalling-benchmark)에 따라 속도면에서 월등하여 JAXB를 마샬러로 사용하고 있었습니다.

그러나, OpenADR 프로토콜으로 통신되는 XML 데이터의 크기가 커져가면서 서버 애플리케이션에서 수행하는 Marshalling 또는 Unmarshalling을 수행하는 속도가 간헐적으로 느려짐을 확인하였습니다. 그 원인은 마샬러를 가져오기 위하여 매번 JAXBContext 인스턴스를 생성하는 코드 구조에 문제가 있었습니다.

```groovy
implementation 'org.springframework:spring-oxm'
```

## JAXBContext
[JAXB](https://docs.oracle.com/javase/8/docs/api/javax/xml/bind/Marshaller.html)의 JAXBContext 인스턴스를 통해 마샬러를 가져오던 기존의 코드는 다음과 같습니다.

```java
public static Marshaller getMarshaller(Object payload) {
    return new JAXBContext.newInstance().createMarshaller();
}

public class JAXBManager {
    public static final String DEFAULT_JAXB_CONTEXT_PATH = "";
    private JAXBContext jaxbContext;

    public JAXBManager() throws JAXBException {
        this(DEFAULT_JAXB_CONTEXT_PATH);
    }

    public JAXBManager(String jaxbContextPath) throws JAXBException {
        this.jaxbContext = JAXBContext.newInstance(jaxbContextPath);
    }

    public JAXBContext getContext() {
        return this.jaxbContext;
    }

    public Marshaller createMarshaller() throws JAXBException {
        Marshaller marshaller = this.jaxbContext.createMarshaller();
        marshaller.setProperty("jaxb.fragment", Boolean.TRUE);
        return marshaller;
    }
}
```

위 코드 구조에 따르면 오브젝트를 XML 데이터로 마샬링할 때 JAXBManager 인스턴스를 만들게되고 내부적으로 JAXBContext 인스턴스를 만들게 됩니다. 이렇게 JAXBContext 인스턴스를 생성하는 구조가 왜 문제가 되는가를 살펴보면

> To avoid the overhead involved in creating a JAXBContext instance, a JAXB application is encouraged to reuse a JAXBContext instance. An implementation of abstract class JAXBContext is required to be thread-safe, thus, multiple threads in an application can share the same JAXBContext instance.

JAXBContext 인스턴스 초기화 시 약간의 오버헤드가 존재하는데 JAXBContext 인스턴스는 Thread Safe 하므로 동일한 JAXBContext 인스턴스를 다중 스레드 환경에서 공유해 사용해도 상관없다고 합니다.

### XML 데이터 확인
다음은 약 8초 ~ 20초가 걸리던 OpenADR 페이로드 중 일부 XML 데이터입니다. 

```xml
<?xml version="1.0" encoding="UTF-8"?>
<oadrPayload xmlns="http://openadr.org/oadr-2.0b/2012/07" 
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:clm5ISO42173A="urn:un:unece:uncefact:codelist:standard:5:ISO42173A:2010-04-07" 
    xmlns:ds="http://www.w3.org/2000/09/xmldsig#" 
    xmlns:dsig11="http://www.w3.org/2009/xmldsig11#" 
    xmlns:ei="http://docs.oasis-open.org/ns/energyinterop/201110" 
    xmlns:emix="http://docs.oasis-open.org/ns/emix/2011/06" 
    xmlns:gb="http://naesb.org/espi" 
    xmlns:gml="http://www.opengis.net/gml/3.2" 
    xmlns:ical="urn:ietf:params:xml:ns:icalendar-2.0" 
    xmlns:power="http://docs.oasis-open.org/ns/emix/2011/06/power" 
    xmlns:pyld="http://docs.oasis-open.org/ns/energyinterop/201110/payloads" 
    xmlns:scale="http://docs.oasis-open.org/ns/emix/2011/06/siscale"
    xmlns:strm="urn:ietf:params:xml:ns:icalendar-2.0:stream" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <oadrSignedObject>
        <oadrUpdateReport ei:schemaVersion="2.0b">
            <pyld:requestID>5db7fe19762ac9e75e1fd897</pyld:requestID>
            <oadrReport>
                <ical:dtstart>
                    <ical:date-time>2019-10-29T08:53:30Z</ical:date-time>
                </ical:dtstart>
                <strm:intervals>
                    <ei:interval>
                        <ical:dtstart>
                            <ical:date-time>2019-10-29T08:53:30Z</ical:date-time>
                        </ical:dtstart>
                        <ical:duration>
                            <ical:duration>PT0M</ical:duration>
                        </ical:duration>
                        <ical:uid>
                            <ical:text>0</ical:text>
                        </ical:uid>
                        <oadrReportPayload>
                            <ei:rID>COMM_ERROR_YN</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>0.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>CYCLE_ACTIVE_ENERGY</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>500.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>CYCLE_REVERSE_ACTIVE_ENERGY</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>0.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>ACTIVE_POWER</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>223.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>TOTAL_ACTIVE_ENERGY</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>24700.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>REVERSE_ACTIVE_POWER</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>0.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>TOTAL_REVERSE_ACTIVE_ENERGY</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>0.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>VOLTAGE_R</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>3745.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>VOLTAGE_S</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>3732.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>VOLTAGE_T</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>117.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>CURRENT_R</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>66.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>CURRENT_S</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>89.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>CURRENT_T</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>93.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>FREQUENCY</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>600.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>REACTIVE_POWER</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>0.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                        <oadrReportPayload>
                            <ei:rID>POWER_FACTOR</ei:rID>
                            <ei:confidence>100</ei:confidence>
                            <ei:accuracy>0.0</ei:accuracy>
                            <ei:payloadFloat>
                                <ei:value>0.0</ei:value>
                            </ei:payloadFloat>
                            <oadrDataQuality>Quality Good - Non Specific</oadrDataQuality>
                        </oadrReportPayload>
                    </ei:interval>
                </strm:intervals>
                <ei:eiReportID>eiRep_5db7fe19762ac9e75e1fd898</ei:eiReportID>
                <ei:reportRequestID>5db673e9762ae7a133ef7841</ei:reportRequestID>
                <ei:reportSpecifierID />
                <ei:reportName>TELEMETRY_USAGE</ei:reportName>
                <ei:createdDateTime>2019-10-29T08:53:45Z</ei:createdDateTime>
            </oadrReport>
            <ei:venID />
        </oadrUpdateReport>
    </oadrSignedObject>
</oadrPayload>
```

### 코드 구조 개선
JAXBManager 클래스 변수로 JAXBContext 인스턴스를 생성해놓고 마샬러와 언마샬러를 가져오는 방식으로 변경하였습니다.

```java
public class JAXBManager {
    public static final String DEFAULT_JAXB_CONTEXT_PATH = "";
    private static JAXBContext jaxbContext;

    static {
        try {
            jaxbContext = JAXBContext.newInstance(DEFAULT_JAXB_CONTEXT_PATH);
        } catch (JAXBException e) {
            e.printStackTrace();
        }
    }

    public static Marshaller getMarshaller() throws JAXBException {
        Marshaller marshaller = jaxbContext.createMarshaller();
        marshaller.setProperty("jaxb.fragment", Boolean.TRUE);
        return marshaller;
    }

    public static Unmarshaller geUnmarshaller() throws JAXBException {
        Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
        unmarshaller.setProperty("jaxb.fragment", Boolean.TRUE);
        return unmarshaller;
    }
}
```

JAXBContext 인스턴스를 생성하는 행위를 줄임으로써 JAXBContext 인스턴스 초기화시 발생하는 오버헤드를 줄이게되므로 이전에 약 8초 ~ 20초가 걸리던 문제가 0.3초 ~ 1초로 단축되었음을 확인하였습니다. 여러분도 마샬러 또는 언마샬러를 가져올때 동일한 JAXBContext 인스턴스에서 가져오도록 하였는지 살펴보시기 바랍니다.


## 참고
- [JAXB creating context and marshallers cost](https://stackoverflow.com/questions/7400422/jaxb-creating-context-and-marshallers-cost)
- [JAXBContext Initialization Takes A Long Time](https://www.ibm.com/support/pages/jaxbcontext-initialization-takes-long-time)
- [김용환 블로그 - JAXB 잘 사용하기](https://knight76.tistory.com/entry/JAXB-%EC%9E%98-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)
