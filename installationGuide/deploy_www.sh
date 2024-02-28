#!/bin/sh
#
# 只部署前端新脚本（2022版）
#
# 前台： 复制www.zip文件放到/usr/udoido目录下，
#并解压到www子目录
cd /usr/udoido
sudo mv ~/nn/*.zip .
sudo unzip -o www.zip  -d www_new
sudo mv www www_old
sudo mv www_new www
sudo rm www.zip

#
# 重新启动系统（不重启硬件）
#

sudo killall -9 node
cd /usr/udoido
sudo nohup node backOffice/bin/server.js&
