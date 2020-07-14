#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com

    cat > ../config/config.local.js <<EOF
'use strict';
exports.cluster = {
  listen: {
    port: 9100,
    hostname: '$2',
  },
};
exports.httpclient = {
  request: {
    timeout: 10000,
  },
};

exports.redis = {
  clients: {
    // 国内
    internal: {
      port: 6379,
      host: '$1',
      password: '123zxc',
      db: 0,
    },
    // 国外火币
    external_huobi: {
      port: 6379,
      host: '$1',
      password: '123zxc',
      db: 0,
    },
    // 国外 ok
    external_okex: {
      port: 6379,
      host: '$1',
      password: '123zxc',
      db: 0,
    },
  },
};
exports.rocketMq = {
  // 与java 订单相关
  javaOrderGroupChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    // 生产者group
    producerGroup:
      'MQ_INST_1782728101358463_Bbpg0jHs%GID-bs-ccr-consumer-order-group-info',
    // 生产者topic
    topic_pub:
      'MQ_INST_1782728101358463_Bbpg0jHs%bs-ccr-topic-trade-order-group-info',
    nameSrv:
      'MQ_INST_1782728101358463_Bbpg0jHs.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
  // 与国外egg 订单相关
  externalOrderGroupChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    // 消费者group
    consumerGroup:
      'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-consumer-egg-huobi-symbol-price',
    // 消费者topic
    topic_sub:
      'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-egg-huobi-symbol-price',
    nameSrv:
      'MQ_INST_1782728101358463_BbCmhMPY.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
};

exports.jwt = {
  secret: 'welovebosen1909',
  expiresIn: 3500,
};

//test
exports.aliyunApiGateway = {
  appKey: '203727404',
  appSecret: 'dflf7ixju8q9c6zwet79yhz8xxaotr0k',
  baseUrl: 'http://ccrapi.bosenkeji.cn',
  stage: 'RELEASE',
  verbose: true,
};

exports.aliyunSms = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  secretAccessKey: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  loginTemplate: 'SMS_161591103',
  registerTemplate: 'SMS_161596094',
  resetPasswordTemplate: 'SMS_161591107',
  replacePhoenTemplate: 'SMS_162140110',
};

exports.oss = {
  client: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    bucket: 'bs-follow',
    endpoint: 'oss-cn-shenzhen.aliyuncs.com',
    timeout: '60s',
  },
};
exports.multipart = {
  fileSize: '20mb',
  // mode:'file',
  whitelist: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
  ],
};

exports.onerror = {
  json(err, ctx) {
    if (typeof err === 'object') {

      if (Reflect.has(err, 'status')) {
        ctx.status = Reflect.get(err, 'status');
      } else {
        ctx.status = 500;
      }
      if (
        Reflect.has(err, 'name') &&
        Reflect.has(err, 'message') &&
        Reflect.has(err, 'status')
      ) {
        const obj = {
          name: err.name,
          errors: err.message,
          status_code: err.status,
        };
        ctx.body = obj;
      } else {
        ctx.body = err;
      }
    } else {
      ctx.status = 500;
      ctx.body = { errors: err };
    }
  },
  accepts(ctx) {
    return 'json';
  },
};


// 部署到国外服务器 专门获取火币api
exports.ccr_huobi = {
  url: 'http://47.254.44.189:7100',
};
exports.huobiServer = {
  url: 'http://47.112.210.29:9200',
};
exports.okexServer = {
  url: 'http://47.112.210.29:9300',
};
exports.aliCloudPopCore = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  apiVersion: '2016-07-14',
};
exports.oauth = {
  url: 'http://47.112.210.29:8100',
};


EOF
