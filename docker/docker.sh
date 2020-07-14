#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com

initConfigFile(){
echo "initConfigFile"
    currentProjectName=`pwd | awk 'BEGIN{FS="/"} {print $(NF-1)}'`
    currentProjectSourcePath=`pwd | awk 'BEGIN{FS="/docker"} {print $1}'`
    password=123zxc
    port=7100
    hostname=node
    yarnCacheDir=`yarn cache dir`
    # if ! [[ -e ./docker-compose.yml ]]; then

    source ./createConfigLocalFile.sh $port $hostname $password
    cat > ./docker-compose.yml <<EOF
version: '3'
services:
    node:
        image: registry.cn-shenzhen.aliyuncs.com/yxw-docker/node10.15.3:latest
        container_name: node
        hostname: $hostname
        ports:
            - "$port:$port"
        working_dir: /source/$currentProjectName
        links:
            - redis:redis
        volumes:
            - $currentProjectSourcePath:/source/$currentProjectName
            - $yarnCacheDir:/usr/local/share/.cache/yarn/v4
        command: ["/bin/sh", "-c", "yarn install && yarn dev"]
    redis:
        image: redis:3
        container_name: redis
        hostname: redis
        command: redis-server /usr/local/etc/redis/redis.conf --requirepass $password
        volumes:
            - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
        ports:
            - "6379:6379"
EOF

    # fi

    currentContainerNum=`docker-compose ps | awk 'BEGIN{FS=" "} {
        if ($1 == "php" || $1 =="nginx" || $1 =="mysql"){
            print $1
        }
    }' | wc -l`

    echo $currentContainerNum

    if [[ currentContainerNum -eq 0 ]]; then
        echo -e "\033[36m Running...... \033[0m"
        docker-compose -f ./docker-compose.yml up -d
    else
        echo -e "\033[36m The services you need has started. \033[0m"
        echo -e "\033[36m Stopping...... \033[0m"
        docker-compose down
        echo -e "\033[36m Complete Stopping. \033[0m"
        echo -e "\033[36m Running...... \033[0m"
        docker-compose -f ./docker-compose.yml up -d
        echo -e "\033[36m Complete. \033[0m"
    fi

}

addPort2NginxFile(){

    echo "createNginxFile";
}

addHost2NginxFile(){

    echo "createNginxFile";
}



start(){
    if [[ currentContainerNum -eq 0 ]]; then
        echo -e "\033[36m Running...... \033[0m"
        docker-compose -f ./docker-compose.yml up -d
    else
        echo -e "\033[36m The services you need has started. \033[0m"
        echo -e "\033[36m Stopping...... \033[0m"
        docker-compose down
        echo -e "\033[36m Complete Stopping. \033[0m"
        echo -e "\033[36m Running...... \033[0m"
        docker-compose -f ./docker-compose.yml up -d
        echo -e "\033[36m Complete. \033[0m"
    fi
}

stop(){
# echo "stop"
   docker-compose down
}

exec(){
   docker exec -it $1 /bin/bash
}

logs(){
   docker-compose logs -f $1
}


#docker-compose -f ./docker-compose1.yml up -d
#
#docker logs php




# create by yuxuewen
# email 8586826@qq.com
# Identify parameters and options
while [ -n $1 ]
do
    case $1 in
        "init")
            initConfigFile ;;
        "start")
            start;;
        "stop")
            stop;;
        "exec")
            exec $2;;
        "logs")
            logs $2;;
        *) break ;;
    esac

    shift

done

while [ -n $1 ]
do
    case $1 in
        -port)
            addPort2NginxFile $2;;
        -host)
            addHost2NginxFile $2;;
        *) break ;;
    esac
    shift
done
