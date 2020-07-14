'use strict';

const Controller = require('egg').Controller;

class coinPairs extends Controller {

  async searchCoinPairs() {

    const { ctx, app } = this;

    const errors = app.validator.validate({
      quot_currency_name: {
        required: true,
        type: 'string',
        max: 10,
        min: 1,
      },
      plantFormName: {
        required: true,
        type: 'string',
        max: 10,
        min: 1,
      },
    }, ctx.request.body);

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }
    const coinPairs = await ctx.service.coinPairs.searchCoinPairs();
    ctx.status = 200;
    ctx.body = {
      status: 200,
      data: coinPairs,
    };
  }

}

module.exports = coinPairs;
