#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com


homePath=`echo $HOME`
password=123zxc

cat > ./$1 <<EOF
#create by yuxuewen
#email 8586826@qq.com
version: '3'
services:
    $2:
        image: mysql:5.7
        container_name: $2
        hostname: $2
        network_mode: bridge
        ports:
          - "3306:3306"
        volumes:
          - ./mysql:/var/lib/mysql
          - ./my.cnf:/etc/mysql/conf.d/my.cnf
        environment:
          - MYSQL_ROOT_PASSWORD=$password
    $3:
        image: redis:3
        container_name: $3
        network_mode: bridge
        hostname: $3
        command: redis-server /usr/local/etc/redis/redis.conf --requirepass $password
        volumes:
          - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
        ports:
          - "6379:6379"

EOF
