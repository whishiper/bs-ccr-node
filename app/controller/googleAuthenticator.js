'use strict';

const Controller = require('egg').Controller;
const https = require('https');
class GoogleAuthenticatorController extends Controller {
  async bindGoogleAuth() {
    const { ctx, app } = this;
    const { account } = ctx.request.body;
    const secret = await ctx.service.googleAuthenticator.createSecret();
    // 这里拿到的是图片线上地址
    const qrCodeUrl = await ctx.service.googleAuthenticator.getGoogleQRCodeAPIUrl(
      account,
      secret,
      '博森ccr'
    );
    const urlencode = str => {
      str = (str + '').toString();
      return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/%20/g, '+');
    };
    // 通过国外服务器转为base64
    const base64Code = await app
      .curl(
        `${app.config.huobiServer.url}/getBase64?fileUrl=${urlencode(
          qrCodeUrl
        )}`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data.data);
    ctx.body = {
      account,
      secret,
      base64Code,
    };
  }
  async verifyCode() {
    const { ctx } = this;
    const { secret, code } = ctx.request.body;
    const verifyRes = await ctx.service.googleAuthenticator.verifyCode(
      secret,
      code
    );
    if (verifyRes) {
      ctx.body = {
        msg: 'match success',
      };
    } else {
      ctx.body = {
        msg: 'code not match',
      };
    }
  }
  async convert2Base64(fileUrl) {
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
    return res;
  }
}

module.exports = GoogleAuthenticatorController;
