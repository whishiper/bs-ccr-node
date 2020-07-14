/** @Author : YuXueWen
 * @File : request.js
 * @Email : 8586826@qq.com
 **/

'use strict';
const Controller = require('egg').Controller;
const { formatTime } = require('../utils/tool');

class SymbolController extends Controller {
  addSymbol(obj) {
    const { app, ctx } = this;

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
        tradePlatformApiBindProductComboId: {
          required: true,
          type: 'string',
          min: 1,
        },
      },
      obj
    );

    const {
      secret,
      signId,
      robotId,
      userId,
      symbol_id,
      symbol,
      account_id,
      tradePlatformApiBindProductComboId,
    } = obj;


    if (errors) {
      ctx.service.handleErrors.throw_error(errors);
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
      userId,
      account_id,
      trade_status: '0',
      old_trade_status: '0', // 用户保存前一个的交易状态
      createDate: formatTime(new Date()),
      updateDate: formatTime(new Date()),
    };
    // 提交java成功再添加到redis
    const _redis = app.redis.get('external_huobi');
    for (const [ field, value ] of Object.entries(redis_value)) {
      if (typeof value === 'object') {
        _redis.hset(redis_key, field, JSON.stringify(value));
      } else {
        _redis.hset(redis_key, field, value);
      }
    }

    // 提交java成功再添加到redis
    for (const [ field, value ] of Object.entries(redis_value)) {
      if (typeof value === 'object') {
        app.redis.hset(redis_key, field, JSON.stringify(value));
      } else {
        app.redis.hset(redis_key, field, value);
      }
    }

    // java可操作redis_key 该hash表中的数据
    app.redis.zadd(`${symbol}_zset`, 1, redis_key);

    // 增加自选货币对
    app.redis.sadd('huobi_choice_symbol_list', symbol);

    // 获取该货币对K线
    ctx.service.commonApi.kline({ symbol });
  }

}
module.exports = SymbolController;
