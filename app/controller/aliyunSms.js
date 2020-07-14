'use strict';

const Controller = require('egg').Controller;

class AliyunSmsController extends Controller {

  async loginCode() {
    const { ctx, config } = this;

    ctx.body = await ctx.service.aliyunSms.sendCode(config.aliyunSms.loginTemplate);

  }

  async registerCode() {
    const { ctx, config } = this;

    ctx.body = await ctx.service.aliyunSms.sendCode(config.aliyunSms.registerTemplate);

  }

  async resetPasswordCode() {
    const { ctx, config } = this;

    ctx.body = await ctx.service.aliyunSms.sendCode(config.aliyunSms.resetPasswordTemplate);

  }

  async resetTelCode() {
    const { ctx, config } = this;

    ctx.body = await ctx.service.aliyunSms.sendCode(config.aliyunSms.replacePhoenTemplate);

  }

  async userLogin() {
    const { ctx, app, config } = this;

    const isUser = await this.isUser();

    ctx.service.handleErrors.is_throw_error_with_condition(
      !((typeof isUser === 'object') && Reflect.has(isUser, 'message') && Reflect.get(isUser, 'message') !== 'false'), [ '用户不存在' ]);

    let apiToken;
    // ctx.service.handleErrors.throw_error_data_format('type', [ 'login_error_time', '超过登录验证次数' ]);
    // ctx.service.handleErrors.throw_error_data_format('type', [ 'login_error_time' ]);
    if (ctx.request.body.password) {

      const login_error_time = await app.redis.get('internal').get('login_error_time_' + ctx.request.body.tel);
      if (login_error_time && parseInt(login_error_time) > app.config.auth.login_error_time) {
        const result = await ctx.service.captcha.validateCode({ type: 'login' });

        ctx.service.handleErrors.is_throw_error_with_condition(!result, [ '验证码输入不正确' ]);
      }

      apiToken = await ctx.service.auth.login();

    } else if (ctx.request.body.code) {

      const result = await ctx.service.aliyunSms.validateCode(config.aliyunSms.loginTemplate);

      ctx.service.handleErrors.is_throw_error_with_condition(!result, [ '验证码错误' ]);

      apiToken = await ctx.service.auth.login();

    } else {
      ctx.service.handleErrors.throw_error([ '请选择密码登录或者手机号码登录其中一种方式' ]);
    }

    ctx.body = apiToken;


  }


  async userRegister() {
    const { ctx, config, app } = this;
    const result = await ctx.service.aliyunSms.validateCode(config.aliyunSms.registerTemplate);

    ctx.service.handleErrors.is_throw_error_with_condition(!result, [ '验证码错误' ]);

    const registerResult = await ctx.service.aliyunApiGateway.index();

    ctx.service.handleErrors.is_throw_error_with_condition(!(ctx.status >= 200 && ctx.status < 300), registerResult, ctx.status);

    const apiToken = await ctx.service.aliyunApiGateway.index('/api/auth/user_login', 'post');

    if (Reflect.has(apiToken, 'access_token') && Reflect.has(apiToken, 'expires_in')) {
      const token = app.jwt.sign(
        { access_token: Reflect.get(apiToken, 'access_token') },
        app.config.jwt.secret,
        { expiresIn: Reflect.get(apiToken, 'expires_in') }
      );
      Reflect.set(apiToken, 'access_token', token);
    }

    ctx.body = apiToken;

  }
}

module.exports = AliyunSmsController;
