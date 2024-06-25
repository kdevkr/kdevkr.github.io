---
title: AWS EC2 인스턴스 메타데이터
date: 2024-06-25T22:00+09:00
tags:
- IMDSv1
- IMDSv2
---

```sh
# IMDSv1
curl http://169.254.169.254/latest/dynamic/instance-identity/document

# IMDSv2
TOKEN=`curl -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"` -X PUT "http://169.254.169.254/latest/api/token" 
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document

{
    "accountId": "",
    "architecture": "arm64",
    "availabilityZone": "ap-northeast-2c",
    "billingProducts": null,
    "devpayProductCodes": null,
    "marketplaceProductCodes": null,
    "imageId": "ami-0331a5c9d849893dc",
    "instanceId": "",
    "instanceType": "c6g.xlarge",
    "kernelId": null,
    "pendingTime": "2024-06-23T01:01:23Z",
    "privateIp": "192.169.44.196",
    "ramdiskId": null,
    "region": "ap-northeast-2",
    "version": "2017-09-30"
}
```

[인스턴스 메타데이터 검색](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html)을 활용해서 동적 데이터의 [인스턴스 자격 증명 문서(instance-identity/document)](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/instance-identity-documents.html)를 가져오는 예시이다. 이번 글에서는 `AWS SDK for Java` 라이브러리에서 제공하는 `EC2 메타데이터 유틸리티`를 통해 AWS EC2 인스턴스에서 실행중인 애플리케이션 서버에서 EC2 인스턴스 정보를 조회할 수 있도록 작성해보려고 한다. 스프링 부트 기반의 애플리케이션이라면 스프링 부트 액추에이터의 [InfoContributor](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.info) 인터페이스를 구현한 `EC2MetadataInfoContributor`를 만들어보자.

#### EC2MetadataInfoContributor with SDK for Java 1.x

```groovy build.gradle
dependencies {
    // the AWS SDK for Java v1.x will enter maintenance mode on July 31, 2024, and reach end-of-support on December 31, 2025.
    implementation platform('com.amazonaws:aws-java-sdk-bom:1.12.748')
    implementation 'com.amazonaws:aws-java-sdk-ec2'
}
```

```java EC2MetadataInfoContributor.java
import com.amazonaws.util.EC2MetadataUtils;
import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.stereotype.Component;

@Component
public class EC2MetadataInfoContributor implements InfoContributor {
    private final boolean isRunningAwsEC2;

    public EC2MetadataInfoContributor() {
        isRunningAwsEC2 = EC2MetadataUtils.getInstanceId() != null;
    }

    @Override
    public void contribute(Info.Builder builder) {
        if (isRunningAwsEC2) {
            EC2MetadataUtils.InstanceInfo instanceInfo = EC2MetadataUtils.getInstanceInfo();
            builder.withDetail("ec2", instanceInfo);
        }
    }
}
```

#### EC2MetadataInfoContributor with SDK for Java 2.x

```groovy build.gradle
dependencies {
    implementation platform('software.amazon.awssdk:bom:2.21.4')
    implementation 'software.amazon.awssdk:imds'
    implementation 'software.amazon.awssdk:url-connection-client'
}
```

```java EC2MetadataInfoContributorV2.java
mport org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.document.Document;
import software.amazon.awssdk.imds.Ec2MetadataClient;
import software.amazon.awssdk.imds.Ec2MetadataResponse;

@Component
public class EC2MetadataInfoContributorV2 implements InfoContributor {
    private boolean isRunningAwsEC2;

    public EC2MetadataInfoContributorV2() {
        try (Ec2MetadataClient client = Ec2MetadataClient.create()) {
            isRunningAwsEC2 = client.get("/latest/meta-data/instance-id").asString() != null;
        } catch (Exception ignored) {
            // ignored
        }
    }

    @Override
    public void contribute(Info.Builder builder) {
        if (isRunningAwsEC2) {
            try (Ec2MetadataClient client = Ec2MetadataClient.create()) {
                Ec2MetadataResponse metadataResponse = client.get("/latest/dynamic/instance-identity/document");
                Document document = metadataResponse.asDocument();
                builder.withDetail("ec2", document.asMap());
            } catch (Exception ignored) {
                // ignored
            }
        }
    }
}
```

#### 인스턴스 메타데이터 검색

1. SDK 버전에 따라 [SDK가 엔드포인트를 IMDS로 확인하기 위해 확인하는 위치](https://docs.aws.amazon.com/ko_kr/sdk-for-java/latest/developer-guide/migration-imds.html#migration-imds-behavior-endpoint-res)가 다르다.
2. [Java 2.x는 IMDSv2만 지원](https://docs.aws.amazon.com/ko_kr/sdk-for-java/latest/developer-guide/migration-imds.html#migration-imds-behavior-imdsv2)하지만 Java 1.x는 IMDSv2 를 사용할 수 없을때 IMDSv1 으로도 조회한다.
3. Java 2.x는 [인스턴스 메타데이터 카테고리](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/instancedata-data-categories.html)를 직접 명시해야한다.
4. Java 1.x는 2025년 12월 31일 [지원 종료(End of support)](https://aws.amazon.com/ko/blogs/developer/announcing-end-of-support-for-aws-sdk-for-java-v1-x-on-december-31-2025/)된다.
