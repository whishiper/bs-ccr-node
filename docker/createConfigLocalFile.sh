#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com

    cat > ../config/config.local.js <<EOF
'use strict';
'use strict';
exports.cluster = {
  listen: {
    port: 7100,
    hostname: 'node',
  },
};
exports.httpclient = {
  request: {
    timeout: 10000,
  },
};

exports.redis = {
  // client: {
  //   port: 6379,
  //   host: 'redis',
  //   password: '123zxc',
  //   db: 0,
  // },
  clients: {
    // 国内
    internal: {
      port: 6379,
      host: 'redis',
      password: '123zxc',
      db: 0,
    },
    // 国外
    external_huobi: {
      port: 6380,
      host: 'redis',
      password: '123zxc',
      db: 0,
    },
  },
};

exports.jwt = {
  secret: 'welovebosen1909',
  expiresIn: 3500,
};

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


// 部署到国外服务器 专门获取火币api
exports.ccr_huobi = {
  url: 'http://47.254.44.189:7100',
};
exports.aliCloudPopCore = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  apiVersion: '2016-07-14',
};

EOF
