'use strict';

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  configWillLoad() {
    const { app } = this;

    const acmConfig = app.options.acmConfig;
    if (acmConfig != null) {
      const acmConfToJson = JSON.parse(acmConfig);
      if (typeof acmConfToJson === 'object') {
        Object.keys(acmConfToJson).forEach(item => {

          app.config[item] = app.config[item] || {};

          Reflect.get(acmConfToJson, item) ?
            Object.assign(app.config[item], Reflect.get(acmConfToJson, item)) : '';

        });
      }
    }

  }


  async serverDidReady() {

    const { app } = this;


    // 配置网关路由
    const getAliYunApi = require('./aliYunApi/getAliYunApi.js');

    const params = {
      AppId: app.config.aliyunApiGateway.appId,
      PageSize: 50,
    };

    const aliyunApiGatewayClient = new getAliYunApi(app);

    const describeAuthorizedApis = await aliyunApiGatewayClient.get('DescribeAuthorizedApis', params);

    const totalCount = describeAuthorizedApis.TotalCount;

    if (totalCount > params.PageSize) {
      const requestPage = Math.ceil((totalCount - params.PageSize) / params.PageSize);

      for (let i = 1; i <= requestPage; i++) {
        Reflect.set(params, 'PageNumber', i + 1);

        await aliyunApiGatewayClient.get('DescribeAuthorizedApis', params).then(api => {
          describeAuthorizedApis.AuthorizedApis.AuthorizedApi = [
            ...describeAuthorizedApis.AuthorizedApis.AuthorizedApi,
            ...api.AuthorizedApis.AuthorizedApi,
          ];
        });
      }

    }

    const authorizedApis = describeAuthorizedApis.AuthorizedApis.AuthorizedApi;
    if (authorizedApis.length > 0) {
      const describeApis = await aliyunApiGatewayClient.describeApis(authorizedApis);

      this.app.messenger.sendToApp('describeApis', describeApis);
      aliyunApiGatewayClient.writeRouteFile(describeApis);
    }


  }


}

module.exports = AppBootHook;
