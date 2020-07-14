'use strict';

const Service = require('egg').Service;
const dateFormat = require('dateformat');

class AliyunOssService extends Service {
  async upload() {
    const ctx = this.ctx;
    const parts = ctx.multipart();
    let part;
    const s_body = new Set();
    while ((part = await parts()) != null) {
      if (part.length) {
        // arrays are busboy fields
      } else {
        if (!part.filename) {
          return;
        }
        const now = new Date();
        const upload_path = dateFormat(now, 'yyyy/mm/dd/');
        const result = await ctx.oss.put(upload_path + part.filename, part);
        s_body.add(result);
      }
    }

    if (s_body.size === 1) {
      ctx.body = [...s_body][0];
    } else if (s_body.size > 1) {
      ctx.body = [...s_body];
    } else {
      ctx.body = 'no data';
    }
  }

  async put(fileName, fileData) {
    const ctx = this.ctx;

    const now = new Date();
    const upload_path = dateFormat(now, 'yyyy/mm/dd/');
    const result = await ctx.oss.put(upload_path + fileName, fileData);

    return result;
  }
}

module.exports = AliyunOssService;
