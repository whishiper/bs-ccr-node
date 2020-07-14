'use strict';

const Service = require('egg').Service;
class EthKline extends Service {

  async subscribe() {
    // 获取所有自选货币对 ['btseth','btceth',]
    const { app, ctx } = this;
    const choice_symbol_list = await app.redis.smembers('okex_choice_symbol_list');
    // 所有eth的自选货币对
    const eth_list = choice_symbol_list.filter(item => item.endsWith('ETH'));
    if (!eth_list.length) {
      return;
    }
    eth_list.forEach(symbol => {
      ctx.service.commonApi.kline({ symbol });
    });
  }
}
module.exports = EthKline;
