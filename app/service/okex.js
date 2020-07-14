'use strict';

const Service = require('egg').Service;
const { gendGroupId, getFloatNum, formatTime } = require('../utils/tool');
const moment = require('moment');
const { OKEX_ERRORS } = require('../utils/okexErrors');
class OkexService extends Service {
  sendError2Mq(data) {
    const { ctx } = this;
    ctx.service.mq.internalWithExternal.emit({
      ...data,
      plantFormName: 'okex',
      type: 'tradeError',
      mqType: 'mqtt-tradeError', // 交易信息类型
    });
  }
  // 查询用户的所有账户状态
  async account({ body }) {
    const { ctx, app } = this;
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
        passphrase: {
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
    return this.ctx.service.okexSdk.account({ body });
  }
  // 查询用户的单个货币账户状态
  async currency_account({ body, params }) {
    const { ctx, app } = this;
    // ctx.logger.error('body', body);
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
        passphrase: {
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
    const errors_2 = app.validator.validate(
      {
        currency: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
      },
      params
    );
    if (errors_2) {
      ctx.service.handleErrors.throw_error(errors_2);
    }
    return this.ctx.service.okexSdk.currency_account({ body, params });
  }
  // 订单详情信息
  async order({ body, query }) {
    const { ctx, app } = this;
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
        passphrase: {
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
    const errors_2 = app.validator.validate(
      {
        symbol: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        order_id: {
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
    const res = await this.ctx.service.okexSdk.order({ body, query });
    // filled_notional  已成交金额
    // filled_size  已成交数量
    return {
      ...res,
      field_cash_amount: res.filled_notional,
      field_amount: res.filled_size,
      createdAt: res.created_at,
      trade_price: res.price_avg,
    };
  }
  async buy(body) {
    const { ctx, app } = this;
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
    const { symbol, signId } = body;
    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    // 货币对交易情况
    const symbol_trade_situation = await app.redis.hgetall(redis_key);
    try {
      const receive_finished_order = body.finished_order;
      console.log(
        '进入买入方法-----------------------',
        signId,
        symbol,
        receive_finished_order
      );
      // 存在未交易成功。还处于挂单状态的买单
      const isHaveNotFinishedBuyOrder = await app.redis.hget(
        'okex-not-finished-buy-order',
        redis_key
      );
      if (isHaveNotFinishedBuyOrder) {
        app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
        return;
      }
      // 存在未交易成功。还处于挂单状态的卖单
      const isHaveNotFinishedSellOrder = await app.redis.hget(
        'okex-not-finished-sell-order',
        redis_key
      );
      if (isHaveNotFinishedSellOrder) {
        app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
        return;
      }

      const {
        accessKey,
        secretKey,
        passphrase,
      } = await ctx.service.secret.decryptSecret(symbol_trade_situation.secret);
      const body_1 = {
        accessKey,
        secretKey,
        passphrase,
        // robotId: symbol_trade_situation.robotId,
      };
      // ctx.logger.error('body_1', body_1);
      // 如果收到的已完成单数小于redis中已完成单数，则不处理
      if (
        receive_finished_order -
          0 -
          (symbol_trade_situation.finished_order - 0) <
        0
      ) {
        ctx.logger.error(
          `收到的已完成单数${receive_finished_order}小于redis中已完成单数${symbol_trade_situation.finished_order}`,
          signId,
          symbol,
          receive_finished_order
        );
        app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
        return;
      }
      // 取该货币对最新报价 现价
      const openPrice = (
        await ctx.service.commonApi.latestOpenPrice({
          symbol,
          type: 'buy',
        })
      ).buy;
      if (!openPrice) {
        app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
        return;
      }
      // redis中存储的交易倍数和策略数列以及已经买入的单数（setting时设置的）
      let {
        userId,
        coinPairChoiceId,
        finished_order,
        // max_trade_order,
        buy_volume,
        // account_id,
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
      ctx.logger.error('交易对报价的精度', price_precision);

      // 委托价格= 最新卖价(现价)*1.02 TODO 暂时保留4位小数 @fsg 08.26
      const trust_price = (openPrice * 1.02).toFixed(
        getFloatNum(price_precision)
      );
      // 买入量
      if (finished_order - 0 === 0) {
        // try {
        // 第一次买入时候
        // 读取卖价前10深度（卖1价~卖10价）
        const deepTotal = await ctx.service.commonApi.getDeepTotal({
          symbol,
          length: 10,
          type: 'buy',
        });

        if (deepTotal < buy_volume[0]) {
          app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
          ctx.logger.error('前十深度之和', deepTotal);
          ctx.logger.error('首单买入量', buy_volume[0]);
          ctx.logger.error('买入量', buy_volume);
          ctx.logger.error(
            '深度之和小于首单买入量',
            signId,
            symbol,
            receive_finished_order
          );
          return;
        }
        // ctx.logger.error('委托价格---', trust_price);
        // 达到买入条件
        const p = {
          ...body_1,
          side: 'buy',
          instrument_id: symbol,
          size: buy_volume[0],
          price: trust_price,
        };
        console.log('提交到okex的参数--', JSON.stringify(p));
        const { order_id } = await ctx.service.okexSdk.order_place({
          body: p,
        });
        // .then(filterOkexResponse);
        console.log('买入第一单', order_id);

        if (!order_id) {
          ctx.logger.error(
            '买入第一单 error',
            order_id,
            signId,
            symbol,
            receive_finished_order
          );
          app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
          return;
        }
        // TODO
        const groupId = gendGroupId(userId, coinPairChoiceId);
        // 当前交易组id
        await app.redis.hset(redis_key, 'cur_groupId', groupId);
        // 将该订单信息暂存,
        await app.redis.hset(
          'okex-not-finished-buy-order',
          redis_key,
          JSON.stringify({
            order_id,
          })
        );
        setTimeout(() => {
          this.changeTradeInfo({
            redis_key,
            order_id,
            first_order_price: openPrice,
          });
        }, 1000 * 3);
        return;
      }
      // try {
      // 达到买入条件
      // 委托下单
      const { order_id } = await ctx.service.okexSdk.order_place({
        body: {
          ...body_1,
          side: 'buy',
          instrument_id: symbol,
          size: buy_volume[finished_order],
          price: trust_price,
        },
      });
      // .then(filterOkexResponse);
      ctx.logger.error(`买入第${finished_order - 0 + 1}单`, order_id);

      if (!order_id) {
        ctx.logger.error(
          `买入第${finished_order - 0 + 1}单 error`,
          order_id,
          signId,
          symbol,
          receive_finished_order
        );
        app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
        return;
      }
      // 将该订单信息暂存,
      await app.redis.hset('okex-not-finished-buy-order', redis_key, order_id);
      // 延迟3秒获取订单信息
      setTimeout(() => {
        this.changeTradeInfo({
          redis_key,
          order_id,
        });
      }, 1000 * 3);
    } catch (e) {
      console.log('buy e', e);
      const tradeErrorMsg = OKEX_ERRORS[e.name] || e.message;
      const tradeErrorCode = e.name;
      const isTradeError = 1;
      // 判断错误数据 是否已在当前redis数据，如有则不发消息
      const cur_tradeErrorMsg = symbol_trade_situation.tradeErrorMsg;
      const cur_tradeErrorCode = symbol_trade_situation.tradeErrorCode;
      const cur_isTradeError = symbol_trade_situation.isTradeError;
      app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
      if (
        cur_tradeErrorMsg === tradeErrorMsg &&
        cur_tradeErrorCode === tradeErrorCode &&
        cur_isTradeError - 0 === isTradeError
      ) {
        return;
      }
      if (Reflect.has(OKEX_ERRORS, tradeErrorCode)) {
        const d = {
          msg: tradeErrorMsg,
          code: tradeErrorCode,
          signId,
          symbol,
        };
        ctx.service.okex.sendError2Mq(d);

        const send2InternalEggData = {
          signId,
          symbol,
          key: redis_key,
          isTradeError, // 交易出错 1是0否
          tradeErrorMsg,
          tradeErrorCode,
          plantFormName: 'okex',
          type: 'updateSymbolTradeInfo',
          mqType: 'mqtt-tradeInfo', // 交易信息类型
        };
        ctx.service.mq.internalWithExternal.emit(send2InternalEggData);
        app.redis.hset(redis_key, 'tradeErrorMsg', tradeErrorMsg);
        app.redis.hset(redis_key, 'tradeErrorCode', tradeErrorCode);
        app.redis.hset(redis_key, 'isTradeError', isTradeError);
      }
      ctx.logger.error(e);
      // ctx.service.handleErrors.throw_error([e]);
    }
  }
  // 处理未完成的订单
  async changeTradeInfo({ redis_key, order_id, first_order_price = null }) {
    const { app, ctx } = this;
    ctx.logger.error('changeTradeInfo');
    const isHaveNotFinishedOrder = await app.redis.hget(
      'okex-not-finished-buy-order',
      redis_key
    );
    if (!isHaveNotFinishedOrder) {
      ctx.logger.error('未完成订单集已没有此单', redis_key);
      return;
    }
    const symbol_trade_situation = await app.redis.hgetall(redis_key);
    // ctx.logger.error('未完成订单集还存在此单===', redis_key);

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
      symbol,
      quote_currency,
      quote_currency_id,
      currency_id,
      tradePlatformApiBindProductComboId,
    } = symbol_trade_situation;
    if (typeof buy_volume !== 'object') {
      buy_volume = JSON.parse(buy_volume);
    }
    if (theoreticalBuildPriceMap) {
      theoreticalBuildPriceMap = JSON.parse(theoreticalBuildPriceMap);
    }
    const {
      accessKey,
      secretKey,
      passphrase,
    } = await ctx.service.secret.decryptSecret(secret);
    // ctx.logger.error(accessKey,
    //   secretKey,
    //   passphrase);
    const order_detail_res = await this.order({
      body: {
        accessKey,
        secretKey,
        passphrase,
      },
      query: { order_id, symbol },
    });
    ctx.logger.error('订单详情', order_detail_res);
    // 该订单完全成交且有新的订单组id
    if (order_detail_res.state - 0 === 2) {
      const {
        filled_notional,
        createdAt,
        trade_price,
        field_amount,
      } = order_detail_res;
      // 理论建仓价 TODO
      let theoreticalBuildPrice = 0;
      // 收益比
      // ctx.logger.error('理论建仓价', theoreticalBuildPriceMap);
      if (theoreticalBuildPriceMap) {
        // 实际建仓价
        theoreticalBuildPrice =
          theoreticalBuildPriceMap[finished_order - 0 + 1] - 0;
      }
      // ctx.logger.error('实际建仓价', theoreticalBuildPrice);
      // ctx.logger.error('收益比', profitRatio);
      let sendOrderData = {
        name: cur_groupId,
        finished_order,
        theoreticalBuildPrice,
        profitRatio: 0,
        tradeAveragePrice: trade_price,
        tradeNumbers: field_amount - 0, // 交易数量
        tradeCost: filled_notional - 0, // 交易费用
        tradeType: 1, // 1 ：AI建仓 | 2：AI整体止盈 | 3:手动清仓
        createdAt: moment(createdAt)
          .utcOffset(8)
          .format('YYYY-MM-DD HH:mm:ss'),
        sign: 2, // 只发订单信息 不需要订单组信息
      };
      // 首单 需要加创建订单组信息
      if (sendOrderData.finished_order - 0 === 0) {
        sendOrderData = {
          ...sendOrderData,
          plantFormName: 'okex',
          coinPairChoiceId,
          orderId: order_id,
          isEnd: 0,
          sign: 1, // 订单与订单组信息合在一起
        };
      }
      ctx.service.mq.order.orderGroup({
        orderGroupData: sendOrderData,
        redis_key,
        redis_table: 'okex-not-finished-buy-order',
      });
      ctx.logger.error(
        `第${finished_order -
          0 +
          1}单的成交总金额为${filled_notional},单号为${order_id}`
      );
      // 成功下单则redis中对应的已买入订单数量要+1
      await app.redis.hset(redis_key, 'finished_order', finished_order - 0 + 1);
      // 获取当前持仓均价,持仓费用,持仓数量
      // 成功买入 查询该订单详情 将费用和数量假如到持仓总费用和持仓总数量
      const old_position_cost = symbol_trade_situation.position_cost;
      const old_position_num = symbol_trade_situation.position_num;
      const position_cost = old_position_cost - 0 + (filled_notional - 0);
      ctx.logger.error(
        `原redis持仓费用${old_position_cost} ,累加后第${finished_order -
          0 +
          1}单的持仓费用${position_cost}`
      );
      // 持仓数量改从数列获取累加 @ 2019.9.25
      const position_num =
        old_position_num - 0 + (buy_volume[finished_order] - 0);

      let position_average = symbol_trade_situation.position_average;
      // ctx.logger.error('position_num', position_num);
      if (position_num) {
        position_average = position_cost / position_num;
        // ctx.logger.error('position_average', position_average);
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
      await app.redis.hdel('okex-not-finished-buy-order', redis_key);
      await app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
      // TODO test环境暂时不发到mqtt
      const send2InternalEggData = {
        signId,
        symbol,
        currency_id,
        secret,
        currency: quote_currency,
        quote_currency_id,
        tradePlatformApiBindProductComboId,
        position_average,
        position_cost,
        position_num,
        userId,
        key: redis_key,
        isTradeError, // 交易出错 1是0否
        tradeErrorMsg,
        tradeErrorCode,
        finished_order: finished_order - 0 + 1,
        plantFormName: 'okex',
        type: 'updateSymbolTradeInfo',
        mqType: 'mqtt-tradeInfo', // 交易信息类型
      };
      const deep_bids = await app.redis.hget(
        'okex-symbol-deep-bids-list',
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
        ctx.logger.error('real_time_earning_ratio', real_time_earning_ratio);
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
        ctx.logger.error('real_time_earning_ratio err', e);
      }
      ctx.service.mq.internalWithExternal.emit(send2InternalEggData);
    } else {
      ctx.logger.error('该订单未完成或还没有订单组id', redis_key, order_id);
      // 将该订单信息暂存,
      await app.redis.hset(
        'okex-not-finished-buy-order',
        redis_key,
        JSON.stringify({
          order_id,
        })
      );
    }
  }
  async sell(body) {
    const { ctx, app } = this;
    // console.log('enter sell  ====== ', body);
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
    let { symbol, signId, real_time_earning_ratio } = body;
    if (!real_time_earning_ratio) {
      const java_key = `okex-trade-java_${signId}_${symbol}`;
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
      console.log('==================清仓============================');
    }
    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    // 货币对交易情况
    const symbol_trade_situation = await app.redis.hgetall(redis_key);
    try {
      // ctx.logger.error('secret', symbol_trade_situation.secret);
      const {
        accessKey,
        secretKey,
        passphrase,
      } = await ctx.service.secret.decryptSecret(symbol_trade_situation.secret);
      // 取该货币对最新报价 现价
      const openPrice = (
        await ctx.service.commonApi.latestOpenPrice({
          symbol,
          type: 'sell',
        })
      ).sell;
      const {
        position_num, // 持仓数量
        coinPairChoiceId,
        amount_precision, // 交易对基础币种计数精度
        price_precision, // 交易对报价的精度
        is_set_stop_profit_trade, // 是否设置止盈后停止
        symbol_id,
        userId,
        quote_currency,
        quote_currency_id,
        currency_id,
        secret,
        tradePlatformApiBindProductComboId,
      } = symbol_trade_situation;
      // 委托价格= 最新卖价(现价)*0.98 TODO 暂时保留4位小数 @fsg 系数暂时设高点 8.26
      // ctx.logger.error('symbol_trade_situation', symbol_trade_situation);
      const trust_price = (openPrice * 0.98).toFixed(
        getFloatNum(price_precision)
      );
      ctx.logger.error('trust_price', trust_price, 'openPrice', openPrice);
      // 卖出的数量 持仓数量*系数
      const sell_amount = (position_num * (1 - 0.002 * 2)).toFixed(
        getFloatNum(amount_precision)
      );
      // ctx.logger.error('sell_amount', sell_amount, 'position_num', position_num);

      // ctx.logger.error('卖出的数量--', sell_amount);
      const p = {
        accessKey,
        secretKey,
        passphrase,
        // symbol,
        side: 'sell',
        price: trust_price,
        instrument_id: symbol,
        size: sell_amount,
      };
      console.log('提交到okex的参数', JSON.stringify(p));
      const sellRes = await ctx.service.okexSdk.order_place({
        body: p,
      });
      // .then(filterOkexResponse);
      const { order_id, result } = sellRes;
      console.log('sell ', sellRes);
      if (!result || !order_id) {
        console.log('卖出 error', sellRes);
        app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
        ctx.service.handleErrors.throw_error(sellRes);
        throw new Error(sellRes);
        // return;
      }
      // 将该订单信息暂存,
      await app.redis.hset(
        'okex-not-finished-sell-order',
        redis_key,
        JSON.stringify({
          order_id,
          sellType,
          redis_value: symbol_trade_situation,
          real_time_earning_ratio,
        })
      );
      // 将order_ 开始的key都删掉
      Object.keys(symbol_trade_situation).forEach(item => {
        if (item.startsWith('order_')) {
          app.redis.hdel(redis_key, item);
        }
      });
      // TODO 查询卖出的单号的详情,计算收益率 存到redis
      ctx.logger.error(`卖出${symbol}`, signId, '单号：', order_id);

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
      app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);

      const java_key = `okex-trade-java_${signId}_${symbol}`;
      app.redis.del(java_key);
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
        plantFormName: 'okex',
        type: 'updateSymbolTradeInfo',
        mqType: 'mqtt-tradeInfo', // 交易信息类型
      };
      // 启用止盈后停止,完全停止交易
      if (is_set_stop_profit_trade - 0 === 1) {
        // 不可以继续交易
        app.redis.hset(redis_key, 'trade_status', '0');
        app.redis.zadd(`okex_${symbol}_zset`, 0, redis_key);
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
        app.redis.zadd(`okex_${symbol}_zset`, 0, redis_key);
        return {
          data: 1,
          msg: 'success',
        };
      }
    } catch (e) {
      console.log('sell e', e);
      const tradeErrorMsg = OKEX_ERRORS[e.name] || e.message;
      const tradeErrorCode = e.name;
      const isTradeError = 1;
      // 判断错误数据 是否已在当前redis数据，如有则不发消息
      const cur_tradeErrorMsg = symbol_trade_situation.tradeErrorMsg;
      const cur_tradeErrorCode = symbol_trade_situation.tradeErrorCode;
      const cur_isTradeError = symbol_trade_situation.isTradeError;
      app.redis.zadd(`okex_${symbol}_zset`, 1, redis_key);
      if (
        cur_tradeErrorMsg === tradeErrorMsg &&
        cur_tradeErrorCode === tradeErrorCode &&
        cur_isTradeError - 0 === isTradeError
      ) {
        return;
      }
      if (Reflect.has(OKEX_ERRORS, tradeErrorCode)) {
        const d = {
          msg: tradeErrorMsg,
          code: tradeErrorCode,
          signId,
          symbol,
        };
        ctx.service.okex.sendError2Mq(d);

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
      ctx.logger.error('error', e.message, e.name, signId, symbol);
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
    } = redis_value;
    const {
      accessKey,
      secretKey,
      passphrase,
    } = await ctx.service.secret.decryptSecret(secret);
    const order_detail_res = await this.order({
      body: {
        accessKey,
        secretKey,
        passphrase,
      },
      query: { order_id, symbol },
    });
    // ctx.logger.error('订单详情', order_detail_res);
    if (order_detail_res.state - 0 === 2) {
      const order_detail_res = await this.order({
        body: {
          accessKey,
          secretKey,
          passphrase,
        },
        query: { order_id, symbol },
      });
      const {
        field_cash_amount,
        createdAt,
        trade_price,
        field_amount,
        field_fees,
      } = order_detail_res;
      // ctx.logger.error('订单详情', order_detail_res);
      // TODO 本轮卖出盈利 = 卖出费用 - 手续费  -持仓费用
      const sellProfit =
        field_cash_amount -
        0 -
        (field_fees ? field_fees : 0 - 0) -
        (position_cost - 0);
      // TODO 额外收益=实际获得的计价货币数量-持仓费用*（100%+触发比例）
      const extraProfit =
        field_cash_amount - 0 - (position_cost - 0) * (1 + (emit_ratio - 0));

      const sendOrderData = {
        name: cur_groupId,
        finished_order,
        endProfitRatio: real_time_earning_ratio, // 结单收益比
        isEnd: 1, // 是否结单 0:否 1:是
        createdAt: moment(createdAt)
          .utcOffset(8)
          .format('YYYY-MM-DD HH:mm:ss'),
        tradeType: sellType === 'clear' ? 3 : 2, // 结单方式。1 ：AI整体止盈 | 2：清仓卖出 | 3:忘记订单
        sellProfit,
        extraProfit: extraProfit > 0 ? extraProfit : 0, // 如果额外收益小于0
        tradeAveragePrice: trade_price,
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
        redis_table: 'okex-not-finished-sell-order',
      });
    } else {
      ctx.logger.error('该订单未完成', order_id);
      // 将该订单信息暂存,
      await app.redis.hset(
        'okex-not-finished-sell-order',
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
module.exports = OkexService;
