'use strict';

const Controller = require('egg').Controller;
class CommonApiController extends Controller {
  // 返回所有货币对 ok
  async symbols() {
    const { ctx, app } = this;
    const data = JSON.parse(await app.redis.get('symbol_map'));
    ctx.body = data;
  }
  async symbol() {
    const { ctx, app } = this;
    const { symbol } = ctx.query;
    const data = JSON.parse(await app.redis.get('symbol_map'));
    ctx.body = data[symbol];
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
      type
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
          min: 1
        }
      },
      ctx.request.query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([errors]);
    }
    // 火币深度数据
    const { text } = await ctx.service.proxy.requestProxy({
      endpoint: `${app.config.huobi.url}/market/depth?symbol=${symbol}&type=step0`
    });
    const { tick } = JSON.parse(text);
    ctx.body = tick;
  }
  async tickers() {
    const { ctx, app } = this;
    try {
      const { text } = await ctx.service.proxy.requestProxy({
        endpoint: `${app.config.huobi.url}/market/tickers`
      });
      const { data } = JSON.parse(text);
      ctx.body = data;
    } catch (err) {
      ctx.body = [];
    }
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
          min: 1
        }
      },
      ctx.request.query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([errors]);
    }
    const { text } = await ctx.service.proxy.requestProxy({
      endpoint: `${app.config.huobi.url}/market/history/kline?period=60min&size=1000&symbol=${symbol}`
    });
    const klineData = JSON.parse(text).data;
    ctx.body = klineData;
  }
}
module.exports = CommonApiController;
