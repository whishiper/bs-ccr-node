'use strict';

const Service = require('egg').Service;
class CommonApiService extends Service {
  /*
  @author:fsg
  @time:2019-07-23 16:49:25
  @params
   symbol
  @description:获取货币对计量单位的精确度和最小交易价等信息
  */
  async getSymbolCondition(symbol) {
    const { app } = this;
    const symbol_map = JSON.parse(await app.redis.get('okex_symbol_map'));
    const targetSymbol = symbol_map[symbol];
    // 交易金额的精度
    const value_precision = targetSymbol['value-precision'];
    // 交易对最小下单量
    const min_order_amt = targetSymbol['min-order-amt'];
    // 最小下单金额
    const min_order_value = targetSymbol['min-order-value'];
    // 交易对报价的精度
    const price_precision = targetSymbol['price-precision'];
    // 交易对基础币种计数精度
    const amount_precision = targetSymbol['amount-precision'];
    return {
      amount_precision,
      price_precision,
      value_precision,
      min_order_amt,
      min_order_value,
    };
  }
  // 最新买卖价
  async latestOpenPrice(obj) {
    const { symbol } = obj;
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        symbol: {
          required: true,
          type: 'string',
          max: 30,
          min: 1,
        },
      },
      obj
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const data = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments/${symbol}/ticker`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    if (!data) {

      return null;
    }
    return {
      // 买价
      buy: data.best_bid,
      // 卖价
      sell: data.best_ask,
    };
  }
  /*
  @author:fsg
  @time:2019-07-22 20:46:54
  @params
   symbol
    type:交易类型@required 买入或卖出：'buy','sell'
    length:获取深度列表前n个
  @description:获取
  */
  async getDeepTotal({ symbol, length, type }) {
    const { ctx, app } = this;
    if (![ 'buy', 'sell' ].includes(type)) {
      ctx.service.handleErrors.throw_error([ 'type参数错误' ]);
    }

    const tick = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments/${symbol}/book`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    // 买入时获取卖价深度及对应报价
    if (type === 'buy') {
      const bids = tick.bids.map(item => item[1]);
      return bids.slice(0, length).reduce((t, cur) => t + (cur - 0), 0);
    }
    // 卖出时获取买价深度及对应报价
    const asks = tick.asks.map(item => item[1]);
    return asks.slice(0, length).reduce((t, cur) => t + (cur - 0), 0);
  }
  /*
  @author:fsg
  @time:2019-08-25 10:59:40
  @params
  @description:自选货币对的k线数据存redis
  */
  async kline(query) {
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        symbol: {
          required: true,
          type: 'string',
          max: 30,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const { symbol } = query;
    const klineData = await app
      .curl(
        `${app.config.okex.url}/api/spot/v3/instruments/${symbol}/candles?granularity=3600`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    if (!klineData) {
      return;
    }
    if (!Array.isArray(klineData)) {
      return;
    }
    // 获取每条的最高价和最低价
    const list = klineData.map(item => [ item[2] - 0, item[3] - 0 ]);
    app.redis.set(`kline_${symbol}`, JSON.stringify(list));
  }
}
module.exports = CommonApiService;
