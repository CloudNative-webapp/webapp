#!/bin/bash

cd /home/ubuntu/webapp
pwd
ls
pm2 stop all
# sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/amazon-cloudwatch-agent.json -s
pm2 start app.js