/** @Author : YuXueWen
* @File : request.js
* @Email : 8586826@qq.com
**/

'use strict';

const Service = require('egg').Service;
const { base64encode } = require('nodejs-base64');
class RequestService extends Service {
  constructor(ctx, base_url, path) {
    super(ctx);
    this.content_type = 'application/x-www-form-urlencoded; charset=UTF-8';
    this.data_type = 'json';

    this.base_url = base_url;
    this.path = path;

    this.auth_encode = '';
    this.is_set_auth = true;

  }

  base(data = {}, options = {}, method = 'GET') {
    options.method = method;
    this.auth = 'fooClientIdPassword:secret';
    options.headers = {
      'content-type': this.content_type,
      dataType: this.data_type,
    };

    if (this.is_set_auth) { options.headers.Authorization = `Basic ${this.auth}`; }

    options.data = data;

    return this.app.curl(this.base_url + this.path, options);
  }


  post(data = {}, options = {}) {
    return this.base(data, options, 'POST');
  }

  get(data = {}, options = {}) {
    return this.base(data, options, 'GET');
  }

  put(data = {}, options = {}) {
    return this.base(data, options, 'PUT');
  }

  delete(data = {}, options = {}) {
    return this.base(data, options, 'DELETE');
  }

  get auth() {
    return this.auth_encode;
  }

  set auth(value) {
    this.auth_encode = base64encode(value);
  }

  get data_type() {
    return this.data_type;
  }

  set data_type(value) {
    this.data_type = value;
  }

  get content_type() {
    return this.content_type;
  }

  set content_type(value) {
    this.content_type = value;
  }

  get is_set_auth() {
    return this.is_set_auth;
  }

  set is_set_auth(value) {
    this.is_set_auth = value;
  }

}


module.exports = RequestService;
