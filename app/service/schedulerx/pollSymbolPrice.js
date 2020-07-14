'use strict';

const Service = require('egg').Service;

class PollSymbolPrice extends Service {
  // constructor(ctx) {
  //   super(ctx);
  //   this.mq_price = ctx.service.mq.price;
  //   this.mq_internalWithExternal = ctx.service.mq.internalWithExternal;
  // }

  async subscribe() {
    // 获取所有自选货币对
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers(
      'huobi_choice_symbol_list'
    );
    ctx.logger.error('enter huobi PollSymbolPrice schedulerx');
    if (!choice_symbol_list.length) {
      return;
    }
    // 向java端发送现价
    for (const item of choice_symbol_list) {
      // TODO 先注释 避免产生太多订单
      ctx.service.mq.price.emit(item);
    }
  }
}
module.exports = PollSymbolPrice;
