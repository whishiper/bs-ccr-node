'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const decrypt = app.middleware.decrypt({});

  // schedulerx
  router.get('/symbol_cache', controller.schedulerx.symbol_cache); //
  router.get('/poll_symbol_price', controller.schedulerx.pollSymbolPrice); // 轮询货币对价格
  // router.get('/loadIpList', controller.schedulerx.loadIpList); //
  router.get(
    '/pollNotFinishedOrder',
    controller.schedulerx.pollNotFinishedOrder
  ); //
  router.get('/checkMqConnection', controller.home.checkMqConnection); //  检查mq连接状况
  // router.post('/testStopProfit', controller.home.testStopProfit); //  测试止盈

  router.get('/trigger_currency_kline', controller.home.trigger_currency_kline); //  触发获取计价货币的所有自选货币对
  router.get('/trigger_symbol_kline', controller.home.trigger_symbol_kline); //  触发获取计价货币的所有自选货币对
  // // test
  // router.get('/testOkex', controller.home.testOkex); //
  router.get('/getTime', controller.home.getTime);

  router.post('/encrypt', controller.home.encrypt); //
  router.post('/decrypt', controller.home.decrypt); //

  router.post('/decryptSecret', controller.home.decryptSecret); //

  router.get('/emit', controller.home.emit); // producer
  // router.get('/getIp', controller.home.getIp); // 获取服务器ip， 请求火币私人数据都用此ip
  // okex
  router.post('/verify_okex_api', decrypt, controller.okex.verify_okex_api); // 账户信息
  router.post('/account', decrypt, controller.okex.account); // 账户信息

  router.post(
    '/currency_account/:currency',
    decrypt,
    controller.okex.currency_account
  ); // 账户信息
  router.post('/order', decrypt, controller.okex.order); // 账户信息

  router.post('/buy', controller.okex.buy); // 账户信息
  router.post('/sell', controller.okex.sell); // 账户信息

  // ccr中 有使用到的火币公共api
  router.get('/symbols', controller.commonApi.symbols); // 返回所有货币对
  router.get('/latestOpenPrice', controller.commonApi.latestOpenPrice); // 买或卖的现价
  router.get('/deep', controller.commonApi.deep); // 深度
  router.get('/tickers', controller.commonApi.tickers); // tickers
  router.get('/kline', controller.commonApi.kline_1); // kline
  router.get('/getDeepTotal', controller.commonApi.getDeepTotal); // kline

  // 谷歌验证的二维码图片解析后返回base64图片
  // router.get('/getBase64', controller.pic2Base64.index); // 验证code

  // 从国内egg设置redis数据写入国外egg
  router.post('/symbolList', controller.redis.symbolList);
  router.post('/setRedis', controller.redis.set);
  router.get('/getRedisValueByKey', controller.redis.get);
  router.get('/zrevrangebyscore', controller.redis.zrevrangebyscore);

  router.get('/getAllKeys', controller.redis.getAllKeys);
  router.get('/checkKey', controller.redis.checkKey);
  router.post('/delKeysByKeyword', controller.redis.delKeysByKeyword);
  router.post('/replaceSecretByKeyword', controller.redis.replaceSecretByKeyword);


};
