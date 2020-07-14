'use strict';
/*
@author:fsg
@time:2019-10-14 10:11:07
@params
@description:用于解密ctx中的accessKey，secretKey,passphrase 之类信息
*/
module.exports = () => {
  // 所有与加密相关的方法都是post 直接从body取数据即可
  return async function decrypt(ctx, next) {
    const NEED_DECRYPT_KEYS = 'secret';

    const { body } = ctx.request;
    const secret = await ctx.service.secret.decrypt(body[NEED_DECRYPT_KEYS]);
    const [ accessKey, secretKey, passphrase ] = secret.split('_');
    body.accessKey = accessKey;
    body.secretKey = secretKey;
    body.passphrase = passphrase;

    Reflect.deleteProperty(body, 'secret');
    ctx.request.body = body;
    await next();
  };
};
