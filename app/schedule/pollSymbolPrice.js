'use strict';

const Subscription = require('egg').Subscription;

class PollSymbolPrice extends Subscription {
  static get schedule() {
    return {
      interval: '10s', // 10s执行一次
      type: 'worker',
      immediate: false,
      disable: true,
      // immediate: true,
    };
  }

  async subscribe() {
    // 获取所有自选货币对
    const { app, ctx } = this;
    // const flag = await app.redis.exists('okex_choice_symbol_list');
    // console.log(flag);
    // if (!flag) {
    //   return;
    // }
    let choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    choice_symbol_list = choice_symbol_list.filter(item => !item.includes('--'));
    // console.log('choice_symbol_list', JSON.stringify(choice_symbol_list));
    if (!choice_symbol_list.length) {
      return;
    }
    // 向java端发送现价
    for (const item of choice_symbol_list) {
      // TODO 先注释 避免产生太多订单
      // console.log('PollSymbolPrice', item);
      ctx.service.mq.price.emit(item);
    }
  }
}
module.exports = PollSymbolPrice;
