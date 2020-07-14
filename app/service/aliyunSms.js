'use strict';

const Service = require('egg').Service;
const randomize = require('randomatic');

class AliyunSmsService extends Service {

  async sendCode(templateCode) {
    const { ctx, app } = this;
    const errors = app.validator.validate({
      tel: {
        required: true,
        type: 'string',
        max: 11,
        min: 11,
      },
      templateCode: {
        required: true,
        type: 'string',
      },
    }, Object.assign(ctx.request.body, { templateCode }));

    ctx.service.handleErrors.is_throw_error(errors, 405);

    const sms = app.aliyunSms;
    const code = randomize('0000');

    const existCode = await app.redis.get('internal').get('telSMSTime_' + templateCode + '_' + ctx.request.body.tel);

    let result = {};
    if (!existCode) {
      await sms.sendSMS({
        PhoneNumbers: ctx.request.body.tel,
        SignName: '博森科技',
        TemplateCode: templateCode,
        TemplateParam: '{"code":"' + code + '"}',
      }).then(async function(res) {
        result = res;
        await app.redis.get('internal').set('telSMS_' + templateCode + '_' + ctx.request.body.tel, code, 'EX', 180);
        await app.redis.get('internal').set('telSMSTime_' + templateCode + '_' + ctx.request.body.tel, code, 'EX', 30);
      }, function(err) {
        result = err;
      });

      // await app.redis.get('internal').set('telSMS_' + templateCode + '_' + ctx.request.body.tel, code, 'EX', 180);
      // await app.redis.get('internal').set('telSMSTime_' + templateCode + '_' + ctx.request.body.tel, code, 'EX', 30);
    } else {
      ctx.status = 405;
      result = { error: 'Please get a code after 1 min.' };
    }

    return result;
  }


  async validateCode(templateCode) {
    const { ctx, app } = this;
    const errors = app.validator.validate({
      tel: {
        required: true,
        type: 'string',
        max: 11,
        min: 11,
      },
      code: {
        required: true,
        type: 'string',
        max: 4,
        min: 4,
      },
    }, ctx.request.body);

    ctx.service.handleErrors.is_throw_error(errors, 405);

    const code = await app.redis.get('internal').get('telSMS_' + templateCode + '_' + ctx.request.body.tel);

    if (code !== ctx.request.body.code) {
      ctx.service.handleErrors.is_throw_error('验证码不正确', 405);
      return false;
    }
    return true;


  }
}

module.exports = AliyunSmsService;
