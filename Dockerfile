FROM node:12
MAINTAINER yuxuewen <8586826@qq.com>

RUN mkdir /opt/app 

COPY . /opt/app

RUN rm -rf /opt/app/node_modules


WORKDIR /opt/app

RUN npm install

EXPOSE 9200

CMD  ["/bin/sh", "-c", "npm run rbn-start-test"]