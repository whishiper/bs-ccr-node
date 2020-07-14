'use strict';
exports.cluster = {
  listen: {
    port: 9200,
  },
};
// exports.alinode = {
//   appid: '82690',
//   secret: '1ba2b048cfb8dfba1b5b2c7d3bb74780cacb474f',
// };
// exports.httpclient = {
//   request: {
//     timeout: 10000,
//   },
// };
// 美国 弗吉尼亚 区域 redis rocketMq
// exports.redis = {
//   client: {
//     port: 6379,
//     host: 'inside-network.redis.rds.aliyuncs.com',
//     password: 'AYbosenkj19',
//     db: 0,
//   },
// };
// exports.rocketMq = {
//   // 与java通信  弗吉尼亚至弗吉尼亚
//   javaChannel: {
//     accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//     accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//     // 生产者group
//     // producerGroup: 'MQ_INST_1782728101358463_BbvkZ2I4%GID-bs-ccr-2',
//     // 消费者group
//     consumerGroup:
//       'MQ_INST_1782728101358463_BbRT1x5s%GID-TCP-bs-ccr-consumer-response-symbol-trade-info',
//     // 消费者topic
//     topic_sub:
//       'MQ_INST_1782728101358463_BbRT1x5s%bs-ccr-topic-response-symbol-trade-info',
//     // 生产者topic
//     topic_pub: 'MQ_INST_1782728101358463_BbRT1x5s%bs-ccr-topic-symbol-price',
//     nameSrv:
//       'MQ_INST_1782728101358463_BbRT1x5s.us-east-1.mq-internal.aliyuncs.com:8080',
//   },
//   // 与java 订单相关 全球路由消息 弗吉尼亚至深圳
//   javaOrderGroupChannel: {
//     accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//     accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//     // 生产者group
//     producerGroup:
//       'MQ_INST_1782728101358463_BbRT1x5s%GID-bs-ccr-consumer-order-group-info',
//     // 生产者topic
//     topic_pub:
//       'MQ_INST_1782728101358463_BbRT1x5s%bs-ccr-topic-trade-order-group-info',
//     nameSrv:
//       'MQ_INST_1782728101358463_BbRT1x5s.us-east-1.mq-internal.aliyuncs.com:8080',
//   },
//   // 与 国内egg通信相关 全球路由消息 弗吉尼亚至深圳
//   InternalWithExternalChannel: {
//     accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//     accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//     // 生产者group
//     producerGroup:
//       'MQ_INST_1782728101358463_BbRT1x5s%GID-bs-ccr-external_to_internal',
//     // 生产者topic
//     topic_pub:
//       'MQ_INST_1782728101358463_BbRT1x5s%bs-ccr-topic-external_to_internal',
//     nameSrv:
//       'MQ_INST_1782728101358463_BbRT1x5s.us-east-1.mq-internal.aliyuncs.com:8080',
//   },
// };

// exports.multipart = {
//   fileSize: '20mb',
//   whitelist: [
//     '.jpg',
//     '.jpeg', // image/jpeg
//     '.png', // image/png, image/x-png
//     '.gif', // image/gif
//     '.bmp', // image/bmp
//   ],
// };

// exports.onerror = {
//   json(err, ctx) {
//     if (typeof err === 'object') {
//       if (Reflect.has(err, 'status')) {
//         ctx.status = Reflect.get(err, 'status');
//       } else {
//         ctx.status = 500;
//       }

//       if (
//         Reflect.has(err, 'name') &&
//         Reflect.has(err, 'message') &&
//         Reflect.has(err, 'status')
//       ) {
//         ctx.body = {
//           ...err,
//           name: err.name,
//           errors: err.message,
//           status_code: err.status,
//         };
//       } else {
//         ctx.body = err;
//       }
//     } else {
//       ctx.status = 500;
//       ctx.body = { message: err };
//     }
//   },
//   accepts(ctx) {
//     return 'json';
//   },
// };
// exports.huobi = {
//   url: 'https://api.huobi.pro',
// };
