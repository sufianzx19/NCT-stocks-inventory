#!/bin/bash

cd /home/sufian/dev/NCT_Stocks_Inventory

git add .

git commit -m "Auto backup $(date '+%Y-%m-%d %H:%M:%S')"

git push origin main
