'use strict';

const Service = require('egg').Service;
class UsdtKline extends Service {


  async subscribe() {
    // 获取所有自选货币对 ['btsusdt','btcusdt',]
    // const fn = async () => {
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');

    // 所有usdt的自选货币对
    const usdt_list = choice_symbol_list.filter(item => item.endsWith('USDT'));
    if (!usdt_list.length) {
      return;
    }
    usdt_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });

    // };
    // debouce(fn, 1000 * 60, false)();
  }
}
module.exports = UsdtKline;
