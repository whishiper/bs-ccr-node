'use strict';

const Service = require('egg').Service;

class PollNotFinishedOrder extends Service {
  async subscribe() {
    const { app, ctx } = this;
    // 获取未完成订单
    const notFinishedOrderMap = await app.redis.hgetall(
      'okex-not-finished-buy-order'
    );
    for (const [ redis_key, info ] of Object.entries(notFinishedOrderMap)) {
      const { order_id } = JSON.parse(info);
      ctx.service.okex.changeTradeInfo({
        redis_key,
        order_id,
      });
    }
    const notFinishedSellOrderMap = await app.redis.hgetall(
      'okex-not-finished-sell-order'
    );
    for (const [ redis_key, info ] of Object.entries(notFinishedSellOrderMap)) {
      const {
        order_id,
        sellType,
        redis_value,
        real_time_earning_ratio,
      } = JSON.parse(info);
      ctx.service.okex.changeNotTotalSellOrder({
        redis_key,
        order_id,
        sellType,
        redis_value,
        real_time_earning_ratio,
      });
    }
  }
}
module.exports = PollNotFinishedOrder;
