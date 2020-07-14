'use strict';

const Service = require('egg').Service;
const { stringify } = require('qs');
const {
  // floatAdd,
  formatTime,
  // hashSet,
  filterHuobiResponse,
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
// key `trade-condition_${signId}_${symbol}` 每个用户每个货币对的交易情况
class CCRHuobiService extends Service {
  // eslint-disable-next-line no-useless-constructor
  constructor(ctx) {
    super(ctx);

    // 初始化handleErrors，保持单例
    this.handleErrors = ctx.service.handleErrors;

    this.aliyunApiGateway = ctx.service.aliyunApiGateway;
  }
  async delete_api(query) {
    const { ctx, app } = this;
    const { id, signId } = query;
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
    const delRes = await ctx.service.aliyunApiGateway
      .delete(`/trade_platform_api/${id}`)
      .then(res => filterJavaResponse(ctx, res));
    if (!delRes) {
      return;
    }
    // 将redis中该用户相关交易数据删除
    // app
    //   .curl(`${app.config.huobiServer.url}/delKeysByKeyword`, {
    //     method: 'POST',
    //     dataType: 'json',
    //     data: {
    //       keyword: `trade-condition_${signId}`,
    //     },
    //   })
    //   .then(res => res.data);
    return delRes;
  }
  /*
  @author:fsg
  @time:2020-01-16 13:19:32
  @params
  @description:解绑api
  */
  async remove_api(query) {
    const { ctx, app } = this;
    const { id, tradePlatformApiBindProductComboId } = query;
    ctx.logger.error('huobi remove_api', query);
    const errors = app.validator.validate(
      {
        id: {
          required: true,
          type: 'string',
          max: 100,
          min: 1,
        },
        tradePlatformApiBindProductComboId: {
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
    const delRes = await ctx.service.aliyunApiGateway
      .delete(
        `/trade_platform_api_bind_product_combo/${tradePlatformApiBindProductComboId}`
      )
      .then(res => filterJavaResponse(ctx, res));
    ctx.logger.error('huobi del trade_platform_api_bind_product_combo', delRes);
    if (!delRes) {
      return;
    }
    // 解绑
    // const res = await this.aliyunApiGateway
    //   .put('/trade_platform_api/', {
    //     id,
    //     sign: guid(),
    //   })
    //   .then(res => filterJavaResponse(ctx, res));
    return delRes;
  }
  /*
  @author:fsg
  @time:2019-10-15 21:28:06
  @params
  @description:
  */
  async bind_api(query) {
    const { ctx, app } = this;
    const { secret, id, tradePlatformApiId, userProductComboId } = query;
    ctx.logger.error('huobi bind_api query======', query);
    const errors = app.validator.validate(
      {
        secret: {
          required: true,
          type: 'string',
          max: 1000,
          min: 1,
        },
        id: {
          required: true,
          type: 'string',
          max: 100,
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
    // 交易所账户数据
    const accountRes = await app
      .curl(`${app.config.huobiServer.url}/verify_account`, {
        method: 'POST',
        dataType: 'json',
        data: {
          secret,
          // robotId,
        },
      })
      .then(res => res.data)
      .then(filterHuobiResponse);
    if (!accountRes) {
      this.handleErrors.throw_error('绑定api失败,请稍后重试');
    }
    ctx.logger.error('huobi accountRes===verify_account', accountRes);

    // 使用中，现货
    const spotInfo = accountRes.find(
      item => item.type === 'spot' && item.state === 'working'
    );
    if (!spotInfo) {
      this.handleErrors.throw_error('没有使用中的现货账户');
    }
    ctx.logger.error('spotInfo', spotInfo);
    const updateRes = await this.aliyunApiGateway
      .put('/trade_platform_api/', {
        id,
        sign: spotInfo.id,
      })
      .then(res => filterJavaResponse(ctx, res));
    if (!updateRes) {
      return;
    }
    // 绑定api
    const bindRes = await this.aliyunApiGateway
      .post(
        `/trade_platform_api_bind_product_combo/binding?tradePlatformApiId=${tradePlatformApiId}&userProductComboId=${userProductComboId}`
      )
      .then(res => filterJavaResponse(ctx, res));
    ctx.logger.error(
      'huobi trade_platform_api_bind_product_combo/binding',
      bindRes
    );
    // TODO 将 redis 中trade-condition_${spotInfo.id}_*中的secret都替换成当前secret @fsg 2020.3.30
    app
      .curl(`${app.config.huobiServer.url}/replaceSecretByKeyword`, {
        method: 'POST',
        dataType: 'json',
        data: {
          keyword: `trade-condition_${spotInfo.id}`,
          secret,
        },
      })
      .then(res => res.data);
    return bindRes;
  }
  /*
  @author:fsg
  @time:2019-08-30 15:01:33
  @params
  @description:验证api
  */
  async verify_api(query) {
    const { ctx, app } = this;
    const { secret, id } = query;
    const accountRes = await app
      .curl(`${app.config.huobiServer.url}/verify_account`, {
        method: 'POST',
        dataType: 'json',
        data: {
          secret,
        },
      })
      .then(res => res.data);
    // .then(filterHuobiResponse);
    ctx.logger.error('huobi accountRes===', accountRes);
    let err_code;
    let err_msg;
    const Incorrect_key = 'api-signature-not-valid';

    if (accountRes.errors) {
      err_code = accountRes.errors['err-code'];
      err_msg = accountRes.errors['err-msg'];
    } else {
      err_code = accountRes['err-code'];
      err_msg = accountRes['err-msg'];
    }
    // key错误： {"status":"error","err-code":"api-signature-not-valid","err-msg":"Signature not valid: Incorrect Access key [Access key错误]","data":null}
    // ip错误：{"status":"error","err-code":"api-signature-not-valid","err-msg":"Signature not valid: Incorrect IP address [IP地址错误]:119.81.237.3","data":null}
    // 过期：{"status":"error","err-code":"api-signature-not-valid","err-msg":"Signature not valid: API key has expired [API Key已经过期]","data":null}
    if (err_code || err_msg) {
      ctx.logger.error(err_code, err_msg);
      if (
        err_code === Incorrect_key &&
        (err_msg.includes('[Access key错误]') ||
          err_msg.includes('[API Key已经过期]'))
      ) {
        if (accountRes.errors) {
          ctx.service.handleErrors.throw_error(err_msg);
        } else {
          ctx.service.handleErrors.throw_error(err_msg);
        }
      }
    } else {
      let method;
      // if (Array.isArray(accountRes)) {
      //   // 使用中，现货
      //   const spotInfo = accountRes.find(
      //     item => item.type === 'spot' && item.state === 'working'
      //   );
      // }
      if (id) {
        method = 'put';
      } else {
        query = Object.assign(query, {
          sign: guid(),
        });
        method = 'post';
      }
      ctx.logger.error('query===>', query);
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
  @time:2019-09-06 10:47:17
  @params
  @description:init symbol_map
  */
  async get_symbol_map() {
    const { app } = this;
    const flag = await app.redis.get('internal').exists('symbol_map');
    if (flag) {
      return JSON.parse(await app.redis.get('internal').get('symbol_map'));
    }
    const data = await app
      .curl(`${app.config.huobiServer.url}/getRedisValueByKey?key=symbol_map`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    await app.redis.get('internal').set('symbol_map', JSON.stringify(data));
    return data;
  }
  async trigger_currency_kline(currency) {
    const { app } = this;
    const res = await app
      .curl(
        `${app.config.huobiServer.url}/trigger_currency_kline?currency=${currency}`,
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
        name: 'usdt',
        id: 0,
      },
      {
        name: 'btc',
        id: 1,
      },
      {
        name: 'eth',
        id: 2,
      },
      {
        name: 'ht',
        id: 3,
      },
      {
        name: 'husd',
        id: 4,
      },
      {
        name: 'eos',
        id: 5,
      },
    ];
    const data = await this.get_symbol_map();
    // 数据集
    const obj = {};
    const currency_name_arr = currencies.map(item => item.name);
    Object.keys(data).forEach(key => {
      // 当前货币 以小写为key
      const cur_currency = data[key]['quote-currency'];
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
    const currencies = [ 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos' ];
    for (const item of currencies) {
      const arr = Object.values(symbol_map).filter(
        v => v['quote-currency'] === item
      );
      for (const v of arr) {
        // ctx.logger.error(v);
        ctx.service.aliyunApiGateway.index(
          `/trade_platform_coin_pair/?tradePlatformName=huobi&isOfficialSet=1&isPopular=1&coinPairName=${v.symbol}`,
          'post',
          'default_handle_result'
        );
        // .then(res => filterJavaResponse(ctx, res));

        ctx.service.aliyunApiGateway
          .index('/coin/', 'post', 'default_handle_result', {
            name: v['base-currency'],
          })
          .then(res => filterJavaResponse(ctx, res))
          .then(r => {
            // ctx.logger.error('======r', r);
            const { data } = r;
            ctx.service.aliyunApiGateway
              .index(
                `/coin_sort/?coinId=${data}&tradePlatformName=huobi&type=2`,
                'post',
                'default_handle_result'
              )
              .then(rep => filterJavaResponse(ctx, rep));
            // .then(rep => ctx.logger.error(v, rep))
            // .catch(err => ctx.logger.error(err, r));
          })
          .catch(err => {});
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
    const currencies = [ 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos' ];
    for (const item of currencies) {
      const res = await ctx.service.aliyunApiGateway
        .index('/coin/', 'post', 'default_handle_result', {
          name: item,
        })
        .then(res => filterJavaResponse(ctx, res));
      const { data } = res;
      ctx.service.aliyunApiGateway
        .index(
          `/coin_sort/?coinId=${data}&tradePlatformName=huobi&type=1`,
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
    const arr = symbol_map.filter(v => v['quote-currency'] === currency);
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
    const currencies = res.list;
    // ctx.logger.error('currencies', currencies);
    const currencyMap = currencies.reduce((t, cur) => {
      t[cur.name] = cur.id;
      return t;
    }, {});
    ctx.logger.error('currencyMap', currencyMap);
    const _list = await app
      .curl(
        `${app.config.huobiServer.url}/getRedisValueByKey?key=huobi_symbol_list`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const huobi_symbol_list = isJSON(_list) ? JSON.parse(_list) : _list;
    try {
      for (const item of currencies) {
        const { id, name } = item;

        const arr = huobi_symbol_list.filter(v => v['quote-currency'] === name);
        for (const v of arr) {
          const base_currency = v['base-currency'];

          const symbol_name = v.symbol;
          const symbolInfo = await ctx.service.aliyunApiGateway.index(
            `/coin_pair/by_name/${symbol_name}`,
            'get'
          );

          const symbol_id = symbolInfo.id;
          // ctx.logger.error(symbolInfo);
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
    console.log('symbol_id', symbol_id, 'currency_id', currency_id);
    const { ctx } = this;
    ctx.service.aliyunApiGateway
      .index('/coin_pair_coin/', 'post', 'default_handle_result', {
        coinPairId: symbol_id,
        coinId: currency_id,
      })
      .then(res => filterJavaResponse(ctx, res))
      .then(res => {
        console.log('success', res);
      })
      .catch(err => {
        // console.log(err);
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
    const {
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

    const redis_key = `trade-condition_${signId}_${symbol}`;
    const redis_value = {
      tradePlatformApiBindProductComboId,
      plantFormName: 'huobi',
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
      zsetName: `${symbol}_zset`,
      value: 1,
      key: redis_key,
    });
    // 向国外egg的redis写入已选货币对
    handleRedisData.set.sadd.push({
      key: 'huobi_choice_symbol_list',
      value: symbol,
    });
    // 手动将该货币对的k线数据写入一次，防止添加成功马上去一键设置但是此时国外egg服务器还未执行新的kline调度任务
    app.curl(
      `${app.config.huobiServer.url}/trigger_symbol_kline?symbol=${symbol}`,
      {
        method: 'GET',
        dataType: 'json',
      }
    );
    // ctx.logger.error('master cur redis ', app.config.redis);
    // ctx.logger.error('handleRedisData', handleRedisData);
    // TODO
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
      `${app.config.huobiServer.url}/latestOpenPrice?symbol=${symbol}`,
      {
        method: 'GET',
        dataType: 'json',
      }
    );
    return data;
  }

  /**
   * @author yuxuewen
   * @param symbol
   * @param signId
   * @return {Promise<void>}
   */
  async symbolInfo({ symbol, signId }) {
    const { ctx, app } = this;

    const redis_key = `trade-condition_${signId}_${symbol}`;

    // 只有java操控的数据
    const java_key = `trade-java_${signId}_${symbol}`;

    const info = await app
      .curl(`${app.config.huobiServer.url}/mergeRequest`, {
        method: 'POST',
        dataType: 'json',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
        data: [
          {
            key: redis_key,
            type: 'Hash',
          },
          {
            key: java_key,
            type: 'Hash',
          },
        ],
      })
      .then(res => res.data);

    const destruction_result = {
      ...info[redis_key],
      ...info[java_key],
    };

    return destruction_result;
  }

  /*
  @author:fsg
  @time:2019-08-01 11:17:50
  @params
  @description:某计价货币交易信息
  */
  async currencyInfo(body) {
    const { app } = this;
    const { currency, signId } = body;
    const tableName = `huobi_currencyInfo_${currency}`;
    const redis_value = await app.redis.get('internal').hget(tableName, signId);
    if (redis_value) {
      this.cache_currencyInfo(body);
      return JSON.parse(redis_value);
    }
    return this.cache_currencyInfo(body);
  }
  // 缓存计价货币余额等数据
  async cache_currencyInfo({
    currency,
    currency_id,
    secret,
    signId,
    robotId,
    tradePlatformApiBindProductComboId,
    custom_set_token = null,
  }) {
    const { ctx, app } = this;
    // 该计价货币下的所有自选货币对
    const { list } = await ctx.service.aliyunApiGateway.index(
      `/coin_pair_choice/?coinId=${currency_id}&tradePlatformApiBindProductComboId=${tradePlatformApiBindProductComboId}`,
      'get',
      'default_handle_result',
      {},
      custom_set_token
    );
    // 预算之和
    let budget_total = 0;
    // 持仓费用总和
    let position_cost_total = 0;
    // 交易中货币对数量
    let trading_symbol_num = 0;
    // list的货币对的redis key组成数组
    const symbolRedisKeyList = list.map(
      item => `trade-condition_${signId}_${item.coinPair.name}`
    );
    const symbolRedisKeyListPromise = app
      .curl(`${app.config.huobiServer.url}/symbolList`, {
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
    const balanceResPromise = app
      .curl(`${app.config.huobiServer.url}/balance/${signId}`, {
        method: 'POST',
        dataType: 'json',
        data: {
          secret,
          robotId,
        },
      })
      .then(res => res.data);
    // .then(filterHuobiResponse);
    const promise_arr = [ symbolRedisKeyListPromise, balanceResPromise ];
    const temp = await Promise.all(promise_arr);
    const [ redisValueList, balanceRes ] = temp;
    // ctx.logger.error('huobi redisValueList', redisValueList);

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
    const balanceList = balanceRes.list;
    // 计价货币余额
    let currency_balance = {
      balance: 0,
    };
    if (balanceList && balanceList.length) {
      currency_balance = balanceList.find(item => item.currency === currency);
    }
    // 将当前计价货币加入缓存
    const data = {
      budget_total,
      position_cost_total,
      trading_symbol_num,
      balance: currency_balance,
    };
    const tableName = `huobi_currencyInfo_${currency}`;
    const redis_value = await app.redis.get('internal').hget(tableName, signId);
    // 如果缓存中的数据与当前获取到的新数据不一致，则用ws推给前端
    if (redis_value && JSON.stringify(data) !== redis_value) {
      // TODO ws推送
      const d = {
        plantFormName: 'huobi',
        type: 'updateCurrencyBalance',
        signId,
        currency,
        ...JSON.parse(redis_value),
      };
      ctx.service.ws.wsHuobi.emit(d);
    }
    app.redis.get('internal').hset(tableName, signId, JSON.stringify(data));
    return data;
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
          buyPrice,
          sellPrice,
        } = item;
        const promise_item = new Promise(async (resolve, reject) => {
          try {
            const target_symbol = symbol_map[symbol];
            // 如果前端没有传到有效的现价则手动获取
            if (!buyPrice || !sellPrice) {
              const latestPriceRes = await ctx.service.ccrHuobi.latestOpenPrice(
                {
                  symbol,
                }
              );
              // 买价
              buyPrice = latestPriceRes.buy;
              // 卖价
              sellPrice = latestPriceRes.sell;
            }
            buyPrice_map[item.symbol] = buyPrice;
            // 建仓间隔
            const store_split = await ctx.service.ccrHuobiFormula.store_split({
              symbol,
              sellPrice,
              max_trade_order,
            });

            store_split_map[item.symbol] = store_split;
            // 交易倍数
            const trade_times = await ctx.service.ccrHuobiFormula.trade_times({
              budget: average_budget,
              min_trade_amount: target_symbol['min-order-amt'],
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
      // 任意一个交易倍数不满足要求都会reject
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
        const theoreticalBuildPriceMap = await ctx.service.ccrHuobiFormula.averagePrice(
          {
            min_trade_amount: target_symbol['min-order-amt'],
            price: buyPrice_map[symbol],
            policy_series,
            store_split: store_split_map[symbol],
          }
        );
        // 当前货币对的拟交易情况
        const cur_symbol = purpose_trade_sition.find(v => v.symbol === symbol);
        const {
          amount_precision, //  交易对基础币种计数精度
          price_precision, // 交易对报价的精度
          value_precision, // 交易金额的精度
          min_order_amt, //  交易对最小下单量
          min_order_value, // 最小下单金额
        } = await ctx.service.ccrHuobiFormula.getSymbolCondition(item.symbol);
        // 计算每单买入量
        const buy_volume = await ctx.service.ccrHuobiFormula.buy_volume({
          symbol,
          policy_series,
          trade_times: cur_symbol.trade_times,
          min_trade_amount: target_symbol['min-order-amt'],
        });

        // 任意一单买入量小于最小下单量都要重新设置
        if (Object.values(buy_volume).some(v => v - min_order_amt < 0)) {
          ctx.service.handleErrors.throw_error(
            `${
              item.symbol
            } 的最小下单量是${min_order_amt},您的每单买入量为${JSON.stringify(
              buy_volume
            )}`
          );
        }
        // 如果第一单买入量* 现价< 最小下单金额
        // if (Object.values(buy_volume)[0] * buyPrice - min_order_value < 0) {
        //   ctx.service.handleErrors.throw_error(
        //     `${item.symbol} 首单买入金额小于最小下单金额${min_order_value}`
        //   );
        // }
        // 计价货币
        const quote_currency = target_symbol['quote-currency'];
        const redis_key = `trade-condition_${signId}_${symbol}`;

        // const old_redis_value = await app
        //   .curl(
        //     `${app.config.huobiServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        //     {
        //       method: "GET",
        //       dataType: "json"
        //     }
        //   )
        //   .then(res => res.data);

        const redis_value = {
          // ...old_redis_value,
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
          min_order_value, // 最小下单金额
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
          is_stop_profit_trace, // 是否启用追踪止盈 0否1是
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
      // ctx.logger.error('coin_pair_choice_attribute', d, res);

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
      app.curl(`${app.config.huobiServer.url}/setRedis`, {
        method: 'POST',
        dataType: 'json',
        data: handleRedisData,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      });
      return settingRes.concat(trade_times_err_arr);
    } catch (e) {
      ctx.logger.error(e);
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
    tradePlatformApiBindProductComboId,
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
    const redis_key = `trade-condition_${signId}_${symbol}`;
    const handleRedisData = deepCopy(redisRule);
    const redis_value = await app
      .curl(
        `${app.config.huobiServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
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
      coinPairChoiceId,
      policy_series,
      leverage,
      budget,
      max_trade_order,
    } = redis_value;
    // 计价货币
    // const quote_currency = target_symbol['quote-currency'];
    // 火币余额
    const balanceRes = await app
      .curl(`${app.config.huobiServer.url}/balance/${signId}`, {
        method: 'POST',
        dataType: 'json',
        data: {
          secret,
          robotId,
        },
      })
      .then(res => res.data)
      .then(filterHuobiResponse);

    const balanceList = balanceRes.list;
    // 计价货币余额
    const currency_balance = balanceList.find(
      item => item.currency === quote_currency
    );

    if (!currency_balance) {
      ctx.service.handleErrors.throw_error(currency_balance);
    }

    // 重新算交易倍数和买入量
    // 如果前端没有传入现价则手动获取现价
    if (!buyPrice || !sellPrice) {
      const latestPriceRes = await ctx.service.ccrHuobi.latestOpenPrice({
        symbol,
      });
      buyPrice = latestPriceRes.buy;
      sellPrice = latestPriceRes.sell;
    }
    // 建仓间隔
    const store_split = await ctx.service.ccrHuobiFormula.store_split({
      symbol,
      sellPrice,
      max_trade_order,
    });
    const lastBuildPrice = await ctx.service.ccrHuobiFormula.lastBuildPrice({
      openPrice: buyPrice,
      max_trade_order,
      store_split,
    });
    const trade_times = await ctx.service.ccrHuobiFormula.trade_times({
      budget,
      min_trade_amount: target_symbol['min-order-amt'],
      price: buyPrice,
      store_split,
      policy_series,
      leverage,
      coin_pairs_num: 1,
    });
    // 理论建仓价
    const theoreticalBuildPriceMap = await ctx.service.ccrHuobiFormula.averagePrice(
      {
        min_trade_amount: target_symbol['min-order-amt'],
        price: buyPrice,
        policy_series,
        store_split,
      }
    );
    //
    const buy_volume = await ctx.service.ccrHuobiFormula.buy_volume({
      symbol,
      policy_series,
      trade_times,
      min_trade_amount: target_symbol['min-order-amt'],
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
      zsetName: `${symbol}_zset`,
      value: 1,
      key: redis_key,
    });
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
  async pause_trade({ symbol, signId, tradePlatformApiBindProductComboId }) {
    const { ctx, app } = this;
    const redis_key = `trade-condition_${signId}_${symbol}`;
    const redis_value = await app
      .curl(
        `${app.config.huobiServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
    const { userId, symbol_id, coinPairChoiceId, trade_status } = redis_value;
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
      ctx.service.handleErrors.throw_error(res);
    }

    //  监控价格，停止买入，只进行止盈
    // TODO temp commit  @fsg 2019.9.25
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
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
  @time:2019-09-02 10:09:06
  @params
  @description:恢复买入 trade_status变回1
  */
  async recover_buy({ symbol, signId, tradePlatformApiBindProductComboId }) {
    const { ctx, app } = this;
    const redis_key = `trade-condition_${signId}_${symbol}`;
    // 恢复买入
    const redis_value = await app
      .curl(
        `${app.config.huobiServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
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
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
  async reset_symbol({ symbol, signId, userId, symbol_id, coinPairChoiceId }) {
    const { ctx, app } = this;
    const res = await ctx.service.aliyunApiGateway
      .index('/coin_pair_choice/', 'put', 'default_handle_result', {
        coinPairId: symbol_id,
        id: coinPairChoiceId,
        isStart: 1, //
        orderStatus: 0,

        userId,
      })
      .then(res => filterJavaResponse(ctx, res));
    if (!res) {
      ctx.service.handleErrors.throw_error(res);
    }
    const redis_key = `trade-condition_${signId}_${symbol}`;
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
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
    const redis_key = `trade-condition_${signId}_${symbol}`;
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
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
    const redis_key = `trade-condition_${signId}_${symbol}`;
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
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
  async forget_orders({ symbol, signId, tradePlatformApiBindProductComboId }) {
    const { ctx, app } = this;
    const redis_key = `trade-condition_${signId}_${symbol}`;
    const java_key = `trade-java_${signId}_${symbol}`;
    const info = await app
      .curl(`${app.config.huobiServer.url}/mergeRequest`, {
        method: 'POST',
        dataType: 'json',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
        data: [
          {
            key: redis_key,
            type: 'Hash',
          },
          {
            key: java_key,
            type: 'Hash',
          },
        ],
      })
      .then(res => res.data);
    const {
      userId,
      symbol_id,
      cur_groupId,
      coinPairChoiceId,
      trade_status,
    } = info[redis_key];

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
      const { real_time_earning_ratio } = info[java_key];
      const orderRes = ctx.service.aliyunApiGateway.index(
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
      zsetName: `${symbol}_zset`,
      value: 0,
      key: redis_key,
    });
    handleRedisData.hash.hdel.push({
      table: 'huobi-not-finished-buy-order',
      field: redis_key,
    });
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
    tradePlatformApiBindProductComboId,
    // TODO
    userId,
    symbol_id,
    coinPairChoiceId,
    finished_order,
    sellPrice,
  }) {
    const { ctx, app } = this;
    // const redis_key = `trade-condition_${signId}_${symbol}`;
    // ctx.logger.error("target_symbol.finished_order", finished_order);
    // const handleRedisData = deepCopy(redisRule);

    // 如果还没有买入第一单即finished_order为0的情况下点了清仓卖出
    if (!(finished_order - 0)) {
      // handleRedisData.zset.zadd.push({
      //   zsetName: `${symbol}_zset`,
      //   value: 1,
      //   key: redis_key
      // });
      ctx.service.handleErrors.throw_error('该货币对还没有买入');
    }

    const obj = {
      symbol,
      signId,
      sellType: 'clear', // 清仓
      sellPrice,
      // real_time_earning_ratio
    };
    const sellRes = await app
      .curl(`${app.config.huobiServer.url}/sell`, {
        method: 'POST',
        dataType: 'json',
        data: obj,
      })
      .then(res => res.data);
    console.log('sellRes', sellRes);
    if (!sellRes || sellRes.name === 'Error') {
      ctx.service.handleErrors.throw_error(sellRes.errors.message);
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
    const { symbol, symbol_id, signId, ...props } = body;
    const {
      id,
      emit_ratio, // 追踪止盈触发比例
      turn_down_ratio, // 追踪止盈回降比例
      stopProfitFixedRate, // 固定止盈比例
      is_use_follow_target_profit, // 是否启用追踪止盈
      target_profit_price, // 止盈金额
    } = props;

    const redis_key = `trade-condition_${signId}_${symbol}`;

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
      console.time('setRedis');
      const setRedisRes = await app.curl(`${app.config.huobiServer.url}/setRedis`, {
        method: 'POST',
        dataType: 'json',
        data: handleRedisData,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      }).then(res => res.data);
      // TODO 重新算交易倍数和买入量@fsg 2019.11.19
      console.timeEnd('setRedis');
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
    const redis_key = `trade-condition_${signId}_${symbol}`;
    const redis_value = await app
      .curl(
        `${app.config.huobiServer.url}/getRedisValueByKey?key=${redis_key}&type=Hash`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);

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
      table: 'huobi-not-finished-buy-order',
      field: redis_key,
    });
    handleRedisData.zset.zrem.push({
      zsetName: `${symbol}_zset`,
      key: redis_key,
    });
    app.curl(`${app.config.huobiServer.url}/setRedis`, {
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
      const i = this.pause_trade(item);
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
  async batch_recover_buy({ list }) {
    list = JSON.parse(list);
    const promiseArr = [];
    for (const item of list) {
      const i = this.recover_buy(item);
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
      const i = this.sell_all_orders(item);
      promiseArr.push(i);
    }
    const res = await Promise.all(promiseArr);
    return res;
  }
}
module.exports = CCRHuobiService;
