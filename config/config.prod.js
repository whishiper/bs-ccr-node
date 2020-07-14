'use strict';
exports.cluster = {
  listen: {
    port: 9100,
  },
};

// exports.redis = {
//   clients: {
//     // 国内
//     internal: {
//       port: 6379,
//       host: 'r-wz9cd29f375d5914.redis.rds.aliyuncs.com',
//       password: 'AYbosenkj19',
//       db: 0,
//     },
//     // 国外
//     external_huobi: {
//       // port: 6380,
//       port: 6379,
//       host: 'internal.redis.rds.aliyuncs.com',
//       password: 'AYbosenkj19',
//       db: 0,
//     },
//     // 国外 ok
//     external_okex: {
//       port: 6379,
//       // host: 'r-t4nrfvp20g0nw7rn3wpd.redis.singapore.rds.aliyuncs.com',
//       host: 'r-wz9epl7gkuzg8u1s1z.redis.rds.aliyuncs.com',
//       password: 'AYbosenkj19',
//       db: 0,
//     },
//   },
// };

// exports.rocketMq = {
//   // 深圳； 接收来自深圳或弗吉尼亚
//   InternalWithExternalChannel: {
//     // accessKeyId: 'LTAISwQkitLFbG0t',
//     // accessKeySecret: 'aCeWQl874e6Jvh76GtfhEAeC24hKl0',
//     accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//     accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//     // 消费者group
//     consumerGroup:
//       'MQ_INST_1782728101358463_Bbpg0jHs%GID-bs-ccr-egg-internal-with-external',
//     // 消费者topic
//     topic_sub:
//       'MQ_INST_1782728101358463_Bbpg0jHs%bs-ccr-topic-egg-internal-with-external',
//     nameSrv:
//       'MQ_INST_1782728101358463_Bbpg0jHs.mq-internet-access.mq-internet.aliyuncs.com:80',
//   },
// };
// 公网
// exports.mqtt = {
//   accessKey: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//   secretKey: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//   clientId: 'MQ_INST_1782728101358463_BbCmhMPY',
//   instanceId: 'post-cn-4591f65jn06',
//   host: 'post-cn-4591f65jn06.mqtt.aliyuncs.com',
//   huobiTopicList: {
//     // 公共
//     common: {
//       symbolPrice: 'mqtt-egg-huobi-symbol-price',
//     },
//     // 私人数据
//     private: {
//       symbolTradeInfo: 'mqtt-egg-huobi-symbol-trade-info',
//       currencyBalance: 'mqtt-egg-huobi-currency-balance',
//     },
//   },
//   okexTopicList: {
//     // 公共
//     common: {
//       symbolPrice: 'mqtt-egg-okex-symbol-price',
//     },
//     // 私人数据
//     private: {
//       symbolTradeInfo: 'mqtt-egg-okex-symbol-trade-info',
//       currencyBalance: 'mqtt-egg-okex-currency-balance',
//     },
//   },
// };
// exports.jwt = {
//   secret: 'welovebosen1909',
//   expiresIn: 3500,
// };

// exports.aliyunApiGateway = {
//   appKey: '203727404',
//   appSecret: 'dflf7ixju8q9c6zwet79yhz8xxaotr0k',
//   baseUrl: 'http://ccrapi.bosenkeji.cn',
//   stage: 'RELEASE',
//   verbose: true,
// };

// exports.aliyunSms = {
//   accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//   secretAccessKey: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//   loginTemplate: 'SMS_161591103',
//   registerTemplate: 'SMS_161596094',
//   resetPasswordTemplate: 'SMS_161591107',
//   replacePhoenTemplate: 'SMS_162140110',
// };

// exports.oss = {
//   client: {
//     accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//     accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//     bucket: 'bs-follow',
//     endpoint: 'oss-cn-shenzhen.aliyuncs.com',
//     timeout: '60s',
//   },
// };


// 部署到国外服务器 专门获取火币api
// exports.huobiServer = {
//   url: 'http://node-huobi-server.bosenkeji.cn',
// };
// exports.okexServer = {
//   url: 'http://node-okex-server.bosenkeji.cn',
// };
exports.aliCloudPopCore = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  apiVersion: '2016-07-14',
};
//
// exports.httpclient = {
//   request: {
//     timeout: 10000,
//   },
// };
//
// exports.multipart = {
//   fileSize: '20mb',
//   // mode:'file',
//   whitelist: [ '.jpg', '.jpeg', '.png', '.gif', '.bmp' ],
// };
//
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
//           name: err.name,
//           errors: err.message,
//           status_code: err.status,
//         };
//       } else {
//         ctx.body = err;
//       }
//     } else {
//       ctx.status = 500;
//       ctx.body = { errors: err };
//     }
//   },
//   accepts(ctx) {
//     return 'json';
//   },
// };
//
// exports.oauth = {
//   url: 'http://47.107.13.73:8100',
// };
//
// exports.aliCloudPopCore = {
//   accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
//   accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
//   endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
//   apiVersion: '2016-07-14',
// };
