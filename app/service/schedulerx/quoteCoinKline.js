'use strict';

const Service = require('egg').Service;

class QuoteCoinKlineService extends Service {

  // 24小时触发一次获取，需要取得获取结果成功以后才算成功，失败需要重试
  async subscribe() {

    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('huobi_choice_symbol_list');

    // 所有usdt的自选货币对
    if (!choice_symbol_list.length) {
      return;
    }

    choice_symbol_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });

  }
}
module.exports = QuoteCoinKlineService;
