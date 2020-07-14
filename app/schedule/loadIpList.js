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
      interval: '300s', // 60*60*24/400=216 执行一次
      type: 'worker',
      immediate: false,
      disable: true,
      // immediate: true,
    };
  }

  async subscribe() {
    const { app } = this;
    const country = 'US';
    const random_str = Math.random()
      .toString(36)
      .substr(2, 8);
    const email = '8586826@qq.com';
    const pwd = 'wcbd49';
    // const url = `http://list.didsoft.com/get?email=${email}&pass=${pwd}&pid=httppremium&https=yes&showcountry=no&country=${country}&name=${random_str}`;
    // const data = await app
    //   .curl(url, {
    //     method: 'GET',
    //     dataType: 'text',
    //   })
    //   .then(res => res.data);
    // const new_ip_list = data
    //   .split('\n')
    //   .map(item => item.replace('\n', ''))
    //   .filter(item => item);

    // for (const ip of new_ip_list) {
    //   await app.redis.sadd('ip_map', ip);
    // }
    // app.runSchedule('symbolCache');
  }
}
module.exports = LoadIpList;
