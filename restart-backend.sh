clear
echo running nodes, killall
ps aux | grep -i node
sudo killall -9 node

echo start new instance:
sudo nohup node backOffice/bin/server.js&
sleep 1
echo ps for new instances:
ps aux | grep -i node
