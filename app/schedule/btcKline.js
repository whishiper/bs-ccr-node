'use strict';

const Subscription = require('egg').Subscription;

class BtcKline extends Subscription {
  static get schedule() {
    return {
      interval: '24h', // 24h执行一次,其实就几乎相当于只可手动触发
      type: 'worker',
      immediate: false,
    };
  }

  async subscribe() {
    // 获取所有自选货币对 ['btsbtc','btcbtc',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('huobi_choice_symbol_list');
    // 所有btc的自选货币对
    const btc_list = choice_symbol_list.filter(item => item.endsWith('btc'));
    if (!btc_list.length) {
      return;
    }
    btc_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = BtcKline;
