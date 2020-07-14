'use strict';

const Service = require('egg').Service;

class ValidateService extends Service {
  /*
   *@author: fsg
   *@date: 2019-03-04 19:05:35
   *@params  ['id','id:number','id:Number','id:NUMBER']
   *@description: 验证不同类型 默认string
   */
  requiredType(fields, data = null) {
    const { ctx, app } = this;
    if (!data) {
      data = ctx.request.body;
    }
    const rules = {};
    if (fields && fields.length) {
      fields.forEach(item => {
        if (item.includes(':')) {
          const arr = item.split(':');
          let [ key, value ] = arr;
          value = value.toLowerCase();
          fields[key] = {
            required: true,
            type: value,
          };
        } else {
          fields[item] = {
            required: true,
            type: 'string',
          };
        }
      });
    }
    const errors = app.validator.validate(rules, data);

    ctx.service.handleErrors.is_throw_error(errors, 405);
  }
}

module.exports = ValidateService;
