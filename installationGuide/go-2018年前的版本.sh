#!/bin/sh

#
# 前台： 解压所有的zip文件（可能不存在）,
# 放到： wwwz/card2/www目录下
#
cd /data/wwwz/card2/www
mv /home/andrew/releaseAll1.0.0.zip .
unzip -o releaseAll1.0.0.zip
rm releaseAll1.0.0.zip

mv /home/andrew/wwwArts.zip .
unzip -o wwwArts.zip
rm wwwArts.zip

mv /home/andrew/www.zip .
unzip -o www.zip
rm www.zip

#
# 前台：搬移 index和lib
# 

#
# 后台：
#
cd /data/wwwz/card2/backoffice
mv /home/andrew/backOffice.zip .
unzip -o backOffice.zip
rm backOffice.zip

#
# 以上是 udoido主项目， 以下是派生项目：
#

cd /data/wwwz/card2/wwwKs
mv /home/andrew/wwwKs.zip .
unzip -o wwwKs.zip
rm wwwKs.zip

#
# 重新启动系统（不重启硬件）
#
killall node
cd /data/wwwz/card2
nohup node backoffice/bin/server.js

