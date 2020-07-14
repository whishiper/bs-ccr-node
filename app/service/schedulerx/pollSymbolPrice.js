'use strict';

const Service = require('egg').Service;
class PollSymbolPrice extends Service {
  async subscribe() {
    // 获取所有自选货币对
    const { app, ctx } = this;
    let choice_symbol_list = await app.redis.smembers(
      'okex_choice_symbol_list'
    );
    choice_symbol_list = choice_symbol_list.filter(
      item => !item.includes('--')
    );
    ctx.logger.error('enter okex PollSymbolPrice schedulerx');
    if (!choice_symbol_list.length) {
      return;
    }
    // const promiseArr = [];
    // 向java端发送现价
    for (const item of choice_symbol_list) {
      // TODO 先注释 避免产生太多订单
      ctx.service.mq.price.emit(item);
    }
  }
}
module.exports = PollSymbolPrice;
