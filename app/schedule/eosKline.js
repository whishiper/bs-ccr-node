'use strict';

const Subscription = require('egg').Subscription;

class EosKline extends Subscription {
  static get schedule() {
    return {
      interval: '24h', // 24h执行一次,其实就几乎相当于只可手动触发
      type: 'worker',
      immediate: false,
    };
  }

  async subscribe() {
    // 获取所有自选货币对 ['btseos','btceos',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('huobi_choice_symbol_list');
    // 所有eos的自选货币对
    const eos_list = choice_symbol_list.filter(item => item.endsWith('eos'));
    if (!eos_list.length) {
      return;
    }
    eos_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = EosKline;
