'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');
const fetch = require('node-fetch');
const DEFAULT_OPTIONS = {
  body: '',
  AUTH_DATA: {},
};
const signRequest = (method, path, options) => {
  // console.log(method, path, options);
  const { accessKey, secretKey, passphrase } = options.AUTH_DATA;
  // const timezone = 8; // 目标时区时间，东八区
  // const ti = new Date();
  // ti.setTime(ti.getTime() + (timezone * 60) * 60 * 1000);
  // ti.toUTCString();
  // console.log('ti', ti);
  // const timestamp = new Date(ti) / 1000;
  const timestamp = new Date() / 1000;

  const what = timestamp + method.toUpperCase() + path + (options.body || '');
  // console.log('what', what);

  const hmac = crypto.createHmac('sha256', secretKey);
  const signature = hmac.update(what).digest('base64');
  return {
    accessKey,
    passphrase,
    signature,
    timestamp,
  };
};
const getSignature = ({ method, relativeURI, opts }) => {
  const sig = signRequest(method, relativeURI, opts);
  return {
    'OK-ACCESS-KEY': sig.accessKey,
    'OK-ACCESS-PASSPHRASE': sig.passphrase,
    'OK-ACCESS-SIGN': sig.signature,
    'OK-ACCESS-TIMESTAMP': sig.timestamp,
  };
};
const request = (url, options) => {
  // console.log('options', options);
  return fetch(url, {
    timeout: 10000,
    ...options,
  })
    .then(res => {
      // console.log('res--', res);
      return res.json();
    })
    .then(res => {
      if (Reflect.has(res, 'error_code')) {
        // code 为'','0'也是成功
        if (res.result || res.code === '' || res.code === '0') {
          return res;
        }
        // console.log('res', url, res);
        const err = new Error();
        err.message = res.error_message;
        err.err_code = res.error_code;
        err.name = res.error_code;
        throw err;
      }
      if (Reflect.has(res, 'code')) {
        if (res.code !== 0) {
          // console.log('res==', url, res);
          const err = new Error();
          err.message = res.message;
          err.err_code = res.code;
          err.name = res.code;
          throw err;
        }
      }
      return res;
    })
    .catch(error => {
      console.log(
        '=======', error.response && error.response !== undefined && error.response.data
          ? JSON.stringify(error.response.data)
          : error
      );
      // console.log('----------', error.message ? error.message : `${url} error`);
      throw error;
    });
};
class OkexSdkService extends Service {
  async get({ url, AUTH_DATA }) {
    const { app } = this;
    const final_url = `${app.config.okex.url}${url}`;
    return request(final_url, {
      headers: {
        ...getSignature({
          method: 'get',
          relativeURI: url,
          opts: {
            ...DEFAULT_OPTIONS,
            AUTH_DATA,
          },
        }),
      },
    });
  }
  async post({ url, body }) {
    const { app } = this;
    const final_url = `${app.config.okex.url}${url}`;
    const bodyJson = JSON.stringify(body);
    return request(final_url, {
      method: 'POST',
      body: bodyJson,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        ...getSignature({
          method: 'post',
          relativeURI: url,
          opts: { ...DEFAULT_OPTIONS, body: bodyJson, AUTH_DATA: body },
        }),
      },
    });
  }
  // 查询用户的所有账户状态
  account({ body }) {
    const url = '/api/spot/v3/accounts';
    return this.get({ url, AUTH_DATA: body });
  }
  // 查询用户的单个货币账户状态
  currency_account({ body, params }) {
    const { currency } = params;
    const url = `/api/spot/v3/accounts/${currency}`;
    return this.get({ url, AUTH_DATA: body });
  }
  // 订单详情信息
  order({ body, query }) {
    const { order_id, symbol } = query;
    const url = `/api/spot/v3/orders/${order_id}?instrument_id=${symbol}`;
    return this.get({ url, AUTH_DATA: body });
  }
  // 下单或卖出
  order_place({ body }) {
    const url = '/api/spot/v3/orders';
    return this.post({
      url,
      body,
    });
  }
}
module.exports = OkexSdkService;
