#!/bin/bash

cd /home/ubuntu/webapp
pwd
ls
sudo pm2 stop all
pm2 start app.js