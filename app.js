'use strict';

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  async configWillLoad() {
    const { app } = this;

    const acmConfig = app.options.acmConfig;
    console.log('--------------app acmConfig--------------', acmConfig);
    if (acmConfig != null) {
      const acmConfToJson = JSON.parse(acmConfig);
      if (typeof acmConfToJson === 'object') {
        Object.keys(acmConfToJson).forEach(item => {
          app.config[item] = app.config[item] || {};

          Reflect.get(acmConfToJson, item)
            ? Object.assign(app.config[item], Reflect.get(acmConfToJson, item))
            : '';
        });
      }
    }
  }

  async willReady() {
    // 获取agent的api信息，然后加入路由
    const getAliYunApi = require('./aliYunApi/getAliYunApi.js');
    const aliyunApiGatewayClient = new getAliYunApi(this.app);

    this.app.messenger.on('describeApis', describeApis => {
      aliyunApiGatewayClient.addRoutes(describeApis);
    });
  }

  async didReady() {
    const { app } = this;

    const ctx = await app.createAnonymousContext();
    ctx.service.ws.wsHuobi.init();
    ctx.service.ws.wsOkex.init();
    ctx.service.mq.internalWithExternal.init();
  }
}

module.exports = AppBootHook;
