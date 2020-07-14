'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const decrypt = app.middleware.decrypt({});
  // router.get('/delRedisKey', controller.home.delRedisKey);

  // router.get('/trigger_currency_kline', controller.home.trigger_currency_kline); //  触发获取计价货币的所有自选货币对
  // router.get('/trigger_symbol_kline', controller.home.trigger_symbol_kline); //  触发获取计价货币的所有自选货币对

  router.get('/checkMqConnection', controller.home.checkMqConnection); //  检查mq连接状况
  router.get('/ip_map', controller.home.ip_map); //  将error-ip-map的ip加到ip_map

  // router.post('/testStopProfit', controller.home.testStopProfit); //  测试止盈


  // test
  // router.post('/testProxy', controller.home.testProxy); //
  // router.post('/testServerIpProxy', controller.home.testServerIpProxy); //


  // router.get('/emit', controller.home.emit); // producer
  // router.post('/emit_orderGroup', controller.home.emit_orderGroup); // producer

  router.get('/getIp', controller.home.getIp); // 获取服务器ip， 请求火币私人数据都用此ip

  // schedulerx
  router.get('/symbol_cache', controller.schedulerx.symbol_cache); //
  router.get('/poll_symbol_price', controller.schedulerx.pollSymbolPrice); // 轮询货币对价格
  router.get('/loadIpList', controller.schedulerx.loadIpList); //
  router.get(
    '/pollNotFinishedOrder',
    controller.schedulerx.pollNotFinishedOrder
  ); //
  router.get('/quote_coin_kline', controller.schedulerx.quoteCoinKline); //

  // 火币 个人数据
  router.post('/verify_account', decrypt, controller.huobi.verify_account); // 账户信息
  router.post('/account', decrypt, controller.huobi.account); // 账户信息

  router.post('/balance/:account_id', decrypt, controller.huobi.balance); // 账户余额

  // router.get('/open_orders', controller.huobi.open_orders); // 查询当前委托订单
  router.get('/order/:order_id', controller.huobi.order); // 查询成交
  // router.get('/orders', controller.huobi.orders); // 查询当前委托、历史委托
  // router.get('/filledTrade', controller.huobi.filledTrade);// 根据某货币对的已成交信息返回当前持仓费用、持仓数量和持仓均价 最新报价 实时收益比

  // router.get('/history', controller.huobi.history); // 查询用户48小时内历史订单
  // router.get('/matchresults', controller.huobi.matchresults); // 查询当前成交、历史成交
  // router.get('/order_matchresults', controller.huobi.order_matchresults); // 查询成交
  // router.get(
  //   '/order_matchresults/:order_id',
  //   controller.huobi.order_matchresults_id
  // );
  // 查询某个订单的成交明细,实际交易费用及实际交易均价
  router.post('/buy', controller.huobi.buy); // 买入、下单
  router.post('/sell', controller.huobi.sell); // 卖出

  // router.get('/pollSymbolPrice', controller.pollSymbolPrice.emit); //
  // ccr中 有使用到的火币公共api
  router.get('/symbol', controller.commonApi.symbol); // 返回单个货币对
  router.get('/symbols', controller.commonApi.symbols); // 返回所有货币对
  router.get('/latestOpenPrice', controller.commonApi.latestOpenPrice); // 买或卖的现价
  router.get('/deep', controller.commonApi.deep); // 深度
  router.get('/tickers', controller.commonApi.tickers); // tickers
  router.get('/kline', controller.commonApi.kline_1); // kline


  // 谷歌验证的二维码图片解析后返回base64图片
  router.get('/getBase64', controller.pic2Base64.index); // 验证code

  // 从国内egg设置redis数据写入国外egg
  router.post('/symbolList', controller.redis.symbolList);
  router.post('/setRedis', controller.redis.setRedis);
  router.get('/getRedisValueByKey', controller.redis.get);
  router.get('/zrevrangebyscore', controller.redis.zrevrangebyscore);
  router.get('/getAllKeys', controller.redis.getAllKeys);
  router.get('/checkKey', controller.redis.checkKey);
  router.post('/delKeysByKeyword', controller.redis.delKeysByKeyword);
  router.post('/replaceSecretByKeyword', controller.redis.replaceSecretByKeyword);
  router.post('/mergeRequest', controller.redis.mergeRequest);
};
