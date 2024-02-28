#!/bin/sh

#
# 前台： 解压所有的zip文件（可能不存在）,
# 放到： /usr/udoido目录下
#
cd /usr/udoido
mv ~/nn/*.zip  .
unzip -o www.zip
rm www.zip

#
# 重新启动系统（不重启硬件）
#
killall node
cd /data/wwwz/card2
nohup node backOffice/bin/server.js

