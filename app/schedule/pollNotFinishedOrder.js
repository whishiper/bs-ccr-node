'use strict';

const Subscription = require('egg').Subscription;

class PollNotFinishedOrder extends Subscription {
  static get schedule() {
    return {
      interval: '30s', // 120s执行一次
      type: 'worker',
      immediate: false,
      disable: true,
      // immediate: true,
    };
  }

  async subscribe() {
    const { app, ctx } = this;
    // 获取未完成订单
    const notFinishedOrderMap = await app.redis.hgetall(
      'okex-not-finished-buy-order'
    );
    for (const [ redis_key, order_id ] of Object.entries(notFinishedOrderMap)) {
      // console.log('未完成订单', redis_key, order_id);
      ctx.service.okex.changeTradeInfo({
        redis_key,
        order_id,
      });
    }
    const notFinishedSellOrderMap = await app.redis.hgetall(
      'okex-not-finished-sell-order'
    );
    for (const [ redis_key, info ] of Object.entries(notFinishedSellOrderMap)) {
      const { order_id, sellType } = JSON.parse(info);
      // console.log('未完成订单', redis_key, order_id);
      ctx.service.okex.changeNotTotalSellOrder({
        redis_key,
        order_id,
        sellType,
      });
    }
  }
}
module.exports = PollNotFinishedOrder;
