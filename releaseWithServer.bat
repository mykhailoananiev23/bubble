chcp 65001 
node --version
echo off
echo "确认Node版本是14.18.3"

rem nvm 要求admin窗口
rem Gulp的task完成之时，其所生成的文件尚未“exist”在OS的file系统中，
rem 即使将task延时关闭，也无法看到这些文件。
rem 所以，分 server和dopack两个部分，间隔以Timeout，
rem 而且在dopack内部waitfor抽检的几个文件，再延时1000ms，
rem 以确保所有文件都生成了

rem 已经全部升级到了14.18.3，不再需要切换nvm到其它版本了
rem start /w nvm use 14.18.3

timeout /T 1 /nobreak
rem 生成cat 文件
start gulp

echo "确认cat文件exist，再开始minify, delay 30s"
timeout /T 30 /nobreak
start gulp server

rem 确认minify文件exist，再开始打包
timeout /T 20 /nobreak   
start gulp dopack

copy upload-to-server.bat dist\dist
timeout /T 20 /nobreak   

rem upload server
start dist\dist\upload-to-server.bat
