'use strict';

const Service = require('egg').Service;
class BtcKline extends Service {
  async subscribe() {
    // 获取所有自选货币对 ['btsbtc','btcbtc',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // 所有btc的自选货币对
    const btc_list = choice_symbol_list.filter(item => item.endsWith('BTC'));
    if (!btc_list.length) {
      return;
    }
    btc_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = BtcKline;
