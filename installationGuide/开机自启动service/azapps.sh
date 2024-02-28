#!/bin/sh

date
echo "wait 10 seconds";

pwd
cd /usr/udoido
pwd
/usr/bin/node /usr/udoido/backOffice/bin/server.js
pwd

echo "end ---------------"