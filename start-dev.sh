#!/usr/bin/env bash

#################################
## Run application in DEV mode ##
#################################

# $1 = seed | 0
# $2 = migrations | 0

started_at=$(date +"%s")
file="docker-compose.dev.yaml"

#### START: Environment settings
echo "-----> Environment settings"
export MY_UID="$(id -u)" 
export MY_GID="$(id -g)"
echo "uid=${MY_UID} gid=${MY_GID}"
echo ""
#### END

#### START: Provisioning containers
echo "-----> Provisioning containers"
docker-compose -f "./$file" up -d
echo ""
#### END

#### START: Share access Mongo /data/db to current user
mongo=$(docker-compose -f "./$file" ps | grep database | awk '{print $1}')

echo "-----> Sharing access Mongo /data/db to current user"
docker exec -it "$mongo" bash -c "chown -R 999:999 /data/db"
echo "<----- Shared"
echo ""
#### END

#### START: Run migrations and seeds
api=$(docker-compose -f "./$file" ps | grep api | awk '{print $1}')

if [ "$1" == "seeds" ]; then
  echo "-----> Running application seeds"
  docker exec -it "$api" bash -c "CLI_PATH=./src/cli.ts npx nestjs-command create:users \
  	&& CLI_PATH=./src/cli.ts npx nestjs-command create:constants \
  	&& CLI_PATH=./src/cli.ts npx nestjs-command create:integrations"
  echo "<----- Seeds created"
  echo ""
fi
#### END

#### START: Calculate result time
ended_at=$(date +"%s")

minutes=$(((ended_at - started_at) / 60))
seconds=$(((ended_at - started_at) % 60))

echo "-----> Done in ${minutes}m${seconds}s"
#### END
