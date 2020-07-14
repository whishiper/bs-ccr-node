'use strict';

const Subscription = require('egg').Subscription;
const { debouce } = require('../utils/tool');
class UsdtKline extends Subscription {
  static get schedule() {
    return {
      interval: '24h', // 24h执行一次,其实就几乎相当于只可手动触发
      type: 'worker',
      immediate: false,
      //   immediate: true,
    };
  }

  async subscribe() {
    // 获取所有自选货币对 ['btsusdt','btcusdt',]
    // const fn = async () => {
    // console.log('11');
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // console.log('choice_symbol_list', choice_symbol_list);

    // 所有usdt的自选货币对
    const usdt_list = choice_symbol_list.filter(item => item.endsWith('USDT'));
    // console.log('usdt_list', usdt_list);
    if (!usdt_list.length) {
      return;
    }
    // console.log('usdt_list', usdt_list);
    usdt_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });

    // };
    // debouce(fn, 1000 * 60, false)();
  }
}
module.exports = UsdtKline;
