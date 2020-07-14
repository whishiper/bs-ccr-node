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
  config.huobiSdk = {};
  config.rocketMq = {};
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  config.httpclient = {
    request: {
      timeout: 10000,
    },
  };
  config.multipart = {
    fileSize: '20mb',
    whitelist: [
      '.jpg',
      '.jpeg', // image/jpeg
      '.png', // image/png, image/x-png
      '.gif', // image/gif
      '.bmp', // image/bmp
    ],
  };
  config.logger = {
    dir: '/tmp/huobi-server',
  };
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


  return {
    ...config,
    ...userConfig,
  };
};
