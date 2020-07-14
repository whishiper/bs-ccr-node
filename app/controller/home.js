'use strict';
const { formatTime, guid } = require('../utils/tool');
const Controller = require('egg').Controller;
const ACMClient = require('acm-client').ACMClient;
const CryptoJS = require('crypto-js');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }
  async mqtt() {
    const { ctx } = this;
    const data = { type: 'updateSymbolPrice', plantFormName: 'huobi' };
    ctx.service.ws.wsHuobi.emit(data);
    ctx.body = {
      msg: 1,
    };
  }
  // 检查mq连接状况
  async checkMqConnection() {
    const { ctx, app } = this;
    const flag = await app.redis.get('internal').get('is_mq_connect_error');
    if (flag) {
      ctx.body = {
        code: false,
        msg: 'master mq connect error',
      };
      return;
    }
    ctx.body = {
      code: true,
      msg: 'master mq connect success',
    };
  }
  async mqttConf() {
    const { ctx } = this;
    const { env } = ctx.query;
    let acmClient;
    let acmConfig;
    // 默认获取test环境
    acmClient = new ACMClient({
      endpoint: 'acm.aliyun.com', // Available in the ACM console
      namespace: '62699127-15c2-4fb7-8bbb-5249df52b156', // Available in the ACM console
      accessKey: 'LTAI4FiW7ykVpsp1C3M2EBzg', // Available in the ACM console
      secretKey: 'hZZmISbQzKUucNPe2woxXFYa3aplaP',
      requestTimeout: 6000,
    });

    acmConfig = await acmClient.getConfig('test-egg-master', 'DEFAULT_GROUP');
    if (env === 'prod') {
      acmClient = new ACMClient({
        endpoint: 'addr-sz-internal.edas.aliyun.com', // Available in the ACM console
        namespace: '2a7ad9e5-927c-4499-a199-a978041d1281', // Available in the ACM console
        accessKey: 'LTAI4Fd1zNzk8YdGKrgF5ohp', // Available in the ACM console
        secretKey: 'aja6ZkZUeA11ZroIdOADMQRKzhSjOJ',
        requestTimeout: 6000,
      });

      acmConfig = await acmClient.getConfig('prod-egg-master', 'DEFAULT_GROUP');
    }
    const res = {};
    if (acmConfig) {
      acmConfig = JSON.parse(acmConfig);
      const mqtt = acmConfig && acmConfig.mqtt;
      const {
        accessKey,
        secretKey,
        instanceId,
        host,
        groupId,
        huobiTopicList,
        okexTopicList,
      } = mqtt;
      const clientId = `${groupId}@@@${guid()}`;
      const username = 'Signature|' + accessKey + '|' + instanceId;
      const password = CryptoJS.HmacSHA1(clientId, secretKey).toString(
        CryptoJS.enc.Base64
      );
      res.username = username;
      res.password = password;
      res.host = host;
      res.huobiTopicList = huobiTopicList;
      res.okexTopicList = okexTopicList;
      res.clientId = clientId;
      ctx.body = res;
    } else {
      ctx.body = res;
    }
  }
  async getTime() {
    const { ctx } = this;
    console.log(new Date(), formatTime(new Date()));
    ctx.body = formatTime(new Date());
  }
  async test_decrypt() {
    const { ctx } = this;
    const { body } = ctx.request;
    ctx.body = body;
  }
  async encrypt() {
    const { ctx } = this;
    const { value } = ctx.request.body;
    ctx.body = await ctx.service.secret.encrypt(value);
  }
  async decrypt() {
    const { ctx } = this;
    const { encryptedData } = ctx.request.body;
    ctx.body = await ctx.service.secret.decrypt(encryptedData);
  }

  async getIp() {
    const { ctx, app } = this;
    const { robotId } = ctx.request.query;

    const res = await app
      .curl(`${app.config.huobiServer.url}/getIp?robotId=${robotId}`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    ctx.body = res;
  }
  async currency() {
    const { ctx } = this;
    ctx.body = await ctx.service.ccrHuobi.currency();
  }
  // async getRedisValue() {
  //   const { ctx } = this;
  //   const { key } = ctx.request.query;
  //   ctx.body = await ctx.service.judgeRedis.getRedisValue(key);
  // }
  // async getAllKeys() {
  //   const { ctx } = this;
  //   ctx.body = await ctx.service.judgeRedis.getAllKeys();
  // }
}

module.exports = HomeController;
