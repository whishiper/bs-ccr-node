'use strict';

const Controller = require('egg').Controller;
class CommonApiController extends Controller {
  // 返回所有货币对 ok
  async symbols() {
    const { ctx, app } = this;
    const data = JSON.parse(await app.redis.get('okex_symbol_map'));
    ctx.body = data;
  }
  async getDeepTotal() {
    const { ctx } = this;
    const { symbol, type, length } = ctx.request.query;
    const res = await ctx.service.commonApi.getDeepTotal({
      symbol,
      type,
      length,
    });
    ctx.body = res;
  }
  /*
  @author:fsg
  @time:2019-07-02 17:14:31
  @params
   symbol:货币对 'ethbtc'
   type:'buy'  'sell'
  @description:所选的货币对的最新报价,最新卖价
  */
  async latestOpenPrice() {
    const { ctx } = this;
    const { symbol, type } = ctx.request.query;
    const res = await ctx.service.commonApi.latestOpenPrice({
      symbol,
      type,
    });
    ctx.body = res;
  }
  // 深度
  async deep() {
    const { ctx, app } = this;
    const { symbol } = ctx.request.query;
    const errors = app.validator.validate(
      {
        symbol: {
          required: true,
          type: 'string',
          max: 30,
          min: 1,
        },
      },
      ctx.request.query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    // 深度数据

    const tick = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments/${symbol}/book`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    ctx.body = tick;
  }
  async tickers() {
    const { ctx, app } = this;


    const data = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments/ticker`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    // const { data } = JSON.parse(text);
    ctx.body = data;
  }
  async kline() {
    const { ctx } = this;
    const { query } = ctx.request;
    ctx.body = await ctx.service.commonApi.kline(query);
  }
  async kline_1() {
    const { ctx, app } = this;
    const { symbol } = ctx.request.query;
    const errors = app.validator.validate(
      {
        symbol: {
          required: true,
          type: 'string',
          max: 30,
          min: 1,
        },
      },
      ctx.request.query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const klineData = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments/${symbol}/candles?granularity=3600`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    ctx.body = klineData;
  }
}
module.exports = CommonApiController;
