'use strict';

const Controller = require('egg').Controller;
class RedisController extends Controller {
  async symbolList() {
    const { ctx, app } = this;
    const { body } = ctx.request;
    const { symbolRedisKeyList } = body;
    if (!symbolRedisKeyList) {
      ctx.body = [];
    } else {
      // symbolRedisKeyList只有一个元素会拿不到数组，而是string，很奇怪
      if (Array.isArray(symbolRedisKeyList)) {
        const arr = symbolRedisKeyList.map(item => app.redis.hgetall(item));
        ctx.body = await Promise.all(arr);
      } else {
        const obj = await app.redis.hgetall(symbolRedisKeyList);
        ctx.body = [ obj ];
      }
    }
  }
  async set() {
    const { ctx, app } = this;
    const { body } = ctx.request;

    if (Reflect.has(body, 'string')) {
      if (body.string.set) {
        const list = Reflect.get(body.string, 'set');
        for (const item of list) {
          const { key, value } = item;
          app.redis.set(key, value);
        }
      }
      if (body.string.del) {
        const list = Reflect.get(body.string, 'del');
        for (const item of list) {
          app.redis.del(item);
        }
      }
    }
    if (Reflect.has(body, 'hash')) {
      if (body.hash.hset) {
        const list = Reflect.get(body.hash, 'hset');
        for (const item of list) {
          const { table, field, value } = item;
          app.redis.hset(table, field, value);
        }
      }
      if (body.hash.hdel) {
        const list = Reflect.get(body.hash, 'hdel');
        for (const item of list) {
          const { table, field } = item;
          app.redis.hdel(table, field);
        }
      }
    }
    if (Reflect.has(body, 'zset')) {
      if (body.zset.zadd) {
        const list = Reflect.get(body.zset, 'zadd');
        for (const item of list) {
          const { zsetName, value, key } = item;
          app.redis.zadd(zsetName, value, key);
        }
      }
      if (body.zset.zrem) {
        const list = Reflect.get(body.zset, 'zrem');
        for (const item of list) {
          const { zsetName, key } = item;
          app.redis.zrem(zsetName, key);
        }
      }
    }
    if (Reflect.has(body, 'set')) {
      const list = Reflect.get(body.set, 'sadd');
      for (const item of list) {
        const { key, value } = item;
        app.redis.sadd(key, value);
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
      ctx.service.handleErrors.throw_error(errors);
    }
    let { key, type } = query;
    const flag = await app.redis.exists(key);
    if (!flag) {
      // ctx.service.handleErrors.throw_error(`redis 中无${key}`);
      ctx.body = null;
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
  // 统一删除 如 okex-trade-condition_12345_${symbol}
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
  // 统一替换secret 如 okex-trade-condition_12345_${symbol}
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
