'use strict';

const Service = require('egg').Service;
/*
@author:fsg
@time:2019-08-09 18:30:15
@params
@description:获取可用ip
*/
class LoadIpList extends Service {


  async subscribe() {
    const { app } = this;
    const country = 'SG';
    const random_str = Math.random()
      .toString(36)
      .substr(2, 8);
    const email = '8586826@qq.com';
    const pwd = 'bsekgg';
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
