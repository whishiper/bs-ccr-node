'use strict';

const Service = require('egg').Service;
class HusdKline extends Service {


  async subscribe() {
    // 获取所有自选货币对 ['btshusd','btchusd',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // 所有husd的自选货币对
    const husd_list = choice_symbol_list.filter(item => item.endsWith('HUSD'));
    if (!husd_list.length) {
      return;
    }
    husd_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = HusdKline;
