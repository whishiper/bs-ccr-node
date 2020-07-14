'use strict';

const Service = require('egg').Service;
class JudgeRedisService extends Service {
  /*
    @author:fsg
    @time:2019-08-05 10:28:45
    @params
     key: redis 中的key
     cn_name: 该key的中文意思
    @description:
    */
  async ifKeyExist(key, cn_name = '') {
    const { app, ctx } = this;
    const flag = await app.redis.get('internal').exists(key);
    if (flag) {
      return true;
    }
    ctx.service.handleErrors.throw_error([ `redis 中还不存在 ${key},没有${cn_name}信息` ]);
  }
  async getAllKeys() {
    return await this.app.redis.get('internal').keys('*');
  }
  async getRedisValue(key) {
    const { app, ctx } = this;
    const flag = await app.redis.get('internal').exists(key);
    if (flag) {
      return JSON.parse(await app.redis.get('internal').get(key));
    }
    ctx.service.handleErrors.throw_error([ `redis 中还不存在 ${key}` ]);
  }
}
module.exports = JudgeRedisService;
