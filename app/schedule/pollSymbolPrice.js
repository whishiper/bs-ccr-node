'use strict';

const Subscription = require('egg').Subscription;

class PollSymbolPrice extends Subscription {
  static get schedule() {
    return {
      interval: '10s', // 10s执行一次
      type: 'worker',
      immediate: false,
      disable: true,
    };
  }

  async subscribe() {
    // 获取所有自选货币对
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('huobi_choice_symbol_list');
    // ctx.logger.info('huobi_choice_symbol_list', choice_symbol_list);
    if (!choice_symbol_list.length) {
      return;
    }
    // 向java端发送现价
    for (const item of choice_symbol_list) {
      // TODO 先注释 避免产生太多订单
      // ctx.logger.info('PollSymbolPrice', item);
      ctx.service.mq.price.emit(item);
    }
  }
}
module.exports = PollSymbolPrice;
