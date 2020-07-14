FROM node:12.14
MAINTAINER yuxuewen <8586826@qq.com>

RUN mkdir /opt/app \
    && yarn config set registry https://registry.npm.taobao.org \
    && npm install -g cnpm --registry=https://registry.npm.taobao.org


COPY . /opt/app

RUN rm -rf /opt/app/node_modules


WORKDIR /opt/app

RUN yarn install



EXPOSE 9100

ENTRYPOINT ["npm","run","rbn-start-test"]