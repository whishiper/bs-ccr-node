FROM registry.cn-shenzhen.aliyuncs.com/yxw-docker/node10.15.3:latest
MAINTAINER yuxuewen <8586826@qq.com>

RUN mkdir /opt/app

COPY . /opt/app

RUN rm -rf /opt/app/node_modules


WORKDIR /opt/app

RUN yarn install


EXPOSE 9300

CMD  ["/bin/sh", "-c", "yarn rbn-start-test"]