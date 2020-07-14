'use strict';
/**
 * aliYunApi下的router.js只是展现api路由，
 * 真正实现路由生效在getAliYunApi.js文件中
 */
class getAliYunApi {
  constructor(app) {
    this.app = app;
  }

  async get(name, param) {
    const params = { RegionId: 'cn-shenzhen' };
    const requestOption = { method: 'POST', timeout: 10000 };
    try {
      // aliyunPopCore  aliCloudPopCore
      return await this.app.aliyunPopCore.request(
        name,
        Object.assign(params, param),
        requestOption
      );
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * 获取授权的api列表信息
   * @param params
   * @return {Promise<*>}
   */
  async describeAuthorizedApis(params) {
    return await this.get('DescribeAuthorizedApis', params);

  }

  /**
   * 添加路由
   * @param describeApis
   */
  addRoutes(describeApis) {

    const { router, controller, jwt } = this.app;

    if (describeApis.length > 0) {
      describeApis.forEach(item => {
        if (item != null && typeof item === 'object' && Reflect.has(item, 'RequestConfig')) {
          const method = item.RequestConfig.RequestHttpMethod.toLowerCase();
          const url = item.RequestConfig.RequestPath.replace(/\[/g, ':').replace(/\]/g, '');

          router[method](url, jwt, controller.aliyunApiGateway.index);
        }

      });
    }

  }

  /**
   * 写入文档文件
   * @param describeApis
   * @return {string}
   */
  writeRouteFile(describeApis) {
    const fs = require('fs');

    let apiFile =
      "'use strict';\nmodule.exports = app => {\n  const { router, controller, jwt } = app;\n";

    if (describeApis.length > 0) {
      describeApis.forEach(item => {
        if (item != null && typeof item === 'object' && Reflect.has(item, 'RequestConfig')) {
          const description = item.Description;
          const method = item.RequestConfig.RequestHttpMethod.toLowerCase();
          const url = item.RequestConfig.RequestPath.replace(/\[/g, ':').replace(/\]/g, '');
          const router = ` router.${method}('${url}', jwt, controller.aliyunApiGateway.index);`;

          apiFile = `${apiFile}  // ${description}\n ${router}\n`;
        }

      });

    }

    apiFile = `${apiFile}};\n`;
    const fileUrl = `${process.cwd()}/aliYunApi/router.js`;
    const ws = fs.createWriteStream(fileUrl);
    ws.write(Buffer.from(apiFile), 'UTF8');
    ws.end();

    return apiFile;

  }

  async describeApis(authorizedApi) {
    const describeApi = [];

    if (authorizedApi.length > 0 && authorizedApi != null) {
      for (const item of authorizedApi) {
        describeApi.push(this.get('DescribeApi', { ApiId: item.ApiId }));
      }
    }

    return await Promise.all(describeApi);
  }

  async describeApi(params) {
    return await this.get('DescribeApi', params);
  }

  // 获取分组线上api
  async describeDeployedApis(params) {
    return await this.get('DescribeDeployedApis', Object.assign(params, { StageName: 'RELEASE' }));
  }

  // 下线 线上api
  async abolishApi(params) {
    return await this.get('AbolishApi', Object.assign(params, { StageName: 'RELEASE' }));
  }

  // 删除api
  async deleteApi(params) {
    return await this.get('DeleteApi', params);
  }

  // 删除api组下所有api
  async deleteGroupAllApi(params) {

    const that = this;
    this.describeDeployedApis(params).then(apiData => {
      if (apiData && Reflect.has(apiData, 'DeployedApiItem')) {
        const deployedApiItem = Reflect.get(apiData, 'DeployedApiItem');
        deployedApiItem.forEach(async item => {
          await that.abolishApi(Object.assign(params, { ApiId: item.ApiId }));
          await that.deleteApi(Object.assign(params, { ApiId: item.ApiId }));
        });
      }
    });
  }
}

module.exports = getAliYunApi;
