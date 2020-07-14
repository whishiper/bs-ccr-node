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
    const { app, ctx } = this;
    // yuxuewen23@qq.com
    // jiz89e
    const { ipServerConf } = app.config;
    if (!ipServerConf) {
      return;
    }
    const { list } = ipServerConf;
    const ip_arr = [];
    for (const item of list) {
      const { email, pwd } = item;
      const url = `http://list.didsoft.com/get?email=${email}&pass=${pwd}&pid=httppremium&https=yes&showcountry=no`;
      const data = await app
        .curl(url, {
          method: 'GET',
          dataType: 'text',
        })
        .then(res => res.data);
      if (!data || data.includes('Error')) {
        // console.log(url, 'get ip err', data);
        continue;
      }
      const new_ip_list = data
        .split('\n')
        .map(v => v.replace('\n', ''))
        .filter(v => v);
      ip_arr.push(...new_ip_list);
    }
    const new_ip_list_str = '"' + ip_arr.join('","') + '"';
    // const email_1 = '8586826@qq.com';
    // const pwd_1 = 'bsekgg';
    // const email_2 = 'yuxuewen23@qq.com';
    // const pwd_2 = 'jiz89e';
    // const url_1 = `http://list.didsoft.com/get?email=${email_1}&pass=${pwd_1}&pid=httppremium&https=yes&showcountry=no`;
    // const url_2 = `http://list.didsoft.com/get?email=${email_2}&pass=${pwd_2}&pid=httppremium&https=yes&showcountry=no`;

    // const data_1 = await app
    //   .curl(url_1, {
    //     method: 'GET',
    //     dataType: 'text',
    //   })
    //   .then(res => res.data);
    // const data_2 = await app
    //   .curl(url_2, {
    //     method: 'GET',
    //     dataType: 'text',
    //   })
    //   .then(res => res.data);
    // if (
    //   !data_1 &&
    //   data_1.includes('Error') &&
    //   !data_2 &&
    //   data_2.includes('Error')
    // ) {
    //   return;
    // }
    // const new_ip_list_1 = data_1
    //   .split('\n')
    //   .map(item => item.replace('\n', ''))
    //   .filter(item => item);
    // const new_ip_list_2 = data_2
    //   .split('\n')
    //   .map(item => item.replace('\n', ''))
    //   .filter(item => item);
    // const new_ip_list_str =
    // '"' + new_ip_list_1.concat(new_ip_list_2).join('","') + '"';
    const set_ip_script = `
        local ip_array={${new_ip_list_str}}
        for key,value in ipairs(ip_array)
        do
           redis.call('sadd', 'ip_map', value)
        end        
    `;

    app.redis.eval(set_ip_script, 0);
    ctx.logger.error(
      'ip_map.length',
      (await app.redis.smembers('ip_map')).length
    );
  }
}
module.exports = LoadIpList;
