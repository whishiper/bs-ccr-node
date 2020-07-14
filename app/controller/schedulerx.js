'use strict';

const Controller = require('egg').Controller;

class SchedulerxController extends Controller {
  async symbol_cache() {
    const { ctx } = this;
    await ctx.service.schedulerx.symbolCache.subscribe();
  }
}
module.exports = SchedulerxController;
