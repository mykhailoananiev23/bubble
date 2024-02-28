cls
echo 先打包到./dist/下的www和backofiice，
echo 再启动它作为web和db服务器
cmd /c gulp 
cmd /c gulp client

cmd /c dist\start
