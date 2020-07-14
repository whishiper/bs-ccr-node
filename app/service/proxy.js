'use strict';

const Service = require('egg').Service;
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const { ipList } = require('../utils/ipList');
/*
@author:fsg
@time:2019-06-24 11:17:18
@params
proxy:代理ip
endpoint:目标api
@description:代理，用于处理翻墙访问火币api
*/
class ProxyService extends Service {
  async testRequestProxy({ endpoint }) {
    const cur_ip_list = ipList;
    const arr = [];

    for (const ip of cur_ip_list) {
      const proxy = `http://${ip}`;
      const obj = new Promise((resolve, reject) => {
        superagent
          .get(endpoint)
          .proxy(proxy)
          .buffer(true)
          .set(
            'User-Agent',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
          )
          // .set(
          //   'Accept',
          //   'text/html,application/xhtml+xml,application/xml,application/x-javascript;q=0.9,image/webp,image/apng,*/*;q=0.8'
          // )
          .set('Accept-Encoding', 'gzip, deflate, br')
          .then(async res => {
            // console.log('res', Object.keys(res));
            // app.redis.sadd('ip_map', ip);
            // console.log('success', ip, res.text);
            return resolve(res.text);
          })
          .catch(async err => {
            console.log('error ip==========>', ip, err.message);

            // 超时、出错就换ip,把当前ip踢掉
            // Reflect.deleteProperty(ip_map, ip);
            // console.log('delete ip====>', ip);
            // await app.redis.set('ip_map', JSON.stringify(ip_map));
            // console.log('err', err);
            // return reject(err);
            // ip调取失败后换ip追加请求
            // return this.requestProxy({ endpoint });
            // ctx.service.handleErrors.throw_error([ '网络异常,请稍后再试' ]);
          });
      });
      arr.push(obj);
    }
    // console.log('arr', arr);
    const proxyRes = await Promise.race(arr);
    return proxyRes;
  }
  async requestProxy({ endpoint }) {
    const { app, ctx } = this;
    // 每次用5个ip去请求
    const cur_ip_list = await app.redis.srandmember('ip_map', 10);
    if (Object.keys(cur_ip_list).length === 0) {
      return '';
    }
    const arr = [];
    for (const ip of cur_ip_list) {
      const proxy = `http://${ip}`;
      const obj = new Promise((resolve, reject) => {
        superagent
          .get(endpoint)
          .proxy(proxy)
          .buffer(true)
          .set(
            'User-Agent',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
          )
          // .set(
          //   'Accept',
          //   'text/html,application/xhtml+xml,application/xml,application/x-javascript;q=0.9,image/webp,image/apng,*/*;q=0.8'
          // )
          .set('Accept-Encoding', 'gzip, deflate, br')
          .then(async res => {
            // console.log('res', Object.keys(res));
            app.redis.sadd('ip_map', ip);
            // console.log('success', ip);
            return resolve(res);
          })
          .catch(async err => {
            // console.log('delete ip===>', ip, err.message);
            app.redis.srem('ip_map', ip);

            // 超时、出错就换ip,把当前ip踢掉
            // Reflect.deleteProperty(ip_map, ip);
            // console.log('delete ip====>', ip);
            // await app.redis.set('ip_map', JSON.stringify(ip_map));
            // console.log('err', err);
            // return reject(err);
            // ip调取失败后换ip追加请求
            // return this.requestProxy({ endpoint });
            // ctx.service.handleErrors.throw_error([ '网络异常,请稍后再试' ]);
          });
      });
      arr.push(obj);
    }
    // console.log('arr', arr);
    const proxyRes = await Promise.race(arr);
    return proxyRes;
  }
}
module.exports = ProxyService;
