'use strict';

const Subscription = require('egg').Subscription;
/*
@author:fsg
@time:2019-08-09 18:30:15
@params
@description:获取可用ip
*/
class LoadIpList extends Subscription {
  static get schedule() {
    return {
      interval: '2000s', // 60*60*24/400=216 执行一次
      type: 'worker',
      immediate: false,
      disable: true,
    };
  }

  async subscribe() {
    const { app } = this;
    const country = 'US';
    const random_str = Math.random()
      .toString(36)
      .substr(2, 8);
    const email = '8586826@qq.com';
    const pwd = 'bsekgg';
    const url = `http://list.didsoft.com/get?email=${email}&pass=${pwd}&pid=httppremium&https=yes&showcountry=no&country=${country}&name=${random_str}`;
    // ctx.logger.info(url);
    const data = await app
      .curl(url, {
        method: 'GET',
        dataType: 'text',
      })
      .then(res => res.data);
    if (!data && data.includes('Error')) {
      return;
    }
    const new_ip_list = data
      .split('\n')
      .map(item => item.replace('\n', ''))
      .filter(item => item);
    // const url =
    //   'http://ged.ip3366.net/api/?key=20190923173253029&getnum=300&ipaddress=%u7F8E%u56FD&area=2&order=2&formats=2&proxytype=1';
    // const data = await app
    //   .curl(url, {
    //     method: 'GET',
    //     dataType: 'text',
    //   })
    //   .then(res => res.data);
    // const new_ip_list = JSON.parse(data)
    //   .map(item => item.Ip)
    //   .filter(item => item);
    for (const ip of new_ip_list) {
      await app.redis.sadd('ip_map', ip);
    }
    // ctx.logger.info('ip_map', await app.redis.smembers('ip_map'));
    app.runSchedule('symbolCache');
  }
}
module.exports = LoadIpList;
