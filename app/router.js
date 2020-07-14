'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, jwt } = app;

  // router.get('/test', controller.home.test);
  router.post('/encrypt', controller.home.encrypt);
  router.post('/decrypt', controller.home.decrypt);
  router.get('/mqtt', controller.home.mqtt);
  router.get('/mqttConf', controller.home.mqttConf);

  router.get('/symbol_cache', controller.schedulerx.symbol_cache); //

  router.post('/test_okex_store_split', controller.ccr.test_okex_store_split);
  router.post('/test_huobi_store_split', controller.ccr.test_huobi_store_split);

  router.post('/upload', controller.aliyunOss.upload);
  router.post('/login', controller.token.login);
  router.post('/register_code', controller.aliyunSms.registerCode);
  router.post('/user_register', controller.token.userRegister);
  router.post('/reset_password_code', controller.aliyunSms.resetPasswordCode);
  router.put('/api/update_password', jwt, controller.token.userUpdatePassword);
  router.put('/api/forget_password', controller.token.userForgetPassword);
  router.post('/reset_tel_code', controller.aliyunSms.resetTelCode);
  router.put('/api/update_tel', jwt, controller.token.userUpdateTel);
  router.post(
    '/api/old_tel/validate/code',
    jwt,
    controller.token.userOldTelValidateCode
  );
  router.get('/get_symbol_map', controller.ccr.get_symbol_map);
  router.post('/batchStopProfit', controller.ccr.batchStopProfit); // 批量停止设置了止盈后停止的货币对


  router.get('/getTime', controller.home.getTime);
  router.get('/checkMqConnection', controller.home.checkMqConnection); //  检查mq连接状况

  // router.get('/getRedisValue', controller.home.getRedisValue);
  // router.get('/getAllKeys', controller.home.getAllKeys);
  router.get('/getIp', controller.home.getIp);

  router.get('/currency', controller.home.currency); // 筛选 USDT@BTC@ETH@HT@HUSD@EOS 的计价货币

  // 谷歌验证
  router.post('/bindGoogleAuth', controller.googleAuthenticator.bindGoogleAuth); // 绑定谷歌验证
  router.post('/verifyCode', controller.googleAuthenticator.verifyCode); // 验证code
  // 交易逻辑
  router.get('/getBaseCoin', jwt, controller.ccr.getBaseCoin); //
  router.get(
    '/formatSymbol2OkextType',
    jwt,
    controller.ccr.formatSymbol2OkextType
  );

  router.post('/setting', jwt, controller.ccr.setting); // 设置货币对与策略对应关系
  router.post('/start_trade', jwt, controller.ccr.start_trade); // 货币对开始交易
  router.post('/pause_trade', jwt, controller.ccr.pause_trade); // 货币对暂停买入
  router.post('/batch_pause_trade', jwt, controller.ccr.batch_pause_trade); // 批量货币对暂停买入

  router.post('/stop_profit_trade', jwt, controller.ccr.stop_profit_trade); // 设置止盈后停止
  router.post(
    '/batch_stop_profit_trade',
    jwt,
    controller.ccr.batch_stop_profit_trade
  ); // 批量设置止盈后停止

  router.post('/reset_symbol', jwt, controller.ccr.reset_symbol); // 重置
  router.post('/recover_buy', jwt, controller.ccr.recover_buy); // 恢复买入
  router.post('/batch_recover_buy', jwt, controller.ccr.batch_recover_buy); // 批量恢复买入

  router.post(
    '/cancel_stop_profit_trade',
    jwt,
    controller.ccr.cancel_stop_profit_trade
  ); // 取消止盈后停止
  router.post(
    '/batch_cancel_stop_profit_trade',
    jwt,
    controller.ccr.batch_cancel_stop_profit_trade
  ); // 批量取消止盈后停止

  router.post('/forget_orders', jwt, controller.ccr.forget_orders); // 立即停止 忘记订单
  router.post('/sell_all_orders', jwt, controller.ccr.sell_all_orders); // 立即停止 清仓卖出
  router.post(
    '/batch_sell_all_orders',
    jwt,
    controller.ccr.batch_sell_all_orders
  ); // 批量立即停止 清仓卖出

  router.post('/setTradeParams', jwt, controller.ccr.setTradeParams); // 设置货币对参数
  router.get('/symbolInfo', jwt, controller.ccr.symbolInfo); // 某货币对交易信息(持仓费用，持仓均价，预算 etc)
  router.post('/currencyInfo', jwt, controller.ccr.currencyInfo); // 某计价货币交易信息(总持仓费用，总预算，交易货币对数量,资产 etc)
  router.get('/currencies', controller.ccr.currencies); // 自选货币
  router.get('/getSymbolByCurrency', jwt, controller.ccr.getSymbolByCurrency); // 计价货币下的所有货币对

  router.get('/initCurrencies', jwt, controller.ccr.initCurrencies); // 初始化所有计价货币
  router.get('/initSymbol', jwt, controller.ccr.initSymbol); // 初始化所有货币对
  router.post('/addSymbol', jwt, controller.ccr.addSymbol); // 添加自选货币
  router.get(
    '/bindAllSymbols2Currency',
    jwt,
    controller.ccr.bindAllSymbols2Currency
  ); // 绑定所有计价货币与货币对
  router.post('/delSymbol', jwt, controller.ccr.delSymbol); // delete自选货币

  router.post(
    '/bind_api',
    jwt,

    controller.ccr.bind_api
  ); // 绑定api
  router.post(
    '/remove_api',
    jwt,

    controller.ccr.remove_api
  ); // 解绑api
  router.post(
    '/delete_api',
    jwt,

    controller.ccr.delete_api
  ); // 删除api
  router.post(
    '/verify_api',
    jwt,

    controller.ccr.verify_api
  ); // 验证添加的api是否合法
  router.get(
    '/api_list',
    jwt,

    controller.ccr.api_list
  );
  router.get(
    '/api_detail/:id',
    jwt,

    controller.ccr.api_detail
  );
  router.get('/trigger_currency_kline', controller.ccr.trigger_currency_kline); // 触发获取计价货币的所有自选货币对

  //

  router.post('/search/coin/pairs', controller.coinPairs.searchCoinPairs);
};
