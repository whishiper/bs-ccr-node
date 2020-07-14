'use strict';

const Subscription = require('egg').Subscription;

class EthKline extends Subscription {
  static get schedule() {
    return {
      interval: '24h', // 24h执行一次,其实就几乎相当于只可手动触发
      type: 'worker',
      immediate: false,
      //   immediate: true,
    };
  }

  async subscribe() {
    // 获取所有自选货币对 ['btseth','btceth',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // 所有eth的自选货币对
    const eth_list = choice_symbol_list.filter(item => item.endsWith('ETH'));
    if (!eth_list.length) {
      return;
    }
    eth_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = EthKline;
