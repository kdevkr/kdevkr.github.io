## Install

### Add Repository Signing Key

```sh
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc | sudo apt-key add -

sudo apt-key adv --keyserver "hkps://keys.openpgp.org" --recv-keys "0x0A9AF2115F4687BD29803A206B73A36E6026DFCA"

#
```

### Enable apt HTTPS Transport
```sh
sudo apt-get install apt-transport-https
```

### Add a Source List File
```sh
# /etc/apt/sources.list.d/bintray.erlang.list

# focal for Ubuntu 20.04
# The erlang component installs the most recent version available
deb https://dl.bintray.com/rabbitmq-erlang/debian focal erlang
```

### Install Erlang Packages
```sh
sudo apt-get update -y
sudo apt-get install rabbitmq-server -y
```

### Run RabbitMQ Server
```sh
service rabbitmq-server start
sudo service rabbitmq-server status

sudo rabbitmq-diagnostics ping
```

### Enable Management Plugin
```sh
sudo rabbitmq-plugins enable rabbitmq_management

# Access to http://localhost:15672/ using guest/guest

sudo rabbitmqctl add_user mambo 'mambo'
sudo rabbitmqctl set_user_tags mambo administrator
sudo rabbitmqctl set_permissions -p / mambo ".*" ".*" ".*"
```

## Install with Docker

```sh
# docker pull rabbitmq
sudo docker run -d --name rabbitmq -p 15672:15672 -p 5672:5672 rabbitmq:management

# Add user.
sudo docker exec -it rabbitmq /bin/bash
rabbitmqctl add_user mambo 'mambo'
rabbitmqctl set_user_tags mambo administrator
rabbitmqctl set_permissions -p / mambo ".*" ".*" ".*"
```
