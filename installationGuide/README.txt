Ignore the Linux setup instructions under UDOIDO3\installationGuide\Udoido安装手册; follow this README to set up a UDOIDO running environment on Windows.

Follow Udoido安装手册/"How to setup Backend office in Windows.pdf". Extra note:
1. Install NodeJS
   Download node-v20.11.1-x64.msi; click to install
   This is straightford.

2. Install MongoDB
   2.1 Download mongodb-windows-x86_64-7.0.5-signed.msi; click to install

   Example setup parameters:
   Service Name: MongoDB
   Data Directory: C:\Program Files\MongoDB\Server\7.0\data\
   Log Directory: C:\Program Files\MongoDB\Server\7.0\log\
   
   Above are default folders. 建议总是创建自己的目录，不用默认的目录， 减少不同OS之间的差异.

   The application is MongoDB Compass
   URI mongodb://localhost:27017
   Note: if you choose the default port 27017, you need to make changes (replacing 57098 with 27017) in backOffice/common/configSvr.js and backOffice/bin/server.js
         So it is advised to use port 57098 to avoid need to change configSvr.js and server.js

   2.2 Create database folder: C:\Tools\dbMongo\db
   Note: You need to use this folder name in "--dbpath C:\Tools\dbMongo\db" in backOffice/db-start.bat
   
   2.3 Copy the wwwz certifications (unzip wwwz) to project UDOIDO3\data (i.e. you will have the cert files in UDOIDO3\data\wwwz)
   Also need to put the wwwz folder under C:\data because C:\data\wwwz\backOffice\resource\fbPageTemplate.html is required

3. Install mongosh to run mongodb cli
   Download mongosh-2.1.4-x64.msi; double click to install

4. Start the Database
   You may need to use mongod's absoluate path in db-start.bat
   In my case it is "C:\Program Files\MongoDB\Server\7.0\bin\mongod"

   Also make sure to use your database folder (2.2) for --dbpath.

   Also make sure you use your db port number (2.1) for --port.

   cd to your UDOIDO3 folder, run
   backOffice\db-start.bat

5. cd to your UDOIDO3\backOffice folder, run
   npm install

6. cd to your UDOIDO3
   node backOffice\bin\server.js
   (need to change backOffice/common/configSvr.js, change port 57098 to your port set in 2.1 e.g. 27017)

7. 给host(在C:\Windows\system32\drivers\etc目录下）添加下面的内容：
#    127.0.0.1       localhost
#    ::1             localhost
127.0.0.1  udoido.com
127.0.0.1  www.udoido.com
127.0.0.1  show.udoido.com
   
   Turn off Internet Information Service from Control Panel
   Then you can visit https://www.udoido.com from your local browser

   You should see a web page like the screenshot udoidopage.png