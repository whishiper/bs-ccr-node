'use strict';

const Service = require('egg').Service;
const { ipList, disableList, serverIp } = require('../utils/ipList');
// const { removePort } = require('../utils/tool');
class IpService extends Service {
  async getServerIp() {
    return serverIp;
  }
  async getRandomIp() {
    // 从给定区间返回随机数 etc:[0,11]===>7
    const getRandomInRange = (start, end) => {
      const split = end - start;
      return start + Math.floor(Math.random() * split);
    };
    const randomIndex = getRandomInRange(0, ipList.length);
    const targetIp = ipList[randomIndex];
    return targetIp;
  }
  // 分配ip
  async getIp(query) {
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        robotId: {
          required: true,
          type: 'string',
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const { robotId } = query;
    if ([ undefined, null ].includes(robotId)) {
      ctx.service.handleErrors.throw_error([ '还未绑定机器人' ]);
    }
    const ip_key = `ip_robotId_${robotId}`;
    const flag = await app.redis.exists(ip_key);
    if (flag) {
      const v = await app.redis.get(ip_key);
      if (!disableList.includes(v)) {
        return {
          address: v,
          serverIp,
        };
      }
    }
    // 一个Set最多对应的用户数量
    const max = 50;
    // 从给定区间返回随机数 etc:[0,11]===>7
    const getRandomInRange = (start, end) => {
      const split = end - start;
      return start + Math.floor(Math.random() * split);
    };
    // 从列表中随机获取一个ip查看 该ip的redis Set 成员数量是否还可以添加新用户
    (async function digui(arr) {
      if (!arr.length) {
        ctx.service.handleErrors.throw_error('没有合适的ip了');
        return;
      }
      // ('arr', arr.length);
      const randomIndex = getRandomInRange(0, arr.length);
      const targetIp = ipList[randomIndex];
      const ip_set_key = `ip_set_${targetIp}`;
      const total = await app.redis.scard(ip_set_key);
      // ('total', total);
      if (total < max) {
        app.redis.sadd(ip_set_key, ip_key);
        app.redis.set(ip_key, targetIp);
        // ('targetIp', targetIp);
        return {
          address: targetIp,
          serverIp,
        };
      }
      arr.splice(randomIndex);
      return digui(arr);
    })(ipList);
  }
  /*
  @author:fsg
  @time:2019-10-16 22:32:51
  @params
  @description:更换ip
  */
  async setIp(query) {
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        robotId: {
          required: true,
          type: 'string',
          min: 1,
        },
        // 排除某ip
        excludeIp: {
          required: true,
          type: 'string',
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    const { robotId, excludeIp } = query;
    if ([ undefined, null ].includes(robotId)) {
      ctx.service.handleErrors.throw_error([ '还未绑定机器人' ]);
    }
    const ip_key = `ip_robotId_${robotId}`;

    const _ip_list = ipList.filter(item => item !== excludeIp);
    // 一个Set最多对应的用户数量
    const max = 50;
    // 从给定区间返回随机数 etc:[0,11]===>7
    const getRandomInRange = (start, end) => {
      const split = end - start;
      return start + Math.floor(Math.random() * split);
    };
    // 从列表中随机获取一个ip查看 该ip的redis Set 成员数量是否还可以添加新用户
    (async function digui(arr) {
      if (!arr.length) {
        ctx.service.handleErrors.throw_error('没有合适的ip了');
        return;
      }
      // ('arr', arr.length);
      const randomIndex = getRandomInRange(0, arr.length);
      const targetIp = _ip_list[randomIndex];
      const ip_set_key = `ip_set_${targetIp}`;
      const total = await app.redis.scard(ip_set_key);
      // ('total', total);
      if (total < max) {
        if (excludeIp) {
          app.redis.srem(`ip_set_${excludeIp}`, ip_key);
        }
        app.redis.sadd(ip_set_key, ip_key);
        app.redis.set(ip_key, targetIp);
        // ('targetIp', targetIp);
        return {
          address: targetIp,
        };
      }
      arr.splice(randomIndex);
      return digui(arr);
    })(_ip_list);
  }
}
module.exports = IpService;
