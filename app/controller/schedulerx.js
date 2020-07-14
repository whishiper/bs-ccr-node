'use strict';

const Controller = require('egg').Controller;

class SchedulerxController extends Controller {
  async symbol_cache() {
    const { ctx } = this;
    await ctx.service.schedulerx.symbolCache.subscribe();
  }
  async pollSymbolPrice() {
    const { ctx } = this;
    await ctx.service.schedulerx.pollSymbolPrice.subscribe();
  }
  async loadIpList() {
    const { ctx } = this;
    await ctx.service.schedulerx.loadIpList.subscribe();
  }
  async pollNotFinishedOrder() {
    const { ctx } = this;
    await ctx.service.schedulerx.pollNotFinishedOrder.subscribe();
  }
  async quoteCoinKline() {
    const { ctx } = this;
    await ctx.service.schedulerx.quoteCoinKline.subscribe();
  }
}
module.exports = SchedulerxController;
