---
  title: RTL88x2bu
  description: Realtek RTL88x2bu Drvier
---

> https://github.com/cilynx/rtl88x2bu

리눅스에서 NEXT-1201AC USB 무선랜카드를 사용하기 위해서는 RTL88x2bu 드라이버를 설치해야한다.

NEXT-1201AC를 USB 포트에 삽입하였지만 다음과 같이 드라이버를 알 수 없다.
```sh
usb-devices

T:  Bus=03 Lev=01 Prnt=01 Port=00 Cnt=01 Dev#=  2 Spd=480 MxCh= 0
D:  Ver= 2.10 Cls=00(>ifc ) Sub=00 Prot=00 MxPS=64 #Cfgs=  1
P:  Vendor=0bda ProdID=b812 Rev=02.10
S:  Manufacturer=Realtek
S:  Product=802.11ac NIC
S:  SerialNumber=123456
C:  #Ifs= 1 Cfg#= 1 Atr=80 MxPwr=500mA
I:  If#=0x0 Alt= 0 #EPs= 5 Cls=ff(vend.) Sub=ff Prot=ff Driver=(none)
```

NEXT-1201AC 제품의 공식 홈페이지에서 제공하는 드라이버 설치 파일을 통해서는 커널 버전 차이로 인하여 제대로 설치가 안될 수 있다.
NEXT-1201AC 제품은 RTL88x2bu 드라이버를 사용하므로 이를 다운받아 설치하도록 하자.

```sh
git clone https://github.com/cilynx/rtl88x2bu
cd rtl88x2bu
VER=$(sed -n 's/\PACKAGE_VERSION="\(.*\)"/\1/p' dkms.conf)
sudo rsync -rvhP ./ /usr/src/rtl88x2bu-${VER}
sudo dkms add -m rtl88x2bu -v ${VER}
sudo dkms build -m rtl88x2bu -v ${VER}
sudo dkms install -m rtl88x2bu -v ${VER}
sudo modprobe 88x2bu

reboot
```

정상적으로 설치가 되었으면 다음과 같이 드라이버를 확인할 수 있다.

```sh
usb-devices

T:  Bus=03 Lev=01 Prnt=01 Port=00 Cnt=01 Dev#=  2 Spd=480 MxCh= 0
D:  Ver= 2.10 Cls=00(>ifc ) Sub=00 Prot=00 MxPS=64 #Cfgs=  1
P:  Vendor=0bda ProdID=b812 Rev=02.10
S:  Manufacturer=Realtek
S:  Product=802.11ac NIC
S:  SerialNumber=123456
C:  #Ifs= 1 Cfg#= 1 Atr=80 MxPwr=500mA
I:  If#=0x0 Alt= 0 #EPs= 5 Cls=ff(vend.) Sub=ff Prot=ff Driver=rtl88x2bu
```
