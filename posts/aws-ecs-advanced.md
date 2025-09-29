---
title: Amazon ECS 조금 더 알아보기
date: 2024-11-14T00:00+09:00
tags:
- Amazon ECS
---

Amazon ECS 에 대해서 조금 더 알아보도록 하자.

#### 태스크 awsvpc 네트워크 모드와 탄력적 네트워크 인터페이스(ENI)

![](/images/posts/aws-ecs-advanced/01.png)

Fargate와 EC2 인스턴스 모두 awsvpc 네트워크 모드에서는 프라이빗 IP 주소가 ENI로 할당된다. 인스턴스 유형에 따라 최대 ENI 할당 개수가 제한되므로 주의해야한다. 이때, ECS 서비스 계정 설정에서 awsVpcTrunking를 활성화하는 경우 EC2 인스턴스에서 사용할 수 있는 ENI 개수 제한이 늘어난다.

```sh
aws ec2 describe-instance-types \
    --filters "Name=instance-type,Values=c6g.*" \
    --query "InstanceTypes[].{ \
        Type: InstanceType, \
        MaxENI: NetworkInfo.MaximumNetworkInterfaces, \
        IPv4addr: NetworkInfo.Ipv4AddressesPerInterface}" \
    --output table

----------------------------------------
|         DescribeInstanceTypes        |
+----------+----------+----------------+
| IPv4addr | MaxENI   |     Type       |
+----------+----------+----------------+
|  50      |  15      |  c6g.16xlarge  |
|  10      |  3       |  c6g.large     |
|  15      |  4       |  c6g.xlarge    |
|  30      |  8       |  c6g.12xlarge  |
|  4       |  2       |  c6g.medium    |
|  50      |  15      |  c6g.metal     |
|  30      |  8       |  c6g.8xlarge   |
|  30      |  8       |  c6g.4xlarge   |
|  15      |  4       |  c6g.2xlarge   |
+----------+----------+----------------+
```

> EC2 인스턴스와 다르게 [Fargate 에서는 ENI 확장을 지원하지 않습니다](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-eni.html?icmpid=docs_ecs_hp_account_settings).

#### 태스크 bridge 네트워크 모드와 동적 포트 매핑

![](/images/posts/aws-ecs-advanced/02.png)

Amazon ECS 공식 문서에서는 EC2 인스턴스에서도 awsvpc 네트워크 모드를 권장합니다. EC2 인스턴스의 [bridge 네트워크 모드](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/networking-networkmode-bridge.html)에서는 호스트 포트를 지정하지 않도록 하여 동적 포트 매핑(Dynamic port mapping)이 가능하므로 동일한 포트를 사용하는 서로 다른 애플리케이션을 운영하는데 도움이 될 것 같다.

> 동적 매핑을 구성하려는 경우 EC2 인스턴스가 가지는 보안 그룹이 [임시 포트 범위(49153-65535 와 32768-61000)](https://repost.aws/knowledge-center/dynamic-port-mapping-ecs)에 대한 인바운드 트래픽을 허용해야 합니다.

#### 젠킨스 파이프라인과 AWS ECR 플러그인

[Amazon ECR 프라이빗 리파지토리로 이미지를 푸시할 수 있는 IAM 권한](https://docs.aws.amazon.com/ko_kr/AmazonECR/latest/userguide/image-push-iam.html)을 만들거나 [EC2InstanceProfileForImageBuilderECRContainerBuilds](https://docs.aws.amazon.com/ko_kr/aws-managed-policy/latest/reference/EC2InstanceProfileForImageBuilderECRContainerBuilds.html) 정책을 가지는 IAM 사용자를 만들면 젠킨스에서 Amazon ECR 리파지토리로 빌드된 이미지를 푸시할 수 있다. 

- [Docker Pipeline 플러그인](https://plugins.jenkins.io/docker-workflow/)
- [AWS Credentials 플러그인](https://plugins.jenkins.io/aws-credentials/)
- [Amazon ECR 플러그인](https://plugins.jenkins.io/amazon-ecr/)

젠킨스 서버에 [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)를 설치해도 되지만 컨테이너 기반의 [inbound-agent](https://hub.docker.com/r/jenkins/inbound-agent/) 또는 Cloud 로 docker-agent 로 빌드 파이프라인을 수행하는 경우 **aws-cli 가 설치되지 않은 상태**일 수 있다. 따라서, AWS Credentails 플러그인과 함께 Amazon ECR 플러그인을 사용하여 ECR 리파지토리로 이미지를 푸시하는 파이프라인을 작성하는 것을 권장한다. 

다음은 젠킨스 파이프라인 작성에 대한 예시이다.

```groovy
pipeline {
    agent {
        label 'docker-agent'
    }
    
    tools {
        jdk "JDK17"
    }

    properties {
        string(name: 'buildTag', defaultValue: 'latest', description: 'build version')
    }
    
    environment {
        registry = 'xxxxx.dkr.ecr.ap-northeast-2.amazonaws.com'
        repository = 'xxxxx.dkr.ecr.ap-northeast-2.amazonaws.com/sample-app'
        registryCredential = 'mambo-ecr-builder'
        registryRegion = 'ap-northeast-2' // seoul
        buildImage = ''
        JAVA_HOME = "tool JDK17"
    }

    stages {
        
        stage('Prepare') {
            steps {
                echo 'Cloning Repository'
                git branch: 'main', 
                    credentialsId: 'jenkins-git-token', 
                    url: 'https://github.com/xxx/ecs-demo.git'
            }
            post {
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }
        
        stage('Build Gradle') {
            steps {
                echo 'Build Gradle'

                dir('./sample-app'){
                    sh '''
                        pwd
                        chmod +x ./gradlew
                        ./gradlew build ecsbuild
                    '''
                }
            }
            post {
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }
        
        stage('Build image') {
            steps {
                dir('./sample-app') {
                    script {
                        buildImage = docker.build("sample-app:${buildTag}", "--build-arg BUILD_VERSION=${buildTag} .")
                    }
                }
            }
        }
        
        stage('Push image') {
            steps {
                script {
                    // sh 'docker images'
                    
                    docker.withRegistry("https://${registry}", "ecr:${registryRegion}:${registryCredential}") {
                        buildImage.push()
                    }
                }
            }
        }
        
        stage('Cleanup docker image') {
            steps {
                script {
                    sh '''
                        docker rmi sample-app:latest
                        docker rmi $repository:$buildTag
                    '''
                }
            }
        }

    }
}
```

> 만약, 젠킨스 파이프라인에서 ERROR: could not find credentials matching ecr:ap-northeast2:aws_credential_id 와 같은 오류가 난다면 젠킨스에 Amazon ECR 플러그인을 설치했는지 확인하시기 바랍니다.

#### Amazon ECS 와 인터페이스 VPC 엔드포인트

[스타트업 엔지니어의 AWS 비용 최적화 경험기](https://tech.inflab.com/20240227-finops-for-startup/)처럼 데브옵스 엔지니어에게는 Amazon ECS에 대한 요금 절감은 중요한 부분에 해당될 수 있다. Amazon ECS 공식 문서에서는 [Amazon ECS 관련 인터페이스 VPC 엔드포인트(PrivateLink)](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/vpc-endpoints.html)를 사용하면 퍼블릭 엔드포인트로의 요청을 위해 인터넷 게이트웨이 또는 NAT 게이트웨이에 대한 비용을 절감할 수 있다고 안내한다. 그러나, 인터페이스 VPC 엔드포인트는 중요한 부분이 있는데 Private Link는 서브넷마다 ENI를 할당하므로 서브넷 개수만큼 시간 요금이 부가된다는 것이다. 

따라서, ECS와 ECS Agent 컨테이너 또는 서비스 연결을 위한 Envoy 사이드카 컨테이너 등에서 CloudWatch Logs VPC 엔드포인트로의 요청이나 여러가지 모니터링을 위한 사이드카 컨테이너로 인해 NAT 게이트웨이에 대한 요금이 많이 발생하는 트래픽 규모가 아니라면 **Amazon ECS와 함께 NAT 게이트웨이를 사용하는게 더 적합**할 수 있다.

#### Amazon ECS 관련 레퍼런스

- [Amazon ECS 알아보기 - ECS Overview](https://www.youtube.com/watch?v=B3kdqNJ7WXc)
- [Amazon ECS 알아보기 - AutoScaling](https://www.youtube.com/watch?v=_AUF9Mn2nuk)
- [Deep Dive on Amazon ECS Cluster Auto Scaling](https://aws.amazon.com/ko/blogs/containers/deep-dive-on-amazon-ecs-cluster-auto-scaling/)
- [Deep dive into Amazon ECS resilience and availability](https://www.youtube.com/watch?v=C7HUkG_tu90)
- [Hybrid deployments at scale with Amazon ECS Anywhere](https://www.youtube.com/watch?v=7fsyqjE8W_I)
- [AWS에서 컨테이너를 운영한다면 꼭 봐야 하는 모범 사례](https://www.youtube.com/watch?v=aY-ZTFPAOEc)