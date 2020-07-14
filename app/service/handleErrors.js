'use strict';

const Service = require('egg').Service;

class HandleErrorsService extends Service {


  phpErrors(errorsFormat) {
    const { ctx } = this;
    const errors = [];
    if (typeof errorsFormat === 'object') {
      if (Reflect.has(errorsFormat, 'status_code')
                && Reflect.has(errorsFormat, 'errors')
                && Reflect.has(errorsFormat, 'status_code')
      ) {
        ctx.status = Reflect.get(errorsFormat, 'status_code');
        Object.keys(errorsFormat.errors).forEach(
          filed => {
            errorsFormat.errors[filed].forEach(key => {
              errors.push(key);
            });

          }
        );

      } else if (Reflect.has(errorsFormat, 'error')) {
        errors.push(errorsFormat.error);
      } else if (Reflect.has(errorsFormat, 'message') && Reflect.has(errorsFormat, 'status_code')) {
        errors.push(Reflect.get(errorsFormat, 'message'));
        ctx.status = Reflect.get(errorsFormat, 'status_code');
      }
    }


    return errors;
  }

  is_throw_error_with_condition(condition, data, status = 0) {
    if (condition) {
      this.throw_error(data, status);
    }
    return;
  }

  is_throw_error(data, status = 0) {

    if ((Array.isArray(data) && data.length > 0)
        || (!Array.isArray(data) && data)
    ) {
      this.throw_error(data, status);
    }

    return;
  }

  throw_error(data, status = 0) {
    throw new function() {
      this.message = data;

      if (status > 0) {
        this.status = status;
      }

    }();
  }

}

module.exports = HandleErrorsService;
