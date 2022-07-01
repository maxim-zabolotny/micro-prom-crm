# Docker

## Useful commands 

1. remove one container: 
   1. `ID=$(docker ps -q) && docker stop $ID && docker rm $ID`
2. watch logs: 
   1. `docker logs --timestamps --follow --tail 20 $container_name`
3. entrance in container: 
   1. `docker exec -it $container_name bash`
4. build and run containers:
   1. `docker-compose -f ./docker-compose.dev.yaml up --build -d`