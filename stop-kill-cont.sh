container_name=$1
container_port=$2

echo "-----> Search container"
container_id=$(docker ps | grep "$container_name" | awk '{print $1}')
echo "<----- Found: id=${container_id}"
echo ""

if [ -n "$container_id" ]
then
  echo "-----> Stop and remove"
  docker stop "$container_id"
  echo "<----- Stoped"
  docker rm "$container_id"
  echo "<----- Removed"
  echo ""
else 
  echo "-----> Container by name "${container_name}" not found. Skip"
  echo ""
fi

echo "-----> Kill proccesses on the port"
for pid in $(sudo lsof -i :"$container_port" | grep "docker" | awk '{print $2}'); do
  echo "<----- Found: pid=${pid}"  	
  sudo kill -9 "$pid"
  echo "<----- Killed"
done
echo "<----- Done"
echo ""
