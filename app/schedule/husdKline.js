'use strict';

const Subscription = require('egg').Subscription;

class HusdKline extends Subscription {
  static get schedule() {
    return {
      interval: '24h', // 24h执行一次,其实就几乎相当于只可手动触发
      type: 'worker',
      immediate: false,
      //   immediate: true,
    };
  }

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
