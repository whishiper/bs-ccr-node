'use strict';

const Controller = require('egg').Controller;
class HuobiController extends Controller {
  /*
  @author:fsg
  @time:2019-07-08 14:13:16
  @params
  @description:  对应火币 '/v1/account/accounts'
  */
  async verify_account() {
    const { ctx } = this;
    const { body } = ctx.request;
    const res = await ctx.service.huobi.verify_account(body);
    ctx.body = res;
  }
  async account() {
    const { ctx } = this;
    const { body } = ctx.request;
    const res = await ctx.service.huobi.account(body);
    ctx.body = res;
  }
  /*
  @author:fsg
  @time:2019-07-08 14:14:06
  @params
  @description:对应火币 `/v1/account/accounts/${account_id}/balance`
  */
  async balance() {
    const { ctx } = this;
    const { params } = ctx;
    const { body } = ctx.request;
    const res = await ctx.service.huobi.balance({ query: body, params });
    ctx.body = res;
  }

  /*
  @author:fsg
  @time:2019-05-31 18:09:36
  @params
  order_id
  @description:查询某个订单详情  `/v1/order/orders/${order_id}`
  */
  async order() {
    const { ctx } = this;
    const { params } = ctx;
    const { query } = ctx.request;
    const res = await ctx.service.huobi.order({ query, params });
    ctx.body = res;
  }
  /*
  @author:fsg
  @time:2019-05-31 18:20:07
  @params
  symbol:交易对
   states:查询的订单状态组合，使用','分割
  @description:查询当前委托、历史委托  '/v1/order/orders'
  */
  // async orders() {
  //   const { ctx } = this;
  //   const { query } = ctx.request;
  //   const res = await ctx.service.huobi.orders(query);
  //   ctx.body = res;
  // }
  /*
  @author:fsg
  @time:2019-07-18 16:47:14
  @params
   symbol
  @description:根据某货币对的已成交信息返回当前持仓费用和持仓数量和持仓均价 最新报价 实时收益比
  */
  // async filledTrade() {
  //   const { ctx } = this;
  //   const { query } = ctx.request;
  //   const res = await ctx.service.huobi.filledTrade(query);

  //   ctx.body = res;
  // }
  /*
  @author:fsg
  @time:2019-05-31 17:11:23
  @params
  account_id:账户id @required
  symbol: @required
  type:订单类型，基本用buy-limit 包括buy-market,  buy-limit,  buy-ioc, buy-limit-maker,  @required
  amount: 订单交易量 @required
  source:  现货交易填写“api”，杠杆交易填写“margin-api”
  @description:买入 '/v1/order/orders/place'
  */
  async buy() {
    // order-id 40919446874
    const { ctx } = this;

    const { body } = ctx.request;
    const res = await ctx.service.huobi.buy(body);
    ctx.body = res;
  }
  /*
  @author:fsg
  @time:2019-07-05 18:54:32
  @params
  account_id: @required
  symbol: @required
  type:订单类型，包括 sell-market, sell-limit,  sell-ioc,  sell-limit-maker  @required
  amount: 订单交易量 @required
  source:  现货交易填写“api”，杠杆交易填写“margin-api”
  @description:卖出  '/v1/order/orders/place'
  */
  async sell() {
    const { ctx } = this;
    const { body } = ctx.request;
    const res = await ctx.service.huobi.sell(body);
    ctx.body = res;
  }
}

module.exports = HuobiController;
