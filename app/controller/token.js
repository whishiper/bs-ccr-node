'use strict';

const Controller = require('egg').Controller;
const { base64encode } = require('nodejs-base64');

class Token extends Controller {
  // eslint-disable-next-line no-useless-constructor
  constructor(ctx) {
    super(ctx);

    this.aliyunApiGateway = ctx.service.aliyunApiGateway;
  }
  async oauthToken() {
    const { app, config, ctx } = this;
    const { oauth, auth } = config;

    const { username, password } = ctx.request.body;

    const author = base64encode(auth.client);

    this.aliyunApiGateway.setHeaders = { Authorization: `Basic ${author}` };
    this.aliyunApiGateway.query = {
      grant_type: 'password',
      username,
      password
    };

    return await this.aliyunApiGateway.post('/oauth/token');
  }

  async login() {
    const { ctx, app } = this;
    const errors = app.validator.validate(
      {
        username: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        password: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        }
      },
      ctx.request.body
    );

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }
    const data = await this.oauthToken();

    // 将user_id与对应token存储
    if (Reflect.has(data, 'user_id')) {
      const _userId = Reflect.get(data, 'user_id');
      const token = Reflect.get(data, 'access_token');
      await app.redis
        .get('internal')
        .hset('user_token_relation_table', _userId, token);
    }
    if (
      !(
        typeof data === 'object' &&
        Reflect.has(data, 'access_token') &&
        Reflect.has(data, 'expires_in')
      )
    ) {
      ctx.status = 422;
      ctx.body = data;
      return;
    }

    const token = app.jwt.sign(
      { access_token: Reflect.get(data, 'access_token') },
      app.config.jwt.secret,
      { expiresIn: Reflect.get(data, 'expires_in') }
    );
    Reflect.set(data, 'access_token', token);

    ctx.body = data;
  }

  async userRegister() {
    const { ctx, config, app } = this;
    const { oauth } = config;

    const errors = app.validator.validate(
      {
        username: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        password: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        tel: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        code: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        }
      },
      ctx.request.body
    );

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }

    const result = await ctx.service.aliyunSms.validateCode(
      config.aliyunSms.registerTemplate
    );

    ctx.service.handleErrors.is_throw_error_with_condition(!result, [
      '验证码错误'
    ]);

    this.aliyunApiGateway.setHeaders = { Authorization: '' };

    ctx.body = await this.aliyunApiGateway.post('/user/');
  }

  async userUpdatePassword() {
    const { ctx, config, app } = this;

    const errors = app.validator.validate(
      {
        id: {
          required: true,
          type: 'string',
          min: 1
        },
        password: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        tel: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        code: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        }
      },
      ctx.request.body
    );

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }
    const result = await ctx.service.aliyunSms.validateCode(
      config.aliyunSms.resetPasswordTemplate
    );

    ctx.service.handleErrors.is_throw_error_with_condition(!result, [
      '验证码错误'
    ]);

    const { id, password } = ctx.request.body;
    ctx.body = await ctx.service.aliyunApiGateway.index(
      `/user/update_password/${id}?password=${password}`,
      'put'
    );
  }

  async userForgetPassword() {
    const { ctx, config, app } = this;
    const { oauth } = config;

    const errors = app.validator.validate(
      {
        password: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        tel: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        code: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        }
      },
      ctx.request.body
    );

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }
    const result = await ctx.service.aliyunSms.validateCode(
      config.aliyunSms.resetPasswordTemplate
    );

    ctx.service.handleErrors.is_throw_error_with_condition(!result, [
      '验证码错误'
    ]);

    const { tel, password } = ctx.request.body;

    const aliyunApiGateway = ctx.service.aliyunApiGateway;
    aliyunApiGateway.setHeaders = { Authorization: '' };

    ctx.body = await aliyunApiGateway.index(
      `/user/forget_password?tel=${tel}&password=${password}`,
      'put'
    );
  }

  async userUpdateTel() {
    const { ctx, config, app } = this;

    const errors = app.validator.validate(
      {
        id: {
          required: true,
          type: 'string',
          min: 1
        },
        tel: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        code: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        }
      },
      ctx.request.body
    );

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }
    const result = await ctx.service.aliyunSms.validateCode(
      config.aliyunSms.replacePhoenTemplate
    );

    ctx.service.handleErrors.is_throw_error_with_condition(!result, [
      '验证码错误'
    ]);

    const { id, tel } = ctx.request.body;
    ctx.body = await ctx.service.aliyunApiGateway.index(
      `/user/update_tel/${id}?tel=${tel}`,
      'put'
    );
  }

  async userOldTelValidateCode() {
    const { ctx, config, app } = this;

    const errors = app.validator.validate(
      {
        tel: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        },
        code: {
          required: true,
          type: 'string',
          max: 30,
          min: 1
        }
      },
      ctx.request.body
    );

    if (errors) {
      ctx.status = 405;
      ctx.body = errors;
      return;
    }

    const { tel } = ctx.request.body;
    const data = await ctx.service.aliyunApiGateway.index(
      '/user/current_user',
      'get'
    );


    if (
      !(
        typeof data === 'object' &&
        Reflect.has(data, 'username') &&
        Reflect.get(data, 'username') === tel
      )
    ) {
      ctx.status = 405;
      ctx.body = {
        errors: '请输入当前用户绑定的手机号码！'
      };
      return;
    }

    const result = await ctx.service.aliyunSms.validateCode(
      config.aliyunSms.replacePhoenTemplate
    );

    ctx.service.handleErrors.is_throw_error_with_condition(!result, [
      '验证码错误'
    ]);

    ctx.status = 200;
    ctx.body = {
      msg: 'success',
      data: 1
    };
  }
}

module.exports = Token;
