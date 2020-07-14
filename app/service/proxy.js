'use strict';

const Service = require('egg').Service;
const superagent = require('../utils/superagent/node/index');
require('superagent-proxy')(superagent);
// const { ipList, serverIp } = require('../utils/ipList');
/*
@author:fsg
@time:2019-06-24 11:17:18
@params
proxy:代理ip
endpoint:目标api
@description:代理，随机ip 用于处理翻墙访问火币api
*/
class ProxyService extends Service {
  constructor(ctx) {
    super(ctx);
    // this.cycleTime = 0;
  }

  async requestProxy({ endpoint }) {
    const { app, ctx } = this;
    app.redis.scard('ip_map').then(result => {
      result < 100 && ctx.service.schedulerx.loadIpList.subscribe();
    });

    const cur_ip_list = await app.redis.srandmember('ip_map', 20);
    if (Object.keys(cur_ip_list).length === 0) {
      return '';
    }
    let cycleTime = 0;
    const arr = [];
    for (const ip of cur_ip_list) {
      const proxy = `http://${ip}`;
      const obj = new Promise(resolve => {
        superagent
          .get(endpoint)
          .timeout(5000)
          .proxy(proxy)
          .buffer(true)
          .set(
            'User-Agent',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
          )
          .set('Accept-Encoding', 'gzip, deflate, br')
          .then(async res => {
            return resolve(res);
          })
          .catch(async error => {
            // console.log('proxy', error);
            const { errno, code, syscall, address, port, response } = error;
            // 出错的ip存到 error-ip-map 中
            const tableName = 'error-ip-map';
            const ECONNREFUSED = 'ECONNREFUSED';
            if (errno === ECONNREFUSED || code === ECONNREFUSED) {
              let v = await app.redis.hget(tableName, ip);
              if (v) {
                //  TODO 只有超时过多才删除该ip
                if (v >= 8) {
                  app.redis.srem('ip_map', ip);
                  app.redis.hdel(tableName, ip);
                } else {
                  v++;
                  app.redis.hset(tableName, ip, v);
                }
              } else {
                app.redis.hset(tableName, ip, 1);
              }
            }
          });
      });
      arr.push(obj);
    }

    const timeoutPromise = new Promise(function(resolve, reject) {
      setTimeout(reject, 5000);
    });
    arr.push(timeoutPromise);

    const proxyRes = await Promise.race(arr)
      .then(value => {
        return value;
      })
      .catch(async err => {
        if (cycleTime >= 4) {
          // return null;
          throw err;
        }
        cycleTime++;

        return await this.requestProxy({ endpoint });
      });

    return proxyRes;
  }
}
module.exports = ProxyService;
