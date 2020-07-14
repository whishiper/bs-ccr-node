'use strict';

const Controller = require('egg').Controller;
const { isJSON } = require('../utils/tool');
class RedisController extends Controller {
  async symbolList() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const { symbolRedisKeyList } = body;
    // console.log('enter redis symbolList', new Date());
    if (!symbolRedisKeyList) {
      ctx.body = [];
    } else {
      const arr = symbolRedisKeyList.map(item => app.redis.hgetall(item));
      ctx.body = await Promise.all(arr);
    }
  }
  async setRedis() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    // isJSON(body) ? body = JSON.parse(body) : '';
    if (Reflect.has(body, 'string')) {
      if (body.string.set) {
        const list = Reflect.get(body.string, 'set');
        for (const item of list) {
          const { key, value } = item;
          await app.redis.set(key, value);
        }
      }
      if (body.string.del) {
        const list = Reflect.get(body.string, 'del');
        for (const item of list) {
          await app.redis.del(item);
        }
      }
    }
    if (Reflect.has(body, 'hash')) {
      if (body.hash.hset) {
        const list = Reflect.get(body.hash, 'hset');

        for (const item of list) {
          const { table, field, value } = item;
          await app.redis.hset(table, field, value);
        }
      }
      if (body.hash.hdel) {
        const list = Reflect.get(body.hash, 'hdel');

        for (const item of list) {
          const { table, field } = item;
          await app.redis.hdel(table, field);
        }
      }
    }
    if (Reflect.has(body, 'zset')) {
      if (body.zset.zadd) {
        const list = Reflect.get(body.zset, 'zadd');

        for (const item of list) {
          const { zsetName, value, key } = item;
          await app.redis.zadd(zsetName, value, key);
        }
      }
      if (body.zset.zrem) {
        const list = Reflect.get(body.zset, 'zrem');
        for (const item of list) {
          const { zsetName, key } = item;
          await app.redis.zrem(zsetName, key);
        }
      }
    }
    if (Reflect.has(body, 'set')) {
      const list = Reflect.get(body.set, 'sadd');
      for (const item of list) {
        const { key, value } = item;
        await app.redis.sadd(key, value);
      }
    }
    ctx.body = {
      data: 1,
      msg: 'success',
    };
  }
  async get() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        key: {
          required: true,
          type: 'string',
          //   max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    let { key, type } = query;
    const flag = await app.redis.exists(key);
    if (!flag) {
      ctx.body = null;
      // ctx.service.handleErrors.throw_error(`redis 中无${key}`);
    }
    if (!type) {
      type = 'String';
    }

    const op = {
      String: async () => app.redis.get(key),
      Hash: async () => app.redis.hgetall(key),
      Set: async () => app.redis.smembers(key),
    };
    const res = await op[type]();

    // const res = await app.redis.get(key);

    ctx.body = res;
  }
  // 合并请求多个key的数据
  async mergeRequest() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    /**
     * body:[{
     *  key:'trade-condition_${signId}_${symbol}',
     *  type:'Hash'
     * },{
     * key:'trade-java_${signId}_${symbol}',
     * type:'Hash'
     * }]
     */
    const obj = {};
    for (const item of body) {
      const { type, key } = item;
      const op = {
        String: async () => app.redis.get(key),
        Hash: async () => app.redis.hgetall(key),
        Set: async () => app.redis.smembers(key),
      };
      try {
        const res = await op[type]();
        obj[key] = res;
      } catch (err) {
        obj[key] = null;
      }
    }
    ctx.body = obj;
  }
  async zrevrangebyscore() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const { key, type } = query;
    const res = await app.redis.zrevrangebyscore(key, type, type);
    ctx.body = res;
  }
  async getAllKeys() {
    return await this.app.redis.keys('*');
  }
  // 统一删除 如 trade-condition_12345_${symbol}
  async delKeysByKeyword() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        keyword: {
          required: true,
          type: 'string',
          //   max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const { keyword } = body;
    const [ cursor, arr ] = await app.redis.scan(0, 'match', `${keyword}*`);
    arr.forEach(key => {
      app.redis.hdel(key);
    });
  }
  // 统一替换secret 如 trade-condition_12345_${symbol}
  async replaceSecretByKeyword() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const errors = app.validator.validate(
      {
        keyword: {
          required: true,
          type: 'string',
          //   max: 100,
          min: 1,
        },
        secret: {
          required: true,
          type: 'string',
          //   max: 100,
          min: 1,
        },
      },
      body
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const { keyword, secret } = body;
    console.log('keyword', keyword);
    // 递归替换所有匹配的hash里面的secret
    const digui = async (cur_cursor = 0) => {
      console.log('cur_cursor', cur_cursor);
      const [ cursor, arr ] = await app.redis.scan(cur_cursor, 'match', `${keyword}*`);
      console.log(cursor, arr);
      if (cursor - 0 !== 0) {
        digui(cursor);
      }
      for (const item of arr) {
        app.redis.hset(item, 'secret', secret);
      }
    };
    digui();
  }
  // 判断是否有该key
  async checkKey() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        key: {
          required: true,
          type: 'string',
          //   max: 100,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const { key } = query;
    return await app.redis.exists(key);
  }
}
module.exports = RedisController;
