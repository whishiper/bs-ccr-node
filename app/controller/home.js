'use strict';

const Controller = require('egg').Controller;
const huobiSdk = require('../service/huobiSdk');
// const requestProxy = require('../service/proxyFn');
const fs = require('fs');

class HomeController extends Controller {
  // 测试止盈
  // async testStopProfit() {
  //   const { ctx, app } = this;
  //   const { symbol, signId } = ctx.request.body;
  //   const redis_key = `trade-condition_${signId}_${symbol}`;
  //   const symbol_trade_situation = await app.redis.hgetall(redis_key);
  //   const {
  //     is_set_stop_profit_trade,
  //     symbol_id,
  //     coinPairChoiceId,
  //     userId,
  //     tradePlatformApiBindProductComboId,
  //   } = symbol_trade_situation;
  //   // 启用止盈后停止,完全停止交易，
  //   if (is_set_stop_profit_trade === '1') {
  //     // 不可以继续交易
  //     // app.redis.hset(redis_key, 'trade_status', '0');
  //     // app.redis.zadd(`${symbol}_zset`, 0, redis_key);
  //     // TODO 提交java 停止买入 @fsg 2019.08.28
  //     ctx.service.mq.internalWithExternal.emit({
  //       mqType: 'mqtt-stopProfit', // 止盈类型
  //       symbol_id,
  //       coinPairChoiceId,
  //       userId,
  //       tradePlatformApiBindProductComboId,
  //     });
  //     console.log('huobi send stopProfit');
  //   } else {
  //     console.log('huobi do not send stopProfit');
  //   }
  // }
  // 检查mq连接状况
  async checkMqConnection() {
    const { ctx, app } = this;
    const flag = await app.redis.get('is_mq_connect_error');
    if (flag) {
      ctx.body = {
        code: false,
        msg: 'huobi-server mq connect error',
      };
      return;
    }
    ctx.body = {
      code: true,
      msg: 'huobi-server mq connect success',
    };
  }
  // async testProxy() {
  //   const { ctx, app } = this;
  //   const errors = app.validator.validate(
  //     {
  //       endpoint: {
  //         required: true,
  //         type: 'string',
  //         max: 1000,
  //         min: 1,
  //       },
  //     },
  //     ctx.request.body
  //   );
  //   const { endpoint } = ctx.request.body;

  //   if (errors) {
  //     ctx.service.handleErrors.throw_error([ errors ]);
  //   }
  //   const res = await ctx.service.proxy.testRequestProxy({
  //     endpoint,
  //     // proxyIp: ip,
  //   });

  //   ctx.body = res;
  // }
  // async testServerIpProxy() {
  //   const { ctx, app } = this;
  //   const errors = app.validator.validate(
  //     {
  //       endpoint: {
  //         required: true,
  //         type: 'string',
  //         max: 1000,
  //         min: 1,
  //       },
  //     },
  //     ctx.request.body
  //   );
  //   const { endpoint } = ctx.request.body;

  //   if (errors) {
  //     ctx.service.handleErrors.throw_error([ errors ]);
  //   }
  //   const res = await ctx.service.proxy.testServerIpRequestProxy({
  //     endpoint,
  //     // proxyIp: ip,
  //   });

  //   ctx.body = res;
  // }
  // async test_buy() {
  //   const p = {
  //     symbol: 'iotausdt',
  //     accessKey: '90854b9e-mn8ikls4qg-d8a152e7-cd30e',
  //     secretKey: '97d74615-f1e7bf4a-756a0261-c1f24',
  //     amount: '20',
  //     price: '0.2',
  //     type: 'buy-limit',
  //     account_id: '8032430',
  //   };
  //   const res = await huobiSdk.order_place({
  //     query: p,
  //     proxyIp: '50.2.15.22:3128',
  //   });

  //   this.ctx.body = res;
  // }
  async ip_map() {
    const tableName = 'error-ip-map';
    const { app } = this;
    app.redis.hgetall(tableName).then(res => {
      const arr = Object.keys(res);
      console.log('arr.length  is ', arr.length);
      arr.forEach(ip => {
        app.redis.sadd('ip_map', ip);
      });
      this.ctx.body = arr.length;
    });
  }
  async emit() {
    const { ctx } = this;
    const { query } = ctx.request;
    const { symbol } = query;
    ctx.body = await ctx.service.mq.price.emit(symbol);
  }
  async emit_orderGroup() {
    const { ctx } = this;
    const { body } = ctx.request;
    ctx.body = await ctx.service.order.orderGroup(body);
  }
  // 触发获取计价货币的所有自选货币对
  async trigger_currency_kline() {
    const { ctx, app } = this;
    const { currency } = ctx.request.query;
    await app.runSchedule(`${currency}Kline`);
    ctx.body = {
      msg: 'success',
    };
  }
  // 触发获取自选货币对
  async trigger_symbol_kline() {
    const { ctx } = this;
    const { query } = ctx.request;
    await ctx.service.commonApi.kline(query);
  }
  // 获取服务器ip， 请求火币私人数据都用此ip
  async getIp() {
    const { ctx } = this;
    const { query } = ctx.request;
    ctx.body = await ctx.service.ip.getIp(query);
  }
}
module.exports = HomeController;
