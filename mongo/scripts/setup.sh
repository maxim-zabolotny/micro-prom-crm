#!/bin/bash

#MONGODB1=`ping -c 1 mongo1 | head -1  | cut -d "(" -f 2 | cut -d ")" -f 1`

MONGODB1=crm_database

echo "**********************************************" ${MONGODB1}
echo "Waiting for startup.."
until curl http://${MONGODB1}:27017/serverStatus\?text\=1 2>&1 | grep uptime | head -1; do
  printf '.'
  sleep 1
done

# echo curl http://${MONGODB1}:28017/serverStatus\?text\=1 2>&1 | grep uptime | head -1
# echo "Started.."


echo SETUP.sh time now: `date +"%T" `
mongo --host "${MONGODB1}:27017" <<EOF

var cfg = {
    "_id": "rs0",
    "protocolVersion": 1,
    "version": 1,
    "members": [
        {
            "_id": 1,
            "host": "${MONGODB1}:27017",
            "priority": 1
        }
    ],
    settings: {
    	chainingAllowed: true
    }
};


rs.initiate(cfg, { force: true });
rs.reconfig(cfg, { force: true });

db.getMongo().setReadPref('nearest');

rs.status();
EOF
