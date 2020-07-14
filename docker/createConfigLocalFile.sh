#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com

    cat > ../config/config.local.js <<EOF
'use strict';
exports.cluster = {
  listen: {
    port: $1,
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
    host: 'redis',
    password: '$3',
    db: 0,
  },
};

exports.jwt = {
  secret: 'welovebosen1909',
  expiresIn: 3500,
};

exports.aliyunApiGateway = {
  appKey: '25524535',
  appSecret: '3b68302d542a38440e43b4e201c489c1',
  baseUrl: 'http://followapi.bosenkeji.cn',
  stage: 'RELEASE',
  verbose: true,
};

exports.aliyunSms = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  secretAccessKey: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  loginTemplate: 'SMS_161591103',
  registerTemplate: 'SMS_161596094',
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

exports.aliCloudPopCore = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  apiVersion: '2016-07-14',
};
EOF
