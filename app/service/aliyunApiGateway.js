'use strict';

const Service = require('egg').Service;

class AliyunApiGatewayService extends Service {
  // eslint-disable-next-line no-useless-constructor
  constructor(ctx) {
    super(ctx);
    this.headers = {};
    this.data = {};
    this._query = {};
    this.handle_result_func = 'default_handle_result';
  }

  get getHeaders() {
    return this.headers;
  }

  set setHeaders(values) {
    this.headers = values;
  }

  get getData() {
    return this.data;
  }

  set setData(values) {
    this.data = values;
  }

  get query() {
    return this._query;
  }

  set query(value) {
    this._query = value;
  }

  get getHandleResultFunc() {
    return this.handle_result_func;
  }

  set setHandleResultFunc(values) {
    this.handle_result_func = values;
  }

  async post(url = '', options = {}) {
    return this.index(url, 'post', this.handle_result_func, options);
  }
  async get(url = '', options = {}) {
    return this.index(url, 'get', this.handle_result_func, options);
  }
  async delete(url = '', options = {}) {
    return this.index(url, 'delete', this.handle_result_func, options);
  }
  async put(url = '', options = {}) {
    return this.index(url, 'put', this.handle_result_func, options);
  }

  async index(
    url = '',
    method = '',
    handle_result_func = 'default_handle_result',
    options = {},
    custom_set_token = null // 自定义传入token
  ) {
    const { ctx, app } = this;

    if (!method) {
      method = ctx.method.toLowerCase();
    }

    const headers = {
      accept: 'application/json',
    };
    if (method === 'post' || method === 'put') {
      Reflect.set(headers, 'content-type', 'application/json; charset=UTF-8');
    }
    // 不传此参数则使用state.user的token
    if (!custom_set_token) {
      if (typeof this.ctx.state === 'object') {
        if (
          Reflect.has(this.ctx.state, 'user') &&
          Reflect.has(this.ctx.state.user, 'access_token')
        ) {
          Reflect.set(
            headers,
            'Authorization',
            'Bearer ' + Reflect.get(ctx.state.user, 'access_token')
          );
        }
      }
    } else {
      // 自定义使用传入的token
      Reflect.set(headers, 'Authorization', 'Bearer ' + custom_set_token);
    }

    let query = ctx.request.query;
    if (!ctx.request.body) {
      ctx.request.body = {};
    }

    if (method === 'delete') {
      query = Object.assign(ctx.request.body, ctx.request.query);
    }

    if (!url) {
      url = ctx.url;
    }

    if (Object.keys(this.headers).length > 0) {
      Object.assign(headers, this.getHeaders);
      this.headers = {};
    }

    if (Object.keys(this.data).length > 0) {
      Object.assign(ctx.request.body, this.data);
      this.data = {};
    }

    if (Object.keys(this._query).length > 0) {
      Object.assign(query, this._query);
      this._query = {};
    }

    if (Object.keys(options).length > 0) {
      Object.assign(ctx.request.body, options);
    }

    const promise = this.app.aliyunApiGateway[method](
      app.config.aliyunApiGateway.baseUrl + url,
      {
        data: ctx.request.body,
        // 有些java post方法是从query里面传参
        query: options.post2Query ? options.data : query,
        headers,
      }
    );
    let handle_result;

    if (typeof handle_result_func === 'function') {
      handle_result = handle_result_func(promise, this);
    } else {
      handle_result = this[handle_result_func](promise);
    }

    return handle_result;
  }

  async handle_result_none_throw_error(promise) {
    return this.default_handle_result(promise, false);
  }

  async default_handle_result(promise, is_throw_error = true) {
    let result = {};
    const { ctx } = this;
    await promise.then(
      data => {
        if (Array.isArray(data) && data.length > 1) {
          if (data[1].response.statusCode) {
            if (
              data[1].response.statusCode >= 200 &&
              data[1].response.statusCode < 300
            ) {
              ctx.status = 200;
            } else {
              ctx.status = data[1].response.statusCode;

              if (is_throw_error) {
                ctx.service.handleErrors.is_throw_error(
                  ctx.service.handleErrors.phpErrors(data[0])
                );

                ctx.service.handleErrors.is_throw_error(data[1].response, 401);
              }
            }
          }

          result = data[0];
        } else {
          result = data;
        }
      },
      error => {
        ctx.status = 500;
        result = error;
      }
    );

    return result;
  }
}

module.exports = AliyunApiGatewayService;
