'use strict';

const Service = require('egg').Service;
const request = require('request');
const httpClient = require('./httpClient').request;
/*
@author:fsg
@time:2019-06-11 14:56:15
@params
@description:ccr 公式计算
*/
class CcrHuobiFormulaService extends Service {
  /*
  @author:fsg
  @time:2019-06-11 15:38:51
  @params
    min_trade_amount:最小交易量、@required number
    price:现价（当前卖价）@required number
    coin_pairs_num:货币对数量@required number
    leverage:杠杆倍数@required number
    max_trade_order:最大交易单数 N @required number
    policy_series:策略数列@required Array<number>
    store_split:建仓间隔@required number
    budget:预算@required number
  @description:计算 交易倍数 trade_times @ok
  */
  async trade_times({
    budget,
    min_trade_amount,
    price,
    store_split,
    policy_series,
    leverage,
    coin_pairs_num,
  }) {
    const { ctx } = this;
    if (!Array.isArray(policy_series)) {
      policy_series = JSON.parse(policy_series);
    }
    // 货币预算
    const symbolBudget = (budget * leverage) / coin_pairs_num;
    // 临时保存的均价
    let temp_average_price = price;
    // 当前N单总费用
    let curTotalCost = 0;
    // 当前N单策略数列值相加
    let curSeriesTotal = 0;
    // 设交易倍数为1
    const new_store_split = [
      0,
      ...Array(policy_series.length - 1).fill(store_split),
    ];
    // 交易倍数为1时的货币对预算
    policy_series.forEach((cur, index) => {
      curSeriesTotal += cur;
      curTotalCost +=
        (temp_average_price - new_store_split[index]) * cur * min_trade_amount;
      const averagePrice = curTotalCost / (curSeriesTotal * min_trade_amount);
      temp_average_price = averagePrice;
    });
    const trade_times = Math.floor(symbolBudget / curTotalCost);
    if (trade_times >= 3) {
      return trade_times;
    }
    return -1;

    // ctx.service.handleErrors.throw_error([ '预算过小' ]);
  }
  /*
  @author:fsg
  @time:2019-06-17 11:43:48
  @params
    min_trade_amount:最小交易量、@required number
    price:现价@required number
    policy_series:策略数列@required Array<number>
    store_split:建仓间隔@required number
     trade_times:交易倍数 number
  @description:前N单均价 @ok
  */
  async averagePrice({
    min_trade_amount,
    price,
    policy_series,
    store_split,
    // trade_times,
  }) {
    if (!Array.isArray(policy_series)) {
      policy_series = JSON.parse(policy_series);
    }
    // 临时保存的均价
    let temp_average_price = price;
    // 当前N单总费用
    let curTotalCost = 0;
    // 当前N单策略数列值相加
    let curSeriesTotal = 0;
    const new_store_split = [
      0,
      ...Array(policy_series.length - 1).fill(store_split),
    ];
    // 每单均价的集合
    const result = {};
    policy_series.forEach((item, index) => {
      curSeriesTotal += item;
      curTotalCost +=
        (temp_average_price - new_store_split[index]) * item * min_trade_amount;
      const averagePrice = curTotalCost / (curSeriesTotal * min_trade_amount);
      temp_average_price = averagePrice;
      result[index + 1] = averagePrice;
    });
    return JSON.stringify(result);
  }
  /*
  @author:fsg
  @time:2019-06-19 15:21:08
  @params
  min_trade_amount:最小交易量、@required number
    policy_series:策略数列@required Array<number>
     trade_times:交易倍数@required number
    max_trade_order:最大交易单数@required
    symbol
  @description:每单买入量 @ok
  */
  async buy_volume({ symbol, policy_series, trade_times, min_trade_amount }) {
    const result = {};
    const { amount_precision } = await this.getSymbolCondition(symbol);
    if (!Array.isArray(policy_series)) {
      policy_series = JSON.parse(policy_series);
    }
    policy_series.forEach((item, index) => {
      result[index] = (trade_times * min_trade_amount * item).toFixed(
        amount_precision
      );
    });
    return result;
  }
  /*
  @author:fsg
  @time:2019-07-23 16:49:25
  @params
   symbol
  @description:获取货币对计量单位的精确度和最小交易价等信息
  */
  async getSymbolCondition(symbol) {
    const { ctx, app } = this;
    const symbol_map = await ctx.service.ccrHuobi.get_symbol_map();
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
  /*
  @author:fsg
  @time:2019-07-12 17:40:11
  @params
   用户设置的各个货币对的预算 数据结构未知 暂时mock
  @description:交易中总预算
  */
  async trade_budget(data) {
    return data.map(item => item.budget).reduce((t, cur) => t + cur, 0);
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
    const { data } = await ctx
      .curl(
        `${app.config.huobiServer.url}/deep?symbol=${symbol}`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    // 买入时获取卖价深度及对应报价
    if (type === 'buy') {
      const bids = data.bids.map(item => item[1]);
      return bids.slice(0, length).reduce((t, cur) => t + cur, 0);
    }
    // 卖出时获取买价深度及对应报价
    const asks = data.asks.map(item => item[1]);
    return asks.slice(0, length).reduce((t, cur) => t + cur, 0);
  }
  /*
  @author:fsg
  @time:2019-06-13 15:41:26
  @params
    symbol:交易对 @required
    trade_amount:交易量@required
    type:交易类型@required 买入或卖出：'buy','sell'
  @description:深度 @ok
  */
  async deep({ symbol, trade_amount, type }) {
    const { ctx, app } = this;

    const { data } = await ctx
      .curl(
        `${app.config.huobiServer.url}/deep?symbol=${symbol}`,
        {
          method: 'GET',
          dataType: 'json',
        }
      );
      // .then(res => res.data);
    const bids = data.bids.map(item => item[1]);
    const asks = data.asks.map(item => item[1]);

    // 买入时获取卖价深度及对应报价
    if (type === 'buy') {
      const total = bids.reduce((t, item) => t + item, 0);
      // 如果所有深度相加都达不到需要的交易量，说明交易量设置不合理
      if (total < trade_amount) {
        ctx.service.handleErrors.throw_error([ '请检查交易量是否过大' ]);
      }
      const len = bids.length;
      let bidTotal = 0;
      let needNum = 0;
      for (let i = 0; i < len; i++) {
        bidTotal += bids[i] - 0;
        if (bidTotal >= trade_amount) {
          needNum = i;
          break;
        }
      }
      const arr1 = bids.slice(0, needNum);
      const supplement = trade_amount - arr1.reduce((t, cur) => t + cur, 0);
      arr1.push(supplement);
      // 算拟交易费用
      const propose_transaction = arr1
        .map((item, idx) => {
          return data.bids[idx][0] * item;
        })
        .reduce((t, cur) => t + cur, 0);
      return {
        deep: arr1,
        propose_transaction,
        // 买入时最低价
        // lowestPrice:tick.bids[0][0]
      };
    }
    // 卖出时获取买价深度及对应报价
    if (type === 'sell') {
      const total = asks.reduce((t, item) => t + item, 0);
      // 如果所有深度相加都达不到需要的交易量，说明交易量设置不合理
      if (total < trade_amount) {
        ctx.service.handleErrors.throw_error([ '请检查交易量是否过大' ]);
      }
      const len = asks.length;
      let askTotal = 0;
      let needNum = 0;
      for (let i = 0; i < len; i++) {
        askTotal += asks[i];
        if (askTotal >= trade_amount) {
          needNum = i;
          break;
        }
      }
      const arr1 = asks.slice(0, needNum);
      const supplement = trade_amount - arr1.reduce((t, cur) => t + cur);
      arr1.push(supplement);
      // 算拟交易费用
      const propose_transaction = arr1
        .map((item, idx) => {
          return data.asks[idx][0] * item;
        })
        .reduce((t, cur) => t + cur, 0);
      return {
        deep: arr1,
        propose_transaction,
        // 卖出时最低价
        //  lowestPrice:tick.asks[0][0]
      };
    }
  }
  /*
  @author:fsg
  @time:2019-06-19 15:25:27
  @params
   symbol:交易对 @required
    trade_amount:交易量@required
  @description:拟交易费用及拟交易均价和最小均价 每次每个货币对交易后获得的拟交易均价a和redis中对应货币对记录到的最小均价b对比大小，如果a更小就替换b
  */
  /*
 @author:fsg
 @time:2019-06-13 15:07:58
 @params
 symbol:货币对@required  'btsusdt'
 max_trade_order:最大交易单数@required
 @description:获取建仓间隔
 */
  async store_split({ symbol, max_trade_order, sellPrice }) {
    const { ctx, app } = this;
    // 卖1价,最高卖价
    const list = await app
      .curl(
        `${app.config.huobiServer.url}/getRedisValueByKey?key=kline_${symbol}`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    let str = '';
    list.forEach(item => {
      str += JSON.stringify(item);
    });
    const url = 'http://jgsf.bj01.bdysite.com/calc';
    const formData = {
      key1: str,
      key2: sellPrice, // 当前卖1价
      key3: max_trade_order, // 最大交易单数
      key4: new Date().getTime(),
    };
    const fn = options =>
      new Promise((resolve, reject) => {
        request(options, (err, response, body) => {
          if (err) {
            reject(err);
          }
          resolve(body);
        });
      });
    const res = await fn({
      url,
      method: 'POST',
      formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const store_split = res.split(',')[1];
    return store_split;
  }
  /*
  @author:fsg
  @time:2019-07-13 18:21:33
  @params
   openPrice:开盘价,第一单的价格
   store_split:建仓间隔
   max_trade_order:最大交易单数
  @description:最后建仓价
  */
  async lastBuildPrice({ openPrice, max_trade_order, store_split }) {
    const lastBuildPrice = openPrice - store_split * (max_trade_order - 1);
    return lastBuildPrice;
  }
  /*
  @author:fsg
  @time:2019-07-19 16:44:36
  @params
    position_average：持仓均价
    store_split：建仓间隔
    follow_lower_ratio:追踪下调比
  @description:下调均价=(整体持仓均价-建仓间隔)-(整体持仓均价*追踪下调比)
  */
  async lowerAveragePrice({
    position_average,
    store_split,
    follow_lower_ratio,
  }) {
    return (
      position_average - store_split - position_average * follow_lower_ratio
    );
  }
  /*
  @author:fsg
  @time:2019-07-19 17:09:29
  @params
  min_averagePrice:最小均价
   position_average：持仓均价
   follow_callback_ratio:追踪回调比
  @description:回调均价
  */
  async callbackAveragePrice({
    min_averagePrice,
    position_average,
    follow_callback_ratio,
  }) {
    return min_averagePrice + position_average * follow_callback_ratio;
  }
}
module.exports = CcrHuobiFormulaService;
