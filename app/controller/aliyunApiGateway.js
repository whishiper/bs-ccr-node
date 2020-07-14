'use strict';

const Controller = require('egg').Controller;

class AliyunApiGatewayController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = await ctx.service.aliyunApiGateway.index();
  }
}

module.exports = AliyunApiGatewayController;
