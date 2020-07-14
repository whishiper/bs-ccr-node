'use strict';
const Service = require('egg').Service;

const url = require('url');
const https = require('https');
const HttpsProxyAgent = require('https-proxy-agent');
const { isJSON, removePort } = require('../utils/tool');
const { serverIp } = require('../utils/ipList');

class proxyService extends Service {
  async requestProxy({
    endpoint,
    proxyIp,
    headers = null,
    method = 'GET',
    payload = null,
  }) {
    const { ctx, app } = this;
    // console.log('ctx', ctx);
    const proxy = `http://${proxyIp}`;

    const opts = url.parse(endpoint);
    const agent = new HttpsProxyAgent(proxy);
    opts.url = endpoint;
    opts.agent = agent;
    opts.method = method;
    opts.headers = headers;
    const query = JSON.stringify(payload);
    const fn = ({ options }) => {
      return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
          // console.log('res', res);
          const datas = [];
          let size = 0;
          res.on('data', data => {
            datas.push(data);
            size += data.length;
          });
          res.on('end', () => {
            const buff = Buffer.concat(datas, size);
            const pic = buff.toString();
            resolve(pic);
          });
        });
        req.on('error', err => {
          reject(err);
        });
        if (options.method === 'POST') {
          req.write(query);
        }
        // console.log('req', req);
        req.end();
      });
    };
    const resStr = await fn({ options: opts });
    if (!endpoint.includes('balance')) {
      console.log('proxyIp', proxyIp);
      console.log('endpoint', endpoint);
      console.log('proxy resStr=====', resStr);
    }
    if (resStr && isJSON(resStr)) {
      // console.log(1111);
      const res = JSON.parse(resStr);
      if (res) {
        if (res.status === 'error') {
          console.log('proxyIp', proxyIp);
          console.log('endpoint', endpoint);
          console.log('res', res);
          // const err = new Error();
          // err.name = res['err-code'];
          // err.message = res['err-msg'];
          // err.explain_message = res['err-msg'];
          // err.status = 422;
          return res;
        }
      }
      // console.log('proxy res.data=====', res.data);
      return res.data;
    }
    console.log('proxyIp', proxyIp);
    console.log('endpoint', endpoint);
    console.log(2222);
    // 记录该 ip 代理出错的次数
    const key = 'proxy_ip_error';
    const tableata = await app.redis.hgetall(key);
    const field = proxyIp;
    let value = tableata[field];
    if (!value) {
      app.redis.hset(key, field, 1);
    } else {
      value++;
      app.redis.hset(key, field, value);
      // TODO 如果次数达到10次,为用户更换ip(redis 中 ip_set_${ip}中)
      if (value > 10) {
        const redis_key = `ip_set_${field}`;
        const list = await app.redis.smembers(redis_key);
        for (const item of list) {
          if (item.startsWith('ip_robotId_')) {
            const robotId = item.replace('ip_robotId_', '');
            // 新的ip
            const { address } = await ctx.service.ip.setIp({
              robotId,
              excludeIp: field,
            });
            app.redis.set(item, address);
          }
        }
        // TODO: 测试此ip是否过期
        app.redis.del(redis_key);
      }
    }
    ctx.service.handleErrors.throw_error({
      message: `请检查是否将此ip:${removePort(proxyIp)}添加到白名单`,
    });
  }
}
module.exports = proxyService;
