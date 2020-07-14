'use strict';

const Service = require('egg').Service;
// const huobiSdk = require('./ctx.service.huobiSdk');
const {
  filterHuobiResponse,
  gendGroupId,
  formatTime,
} = require('../utils/tool');
const { HUOBI_ERRORS } = require('../utils/huobiErrors');
class HuobiService extends Service {
  sendError2Mq(data) {
    const { ctx } = this;
    const d = {
      plantFormName: 'huobi',
      type: 'tradeError',
      mqType: 'mqtt-tradeError', // 交易信息类型
      ...data,
    };
    ctx.service.mq.internalWithExternal.emit(d);
  }
  /*
  @author:fsg
  @time:2019-08-05 11:57:46
  @params
  @description:
  */
  async verify_account(query) {
    const { app, ctx } = this;
    const errors = app.validator.validate(
      {
        accessKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        secretKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        // robotId: {
        //   required: true,
        //   type: 'string',
        //   max: 100,
        //   min: 1,
        // },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const proxyIp = await ctx.service.ip.getRandomIp();
    const res = await ctx.service.huobiSdk.verify_account({
      query,
      // proxyMany: true,
      proxyIp,
    });

    return res;
  }
  async account(query) {
    const { app, ctx } = this;
    const errors = app.validator.validate(
      {
        accessKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        secretKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        robotId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const proxyIp = await ctx.service.ip.getIp(query);
    const { address } = proxyIp;
    const res = await ctx.service.huobiSdk
      .account({ query, proxyIp: address })
      .then(filterHuobiResponse);
    console.log('account res', res);
    return res;
  }
  /*
  @author:fsg
  @time:2019-07-08 14:14:06
  @params
  @description:对应火币 `/v1/account/accounts/${account_id}/balance`
  */
  async balance({ params, query }) {
    const { app, ctx } = this;
    const errors_1 = app.validator.validate(
      {
        account_id: {
          required: true,
          type: 'string',
        },
      },
      params
    );
    if (errors_1) {
      ctx.service.handleErrors.throw_error([ errors_1 ]);
    }
    const errors_2 = app.validator.validate(
      {
        accessKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        secretKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        robotId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );

    if (errors_2) {
      ctx.service.handleErrors.throw_error([ errors_2 ]);
    }
    const proxyIp = (await ctx.service.ip.getIp(query)).address;
    // const res = await ctx.service.huobiSdk.balance({ query, params });
    const res = await ctx.service.huobiSdk
      .balance({ query, params, proxyIp })
      .then(filterHuobiResponse);

    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    // 需要的计价货币 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos'
    // const currencies = [ 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos' ];
    // res.list = res.list.filter(item => currencies.includes(item.currency));
    res.list = res.list.filter(item => item.type === 'trade');
    // 用户个人的余额列表
    return res;
  }
  /*
  @author:fsg
  @time:2019-08-26 16:58:56
  @params
  @description:
  */
  async order({ query, params }) {
    const { ctx, app } = this;
    // const errors_1 = app.validator.validate(
    //   {
    //     order_id: {
    //       required: true,
    //       type: 'string',
    //       // max: 30,
    //       // min: 1,
    //     },
    //   },
    //   params
    // );
    // if (errors_1) {
    //   ctx.service.handleErrors.throw_error(errors_1 );
    // }
    const errors_2 = app.validator.validate(
      {
        accessKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        secretKey: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        robotId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors_2) {
      ctx.service.handleErrors.throw_error(errors_2);
    }
    const proxyIp = (await ctx.service.ip.getIp(query)).address;
    const res = await ctx.service.huobiSdk.order_detail({
      query,
      params,
      proxyIp,
    });
    return {
      ...res,
      field_cash_amount: res['field-cash-amount'],
      field_amount: res['field-amount'],
      field_fees: res['field-fees'],
      createdAt: res['created-at'],
      trade_price: res.price,
    };
  }

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
  async buy(body) {
    const { ctx, app } = this;
    // const errors_2 = app.validator.validate(
    //   {
    //     symbol: {
    //       required: true,
    //       type: 'string',
    //       max: 100,
    //       min: 1,
    //     },
    //     signId: {
    //       required: true,
    //       type: 'string',
    //       max: 100,
    //       min: 1,
    //     },
    //   },
    //   body
    // );
    let { symbol, signId, buyPrice } = body;
    const redis_key = `trade-condition_${signId}_${symbol}`;
    const symbol_trade_situation = await app.redis.hgetall(redis_key);
    try {
      const receive_finished_order = body.finished_order;
      console.log(
        '进入买入方法-----------------------',
        signId,
        symbol,
        receive_finished_order,
        new Date()
      );
      // 存在未交易成功。还处于挂单状态的买单
      const isHaveNotFinishedBuyOrder = await app.redis.hget(
        'huobi-not-finished-buy-order',
        redis_key
      );
      if (isHaveNotFinishedBuyOrder) {
        console.log(
          'isHaveNotFinishedBuyOrder',
          isHaveNotFinishedBuyOrder,
          redis_key
        );
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      // 存在未交易成功。还处于挂单状态的卖单
      const isHaveNotFinishedSellOrder = await app.redis.hget(
        'huobi-not-finished-sell-order',
        redis_key
      );
      if (isHaveNotFinishedSellOrder) {
        console.log(
          'isHaveNotFinishedSellOrder',
          isHaveNotFinishedSellOrder,
          redis_key
        );
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      // 货币对交易情况
      const { accessKey, secretKey } = await ctx.service.secret.decryptSecret(
        symbol_trade_situation.secret
      );
      const query = {
        accessKey,
        secretKey,
        robotId: symbol_trade_situation.robotId,
      };
      const proxyIp = (
        await ctx.service.ip.getIp({
          robotId: symbol_trade_situation.robotId,
        })
      ).address;
      // 如果收到的已完成单数小于redis中已完成单数，则不处理
      if (
        receive_finished_order -
          0 -
          (symbol_trade_situation.finished_order - 0) <
        0
      ) {
        console.log(
          `收到的已完成单数${receive_finished_order}小于redis中已完成单数${symbol_trade_situation.finished_order}`,
          signId,
          symbol,
          receive_finished_order
        );
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      if (!buyPrice) {
        // 取该货币对最新报价 现价
        buyPrice = (
          await ctx.service.commonApi.latestOpenPrice({
            symbol,
            type: 'buy',
          })
        ).buy;
        console.log('buyPrice', buyPrice, redis_key);
      }
      if (!buyPrice) {
        console.log('no buyPrice=======', buyPrice, redis_key);
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      // redis中存储的交易倍数和策略数列以及已经买入的单数（setting时设置的）
      let {
        userId,
        coinPairChoiceId,
        finished_order,
        // max_trade_order,
        buy_volume,
        account_id,
        // min_order_value, // 最小下单金额
        price_precision, // 交易对报价的精度
        theoreticalBuildPriceMap, // 理论建仓价
      } = symbol_trade_situation;
      if (typeof buy_volume !== 'object') {
        buy_volume = JSON.parse(buy_volume);
      }
      if (theoreticalBuildPriceMap) {
        theoreticalBuildPriceMap = JSON.parse(theoreticalBuildPriceMap);
      }

      // 委托价格= 最新卖价(现价)*1.02 TODO 暂时保留4位小数 @fsg 08.26
      const trust_price = (buyPrice * 1.02).toFixed(price_precision);
      if (finished_order - 0 === 0) {
        // try {
        // 第一次买入时候
        // 读取卖价前10深度（卖1价~卖10价）
        const deepTotal = await ctx.service.commonApi.getDeepTotal({
          symbol,
          length: 10,
          type: 'buy',
        });

        if (!deepTotal || deepTotal < buy_volume[0]) {
          app.redis.zadd(`${symbol}_zset`, 1, redis_key);
          console.log(
            '深度之和小于首单买入量',
            signId,
            symbol,
            receive_finished_order
          );
          return;
        }
        // 达到买入条件
        const p = {
          ...query,
          symbol,
          amount: buy_volume[0],
          price: trust_price,
          type: 'buy-limit',
          account_id,
        };
        console.log('buy 提交到火币的参数', JSON.stringify(p));
        const order_id = await ctx.service.huobiSdk
          .order_place({
            query: p,
            proxyIp,
          })
          .then(filterHuobiResponse);
        // console.log('买入第一单', order_id);
        if (!order_id) {
          console.log(
            '买入第一单 error',
            order_id,
            signId,
            symbol,
            receive_finished_order
          );
          await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
          return;
        }
        console.log(
          `买入成功-------->第${finished_order - 0 + 1}单`,
          redis_key,
          order_id
        );
        const groupId = gendGroupId(userId, coinPairChoiceId);
        // 当前交易组id
        await app.redis.hset(redis_key, 'cur_groupId', groupId);
        // 首单成功创建新的订单组
        // 将该订单信息暂存,
        await app.redis.hset(
          'huobi-not-finished-buy-order',
          redis_key,
          JSON.stringify({
            order_id,
          })
        );
        // }
        setTimeout(() => {
          this.changeTradeInfo({
            redis_key,
            order_id,
            first_order_price: buyPrice,
          });
        }, 1000 * 3);
        return;
      }
      // try {
      // 达到买入条件
      // 委托下单
      const p = {
        ...query,
        symbol,
        amount: buy_volume[finished_order],
        price: trust_price,
        type: 'buy-limit',
        account_id,
      };
      console.log(`buy 第${finished_order - 0 + 1}单 参数`, JSON.stringify(p));
      const order_id = await ctx.service.huobiSdk
        .order_place({
          query: p,
          proxyIp,
        })
        .then(filterHuobiResponse);
      if (!order_id) {
        console.log(
          `买入第${finished_order - 0 + 1}单 error`,
          order_id,
          signId,
          symbol,
          receive_finished_order
        );
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      console.log(
        `买入成功-------->第${finished_order - 0 + 1}单`,
        redis_key,
        order_id
      );
      // 将该订单信息暂存,
      await app.redis.hset(
        'huobi-not-finished-buy-order',
        redis_key,
        JSON.stringify({
          order_id,
        })
      );
      // }
      setTimeout(() => {
        this.changeTradeInfo({
          redis_key,
          order_id,
        });
      }, 1000 * 3);
    } catch (e) {
      await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
      console.log(
        '买入失败----->',
        e.name,
        e.message,
        redis_key,
        '分数是：===',
        await app.redis.zscore(`${symbol}_zset`, redis_key)
      );
      if (e.message.includes('JSON')) {
        console.log('json err key', e);
      }
      const tradeErrorMsg = HUOBI_ERRORS[e.name];
      const tradeErrorCode = e.name;
      const isTradeError = 1;
      // 判断错误数据 是否已在当前redis数据，如有则不发消息
      const cur_tradeErrorMsg = symbol_trade_situation.tradeErrorMsg;
      const cur_tradeErrorCode = symbol_trade_situation.tradeErrorCode;
      const cur_isTradeError = symbol_trade_situation.isTradeError;
      if (
        cur_tradeErrorMsg === tradeErrorMsg &&
        cur_tradeErrorCode === tradeErrorCode &&
        cur_isTradeError - 0 === isTradeError
      ) {
        return;
      }
      if (Reflect.has(HUOBI_ERRORS, tradeErrorCode)) {
        const d = {
          msg: tradeErrorMsg,
          code: tradeErrorCode,
          signId,
          symbol,
        };
        ctx.service.huobi.sendError2Mq(d);
        const send2InternalEggData = {
          signId,
          symbol,
          key: redis_key,
          isTradeError, // 交易出错 1是0否
          tradeErrorMsg,
          tradeErrorCode,
          plantFormName: 'huobi',
          type: 'updateSymbolTradeInfo',
          mqType: 'mqtt-tradeInfo', // 交易信息类型
        };
        ctx.service.mq.internalWithExternal.emit(send2InternalEggData);
        app.redis.hset(redis_key, 'tradeErrorMsg', tradeErrorMsg);
        app.redis.hset(redis_key, 'tradeErrorCode', tradeErrorCode);
        app.redis.hset(redis_key, 'isTradeError', isTradeError);
      }
    }
  }
  async changeTradeInfo({ redis_key, order_id, first_order_price = null }) {
    try {
      const { app, ctx } = this;
      const isHaveNotFinishedOrder = await app.redis.hget(
        'huobi-not-finished-buy-order',
        redis_key
      );
      if (!isHaveNotFinishedOrder) {
        console.log('未完成订单集已没有此单', redis_key);
        return;
      }
      const symbol_trade_situation = await app.redis.hgetall(redis_key);
      console.log('未完成订单集还存在此单===', redis_key);
      if (
        !symbol_trade_situation ||
        !Object.values(symbol_trade_situation).length
      ) {
        return;
      }
      let {
        secret,
        theoreticalBuildPriceMap,
        signId,
        coinPairChoiceId,
        finished_order,
        cur_groupId,
        buy_volume,
        userId,
        robotId,
        symbol,
        currency_id,
        quote_currency,
        quote_currency_id,
        tradePlatformApiBindProductComboId,
      } = symbol_trade_situation;
      if (typeof buy_volume !== 'object') {
        buy_volume = JSON.parse(buy_volume);
      }
      if (theoreticalBuildPriceMap) {
        theoreticalBuildPriceMap = JSON.parse(theoreticalBuildPriceMap);
      }
      const { accessKey, secretKey } = await ctx.service.secret.decryptSecret(
        secret
      );
      const order_detail_res = await this.order({
        query: {
          accessKey,
          secretKey,
          robotId,
        },
        params: { order_id },
      });
      const {
        state,
        field_cash_amount,
        field_amount,
        createdAt,
        trade_price,
      } = order_detail_res;
      // 完全成交
      if (state === 'filled') {
        // 理论建仓价 TODO
        let theoreticalBuildPrice = 0;
        // 收益比
        if (theoreticalBuildPriceMap) {
          // 实际建仓价
          theoreticalBuildPrice =
            theoreticalBuildPriceMap[finished_order - 0 + 1] - 0;
        }
        let sendOrderData = {
          name: cur_groupId,
          finished_order,
          theoreticalBuildPrice,
          profitRatio: 0,
          tradeAveragePrice: (field_cash_amount - 0) / (field_amount - 0), // 交易均价
          tradeNumbers: field_amount - 0, // 交易数量
          tradeCost: field_cash_amount - 0, // 交易费用
          tradeType: 1, // 1 ：AI建仓 | 2：AI整体止盈 | 3:手动清仓
          createdAt: formatTime(createdAt),
          sign: 2,
        };
        // 首单 需要加创建订单组信息
        if (sendOrderData.finished_order - 0 === 0) {
          sendOrderData = {
            ...sendOrderData,
            plantFormName: 'huobi',
            coinPairChoiceId,
            orderId: order_id,
            isEnd: 0,
            sign: 1, // 订单与订单组信息合在一起
          };
        }
        ctx.service.mq.order.orderGroup({
          orderGroupData: sendOrderData,
          redis_key,
          redis_table: 'huobi-not-finished-buy-order',
        });
        console.log(
          `第${finished_order -
            0 +
            1}单的成交总金额为${field_cash_amount},单号为${order_id}`
        );
        // 成功下单则redis中对应的已买入订单数量要+1
        await app.redis.hset(
          redis_key,
          'finished_order',
          finished_order - 0 + 1
        );
        // 获取当前持仓均价,持仓费用,持仓数量
        // 成功买入 查询该订单详情 将费用和数量假如到持仓总费用和持仓总数量
        const old_position_cost = symbol_trade_situation.position_cost;
        const old_position_num = symbol_trade_situation.position_num;
        const position_cost = old_position_cost - 0 + (field_cash_amount - 0);
        console.log(
          `原redis持仓费用${old_position_cost} ,累加后第${finished_order -
            0 +
            1}单的持仓费用${position_cost}`
        );
        // 持仓数量改从数列获取累加 @ 2019.9.25
        // const position_num = old_position_num - 0 + (field_amount - 0);
        const position_num =
          old_position_num - 0 + (buy_volume[finished_order] - 0);

        let position_average = symbol_trade_situation.position_average;
        if (position_num) {
          position_average = position_cost / position_num;
        }
        app.redis.hset(
          redis_key,
          `order_${finished_order - 0 + 1}_${order_id}`,
          JSON.stringify(order_detail_res)
        );
        const tradeErrorMsg = '';
        const tradeErrorCode = '';
        const isTradeError = 0;
        // 获取当前持仓均价,持仓费用,持仓数量
        app.redis.hset(redis_key, 'position_average', position_average);
        app.redis.hset(redis_key, 'position_cost', position_cost);
        app.redis.hset(redis_key, 'position_num', position_num);
        app.redis.hset(redis_key, 'tradeErrorMsg', tradeErrorMsg);
        app.redis.hset(redis_key, 'tradeErrorCode', tradeErrorCode);
        app.redis.hset(redis_key, 'isTradeError', isTradeError);
        // 首单价格
        if (first_order_price) {
          app.redis.hset(redis_key, 'first_order_price', first_order_price);
        }
        await app.redis.hdel('huobi-not-finished-buy-order', redis_key);
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);

        const send2InternalEggData = {
          signId,
          symbol,
          currency_id,
          secret,
          currency: quote_currency,
          quote_currency_id,
          tradePlatformApiBindProductComboId,
          robotId,
          position_average,
          position_cost,
          position_num,
          key: redis_key,
          userId,
          isTradeError, // 交易出错 1是0否
          tradeErrorMsg,
          tradeErrorCode,
          finished_order: finished_order - 0 + 1,
          plantFormName: 'huobi',
          type: 'updateSymbolTradeInfo',
          mqType: 'mqtt-tradeInfo', // 交易信息类型
        };
        const deep_bids = await app.redis.hget(
          'huobi-symbol-deep-bids-list',
          symbol
        );
        try {
          // TODO 计算实时收益比
          const real_time_earning_ratio = await ctx.service.formula.realTimeEarningRatio(
            {
              deep_bids: JSON.parse(deep_bids),
              // buy_price,
              positionNum: position_num,
              positionCost: position_cost,
            }
          );
          console.log('real_time_earning_ratio', real_time_earning_ratio);
          if (real_time_earning_ratio) {
            send2InternalEggData.real_time_earning_ratio = real_time_earning_ratio;
            // node 算的收益比
            app.redis.hset(
              redis_key,
              'node_calc_real_time_earning_ratio',
              real_time_earning_ratio
            );
          }
        } catch (e) {
          console.log('real_time_earning_ratio err', e);
        }
        ctx.service.mq.internalWithExternal.emit(send2InternalEggData);
      } else {
        console.log('该订单未完成或还没有订单组id', redis_key, order_id);
        // 将该订单信息暂存,
        app.redis.hset(
          'huobi-not-finished-buy-order',
          redis_key,
          JSON.stringify({
            order_id,
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }
  /*
  @author:fsg
  @time:2019-07-05 18:54:32
  @params
  account_id: @required
  symbol: @required
  type:订单类型，基本是sell-limit 包括 sell-market, sell-limit,  sell-ioc,  sell-limit-maker  @required
  amount: 订单交易量 @required
  price:
  source:  现货交易填写“api”，杠杆交易填写“margin-api”
  @description:卖出  '/v1/order/orders/place'
  */
  async sell(body) {
    const { ctx, app } = this;
    console.log('enter sell  ====== ', new Date());
    const errors_2 = app.validator.validate(
      {
        symbol: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        signId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors_2) {
      ctx.service.handleErrors.throw_error([ errors_2 ]);
    }
    //  real_time_earning_ratio 在清仓时没有
    //  sellPrice 在ai止盈时没有
    let { symbol, signId, real_time_earning_ratio, sellPrice } = body;
    const redis_key = `trade-condition_${signId}_${symbol}`;
    const java_key = `trade-java_${signId}_${symbol}`;
    if (!real_time_earning_ratio) {
      real_time_earning_ratio = await app.redis.hget(
        java_key,
        'real_time_earning_ratio'
      );
    }
    let sellType;
    if (!body.sellType) {
      sellType = 'AI_sell';
    } else {
      sellType = body.sellType;
      console.log(
        '==================清仓============================',
        symbol,
        new Date()
      );
    }
    // 货币对交易情况
    const symbol_trade_situation = await app.redis.hgetall(redis_key);
    try {
      const { accessKey, secretKey } = await ctx.service.secret.decryptSecret(
        symbol_trade_situation.secret
      );

      // 取该货币对最新报价 现价
      if (!sellPrice) {
        sellPrice = (
          await ctx.service.commonApi.latestOpenPrice({
            symbol,
            type: 'sell',
          })
        ).sell;
        console.log('no sellPrice', sellPrice, redis_key);
      }
      if (!sellPrice) {
        console.log('=====no sellPrice', sellPrice, redis_key);
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      const {
        position_num, // 持仓数量
        account_id,
        coinPairChoiceId,
        symbol_id,
        amount_precision, // 交易对基础币种计数精度
        price_precision, // 交易对报价的精度
        is_set_stop_profit_trade, // 是否设置止盈后停止
        robotId,
        quote_currency_id,
        userId,
        quote_currency,
        currency_id,
        secret,
        tradePlatformApiBindProductComboId,
      } = symbol_trade_situation;
      // 委托价格= 最新卖价(现价)*0.98 TODO 暂时保留4位小数 @fsg 系数暂时设高点 8.26
      const trust_price = (sellPrice * 0.98).toFixed(price_precision);
      // 卖出的数量 持仓数量*系数
      const sell_amount = (position_num * (1 - 0.002 * 2)).toFixed(
        amount_precision
      );
      // console.log('卖出的数量--', sell_amount);
      const p = {
        accessKey,
        secretKey,
        symbol,
        price: trust_price,
        amount: sell_amount,
        type: 'sell-limit',
        account_id,
      };
      const proxyIp = (
        await ctx.service.ip.getIp({
          robotId,
        })
      ).address;

      const order_id = await ctx.service.huobiSdk
        .order_place({
          query: p,
          proxyIp,
        })
        .then(filterHuobiResponse);
      console.log('sell 提交到火币的参数', JSON.stringify(p), '卖出', order_id);

      if (!order_id) {
        app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }
      const order_detail_res = await this.order({
        query: {
          accessKey,
          secretKey,
          robotId,
        },
        params: { order_id },
      });
      // console.log('订单详情', order_detail_res);
      if (!order_detail_res) {
        console.log(`查询卖出单号明细${order_id} error ===>`, order_detail_res);
        await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
        return;
      }

      // 将order_ 开始的key都删掉
      Object.keys(symbol_trade_situation).forEach(item => {
        if (item.startsWith('order_')) {
          app.redis.hdel(redis_key, item);
        }
      });
      console.log('卖出成功------>', redis_key, '单号：', order_id);

      // 重置
      app.redis.hset(redis_key, 'isNeedRecordMaxRiskBenefitRatio', '0');
      app.redis.hset(redis_key, 'finished_order', 0);
      app.redis.hset(redis_key, 'isFollowBuild', '0');
      app.redis.hset(redis_key, 'position_cost', '0');
      app.redis.hset(redis_key, 'position_num', '0');
      app.redis.hset(redis_key, 'first_order_price', 0);
      app.redis.hset(redis_key, 'position_average', '0');
      app.redis.hset(redis_key, 'min_averagePrice', 0);
      app.redis.hdel(redis_key, 'history_max_riskBenefitRatio');
      app.redis.hset(redis_key, 'isTradeError', 0);
      // 删除订单组id
      app.redis.hdel(redis_key, 'cur_groupId');
      app.redis.hdel(redis_key, 'tradeErrorMsg');
      app.redis.hdel(redis_key, 'tradeErrorCode');

      await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
      console.log(
        '卖出成功',
        redis_key,
        '分数是：===',
        await app.redis.zscore(`${symbol}_zset`, redis_key)
      );
      app.redis.del(java_key);
      await app.redis.hset(
        'huobi-not-finished-sell-order',
        redis_key,
        JSON.stringify({
          order_id,
          redis_value: symbol_trade_situation,
          sellType,
          real_time_earning_ratio,
        })
      );
      setTimeout(() => {
        this.changeNotTotalSellOrder({
          redis_key,
          order_id,
          sellType,
          redis_value: symbol_trade_situation,
          real_time_earning_ratio,
        });
      }, 1000 * 3);
      // 发mq到国内egg
      // TODO test环境暂时不发到mqtt
      const send2InternalEggData = {
        signId,
        symbol,
        currency_id,
        quote_currency_id,
        secret,
        currency: quote_currency,
        tradePlatformApiBindProductComboId,
        robotId,
        userId,
        position_average: '0',
        position_cost: '0',
        position_num: '0',
        key: redis_key,
        finished_order: '0',
        isFollowBuild: '0',
        real_time_earning_ratio: '0',
        min_averagePrice: '0',
        history_max_riskBenefitRatio: '0',
        plantFormName: 'huobi',
        type: 'updateSymbolTradeInfo',
        mqType: 'mqtt-tradeInfo', // 交易信息类型
      };
      // 启用止盈后停止,完全停止交易，
      if (is_set_stop_profit_trade - 0 === 1) {
        // 不可以继续交易
        app.redis.hset(redis_key, 'trade_status', '0');
        app.redis.zadd(`${symbol}_zset`, 0, redis_key);
        // send2InternalEggData = {
        // ...send2InternalEggData,
        send2InternalEggData.trade_status = '0';
        send2InternalEggData.is_set_stop_profit_trade = '0';
        // };
        // TODO 提交java 停止买入 @fsg 2019.08.28
        ctx.service.mq.internalWithExternal.emit({
          mqType: 'mqtt-stopProfit', // 止盈类型
          symbol_id,
          coinPairChoiceId,
          userId,
          tradePlatformApiBindProductComboId,
        });
      }
      ctx.service.mq.internalWithExternal.emit(send2InternalEggData);
      // 清仓也停止
      if (sellType === 'clear') {
        // 不可以继续交易
        app.redis.hset(redis_key, 'trade_status', '0');
        app.redis.zadd(`${symbol}_zset`, 0, redis_key);
        console.log('clear success--------------', symbol);
        return {
          data: 1,
          msg: 'success',
        };
      }
    } catch (e) {
      await app.redis.zadd(`${symbol}_zset`, 1, redis_key);
      console.log(
        '卖出失败',
        e.name,
        e.message,
        redis_key,
        '分数是：===',
        await app.redis.zscore(`${symbol}_zset`, redis_key)
      );
      const tradeErrorMsg = HUOBI_ERRORS[e.name];
      const tradeErrorCode = e.name;
      const isTradeError = 1;
      // 判断错误数据 是否已在当前redis数据，如有则不发消息
      const cur_tradeErrorMsg = symbol_trade_situation.tradeErrorMsg;
      const cur_tradeErrorCode = symbol_trade_situation.tradeErrorCode;
      const cur_isTradeError = symbol_trade_situation.isTradeError;

      if (
        cur_tradeErrorMsg === tradeErrorMsg &&
        cur_tradeErrorCode === tradeErrorCode &&
        cur_isTradeError - 0 === isTradeError
      ) {
        return;
      }
      if (Reflect.has(HUOBI_ERRORS, tradeErrorCode)) {
        const d = {
          msg: tradeErrorMsg,
          code: tradeErrorCode,
          signId,
          symbol,
        };
        ctx.service.huobi.sendError2Mq(d);

        const send2InternalEggData = {
          signId,
          symbol,
          key: redis_key,
          isTradeError, // 交易出错 1是0否
          tradeErrorMsg,
          tradeErrorCode,
          plantFormName: 'huobi',
          type: 'updateSymbolTradeInfo',
          mqType: 'mqtt-tradeInfo', // 交易信息类型
        };
        ctx.service.mq.internalWithExternal.emit(send2InternalEggData);
        app.redis.hset(redis_key, 'tradeErrorMsg', tradeErrorMsg);
        app.redis.hset(redis_key, 'tradeErrorCode', tradeErrorCode);
        app.redis.hset(redis_key, 'isTradeError', isTradeError);
      }
      ctx.service.handleErrors.throw_error(e);
    }
  }
  async changeNotTotalSellOrder({
    redis_key,
    order_id,
    sellType,
    redis_value,
    real_time_earning_ratio,
  }) {
    const { app, ctx } = this;
    const {
      secret,
      signId,
      coinPairChoiceId,
      finished_order,
      cur_groupId,
      symbol,
      position_cost,
      emit_ratio,
      robotId,
    } = redis_value;
    const { accessKey, secretKey } = await ctx.service.secret.decryptSecret(
      secret
    );
    const order_detail_res = await this.order({
      query: {
        accessKey,
        secretKey,
        robotId,
      },
      params: { order_id },
    });
    if (order_detail_res.state === 'filled') {
      const {
        field_cash_amount,
        createdAt,
        field_amount,
        field_fees,
      } = order_detail_res;
      if (cur_groupId) {
        // TODO 本轮卖出盈利 = 卖出费用 - 手续费  -持仓费用
        const sellProfit =
          field_cash_amount - 0 - (field_fees - 0) - (position_cost - 0);
        // TODO 额外收益=实际获得的计价货币数量-持仓费用*（100%+触发比例）
        const extraProfit =
          field_cash_amount - 0 - (position_cost - 0) * (1 + (emit_ratio - 0));
        const sendOrderData = {
          name: cur_groupId,
          finished_order,
          endProfitRatio: real_time_earning_ratio, // 结单收益比
          isEnd: 1, // 是否结单 0:否 1:是
          tradeType: sellType === 'clear' ? 3 : 2, // 结单方式。1 ：AI整体止盈 | 2：清仓卖出 | 3:忘记订单
          createdAt: formatTime(createdAt),
          sellProfit,
          extraProfit: extraProfit > 0 ? extraProfit : 0, // 如果额外收益小于0
          tradeAveragePrice: (field_cash_amount - 0) / (field_amount - 0), // 交易均价
          tradeNumbers: field_amount - 0,
          tradeCost: field_cash_amount - 0,
          // 额外订单组信息
          coinPairChoiceId,
          endType: sellType === 'clear' ? 2 : 1, // 结单方式。1 ：AI整体止盈 | 2：清仓卖出 | 3:忘记订单
          sign: 1,
        };
        ctx.service.mq.order.orderGroup({
          orderGroupData: sendOrderData,
          redis_key,
          redis_table: 'huobi-not-finished-sell-order',
        });
      }
    } else {
      console.log('该订单未完成', order_id);
      // 将该订单信息暂存,
      await app.redis.hset(
        'huobi-not-finished-sell-order',
        redis_key,
        JSON.stringify({
          order_id,
          redis_value,
          sellType,
          real_time_earning_ratio,
        })
      );
    }
  }
}

module.exports = HuobiService;
