/** @Author : YuXueWen
 * @File : request.js
 * @Email : 8586826@qq.com
 **/

'use strict';

const Service = require('egg').Service;
class DefaultHandleResult extends Service {
  constructor(ctx, promise, is_throw_error = true) {
    super(ctx);
    this.promise = promise;
    this.is_throw_error = is_throw_error;
    this.handler();
  }

  async handler() {
    let result = {};
    const { ctx } = this;
    await this.promise.then(
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

              if (this.is_throw_error) {
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

module.exports = DefaultHandleResult;
