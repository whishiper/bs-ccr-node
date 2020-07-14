'use strict';

const Service = require('egg').Service;

class PollNotFinishedOrder extends Service {
  async subscribe() {
    const { app, ctx } = this;
    // 获取未完成订单
    const notFinishedOrderMap = await app.redis.hgetall(
      'huobi-not-finished-buy-order'
    );
    for (const [ redis_key, info ] of Object.entries(notFinishedOrderMap)) {
      console.log('enter notFinishedBuyOrder');
      const { order_id } = JSON.parse(info);
      ctx.service.huobi.changeTradeInfo({
        redis_key,
        order_id,
      });
    }
    const notFinishedSellOrderMap = await app.redis.hgetall(
      'huobi-not-finished-sell-order'
    );
    for (const [ redis_key, info ] of Object.entries(notFinishedSellOrderMap)) {
      const {
        order_id,
        sellType,
        redis_value,
        real_time_earning_ratio,
      } = JSON.parse(info);
      // console.log('enter notFinishedSellOrder');
      ctx.service.huobi.changeNotTotalSellOrder({
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
