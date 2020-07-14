#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com

    cat > ../config/config.local.js <<EOF
'use strict';
exports.cluster = {
  listen: {
    port: 9300,
    hostname: '$2',
  },
};
exports.httpclient = {
  request: {
    timeout: 10000,
  },
};
exports.redis = {
  client: {
    port: 6379,
    host: '$1',
    password: '123zxc',
    db: 0,
  },
};
exports.rocketMq = {
  // 与java通信
  javaChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    // 消费者group
    consumerGroup:
      'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-consumer-response-symbol-trade-info-okex',
    // 消费者topic
    topic_sub:
      'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-response-symbol-trade-info-okex',
    // 生产者topic
    topic_pub: 'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-symbol-price',
    nameSrv:
      'MQ_INST_1782728101358463_BbCmhMPY.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
  // 订单相关
  javaOrderChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    producerGroup:
      'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-consumer-order-info',
    // 订单topic 生产者
    orderTopic:
      'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-trade-order-info',
    nameSrv:
      'MQ_INST_1782728101358463_BbCmhMPY.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
  // 订单组相关
  internalEggOrderGroupChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    producerGroup:
      'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-consumer-order-group-info',
    // 订单组topic 生产者
    orderGroupTopic:
      'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-trade-order-group-info',
    // 消费者group
    consumerGroup:
    'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-produce-order-group-id-okex',
    // 获取订单组id 消费者
    orderGroupIdTopic:
      'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-response-order-group-id-okex',
    nameSrv:
      'MQ_INST_1782728101358463_BbCmhMPY.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
  // 与国内egg通信
  internalEggSymbolPriceChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    // 生产者group
    producerGroup:
      'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-consumer-egg-huobi-symbol-price',
    // 生产者topic
    topic_pub:
      'MQ_INST_1782728101358463_BbCmhMPY%bs-ccr-topic-egg-huobi-symbol-price',
    nameSrv:
      'MQ_INST_1782728101358463_BbCmhMPY.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
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
        ctx.body = {
          ...err,
          name: err.name,
          errors: err.message,
          status_code: err.status,
        };
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
exports.okex = {
  url: 'https://www.okex.me',
};



EOF
