'use strict';

const Service = require('egg').Service;
class EosKline extends Service {


  async subscribe() {
    // 获取所有自选货币对 ['btseos','btceos',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // 所有eos的自选货币对
    const eos_list = choice_symbol_list.filter(item => item.endsWith('EOS'));
    if (!eos_list.length) {
      return;
    }
    eos_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = EosKline;
