/*
--port=7001 端口号，默认会读取环境变量 process.env.PORT，如未传递将使用框架内置端口 7001。
--daemon 是否允许在后台模式，无需 nohup。若使用 Docker 建议直接前台运行。
--env=prod 框架运行环境，默认会读取环境变量 process.env.EGG_SERVER_ENV， 如未传递将使用框架内置环境 prod。
--workers=2 框架 worker 线程数，默认会创建和 CPU 核数相当的 app worker 数，可以充分的利用 CPU 资源。
--title=egg-server-showcase 用于方便 ps 进程时 grep 用，默认为 egg-server-${appname}。
--framework=yadan 如果应用使用了自定义框架，可以配置 package.json 的 egg.framework 或指定该参数。
--ignore-stderr 忽略启动期的报错。
 */
'use strict';
// exports.cluster = {
//   listen: {
//     port: 7002,
//     hostname: 'node-follow',
//   },
// };
exports.httpclient = {
  request: {
    // 默认 request 超时时间
    timeout: 10000,
  },
};

exports.redis = {
  clients: {
    internal: {
      port: 6379,
      // host: 'redis',
      host: '127.0.0.1',
      password: 'FSG851024125',
      db: 0,
    },
  },
};

// exports.alinode = {
//   // 从 `Node.js 性能平台` 获取对应的接入参数
//   appid: '75971',
//   secret: '7ae5141cc7bfbd1845b2bd6b4c50da389532d2f6',
// };

exports.jwt = {
  secret: 'welovelianxin111',
  expiresIn: 3500,
};

exports.aliyunApiGateway = {
  baseUrl: 'http://ccrapi.bosenkeji.cn',
  appId: '110565671',
  client: {
    appKey: '203727404',
    appSecret: 'dflf7ixju8q9c6zwet79yhz8xxaotr0k',
    stage: 'RELEASE',
    verbose: true,
  },
};

exports.aliyunSms = {
  loginTemplate: 'SMS_161591103',
  registerTemplate: 'SMS_161596094',
  resetPasswordTemplate: 'SMS_161591107',
  replacePhoenTemplate: 'SMS_162140110',
  client: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    secretAccessKey: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  },
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
    '.jpeg', // image/jpeg
    '.png', // image/png, image/x-png
    '.gif', // image/gif
    '.bmp', // image/bmp
  ],
};
exports.aliyunPopCore = {
  client: {
    accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
    accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
    endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
    apiVersion: '2016-07-14',
  },
};
exports.aliCloudPopCore = {
  accessKeyId: 'LTAI4FiW7ykVpsp1C3M2EBzg',
  accessKeySecret: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
  endpoint: 'https://apigateway.cn-shenzhen.aliyuncs.com',
  apiVersion: '2016-07-14',
};
exports.auth = {
  client: 'fooClientIdPassword:secret',
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
          // name: err.name,
          timestamp: new Date().getTime(),
          errors: err.message,
          status: err.status,
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
exports.zbServer = {
  url: 'http://127.0.0.1:7002',
};
