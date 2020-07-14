'use strict';

const Controller = require('egg').Controller;

// const url = require('url');
// const http = require('http');

class CcrController extends Controller {
  async getBaseCoin() {
    const { ctx } = this;
    const { symbol } = ctx.request.query;
    ctx.body = await ctx.service.ccrOkex.getBaseCoin(symbol);
  }
  async formatSymbol2OkextType() {
    const { ctx } = this;
    const { symbol } = ctx.request.query;
    ctx.body = await ctx.service.ccrOkex.formatSymbol2OkextType(symbol);
  }
  async test_okex_store_split() {
    const { ctx } = this;
    ctx.body = await ctx.service.ccrOkexFormula.store_split({
      symbol: 'XEM-USDT',
      max_trade_order: 6,
      sellPrice: '0.0353',
    });
  }
  async test_huobi_store_split() {
    const { ctx } = this;
    ctx.body = await ctx.service.ccrHuobiFormula.store_split({
      symbol: 'xemusdt',
      max_trade_order: 6,
      sellPrice: '0.0349',
    });
  }
  // 批量停止设置了止盈后停止的货币对
  async batchStopProfit() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        userId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { userId } = body;
    const list = await app.redis
      .get('internal')
      .hgetall(`user_${userId}_stopProfit_table`);
    const promiseArr = [];
    for (const [ coinPairChoiceId, info ] of Object.entries(list)) {
      promiseArr.push(ctx.service.ccrCommon.stopProfit(JSON.parse(info)));
    }
    ctx.body = await Promise.all(promiseArr);
  }
  async get_symbol_map() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.get_symbol_map();
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.get_symbol_map();
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.get_symbol_map();
    }
  }
  async bind_api() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.bind_api(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.bind_api(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.bind_api(body);
    }
  }
  async delete_api() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.delete_api(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.delete_api(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.delete_api(body);
    }
  }
  async remove_api() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.remove_api(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.remove_api(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.remove_api(body);
    }
  }
  async verify_api() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.verify_api(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.verify_api(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.verify_api(body);
    }
  }
  // TODO 抽离到公共 @fsg 2019.11.19. for example:ccrHuobi.api_list ===> ccrCommon.api_list
  async api_list() {
    const { ctx } = this;
    const { query } = ctx.request;
    const res = await ctx.service.ccrHuobi.api_list(query);
    ctx.body = res;
  }
  // TODO 抽离到公共 @fsg 2019.11.19
  async api_detail() {
    const { ctx } = this;
    const { id } = ctx.params;
    const res = await ctx.service.ccrHuobi.api_detail(id);
    ctx.body = res;
  }
  async getSymbolByCurrency() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.getSymbolByCurrency(query);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.getSymbolByCurrency(query);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.getSymbolByCurrency(query);
    }
  }
  // 初始化所有计价货币
  async initCurrencies() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.initCurrencies();
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.initCurrencies();
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.initCurrencies();
    }
  }
  // 绑定所有计价货币和所有货币对
  async bindAllSymbols2Currency() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.bindAllSymbols2Currency();
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.bindAllSymbols2Currency();
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.bindAllSymbols2Currency();
    }
  }
  // 初始化所有的货币对然后添加
  async initSymbol() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.initSymbol();
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.initSymbol();
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.initSymbol();
    }
  }
  async currencies() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.currencies();
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.currencies();
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.currencies();
    }
  }
  // 添加自选货币对
  async addSymbol() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.addSymbol(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.addSymbol(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.addSymbol(body);
    }
  }
  async delSymbol() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.delSymbol(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.delSymbol(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.delSymbol(body);
    }
  }
  // 主动触发获取计价货币所有自选货币对的k线
  async trigger_currency_kline() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName, currency } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.trigger_currency_kline(currency);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.trigger_currency_kline(currency);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.trigger_currency_kline(currency);
    }
  }
  async setTradeParams() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.setTradeParams(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.setTradeParams(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.setTradeParams(body);
    }
  }
  async symbolInfo() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = query;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.symbolInfo(query);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.symbolInfo(query);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.symbolInfo(query);
    }
  }
  async currencyInfo() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.currencyInfo(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.currencyInfo(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.currencyInfo(body);
    }
  }

  /*
 @author:fsg
 @time:2019-07-15 18:13:02
 @params
  symbol_list:货币对数列 [{symbol:'btsusdt',budget:50},{name:'ethusdt',budget:60}] ,
  policy_id:策略id
 @description:设置货币对与策略对应关系 将货币对的最大建仓次数存到redis

 */
  async setting() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.setting(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.setting(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.setting(body);
    }
  }
  /*
  @author:fsg
  @time:2019-07-22 22:55:21
  @params
  @description:开始交易 trade_status从0变为 1
  */
  async start_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.start_trade(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.start_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.start_trade(body);
    }
  }
  /*
  @author:fsg
  @time:2019-12-17 15:54:49
  @params
  @description:批量暂停
  */
  async batch_pause_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        list: {
          required: true,
          type: 'string',
          max: 2000,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.batch_pause_trade(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.batch_pause_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.batch_pause_trade(body);
    }
  }
  /*
  @author:fsg
  @time:2019-07-22 22:55:21
  @params
  @description:暂停买入 状态trade_status从1 变为 3
  */
  async pause_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.pause_trade(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.pause_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.pause_trade(body);
    }
  }
  /*
  @author:fsg
  @time:2019-12-17 16:27:00
  @params
  @description:
  */
  async batch_recover_buy() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        list: {
          required: true,
          type: 'string',
          max: 2000,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.batch_recover_buy(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.batch_recover_buy(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.batch_recover_buy(body);
    }
  }
  /*
  @author:fsg
  @time:2019-09-02 10:14:25
  @params
  @description:恢复买入 trade_status变回1
  */
  async recover_buy() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.recover_buy(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.recover_buy(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.recover_buy(body);
    }
  }
  /*
  @author:fsg
  @time:2019-08-28 18:08:59
  @params
  @description:
  */
  async reset_symbol() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.reset_symbol(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.reset_symbol(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.reset_symbol(body);
    }
  }
  /*
  @author:fsg
  @time:2019-12-17 16:28:22
  @params
  @description:
  */
  async batch_stop_profit_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        list: {
          required: true,
          type: 'string',
          max: 2000,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.batch_stop_profit_trade(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.batch_stop_profit_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.batch_stop_profit_trade(body);
    }
  }
  /*
  @author:fsg
  @time:2019-08-13 14:16:04
  @params
  @description:设置止盈后停止 trade_status 变为 2
  */
  async stop_profit_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.stop_profit_trade(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.stop_profit_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.stop_profit_trade(body);
    }
  }

  async batch_cancel_stop_profit_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        list: {
          required: true,
          type: 'string',
          max: 2000,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.batch_cancel_stop_profit_trade(
        body
      );
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.batch_cancel_stop_profit_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.batch_cancel_stop_profit_trade(body);
    }
  }
  /*
  @author:fsg
  @time:2019-08-13 14:16:04
  @params
  @description:取消止盈后停止 trade_status 变为 1
  */
  async cancel_stop_profit_trade() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.cancel_stop_profit_trade(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.cancel_stop_profit_trade(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.cancel_stop_profit_trade(body);
    }
  }
  /*
@author:fsg
@time:2019-08-13 14:16:35
@params
@description:立即停止 忘记订单（即 丢弃该轮之前所有订单）,trade_status重置为0
*/
  async forget_orders() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.forget_orders(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.forget_orders(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.forget_orders(body);
    }
  }
  async batch_sell_all_orders() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.batch_sell_all_orders(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.batch_sell_all_orders(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.batch_sell_all_orders(body);
    }
  }
  /*
@author:fsg
@time:2019-08-13 14:17:08
@params
@description:立即停止 清仓卖出（即 立即卖掉当前所有订单）,卖出成功不进行下一轮,trade_status重置为0
*/
  async sell_all_orders() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        plantFormName: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    const { plantFormName } = body;
    if (plantFormName === 'huobi') {
      ctx.body = await ctx.service.ccrHuobi.sell_all_orders(body);
    }
    if (plantFormName === 'okex') {
      ctx.body = await ctx.service.ccrOkex.sell_all_orders(body);
    }
    if (plantFormName === 'zb') {
      ctx.body = await ctx.service.ccrZb.sell_all_orders(body);
    }
  }
}

module.exports = CcrController;
