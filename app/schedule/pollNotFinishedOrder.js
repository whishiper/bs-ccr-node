'use strict';

const Subscription = require('egg').Subscription;

class PollNotFinishedOrder extends Subscription {
  static get schedule() {
    return {
      interval: '30s', // 120s执行一次
      type: 'worker',
      immediate: false,
      disable: true,
    };
  }

  async subscribe() {
    const { app, ctx } = this;
    // 获取未完成订单
    const notFinishedOrderMap = await app.redis.hgetall('huobi-not-finished-buy-order');
    // ctx.logger.info('notFinishedOrderMap', notFinishedOrderMap);
    if (!Object.values(notFinishedOrderMap).length) {
      return;
    }
    for (const [ redis_key, order_id ] of Object.entries(notFinishedOrderMap)) {
      // ctx.logger.info('未完成订单', redis_key, order_id);
      ctx.service.huobi.changeTradeInfo({
        redis_key,
        order_id,
      });
    }
  }
}
module.exports = PollNotFinishedOrder;
