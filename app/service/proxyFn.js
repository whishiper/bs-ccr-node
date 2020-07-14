'use strict';
const Service = require('egg').Service;
const url = require('url');
const https = require('https');
const HttpsProxyAgent = require('https-proxy-agent');
const { isJSON, removePort } = require('../utils/tool');
// const { serverIp } = require('../utils/ipList');
/**
 * 高质量ip代理火币私人请求
 */
class proxyService extends Service {
  async requestProxy({
    endpoint,
    proxyIp,
    headers = null,
    method = 'GET',
    payload = null,
    robotId = null,
  }) {
    const { ctx, app } = this;
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
        req.end();
      });
    };
    try {
      const resStr = await fn({ options: opts });
      if (resStr && isJSON(resStr)) {
        const res = JSON.parse(resStr);
        if (res) {
          if (res.status === 'error') {
            return res;
          }
        }
        return res.data;
      }
    } catch (ex) {
      const { name, message, address, port, errno, code } = ex;
      console.log(
        'requestProxy==',
        name,
        message,
        code,
        errno,
        address,
        port
      );
      const errArr = [ 'ECONNREFUSED', 'ETIMEDOUT' ];
      if (errArr.includes(code) || errArr.includes(errno)) {
        if (address && port) {
          const ip = `${address}:${port}`;
          console.log(`${ip} is ${errno}`);
          const tableName = `error_robot_ip_${ip}`;
          let v = await app.redis.hget(tableName, robotId);
          if (v) {
            // 累计超时超过4次则更换ip,
            // TODO 暂时不去除该key，记录下来查看该ip是否对所有机器人都超时 @fsg 2020.03.11
            if (v > 4) {
              ctx.service.ip.setIp({
                robotId,
                excludeIp: ip,
              });
            } else {
              v++;
              app.redis.hset(tableName, robotId, v);
            }
          } else {
            app.redis.hset(tableName, robotId, 1);
          }
        }
      }
      // ctx.service.handleErrors.throw_error(ex);
      throw ex;
      // ctx.service.handleErrors.throw_error({
      //    message: `请检查是否将此ip:${removePort(proxyIp)}添加到白名单`,
      // });
    }

    // ctx.logger.error('proxyIp', proxyIp);
    // ctx.logger.error('endpoint', endpoint);
    // 记录该 ip 代理出错的次数

    // const tableata = await app.redis.hgetall(key);
    // const field = proxyIp;
    // let value = tableata[field];
    // if (!value) {
    //   app.redis.hset(key, field, 1);
    // } else {
    //   value++;
    //   app.redis.hset(key, field, value);
    //   // TODO 如果次数达到10次,为用户更换ip(redis 中 ip_set_${ip}中)
    //   if (value > 10) {
    //     const redis_key = `ip_set_${field}`;
    //     const list = await app.redis.smembers(redis_key);
    //     for (const item of list) {
    //       if (item.startsWith('ip_robotId_')) {
    //         const robotId = item.replace('ip_robotId_', '');
    //         // 新的ip
    //         const proxyIpRes = await ctx.service.ip.setIp({
    //           robotId,
    //           excludeIp: field,
    //         });
    //         if (!proxyIpRes) {
    //           return;
    //         }
    //         if (proxyIpRes.address) {
    //           app.redis.set(item, proxyIpRes.address);
    //         }
    //       }
    //     }
    //     // TODO: 测试此ip是否过期
    //     app.redis.del(redis_key);
    //   }
    // }
    // ctx.service.handleErrors.throw_error({
    //   message: `请检查是否将此ip:${removePort(proxyIp)}添加到白名单`,
    // });
  }
}
module.exports = proxyService;
