'use strict';

const Controller = require('egg').Controller;
const https = require('https');

/*
@author:fsg
@time:2019-08-16 10:27:48
@params
@description:读取图片转为base64
*/
class Pic2Base64Controller extends Controller {
  async index() {
    const { ctx, app } = this;
    const { query } = ctx.request;
    const errors = app.validator.validate(
      {
        fileUrl: {
          required: true,
          type: 'string',
          max: 500,
          min: 1,
        },
      },
      query
    );
    if (errors) {
      ctx.service.handleErrors.throw_error([ errors ]);
    }
    // 文件路径 当前只处理 谷歌验证的图片 所以支持https即可
    const { fileUrl } = query;
    const fn = fileUrl => {
      return new Promise((resolve, reject) => {
        https
          .get(fileUrl, res => {
            const datas = [];
            let size = 0;
            res.on('data', data => {
              datas.push(data);
              size += data.length;
            });
            res.on('end', () => {
              const buff = Buffer.concat(datas, size);
              const pic = buff.toString('base64');
              resolve(pic);
            });
          })
          .on('error', err => {
            reject(err);
          });
      });
    };
    const res = await fn(fileUrl);
    ctx.body = {
      data: res,
    };
  }
}
module.exports = Pic2Base64Controller;
