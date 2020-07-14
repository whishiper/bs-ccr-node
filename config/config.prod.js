'use strict';
exports.cluster = {
  listen: {
    port: 9300,
  },
};
exports.httpclient = {
  request: {
    timeout: 10000,
  },
};
// 美国 弗吉尼亚 区域 redis rocketMq
exports.redis = {
  client: {
    port: 6379,
    host: 'r-t4nfdkeue6i5h4f4zk.redis.singapore.rds.aliyuncs.com',
    password: 'AYbosenkj19',
    db: 0,
  },
};
exports.rocketMq = {
  // 与java通信
  javaChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    // 生产者group
    // producerGroup: 'MQ_INST_1782728101358463_BbCmhMPY%GID-bs-ccr-2',
    // 消费者group
    consumerGroup:
      'MQ_INST_1782728101358463_BbtxLt90%GID-TCP-bs-ccr-consumer-response-symbol-trade-info',
    // 消费者topic
    topic_sub:
      'MQ_INST_1782728101358463_BbtxLt90%bs-ccr-topic-response-symbol-trade-info',
    // 生产者topic
    topic_pub: 'MQ_INST_1782728101358463_BbtxLt90%bs-ccr-topic-symbol-price',
    nameSrv:
      'MQ_INST_1782728101358463_BbtxLt90.ap-southeast-1.mq-internal.aliyuncs.com:8080',
  },
  // 与国内egg 订单组相关
  internalEggOrderGroupChannel: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    // 生产者group
    producerGroup: 'MQ_INST_1782728101358463_BbvkZ2I4%GID-bs-ccr-topic-order_to_internal',
    // 生产者topic
    topic_pub: 'MQ_INST_1782728101358463_BbvkZ2I4%bs-ccr-topic-order_to_internal',
    nameSrv:
      'MQ_INST_1782728101358463_BbvkZ2I4.mq-internet-access.mq-internet.aliyuncs.com:80',
  },
};

exports.multipart = {
  fileSize: '20mb',
  whitelist: [
    '.jpg', '.jpeg', // image/jpeg
    '.png', // image/png, image/x-png
    '.gif', // image/gif
    '.bmp', // image/bmp
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

      if (Reflect.has(err, 'name')
                && Reflect.has(err, 'message')
                && Reflect.has(err, 'status')
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
      ctx.body = { message: err };
    }

  },
  accepts(ctx) {
    return 'json';
  },
};
exports.okex = {
  url: 'https://www.okex.me',
};
