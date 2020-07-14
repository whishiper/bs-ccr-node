/** @Author : YuXueWen
 * @File : request.js
 * @Email : 8586826@qq.com
 **/

'use strict';

const fs = require('fs');
const http = require('http'),
  httpProxy = require('http-proxy');

const redis = require('redis');

const pako = require('pako');

const ACMClient = require('acm-client').ACMClient;

let acmConfig;
let redisCliet;

(async () => {
  // 获取ACM中的配置
  const endpoint = process.env.acm_endpoint;
  const namespace = process.env.acm_namespace;
  const accessKey = process.env.acm_accessKey;
  const secretKey = process.env.acm_secretKey;
  const requestTimeout = process.env.acm_requestTimeout || 6000;

  const dataId = process.env.acm_dataId || 'prod-egg-huobi-server';
  const group = process.env.acm_group || 'DEFAULT_GROUP';

  if (!endpoint || !namespace || !accessKey || !secretKey) {
    throw new Error('ACM Config Fail');
  }

  const acmClient = new ACMClient({ endpoint, namespace, accessKey, secretKey, requestTimeout });

  acmConfig = await acmClient.getConfig(dataId, group);


  await acmClient.close();

  if (acmConfig != null) {
    const acmConfToJson = JSON.parse(acmConfig);
    if (typeof acmConfToJson === 'object') {
      // 建立redis客户端
      if (Reflect.has(acmConfToJson.redis, 'client')) {
        redisCliet = await redis.createClient(acmConfToJson.redis.client);
      } else if (Reflect.has(acmConfToJson.redis, 'clients')) {
        redisCliet = await redis.createClient(acmConfToJson.redis.clients.internal);

      }

    }
  }


})();

const proxy = new httpProxy.createProxyServer({
  target: {
    protocol: 'https:',
    host: 'api.huobi.pro',
    port: 443,
    pfx: fs.readFileSync(process.env.p12_path || '/opt/app/ccr9999.p12'),
    passphrase: 'bsccr1616',
  },
  changeOrigin: true,
});


const server = http.createServer(async function(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-credentials', 'true');

  redisCliet.get(req.url, function(err, reply) {
    // reply is null when the key is missing
    if (reply == null) {
      proxy.web(req, res);


      proxy.on('proxyRes', function(proxyRes, req, res) {

        let body = [];
        proxyRes.on('data', function(chunk) {
          body.push(chunk);
        });
        proxyRes.on('end', function() {
          body = Buffer.concat(body);

          let string_data;
          if (Reflect.has(req.headers, 'accept-encoding') &&
              req.headers['accept-encoding'].indexOf('gzip') !== -1) {
            string_data = pako.inflate(body, { to: 'string' });
          } else {
            string_data = body.toString();
          }

          try {
            JSON.parse(string_data);
            redisCliet.set(req.url, string_data);
            redisCliet.expire(req.url, 15);
          } catch (e) {
            redisCliet.set(req.url, '0');
            redisCliet.expire(req.url, 60);
          }


        });

      });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write(reply);
      res.end();
    }
  });

  proxy.on('error', function(e) {
    console.log(e);
  });

});

server.listen(8000);
