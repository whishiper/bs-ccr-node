#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com
currentProjectName=`pwd | awk 'BEGIN{FS="/"} {print $(NF-1)}'`
currentProjectSourcePath=`pwd | awk 'BEGIN{FS="/docker"} {print $1}'`
nodeFileName=docker-compose-node-dev.yml
password=123zxc
port=9100
redisDevName=redis-dev
nodeDevName=node-master-dev

mysqlAndRedisFileName=docker-compose-mysql-redis.yml
mysqlDevName=mysql-dev
redisDevName=redis-dev

yarnCacheDir=`yarn cache dir`

initConfigFile(){
echo "initConfigFile"


    source ./initMysqlAndRedis.sh $mysqlAndRedisFileName $mysqlDevName $redisDevName
    source ./initExternalConfigLocalFile.sh $redisDevName $nodeDevName

cat > ./$nodeFileName <<EOF
version: '3'
services:
    $nodeDevName:
        image: registry.cn-shenzhen.aliyuncs.com/yxw-docker/node10.15.3:latest
        container_name: $nodeDevName
        hostname: $nodeDevName
        network_mode: bridge
        ports:
            - "$port:$port"
        working_dir: /source/$currentProjectName
        external_links:
          - $redisDevName:$redisDevName
        volumes:
            - $currentProjectSourcePath:/source/$currentProjectName
            - $yarnCacheDir:/usr/local/share/.cache/yarn/v4
        command: ["/bin/sh", "-c", "yarn install && yarn dev"]
EOF

    # check mysql and redis
    mysqlAndRedisContainerNum=`docker-compose -f ./$mysqlAndRedisFileName ps |
        awk -v mysql=$mysqlDevName -v redis=$redisDevName 'BEGIN{FS=" "} {
        if ($1 ==mysql || $1 ==redis){
            print $1
        }
    }' | wc -l`

    if [[ mysqlAndRedisContainerNum -eq 0 ]]; then
        echo -e "\033[36m Running...... \033[0m"
        docker-compose -f ./$mysqlAndRedisFileName up -d
    else
        echo -e "\033[36m Mysql service and Redis service have started. \033[0m"
        echo -e "\033[36m Ignore...... \033[0m"
    fi

    nodeContainerNum=`docker-compose -f ./$mysqlAndRedisFileName ps |
        awk -v node=$nodeDevName 'BEGIN{FS=" "} {
        if ($1 ==node){
            print $1
        }
    }' | wc -l`

    if [[ nodeContainerNum -eq 0 ]]; then
        echo -e "\033[36m Running...... \033[0m"
        docker-compose -f ./$nodeFileName up -d
    else
        echo -e "\033[36m Node service you need has started. \033[0m"
        echo -e "\033[36m Ignore...... \033[0m"
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

    echo $1
    echo $nodeFileName
    if [[ "$1" == "mysql" || "$1" == "redis" ]]; then
        docker-compose -f ./$mysqlAndRedisFileName down
    fi

    if [[ "$1" == "node" ]]; then
        docker-compose -f ./$nodeFileName down
    fi


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
            stop $2;;
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
