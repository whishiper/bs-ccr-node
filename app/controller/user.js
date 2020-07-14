'use strict';

const Controller = require('egg').Controller;

class User extends Controller {
  async addUserTime() {
    const { app, ctx } = this;
    const { userId, time } = ctx.request.body;
    // const addT = (new Date()).getTime();
    let userTime = app.redis.get('internal').get(userId);
    if (userTime) {
      userTime = userTime + time;
    }
    app.redis.get('internal').set(userId, userTime);
    ctx.status = 200;
    // ctx.body = {
    //   access_token: token,
    //   expires_in: app.config.jwt.expiresIn,
    // };
  }
}

module.exports = User;
