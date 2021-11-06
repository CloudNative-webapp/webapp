#!/bin/bash

cd /home/ubuntu/webapp
pwd
ls
pm2 stop app.js
pm2 start app.js