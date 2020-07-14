/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */

module.exports = appInfo => {

  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});
  config.logger = {
    level: 'DEBUG',
  };


  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1558498000845_5191';
  config.cors = {
    origin: '*',
    credentials: true,
  };
  config.security = {
    csrf: {
      enable: false,
      // ignoreJSON: true,
    },
    domainWhiteList: [],
  };
  // add your middleware config here
  config.middleware = [];
  // config.huobiSdk = {};
  // config.rocketMq = {};
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  // config.aliyunApiGateway = {};

  config.httpclient = {
    request: {
      timeout: 10000,
    },
  };

  config.multipart = {
    fileSize: '20mb',
    // mode:'file',
    whitelist: [ '.jpg', '.jpeg', '.png', '.gif', '.bmp' ],
  };
  config.logger = {
    dir: '/tmp/master',
  };
  // config.httpclient = {
  //   request: {
  //     // 默认 request 超时时间 10s
  //     timeout: 10000,
  //   },
  // }
  config.onerror = {
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

  // config.acm = {
  //   all: {
  //     endpoint: 'acm.aliyun.com', // Available in the ACM console
  //     namespace: '9056bc66-b393-49d5-89a6-fea8d039342e', // Available in the ACM console
  //     accessKey: 'LTAI4Fd1zNzk8YdGKrgF5ohp', // Available in the ACM console
  //     secretKey: 'aja6ZkZUeA11ZroIdOADMQRKzhSjOJ',
  //     requestTimeout: 6000,
  //   },
  //   sz: {
  //     endpoint: 'addr-sz-internal.edas.aliyun.com', // Available in the ACM console
  //     namespace: '2a7ad9e5-927c-4499-a199-a978041d1281', // Available in the ACM console
  //     accessKey: 'LTAI4Fd1zNzk8YdGKrgF5ohp', // Available in the ACM console
  //     secretKey: 'aja6ZkZUeA11ZroIdOADMQRKzhSjOJ',
  //     requestTimeout: 6000,
  //   },
  //
  // };

  // config.aliyunPopCore = {
  //   accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  //   accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  //   endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  //   apiVersion: '2016-07-14',
  // };
  //
  // config.aliCloudPopCore = {
  //   accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  //   accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  //   endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  //   apiVersion: '2016-07-14',
  // };


  return {
    ...config,
    ...userConfig,
  };
};
