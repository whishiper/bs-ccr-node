'use strict';

const Service = require('egg').Service;
const { stringify } = require('qs');
const {
  floatAdd,
  formatTime,
  hashSet,
  filterOkexResponse,
  filterJavaResponse,
  guid,
  isJSON,
  deepCopy,
} = require('../utils/tool');
const { redisRule } = require('../utils/model');

// const fs = require('fs');

/*
@author:fsg
@time:2019-07-02 15:55:08
@params
@description:
*/
// key `okex-trade-condition_${signId}_${symbol}` 每个用户每个货币对的交易情况
class CcrOkexService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化handleErrors，保持单例
    this.handleErrors = ctx.service.handleErrors;

    this.aliyunApiGateway = ctx.service.aliyunApiGateway;
  }
  /*
  @author:fsg
  @time:2019-11-21 18:40:49
  @params
  @description:处理货币对的 etc :OKB-ETH => okbeth
  */
  formatSymbol(symbol) {
    return symbol
      .split('-')
      .join('')
      .toLocaleLowerCase();
  }
  /*
  @author:fsg
  @time:2019-11-21 17:43:11
  @params
  @description: 转为okex格式 okbeth ==>  OKB-ETH
  */
  async formatSymbol2OkextType(symbol, custom_set_token = null) {
    const { ctx, app } = this;
    const res = await ctx.service.aliyunApiGateway
      .index(
        `/coin_pair_coin/base_coin?coinPairName=${symbol}`,
        'get',
        'default_handle_result',
        {},
        custom_set_token
      )
      .then(res => filterJavaResponse(ctx, res))
      .then(res => res.data);
    const { valuationCoinName, baseCoinName } = res;
    const obj = {
      formatOKexSymbol: `${baseCoinName}-${valuationCoinName}`.toLocaleUpperCase(),
      upper_base_currency: baseCoinName.toLocaleUpperCase(),
      upper_quato_currency: valuationCoinName.toLocaleUpperCase(),
    };
    return obj;
  }
  async delete_api(query) {
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        id: {
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
      this.handleErrors.throw_error(errors);
    }
    const { id } = query;
    const delRes = await ctx.service.aliyunApiGateway
      .delete(`/trade_platform_api/${id}`)
      .then(res => filterJavaResponse(ctx, res));
    if (!delRes) {
      return;
    }
    // app
    //   .curl(`${app.config.okexServer.url}/delKeysByKeyword`, {
    //     method: 'POST',
    //     dataType: 'json',
    //     data: {
    //       keyword: `okex-trade-condition_${signId}`,
    //     },
    //   })
    //   .then(res => res.data);
    return delRes;
  }
  /*
  @author:fsg
  @time:2020-02-27 13:00:30
  @params
  @description:解绑
  */
  async remove_api(query) {
    const { ctx, app } = this;
    const { tradePlatformApiBindProductComboId } = query;
    // ctx.logger.error('okex remove_api query======', query);
    const errors = app.validator.validate(
      {
        // sign: {
        //   required: true,
        //   type: 'string',
        //   max: 1000,
        //   min: 1
        // },
        tradePlatformApiBindProductComboId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        // id: {
        //   required: true,
        //   type: 'string',
        //   max: 100,
        //   min: 1
        // },
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
    const res = await ctx.service.aliyunApiGateway
      .delete(
        `/trade_platform_api_bind_product_combo/${tradePlatformApiBindProductComboId}`
      )
      .then(res => filterJavaResponse(ctx, res));
    // ctx.logger.error('okex del trade_platform_api_bind_product_combo', res);
    return res;
  }
  /*
  @author:fsg
  @time:2019-10-15 21:28:06
  @params
  @description:
  */
  async bind_api(query) {
    const { ctx, app } = this;
    // ctx.logger.error('okex bind_api query======', query);
    const errors = app.validator.validate(
      {
        sign: {
          required: true,
          type: 'string',
          max: 1000,
          min: 1,
        },
        secret: {
          required: true,
          type: 'string',
          max: 1000,
          min: 1,
        },
        tradePlatformApiId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        userProductComboId: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        // id: {
        //   required: true,
        //   type: 'string',
        //   max: 100,
        //   min: 1
        // },
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
    const { tradePlatformApiId, userProductComboId, sign, secret } = query;
    const res = await this.aliyunApiGateway
      .post(
        `/trade_platform_api_bind_product_combo/binding?tradePlatformApiId=${tradePlatformApiId}&userProductComboId=${userProductComboId}`
      )
      .then(res => filterJavaResponse(ctx, res));
    // ctx.logger.error('okex trade_platform_api_bind_product_combo/binding', res);
    // TODO 将 redis 中okex-trade-condition_${spotInfo.id}_*中的secret都替换成当前secret @fsg 2020.3.30
    app
      .curl(`${app.config.okexServer.url}/replaceSecretByKeyword`, {
        method: 'POST',
        dataType: 'json',
        data: {
          keyword: `okex-trade-condition_${sign}`,
          secret,
        },
      })
      .then(res => res.data);
    return res;
  }
  /*
  @author:fsg
  @time:2019-08-30 15:01:33
  @params
  @description: ok
  */
  async verify_api(query) {
    const { ctx, app } = this;
    const { secret, id } = query;
    const errors_1 = app.validator.validate(
      {
        sign: {
          required: true,
          type: 'string',
          max: 1000,
          min: 1,
        },
      },
      query
    );

    if (errors_1) {
      ctx.service.handleErrors.throw_error(errors_1);
    }
    const accountRes = await ctx
      .curl(`${app.config.okexServer.url}/verify_okex_api`, {
        method: 'POST',
        dataType: 'json',
        data: {
          secret,
        },
      })
      .then(res => res.data);
    // .then(filterOkexResponse);
    ctx.logger.error('okex accountRes===', accountRes);
    if (
      Reflect.has(accountRes, 'err_code') ||
      Reflect.has(accountRes, 'errors')
    ) {
      const { err_code, errors } = accountRes;
      ctx.logger.error(err_code, errors);
      if ([ 30015, 30013, 30006 ].includes(err_code)) {
        ctx.service.handleErrors.throw_error(errors);
      }
    } else {
      // return accountRes;
      let method;
      if (id) {
        method = 'put';
      } else {
        method = 'post';
      }
      const res = await ctx.service.aliyunApiGateway
        .index('/trade_platform_api/', method, 'default_handle_result', query)
        .then(res => filterJavaResponse(ctx, res));
      return res;
    }
  }
  /*
  @author:fsg
  @time:2019-10-14 21:26:32
  @params
  @description:api列表
  */
  async api_list(query) {
    const { ctx } = this;
    const q = stringify(query);
    const res = await ctx.service.aliyunApiGateway.index(
      `/trade_platform_api/?${q}`,
      'get'
    );
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    for (const item of res.list) {
      const { accessKey } = await ctx.service.secret.decryptSecret(item.secret);
      item.accessKey = accessKey;
      item.secretKey = '';
    }
    return res;
  }
  /*
  @author:fsg
  @time:2019-10-14 21:35:13
  @params
  @description:
  */
  async api_detail(id) {
    const { ctx } = this;
    const res = await ctx.service.aliyunApiGateway.index(
      `/trade_platform_api/${id}`,
      'get'
    );
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    const { accessKey } = await ctx.service.secret.decryptSecret(res.secret);
    res.accessKey = accessKey;
    res.secretKey = '';
    return res;
  }

  /*
  @author:fsg
  @time:2019-11-08 11:12:39
  @params
  @description:获取okex服务器的所有货币对数据
  */
  async get_symbol_map() {
    const { app } = this;
    const flag = await app.redis.get('internal').exists('okex_symbol_map');
    if (flag) {
      return JSON.parse(await app.redis.get('internal').get('okex_symbol_map'));
    }
    const data = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=okex_symbol_map`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    await app.redis
      .get('internal')
      .set('okex_symbol_map', JSON.stringify(data));
    return data;
  }
  async trigger_currency_kline(currency) {
    const { app } = this;
    const res = await app
      .curl(
        `${app.config.okexServer.url}/trigger_currency_kline?currency=${currency}`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    return res;
  }
  /*
    @author:fsg
    @time:2019-07-02 15:58:52
    @params
    @description:筛选 USDT@BTC@ETH@HT@HUSD@EOS 的计价货币 火币
    */
  async currencies() {
    const { app } = this;
    // 需要的计价货币 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos'
    const currencies = [
      {
        name: 'USDT',
        id: 0,
      },
      {
        name: 'BTC',
        id: 1,
      },
      {
        name: 'ETH',
        id: 2,
      },
      // {
      //   name: 'HT',
      //   id: 3,
      // },
      // {
      //   name: 'HUSD',
      //   id: 4,
      // },
      {
        name: 'EOS',
        id: 5,
      },
    ];
    const data = await this.get_symbol_map();
    // 数据集
    const obj = {};
    const currency_name_arr = currencies.map(item => item.name);
    Object.keys(data).forEach(key => {
      // 当前货币 以大写为key
      const cur_currency = data[key].quote_currency;
      // 如果当前货币属于我们需要的货币则加入集合中
      if (currency_name_arr.includes(cur_currency)) {
        if (!obj[cur_currency]) {
          obj[cur_currency] = {
            list: [],
            id: currencies.find(v => v.name === cur_currency).id,
          };
        }
        obj[cur_currency].list.push(data[key]);
      }
    });
    // 排序，返回一个二维数组
    const list = Object.values(obj)
      .sort((a, b) => a.id - b.id > 0)
      .map(item => item.list);
    return list;
  }
  //  btsusdt
  /*
  @author:fsg
  @time:2019-08-08 17:44:59
  @params
  @description:初始化所有的货币对然后添加
  */
  async initSymbol() {
    const { ctx, app } = this;
    // ok
    const symbol_map = await this.get_symbol_map();
    // ctx.logger.error('data', symbol_map);
    const currencies = [ 'USDT', 'BTC', 'ETH', 'EOS', 'USDK' ];
    for (const item of currencies) {
      const arr = Object.values(symbol_map)
        .filter(v => v.quote_currency === item)
        .map(item => ({
          symbol: `${item.base_currency}${item.quote_currency}`.toLocaleLowerCase(),
          base_currency: item.base_currency,
        }));
      for (const v of arr) {
        // ctx.logger.error(v);
        ctx.service.aliyunApiGateway.index(
          `/trade_platform_coin_pair/?tradePlatformName=okex&isOfficialSet=1&isPopular=1&coinPairName=${v.symbol}`,
          'post',
          'default_handle_result'
        );
        // .then(res => filterJavaResponse(ctx, res));

        ctx.service.aliyunApiGateway
          .index('/coin/', 'post', 'default_handle_result', {
            name: v.base_currency,
          })
          .then(res => filterJavaResponse(ctx, res))
          .then(r => {
            // ctx.logger.error('======r', r);
            const { data } = r;
            ctx.service.aliyunApiGateway
              .index(
                `/coin_sort/?coinId=${data}&tradePlatformName=okex&type=2`,
                'post',
                'default_handle_result'
              )
              .then(rep => filterJavaResponse(ctx, rep))
              // .then(rep => ctx.logger.error(v, rep))
              .catch(err => ctx.logger.error(err));
          })
          .catch(err => ctx.logger.error(err));
      }
    }
  }
  /*
  @author:fsg
  @time:2019-08-08 17:46:37
  @params
  @description:初始化所有计价货币
  */
  async initCurrencies() {
    const { ctx } = this;
    // 需要的计价货币 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos'
    const currencies = [ 'USDT', 'BTC', 'ETH', 'EOS', 'USDK' ];
    for (const item of currencies) {
      const res = await ctx.service.aliyunApiGateway
        .index('/coin/', 'post', 'default_handle_result', {
          name: item,
        })
        .then(res => filterJavaResponse(ctx, res));
      const { data } = res;
      ctx.service.aliyunApiGateway
        .index(
          `/coin_sort/?coinId=${data}&tradePlatformName=okex&type=1`,
          'post',
          'default_handle_result'
        )
        .then(res => filterJavaResponse(ctx, res));
    }
  }
  /*
  @author:fsg
  @time:2019-08-05 15:10:44
  @params
  @description:计价货币下的所有货币对
  */
  async getSymbolByCurrency({ currency_id, currency }) {
    const { ctx, app } = this;
    const symbol_map = await this.get_symbol_map();
    const arr = Object.values(symbol_map).filter(
      item => item.quote_currency === currency.toLocaleUpperCase()
    );
    ctx.logger.error('arr', arr);
    const res = await ctx.service.aliyunApiGateway.index(
      `/coin/${currency_id}`,
      'get'
    );
    return {
      list: arr,
      ...res,
    };
  }
  /*
  @author:fsg
  @time:2019-08-13 09:55:13
  @params
  @description:绑定所有计价货币和所有货币对
  */
  async bindAllSymbols2Currency() {
    const { ctx, app } = this;
    const res = await ctx.service.aliyunApiGateway.index('/coin/', 'get');
    const currencies = res.list.map(item => ({
      ...item,
      name: item.name.toLocaleUpperCase(),
    }));
    // const currencyNameArr=currencies.map(item=>item.name)
    const currencyMap = currencies.reduce((t, cur) => {
      t[cur.name] = cur.id;
      return t;
    }, {});
    ctx.logger.error('currencies', currencies);
    const _list = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=okex_symbol_list`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const okex_symbol_list = isJSON(_list) ? JSON.parse(_list) : _list;
    // ctx.logger.error('okex_symbol_list', okex_symbol_list);
    try {
      for (const item of currencies) {
        const { id, name } = item;
        ctx.logger.error('name', name, id);
        const arr = okex_symbol_list.filter(
          v => v.quote_currency === name.toLocaleUpperCase()
        );
        // ctx.logger.error('arr', arr);
        for (const v of arr) {
          const { base_currency, instrument_id } = v;
          const symbol_name = this.formatSymbol(instrument_id);
          const symbolInfo = await ctx.service.aliyunApiGateway.index(
            `/coin_pair/by_name/${symbol_name}`,
            'get'
          );
          const symbol_id = symbolInfo.id;
          // ctx.logger.error('symbol_name', symbol_name, symbol_id);

          this.bindSymbol2Currency({
            symbol_id,
            currency_id: id,
          });
          if (Reflect.has(currencyMap, base_currency)) {
            this.bindSymbol2Currency({
              symbol_id,
              currency_id: currencyMap[base_currency],
            });
          }
        }
      }
    } catch (err) {
      ctx.logger.error(err);
    }

    // return currencies;
  }
  /*
  @author:fsg
  @time:2019-08-13 10:05:26
  @params
  @description:获取
  */
  /*
  @author:fsg
  @time:2019-08-13 09:44:23
  @params
  symbol_id:货币对id,
  currency_id:计价货币id
  @description:绑定单个计价货币和单个货币对
  */
  async bindSymbol2Currency({ symbol_id, currency_id }) {
    const { ctx } = this;
    ctx.service.aliyunApiGateway
      .index('/coin_pair_coin/', 'post', 'default_handle_result', {
        coinPairId: symbol_id,
        coinId: currency_id,
      })
      .then(res => filterJavaResponse(ctx, res))
      .then(res => {
        ctx.logger.error('success', res);
      })
      .catch(err => {
        // ctx.logger.error('err', currency_id, symbol_id, err);
        // if (symbol_id - 0 > 600) {
        //   ctx.logger.error('err', currency_id, symbol_id, err);
        // }
      });
  }
  /*
  @author:fsg
  @time:2019-08-05 16:01:38
  @params
  @description:
  */

  /*
  @author:fsg
  @time:2019-08-08 15:46:40
  @params
  @description:添加自选货币对
  */
  async addSymbol(obj) {
    const { app, ctx } = this;
    // 所有的自选货币缓存 ['btsusdt','xxxx']
    const errors = app.validator.validate(
      {
        secret: {
          required: true,
          type: 'string',
          min: 1,
        },
        symbol_id: {
          required: true,
          type: 'string',
          min: 1,
        },
        symbol: {
          required: true,
          type: 'string',
          min: 1,
        },
        userId: {
          required: true,
          type: 'string',
          min: 1,
        },
        account_id: {
          required: true,
          type: 'string',
          min: 1,
        },
        signId: {
          required: true,
          type: 'string',
          min: 1,
        },
        robotId: {
          required: true,
          type: 'string',
          min: 1,
        },
        quote_currency_id: {
          required: true,
          type: 'string',
          min: 1,
        },
        quote_currency: {
          required: true,
          type: 'string',
          min: 1,
        },
        tradePlatformApiBindProductComboId: {
          required: true,
          type: 'string',
          min: 1,
        },
      },
      obj
    );
    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
    }
    let {
      secret,
      signId,
      robotId,
      userId,
      symbol_id,
      symbol,
      account_id,
      tradePlatformApiBindProductComboId,
      quote_currency_id,
      quote_currency,
    } = obj;
    ctx.logger.error('obj', obj);
    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'post', 'default_handle_result', {
        post2Query: true,
        data: {
          coinPairId: symbol_id,
          isStrategy: 1, // 1否2是
          userId,
          orderStatus: 0,

          tradePlatformApiBindProductComboId:
            tradePlatformApiBindProductComboId - 0,
        },
      })
      .then(res => filterJavaResponse(ctx, res));
    ctx.logger.error('coin_pair_choice post', res);
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    const formatSymbolInfo = await this.formatSymbol2OkextType(symbol);
    ctx.logger.error('formatSymbolInfo', symbol, formatSymbolInfo);
    symbol = formatSymbolInfo.formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    const redis_value = {
      tradePlatformApiBindProductComboId,
      plantFormName: 'okex',
      symbol,
      secret,
      signId,
      robotId,
      symbol_id,
      quote_currency_id,
      quote_currency,
      userId,
      account_id,
      trade_status: '0',
      old_trade_status: '0', // 用户保存前一个的交易状态
      createDate: formatTime(new Date()),
      updateDate: formatTime(new Date()),
    };
    ctx.logger.error('addSymbol', redis_value);
    // 提交java成功再添加到redis
    const handleRedisData = deepCopy(redisRule);
    for (const [ field, value ] of Object.entries(redis_value)) {
      if (typeof value === 'object') {
        handleRedisData.hash.hset.push({
          table: redis_key,
          field,
          value: JSON.stringify(value),
        });
      } else {
        handleRedisData.hash.hset.push({
          table: redis_key,
          field,
          value,
        });
      }
    }
    // java可操作redis_key 该hash表中的数据
    handleRedisData.zset.zadd.push({
      zsetName: `okex_${symbol}_zset`,
      value: 1,
      key: redis_key,
    });
    // 向国外egg的redis写入已选货币对
    handleRedisData.set.sadd.push({
      key: 'okex_choice_symbol_list',
      value: symbol,
    });
    // 手动将该货币对的k线数据写入一次，防止添加成功马上去一键设置但是此时国外egg服务器还未执行新的kline调度任务
    app.curl(
      `${app.config.okexServer.url}/trigger_symbol_kline?symbol=${symbol}`,
      {
        method: 'GET',
        dataType: 'json',
      }
    );
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return res;
  }
  /*
  @author:fsg
  @time:2019-07-02 17:14:31
  @params
   symbol:货币对 'ethbtc'
   type:'buy'  'sell'
  @description:所选的货币对的最新报价,最新卖价
  */
  async latestOpenPrice({ symbol }) {
    const { ctx, app } = this;
    const { data } = await app.curl(
      `${app.config.okexServer.url}/latestOpenPrice?symbol=${symbol}`,
      {
        method: 'GET',
        dataType: 'json',
      }
    );
    return data;
  }
  /*
  @author:fsg
  @time:2019-08-01 11:04:26
  @params
  @description:查询某个货币对的信息
  */
  async symbolInfo({ symbol, signId }) {
    const { ctx, app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    let target_symbol = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    if (!target_symbol) {
      target_symbol = null;
    }
    // TODO 暂时注释@fsg 2019.11.22
    const java_key = `okex-trade-java_${signId}_${symbol}`;
    // 只有java操控的数据
    let extraData = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${java_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    if (!extraData) {
      extraData = null;
    }
    return { ...target_symbol, ...extraData };
  }
  /*
  @author:fsg
  @time:2019-08-01 11:17:50
  @params
  @description:某计价货币交易信息
  */
  async currencyInfo({
    currency,
    currency_id,
    secret,
    signId,
    robotId,
    tradePlatformApiBindProductComboId,
    custom_set_token = null,
  }) {
    const { ctx, app } = this;

    const url = `/coin_pair_choice/?coinId=${currency_id}&tradePlatformApiBindProductComboId=${tradePlatformApiBindProductComboId}`;

    // 该计价货币下的所有自选货币对
    const rep = await ctx.service.aliyunApiGateway.index(
      url,
      'get',
      'default_handle_result',
      {},
      custom_set_token
    );
    const { list } = rep;
    // 预算之和
    let budget_total = 0;
    // 持仓费用总和
    let position_cost_total = 0;
    // 交易中货币对数量
    let trading_symbol_num = 0;
    const symbolRedisKeyList = [];
    const symbolBalancePromiseArr = [];
    for (const item of list) {
      if (item.coinPair && item.coinPair.name) {
        const {
          formatOKexSymbol,
          upper_base_currency,
        } = await this.formatSymbol2OkextType(
          item.coinPair.name,
          custom_set_token
        );
        const redis_key = `okex-trade-condition_${signId}_${formatOKexSymbol}`;
        symbolRedisKeyList.push(redis_key);
        const symbolBalanceRes = ctx
          .curl(
            `${app.config.okexServer.url}/currency_account/${upper_base_currency}`,
            {
              method: 'POST',
              dataType: 'json',
              data: {
                secret,
              },
            }
          )
          .then(res => res.data);
        symbolBalancePromiseArr.push(symbolBalanceRes);
      }
    }
    // ctx.logger.error('symbolRedisKeyList', symbolRedisKeyList);
    const symbolRedisKeyListPromise = app
      .curl(`${app.config.okexServer.url}/symbolList`, {
        method: 'POST',
        dataType: 'json',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
        data: {
          symbolRedisKeyList,
        },
      })
      .then(res => res.data);
    // 该计价货币可用余额
    // const symbol_map = await this.get_symbol_map();
    const balanceResPromise = ctx
      .curl(`${app.config.okexServer.url}/currency_account/${currency}`, {
        method: 'POST',
        dataType: 'json',
        data: {
          secret,
          // robotId,
        },
      })
      .then(res => res.data);
    // .then(filterOkexResponse);
    // ctx.logger.error('balanceRes', balanceRes);
    // const balanceList = balanceRes.list;
    const promise_arr = [
      symbolRedisKeyListPromise,
      balanceResPromise,
      ...symbolBalancePromiseArr,
    ];
    const temp = await Promise.all(promise_arr);
    const [ redisValueList, balanceRes, ...symbolBalanceList ] = temp;
    // ctx.logger.error('symbolBalanceList', symbolBalanceList);
    list.forEach((item, idx) => {
      const symbolBalanceRes = symbolBalanceList[idx];
      if (!Reflect.has(symbolBalanceRes, 'err_code')) {
        item.symbol_balance = symbolBalanceRes;
      } else {
        item.symbol_balance = {
          balance: 0,
        };
      }
    });
    // ctx.logger.error('okex redisValueList', redisValueList);

    redisValueList &&
      Array.isArray(redisValueList) &&
      redisValueList
        .filter(item => item)
        .forEach(item => {
          const { trade_status, budget, position_cost } = item;
          const isNeedAddBudget =
            trade_status && trade_status !== '0' && budget;
          isNeedAddBudget && (budget_total += budget - 0);
          position_cost && (position_cost_total += position_cost - 0);
          trade_status && trade_status !== '0' && (trading_symbol_num += 1);
        });
    // 计价货币余额
    const currency_balance = balanceRes;

    return {
      budget_total,
      position_cost_total,
      trading_symbol_num,
      balance: currency_balance,
      list,
    };
  }
  /*
  @author:fsg
  @time:2019-07-16 14:45:09
  @params
  symbol_list:货币对数列 btsusdt,ethusdt
  ] ,
  policy_id:策略id
  @description:设置货币对与策略对应关系 将货币对的最大建仓次数存到redis  TODO
  */
  async setting(body) {
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        signId: {
          required: true,
          type: 'string',
          min: 1,
        },
        // [{coinPairChoiceId:'',symbol:'',policy_id:'',budget:''}]
        symbol_list: {
          required: true,
          type: 'string',
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    let { symbol_list, signId } = body;

    symbol_list = JSON.parse(symbol_list);
    // 货币对缓存数据
    const symbol_map = await this.get_symbol_map();

    for (const item of symbol_list) {
      const { policy_id, budget } = item;
      item.symbol = (
        await this.formatSymbol2OkextType(item.symbol)
      ).formatOKexSymbol;
      // 查出对应的策略详情
      const targetPolicy = await ctx.service.aliyunApiGateway.index(
        `/strategy/${policy_id}`,
        'get'
      );
      const {
        stopProfitRatio,
        stopProfitTraceTriggerRate,
        stopProfitTraceDropRate,
        sequenceValue,
        is_stop_profit_trace,
        name,
      } = targetPolicy;
      // ctx.logger.error('targetPolicy', targetPolicy);
      // 现在的策略数列全是倍投
      const origin_policy_series = sequenceValue
        .split(',')
        .map(item => item - 0);
      // 最大交易次数
      const max_trade_order = targetPolicy.buildReference;
      // 杠杆倍数
      const leverage = targetPolicy.lever;
      // 策略数列
      const policy_series = origin_policy_series.slice(0, max_trade_order);
      // 货币对数量
      // const coin_pairs_num = symbol_list.length;
      const average_budget = (budget * leverage) / 1;
      // const average_budget = (budget * leverage) / coin_pairs_num; // 每个货币对分配的输入预算
      Object.assign(item, {
        policy_name: name,
        max_trade_order,
        leverage,
        policy_series,
        average_budget,
        stopProfitRatio,
        stopProfitTraceTriggerRate,
        stopProfitTraceDropRate,
        sequenceValue,
        is_stop_profit_trace,
      });
    }

    try {
      // TODO  算各个货币对的交易倍数 凡是有任意一个小于3则都不成功
      const buyPrice_map = {};
      const store_split_map = {};

      const promise_arr = [];
      for (const item of symbol_list) {
        let {
          symbol,
          max_trade_order,
          average_budget,
          policy_series,
          leverage,
          sellPrice,
          buyPrice,
        } = item;

        // {coinPairChoiceId:'',symbol:'',policy_id:'',budget:''}
        const promise_item = new Promise(async (resolve, reject) => {
          try {
            const target_symbol = symbol_map[symbol];
            // 如果前端没有传到有效的现价则手动获取
            if (!buyPrice || !sellPrice) {
              const latestPriceRes = await ctx.service.ccrOkex.latestOpenPrice({
                symbol,
              });
              // 买价
              buyPrice = latestPriceRes.buy;
              // 卖价
              sellPrice = latestPriceRes.sell;
            }
            buyPrice_map[item.symbol] = buyPrice;
            // 建仓间隔
            const store_split = await ctx.service.ccrOkexFormula.store_split({
              symbol,
              sellPrice,
              max_trade_order,
            });

            store_split_map[item.symbol] = store_split;

            // 交易倍数
            const trade_times = await ctx.service.ccrOkexFormula.trade_times({
              budget: average_budget,
              min_trade_amount: target_symbol.min_size,
              price: buyPrice,
              store_split,
              policy_series,
              leverage,
              coin_pairs_num: 1,
            });

            const obj = {
              store_split,
              symbol,
              trade_times,
            };
            resolve(obj);
          } catch (err) {
            reject(err);
          }
        });
        promise_arr.push(promise_item);
      }
      const purpose_trade_sition = await Promise.all(promise_arr);
      const map = {};
      const settingRes = [];
      // 交易倍数不符合的
      const trade_times_err_arr = [];
      symbol_list = symbol_list.filter(item => {
        const temp = purpose_trade_sition.find(v => v.symbol === item.symbol);
        if (temp.trade_times === -1) {
          trade_times_err_arr.push({
            ...temp,
            msg: '预算过小',
            errors: `${temp.symbol}预算过小`,
          });
        }
        return temp.trade_times > 0;
      });
      for (const item of symbol_list) {
        const {
          policy_series,
          symbol,
          max_trade_order,
          average_budget,
          leverage,
          stopProfitRatio,
          is_stop_profit_trace,
          stopProfitTraceTriggerRate,
          stopProfitTraceDropRate,
          policy_id,
          coinPairChoiceId,
          policy_name,
        } = item;
        const target_symbol = symbol_map[symbol];
        // 理论建仓价
        const theoreticalBuildPriceMap = await ctx.service.ccrOkexFormula.averagePrice(
          {
            min_trade_amount: target_symbol.min_size,
            price: buyPrice_map[symbol],
            policy_series,
            store_split: store_split_map[symbol],
          }
        );
        // ctx.logger.error(`${item.symbol}理论建仓价`, theoreticalBuildPriceMap);
        // 当前货币对的拟交易情况
        const cur_symbol = purpose_trade_sition.find(v => v.symbol === symbol);
        // 计算每单买入量
        const buy_volume = await ctx.service.ccrOkexFormula.buy_volume({
          symbol,
          policy_series,
          trade_times: cur_symbol.trade_times,
          min_trade_amount: target_symbol.min_size,
        });
        console.log(symbol, 'buy_volume', buy_volume);
        const {
          amount_precision, //  交易对基础币种计数精度
          price_precision, // 交易对报价的精度
          value_precision, // 交易金额的精度
          min_order_amt, //  交易对最小下单量
        } = await ctx.service.ccrOkexFormula.getSymbolCondition(symbol);
        // ctx.logger.error(
        //   '交易对基础币种计数精度',
        //   amount_precision, //  交易对基础币种计数精度
        //   '交易对报价的精度',
        //   price_precision, // 交易对报价的精度
        //   '交易金额的精度',
        //   value_precision, // 交易金额的精度
        //   '交易对最小下单量',
        //   min_order_amt //  交易对最小下单量
        // );
        // 任意一单买入量小于最小下单量都要重新设置
        if (Object.values(buy_volume).some(v => v - min_order_amt < 0)) {
          const msg = `${symbol} 的最小下单量是${min_order_amt},您的每单买入量为${JSON.stringify(
            buy_volume
          )}`;
          console.log(msg);
          ctx.service.handleErrors.throw_error(msg);
        }
        // ctx.logger.error('buy_volume', buy_volume);
        // 计价货币
        const quote_currency = target_symbol.quote_currency;
        const redis_key = `okex-trade-condition_${signId}_${symbol}`;

        const old_redis_value = await app
          .curl(
            `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
            {
              method: 'GET',
              dataType: 'json',
            }
          )
          .then(res => res.data);

        const redis_value = {
          ...old_redis_value,
          policy_name,
          theoreticalBuildPriceMap,
          coinPairChoiceId: item.coinPairChoiceId, // 自选货币对id TODO @fsg 2019.08.28
          quote_currency,
          updateDate: formatTime(new Date()),
          // 最大交易单数 @Number
          max_trade_order,
          budget: average_budget,
          amount_precision, //  交易对基础币种计数精度
          price_precision, // 交易对报价的精度
          value_precision, // 交易金额的精度
          min_order_amt, //  交易对最小下单量
          // min_order_value, // 最小下单金额
          // 买入订单的数量
          finished_order: 0,
          leverage,
          // 交易倍数，计算买入量需要
          trade_times: cur_symbol.trade_times,
          policy_series, // 策略
          buy_volume, // 交易量
          first_order_price: 0, // 首单现价
          isFollowBuild: '0', // 做是否触发追踪建仓的标示 0否1是
          isNeedRecordMaxRiskBenefitRatio: '0', // 是否需要做记录最高收益比标识 0否1是
          min_averagePrice: 0, // 最小均价
          store_split: cur_symbol.store_split, // 建仓间隔
          trade_status: '0', // 本身拥有的： 未交易0,交易中自动循环 1，     人为干预才有的：交易中止盈后停止 2，交易中暂停买入 3
          history_max_riskBenefitRatio: '0', // 历史最高收益比
          position_average: '0', // 持仓均价
          position_cost: '0', // 持仓费用
          position_num: '0', // 持仓数量
          stopProfitRatio, // 止盈比例
          is_stop_profit_trace, // 是否启用追踪止盈
          emit_ratio: stopProfitTraceTriggerRate, // 追踪止盈触发比例
          turn_down_ratio: stopProfitTraceDropRate, // 追踪止盈回降比例
          follow_lower_ratio: '0.01', // 追踪下调比
          follow_callback_ratio: '0.01', // 追踪回调比
        };
        map[redis_key] = redis_value;
        // TODO
        const _q = {
          coinPairChoiceId: item.coinPairChoiceId, // 自选币id
          stopProfitFixedRate: item.stopProfitRatio, // 固定止盈比例
          stopProfitMoney: 0, // 止盈金额
          stopProfitTraceDropRate, // 追踪止盈回降比例
          stopProfitTraceTriggerRate, // 追踪止盈触发比例
          stopProfitType: 1, // ‘2 ’是固定 ’1‘追踪
        };
        // ctx.logger.error('交易参数===>', _q);

        ctx.service.aliyunApiGateway
          .index(
            '/coin_pair_choice_attribute_custom/',
            'post',
            'default_handle_result',
            _q
          )
          .then(res => filterJavaResponse(ctx, res));
        const d = {
          coinPairChoiceIdStr: coinPairChoiceId,
          isCustom: 1, // 1否2是
          money: average_budget,
          strategyId: policy_id,
        };
        // ctx.logger.error(d);
        try {
          const res = await ctx.service.aliyunApiGateway
            .index(
              '/coin_pair_choice_attribute/',
              'post',
              'default_handle_result',
              {
                post2Query: true,
                data: d,
              }
            )
            .then(res => filterJavaResponse(ctx, res, 'throwErr'));
          settingRes.push({ ...res, symbol });
        } catch (err) {
          // ctx.logger.error('err', err);
          settingRes.push({ ...err, symbol, errors: `${symbol}设置失败` });
        }
      }
      // 提交java成功再添加到redis
      const handleRedisData = deepCopy(redisRule);
      for (const key in map) {
        for (const [ field, value ] of Object.entries(map[key])) {
          if (typeof value === 'object') {
            handleRedisData.hash.hset.push({
              table: key,
              field,
              value: JSON.stringify(value),
            });
          } else {
            handleRedisData.hash.hset.push({
              table: key,
              field,
              value,
            });
          }
        }
      }
      app.curl(`${app.config.okexServer.url}/setRedis`, {
        method: 'POST',
        dataType: 'json',
        data: handleRedisData,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      });
      // ctx.logger.error('trade_times_err_arr', trade_times_err_arr);
      return settingRes.concat(trade_times_err_arr);
    } catch (e) {
      // ctx.logger.error(e);
      ctx.service.handleErrors.throw_error(e.message);
    }
  }
  /*
  @author:fsg
  @time:2019-07-22 23:06:04
  @params
   symbol
  @description:开始交易 trade_status从0变为 1
  */
  async start_trade({
    symbol,
    signId,
    quote_currency_id,
    quote_currency,
    buyPrice,
    sellPrice,
    // secret,
    // robotId,
    // userId,
    // symbol_id,
    // coinPairChoiceId
  }) {
    const { ctx, app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    const handleRedisData = deepCopy(redisRule);

    const redis_value = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const symbol_map = await this.get_symbol_map();
    const target_symbol = symbol_map[symbol];
    const {
      secret,
      robotId,
      userId,
      symbol_id,
      account_id,
      coinPairChoiceId,
      policy_series,
      leverage,
      budget,
      max_trade_order,
      tradePlatformApiBindProductComboId,
    } = redis_value;
    // 计价货币
    const _quote_currency = target_symbol.quote_currency;
    // 火币余额
    const balanceRes = await ctx
      .curl(
        `${app.config.okexServer.url}/currency_account/${_quote_currency}`,
        {
          method: 'POST',
          dataType: 'json',
          data: {
            secret,
            // robotId,
          },
        }
      )
      .then(res => res.data)
      .then(filterOkexResponse);
    // const balanceList = balanceRes.list;
    // 计价货币余额
    const currency_balance = balanceRes.balance;

    if (!currency_balance) {
      ctx.service.handleErrors.throw_error(currency_balance);
    }

    // 重新算交易倍数和买入量
    // 如果前端没有传入现价则手动获取现价
    if (!buyPrice || !sellPrice) {
      const latestPriceRes = await ctx.service.ccrOkex.latestOpenPrice({
        symbol,
      });
      buyPrice = latestPriceRes.buy;
      sellPrice = latestPriceRes.sell;
    }
    // 建仓间隔
    const store_split = await ctx.service.ccrOkexFormula.store_split({
      symbol,
      sellPrice,
      max_trade_order,
    });
    const lastBuildPrice = await ctx.service.ccrOkexFormula.lastBuildPrice({
      openPrice: buyPrice,
      max_trade_order,
      store_split,
    });
    const trade_times = await ctx.service.ccrOkexFormula.trade_times({
      budget,
      min_trade_amount: target_symbol.min_size,
      price: buyPrice,
      store_split,
      policy_series,
      leverage,
      coin_pairs_num: 1,
    });
    // 理论建仓价
    const theoreticalBuildPriceMap = await ctx.service.ccrOkexFormula.averagePrice(
      {
        min_trade_amount: target_symbol.min_size,
        price: buyPrice,
        policy_series,
        store_split,
      }
    );
    //
    const buy_volume = await ctx.service.ccrOkexFormula.buy_volume({
      symbol,
      policy_series,
      trade_times,
      min_trade_amount: target_symbol.min_size,
    });

    const hsetData = [
      {
        field: 'trade_times',
        value: trade_times,
      },
      {
        field: 'theoreticalBuildPriceMap',
        value: theoreticalBuildPriceMap,
      },
      {
        field: 'buy_volume',
        value: JSON.stringify(buy_volume),
      },
      {
        field: 'trade_status',
        value: '1',
      },
      {
        field: 'lastBuildPrice',
        value: lastBuildPrice,
      },
      {
        field: 'old_trade_status',
        value: '0',
      },
      {
        field: 'store_split',
        value: store_split,
      },
      {
        field: 'isTradeError', // 交易出错 0否1是
        value: 0,
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
      {
        field: 'quote_currency_id',
        value: quote_currency_id,
      },
      {
        field: 'quote_currency',
        value: quote_currency,
      },
      {
        field: 'is_set_stop_profit_trade',
        value: '0',
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    handleRedisData.zset.zadd.push({
      zsetName: `okex_${symbol}_zset`,
      value: 1,
      key: redis_key,
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });

    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'put', 'default_handle_result', {
        coinPairId: symbol_id,
        id: coinPairChoiceId,
        isStart: 2, //
        userId,
        orderStatus: 0,

        tradePlatformApiBindProductComboId:
          tradePlatformApiBindProductComboId - 0,
      })
      .then(res => filterJavaResponse(ctx, res));
    return res;
  }

  /*
  @author:fsg
  @time:2019-07-22 23:32:45
  @params
   symbol
  @description:暂停买入 状态trade_status从1 变为 3
  */
  async pause_trade({ symbol, signId, isBatchUpdate = false }) {
    const { ctx, app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    const redis_value = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const {
      userId,
      symbol_id,
      coinPairChoiceId,
      trade_status,
      tradePlatformApiBindProductComboId,
    } = redis_value;
    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'put', 'default_handle_result', {
        coinPairId: symbol_id,
        id: coinPairChoiceId,
        isStart: 1, //
        userId,
        orderStatus: 1,

        tradePlatformApiBindProductComboId:
          tradePlatformApiBindProductComboId - 0,
      })
      .then(res => filterJavaResponse(ctx, res));
    if (!res) {
      if (isBatchUpdate) {
        return {
          msg: '暂停失败',
          data: 0,
        };
      }
      ctx.service.handleErrors.throw_error(res);
    }
    const handleRedisData = deepCopy(redisRule);
    const hsetData = [
      {
        field: 'trade_status',
        value: '3',
      },
      {
        field: 'old_trade_status',
        value: trade_status,
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    //  监控价格，停止买入，只进行止盈

    return res;
  }

  /*
  @author:fsg
  @time:2019-09-02 10:09:06
  @params
  @description:恢复买入 trade_status变回1
  */
  async recover_buy({ symbol, signId, isBatchUpdate = false }) {
    const { ctx, app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    // 恢复买入
    const redis_value = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const {
      userId,
      symbol_id,
      coinPairChoiceId,
      old_trade_status,
      trade_status,
      tradePlatformApiBindProductComboId,
    } = redis_value;
    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'put', 'default_handle_result', {
        coinPairId: symbol_id,
        id: coinPairChoiceId,
        isStart: 2, //
        userId,
        orderStatus: 0,

        tradePlatformApiBindProductComboId:
          tradePlatformApiBindProductComboId - 0,
      })
      .then(res => filterJavaResponse(ctx, res));
    if (!res) {
      if (isBatchUpdate) {
        return {
          msg: '恢复买入失败',
          data: 0,
        };
      }
      ctx.service.handleErrors.throw_error(res);
    }
    const handleRedisData = deepCopy(redisRule);
    const hsetData = [
      {
        field: 'trade_status',
        value: old_trade_status,
      },
      {
        field: 'old_trade_status',
        value: trade_status,
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return res;
  }
  /*
  @author:fsg
  @time:2019-08-28 17:34:11
  @params
  @description:重置状态trade_status为0
  */
  async reset_symbol({
    symbol, signId,
    userId,
    symbol_id,
    coinPairChoiceId,
    tradePlatformApiBindProductComboId,
  }) {
    const { ctx, app } = this;
    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'put', 'default_handle_result', {
        coinPairId: symbol_id,
        id: coinPairChoiceId,
        isStart: 1, //
        userId,
        orderStatus: 0,

        tradePlatformApiBindProductComboId:
          tradePlatformApiBindProductComboId - 0,
      })
      .then(res => filterJavaResponse(ctx, res));
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    const handleRedisData = deepCopy(redisRule);
    const hsetData = [
      {
        field: 'trade_status',
        value: '0',
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return res;
  }

  /*
  @author:fsg
  @time:2019-08-13 12:52:08
  @params
  @description:设置止盈后停止
  */
  async stop_profit_trade({ symbol, signId }) {
    const { app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    //  监控价格，停止买入，只进行止盈
    const handleRedisData = deepCopy(redisRule);
    const hsetData = [
      // 设置了止盈后停止
      {
        field: 'is_set_stop_profit_trade',
        value: '1',
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return {
      msg: 'success',
      data: 1,
    };
  }

  /*
  @author:fsg
  @time:2019-08-28 17:54:28
  @params
  @description:取消止盈后停止
  */
  async cancel_stop_profit_trade({ symbol, signId }) {
    const { app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    // 取消止盈后停止
    const handleRedisData = deepCopy(redisRule);
    const hsetData = [
      // 取消止盈后停止
      {
        field: 'is_set_stop_profit_trade',
        value: '0',
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return {
      msg: 'success',
      data: 1,
    };
  }
  /*
  @author:fsg
  @time:2019-08-13 13:01:07
  @params
  @description: 立即停止 忘记订单（即 丢弃该轮之前所有订单）,trade_status重置为0
  */
  async forget_orders({ symbol, signId }) {
    const { ctx, app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    const redis_value = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const {
      userId,
      symbol_id,
      coinPairChoiceId,
      trade_status,
      cur_groupId,
      tradePlatformApiBindProductComboId,
    } = redis_value;
    const java_key = `okex-trade-java_${signId}_${symbol}`;

    // ctx.logger.error(java_key, extraData);
    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'put', 'default_handle_result', {
        coinPairId: symbol_id,
        id: coinPairChoiceId,
        isStart: 1, //
        userId,
        orderStatus: 2,

        tradePlatformApiBindProductComboId:
          tradePlatformApiBindProductComboId - 0,
      })
      .then(res => filterJavaResponse(ctx, res));
    ctx.logger.error('forget_orders res', res);
    ctx.logger.error('cur_groupId', cur_groupId);
    // 忘记订单 提交订单结算
    if (cur_groupId) {
      const extraData = await app
        .curl(
          `${app.config.okexServer.url}/getRedisValueByKey?key=${java_key}&type=Hash`,
          {
            method: 'GET',
            dataType: 'json',
          }
        )
        .then(res => res.data);
      const { real_time_earning_ratio } = extraData;
      const orderRes = await ctx.service.aliyunApiGateway.index(
        '/order_group/',
        'put',
        'default_handle_result',
        {
          name: cur_groupId,
          coinPairChoiceId,
          key: redis_key,
          endProfitRatio: real_time_earning_ratio - 0, // 结单收益比
          isEnd: 1,
          endType: 3,
        }
      );
      // .then(res => filterJavaResponse(ctx, res));
      ctx.logger.error('orderRes', orderRes);
    }
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    const handleRedisData = deepCopy(redisRule);
    const hsetData = [
      {
        field: 'finished_order',
        value: 0,
      },
      {
        field: 'is_set_stop_profit_trade',
        value: '0',
      },
      {
        field: 'cur_groupId',
        value: cur_groupId,
      },
      {
        field: 'trade_status',
        value: '0',
      },
      {
        field: 'position_average',
        value: '0',
      },
      {
        field: 'old_trade_status',
        value: trade_status,
      },
      {
        field: 'position_cost',
        value: '0',
      },
      {
        field: 'position_num',
        value: '0',
      },
      {
        field: 'updateDate',
        value: formatTime(new Date()),
      },
    ];
    hsetData.forEach(item => {
      const { field, value } = item;
      handleRedisData.hash.hset.push({
        table: redis_key,
        field,
        value,
      });
    });
    handleRedisData.string.del.push(java_key);
    handleRedisData.zset.zadd.push({
      zsetName: `okex_${symbol}_zset`,
      value: 0,
      key: redis_key,
    });
    handleRedisData.hash.hdel.push({
      table: 'okex-not-finished-buy-order',
      field: redis_key,
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return res;
  }

  /*
  @author:fsg
  @time:2019-08-13 13:01:47
  @params
  @description:立即停止 清仓卖出（即 立即卖掉当前所有订单）,卖出成功不进行下一轮,trade_status重置为0
  */
  async sell_all_orders({
    symbol,
    signId,
    userId,
    symbol_id,
    coinPairChoiceId,
    finished_order,
    tradePlatformApiBindProductComboId,
    sellPrice,
    isBatchUpdate = false,
  }) {
    const { ctx, app } = this;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;


    // 如果还没有买入第一单即finished_order为0的情况下点了清仓卖出
    if (!(finished_order - 0)) {
      ctx.service.handleErrors.throw_error('该货币对还没有买入');
    }


    const obj = {
      symbol,
      signId,
      // secret,
      sellType: 'clear',
      sellPrice,
      // real_time_earning_ratio
    };
    const sellRes = await ctx
      .curl(`${app.config.okexServer.url}/sell`, {
        method: 'POST',
        dataType: 'json',
        data: obj,
      })
      .then(res => res.data);
    console.log('sellRes', sellRes);
    if (!sellRes || sellRes.name === 'Error') {
      if (isBatchUpdate) {
        return {
          msg: '清仓卖出失败',
          data: 0,
        };
      }
      ctx.service.handleErrors.throw_error(sellRes.errors.message || sellRes.errors);
    } else {
      const res = await ctx.service.aliyunApiGateway
        .index('/coin_pair_choice/', 'put', 'default_handle_result', {
          coinPairId: symbol_id,
          id: coinPairChoiceId,
          isStart: 1, //
          userId,
          orderStatus: 0,

          tradePlatformApiBindProductComboId:
            tradePlatformApiBindProductComboId - 0,
        })
        .then(res => filterJavaResponse(ctx, res));
      // ctx.logger.error('sell_all_orders', res);
      return res;
    }
  }
  /*
  @author:fsg
  @time:2019-07-31 17:29:23
  @params
   symbol:
    //   emit_ratio,
        //   turn_down_ratio,
        //   follow_lower_ratio,
        //   follow_callback_ratio,
        //   is_use_follow_target_profit,
        //   target_profit_price,
  @description:设置参数
  */
  async setTradeParams(body) {
    const { ctx, app } = this;
    let { symbol, symbol_id, signId, ...props } = body;
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const {
      id,
      emit_ratio, // 追踪止盈触发比例
      turn_down_ratio, // 追踪止盈回降比例
      stopProfitFixedRate, // 固定止盈比例
      is_use_follow_target_profit, // 是否启用追踪止盈
      target_profit_price, // 止盈金额
    } = props;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;

    const res = await ctx.service.aliyunApiGateway
      .index(
        '/coin_pair_choice_attribute_custom/',
        'put',
        'default_handle_result',
        {
          id,
          coinPairChoiceId: symbol_id, // 货币对id
          stopProfitFixedRate, // 固定止盈比例
          stopProfitMoney: target_profit_price, // 止盈金额
          stopProfitTraceDropRate: turn_down_ratio, // 追踪止盈回降比例
          stopProfitTraceTriggerRate: emit_ratio, // 追踪止盈触发比例
          stopProfitType: is_use_follow_target_profit - 0 === 1 ? 1 : 2, // 止盈方式 1 追踪止盈 2固定止盈
        }
      )
      .then(res => filterJavaResponse(ctx, res));
    let data = {};
    const handleRedisData = deepCopy(redisRule);

    // 追踪止盈
    if (is_use_follow_target_profit - 0 === 1) {
      data = {
        // 追踪止盈触发比例
        emit_ratio,
        // 追踪止盈回降比例
        turn_down_ratio,
        // 启用追踪止盈
        is_stop_profit_trace: 1,
      };
    } else {
      // 固定止盈
      data = {
        // 固定止盈比例
        stopProfitFixedRate,
        // 是否启用追踪止盈
        is_stop_profit_trace: 0,
      };
      handleRedisData.hash.hdel = [
        {
          table: redis_key,
          field: 'emit_ratio',
        },
        {
          table: redis_key,
          field: 'turn_down_ratio',
        },
      ];
    }
    // 止盈金额
    if (target_profit_price) {
      data.target_profit_price = target_profit_price;
    }

    if (res) {
      // 提交java成功
      // 提交java成功再添加到redis
      for (const [ field, value ] of Object.entries(data)) {
        if (typeof value === 'object') {
          handleRedisData.hash.hset.push({
            table: redis_key,
            field,
            value: JSON.stringify(value),
          });
        } else {
          handleRedisData.hash.hset.push({
            table: redis_key,
            field,
            value,
          });
        }
      }
      const setRedisRes = await app.curl(`${app.config.okexServer.url}/setRedis`, {
        method: 'POST',
        dataType: 'json',
        data: handleRedisData,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      }).then(res => res.data);
      return setRedisRes;
    }
  }

  /*
  @author:fsg
  @time:2019-08-26 10:20:58
  @params
  @description:
  */
  async delSymbol({ symbol, signId, coinPairChoiceId }) {
    const { ctx, app } = this;
    ctx.logger.error(
      '--------del symbol--------',
      symbol,
      signId,
      coinPairChoiceId
    );
    symbol = (await this.formatSymbol2OkextType(symbol)).formatOKexSymbol;

    const redis_key = `okex-trade-condition_${signId}_${symbol}`;
    ctx.logger.error('redis_key', redis_key);
    const redis_value = await app
      .curl(
        `${app.config.okexServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    ctx.logger.error('redis_value', redis_value);

    // 交易状态为0才允许删除
    const { trade_status } = redis_value;

    if (trade_status - 0 !== 0) {
      ctx.service.handleErrors.throw_error('请先停止货币对交易');
    }
    const res = await ctx.service.aliyunApiGateway
      .index(
        `/coin_pair_choice/${coinPairChoiceId}`,
        'delete',
        'default_handle_result'
      )
      .then(res => filterJavaResponse(ctx, res));
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    ctx.logger.error('delSymbol======>', res);
    const java_key = `trade-java_${signId}_${symbol}`;
    const handleRedisData = deepCopy(redisRule);
    handleRedisData.string.del = [ redis_key, java_key ];
    handleRedisData.hash.hdel.push({
      table: 'okex-not-finished-buy-order',
      field: redis_key,
    });
    handleRedisData.zset.zrem.push({
      zsetName: `okex_${symbol}_zset`,
      key: redis_key,
    });
    app.curl(`${app.config.okexServer.url}/setRedis`, {
      method: 'POST',
      dataType: 'json',
      data: handleRedisData,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
    return res;
  }
  /*
  @author:fsg
  @time:2019-12-17 15:59:26
  @params
  @description:批量暂停
  */
  async batch_pause_trade({ list }) {
    list = JSON.parse(list);
    const promiseArr = [];
    for (const item of list) {
      const i = this.pause_trade({ ...item, isBatchUpdate: true });
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
  async batch_recover_buy({ list }) {
    list = JSON.parse(list);
    const promiseArr = [];
    for (const item of list) {
      const i = this.recover_buy({ ...item, isBatchUpdate: true });
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
  async batch_stop_profit_trade({ list }) {
    list = JSON.parse(list);
    const promiseArr = [];
    for (const item of list) {
      const i = this.stop_profit_trade(item);
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
  async batch_cancel_stop_profit_trade({ list }) {
    list = JSON.parse(list);
    const promiseArr = [];
    for (const item of list) {
      const i = this.cancel_stop_profit_trade(item);
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
  async batch_sell_all_orders({ list }) {
    list = JSON.parse(list);
    const promiseArr = [];
    for (const item of list) {
      const i = this.sell_all_orders({ ...item, isBatchUpdate: true });
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
}
module.exports = CcrOkexService;
