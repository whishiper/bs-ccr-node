'use strict';

const Controller = require('egg').Controller;
// const accessKey = 'b90265e6-1873-4847-80c7-6dbb88c81402';
// const secretKey = '748EE75D7471E487D88D481D91612E0C';
// const passphrase = 'FSG851024125';
class OkexController extends Controller {
  // 查询用户的所有账户状态
  async verify_okex_api() {
    const { ctx } = this;
    const { body } = ctx.request;
    ctx.body = await ctx.service.okex.account({ body });
  }
  // 查询用户的所有账户状态
  async account() {
    const { ctx } = this;
    const { body } = ctx.request;
    ctx.body = await ctx.service.okex.account({ body });
  }
  // 查询用户的单个货币账户状态 有余额
  async currency_account() {
    const { ctx } = this;
    const { body } = ctx.request;
    const { params } = ctx;
    ctx.body = await ctx.service.okex.currency_account({ body, params });
  }
  // 订单详情信息
  async order() {
    const { ctx } = this;
    const { body, query } = ctx.request;
    ctx.body = await ctx.service.okex.order({ body, query });
  }
  async buy() {
    const { ctx } = this;
    const { body } = ctx.request;
    ctx.body = await ctx.service.okex.buy(body);
  }
  async sell() {
    const { ctx } = this;
    const { body } = ctx.request;
    // const body = {
    //   side: 'sell',
    //   instrument_id: 'DOGE-USDT',
    //   size: '20',
    //   price: '0.002674',
    // };
    ctx.body = await ctx.service.okex.sell(body);
  }
}
module.exports = OkexController;
