'use strict';

const Service = require('egg').Service;
class HtKline extends Service {


  async subscribe() {
    // 获取所有自选货币对 ['btsht','btcht',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // 所有ht的自选货币对
    const ht_list = choice_symbol_list.filter(item => item.endsWith('HT'));
    if (!ht_list.length) {
      return;
    }
    ht_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = HtKline;
