cd \proj\UDOIDO3\dist\dist
scp *.zip udomgr@67.43.233.241:/usr/udoido

rem in Server, using tools in /usr/udoido folder:
rem sh unzip-new-version.sh
rem sh apply-new-version.sh
rem sh apply-new-version-2.sh
rem sh restart-backend.sh
