## router.get('/getSymbolByCurrency', jwt, controller.ccr.getSymbolByCurrency); // 计价货币下的所有货币对

```
query:
    {
        currency:'usdt',// 计价货币
        currency_id:'',//计价货币id
    },


```

## router.get('/addSymbol', controller.ccr.addSymbol); // 添加自选货币

```
body:[
    {
        account_id:'',//账号id
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
    },
]

```

## router.get('/delSymbol', controller.ccr.delSymbol); // delete 自选货币

```
body:[
    {
       symbol:'btsusdt',
       symbol_id:'',//货币对id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
    },
]

```

## router.post('/setting', controller.ccr.setting);// 设置货币对与策略对应关系

```
body:[
    {
        policy_id:1,//策略id
        symbol_list:[{"symbol":"btsusdt","id":"5","coinPairChoiceId":"1","buyPrice":0.1,"sellPrice":0.12},{"symbol":"xxx","id":"xx",,"coinPairChoiceId":"2"}],//
        budget:20,// 输入总预算
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24',
        userId:1
    },
]

```

## router.post('/setTradeParams', controller.ccr.setTradeParams);// 设置货币对参数

```
body:
    {
        symbol:'btsusdt',// 货币对
        symbol_id:'5',// 货币对id
        emit_ratio:0.2,//追踪止盈触发比例
        turn_down_ratio:0.1,// 追踪止盈回降比例
        stopProfitFixedRate:'',//固定止盈比例
        is_use_follow_target_profit:'1',//是否启用追踪止盈 '1'或'0' @String
        target_profit_price:50,// 止盈金额
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
    },


```

## router.get('/symbolInfo', controller.ccr.symbolInfo);// 某货币对交易信息(持仓费用，持仓均价，预算 etc

```
query:
    {
        symbol:'btsusdt',
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
    },


```

## router.post('/currencyInfo', controller.ccr.currencyInfo);// 某计价货币交易信息(总持仓费用，总预算，交易货币对数量,资产 etc

```
query:
    {
        currency:'usdt',// 计价货币
        currency_id:'',//计价货币id
        userId:'',// 用户id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24',
        account_id:''
    },


```

## router.post('/start_trade', jwt, controller.ccr.start_trade);// 货币对开始交易

```
  body:{
      buyPrice:0.1,
      sellPrice:0.12,
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
       coinPairChoiceId:'',//自选货币对id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.post('/pause_trade', jwt, controller.ccr.pause_trade);// 货币对暂停买入

```
  body:{
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
       coinPairChoiceId:'',//自选货币对id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.post('/recover_buy', jwt, controller.ccr.recover_buy);// 货币对恢复买入

```
  body:{
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
       coinPairChoiceId:'',//自选货币对id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.post('/stop_profit_trade', jwt, controller.ccr.stop_profit_trade);// 设置止盈后停止

```
  body:{
        symbol:'btsusdt',
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.post('/cancel_stop_profit_trade', jwt, controller.ccr.cancel_stop_profit_trade);// 取消止盈后停止

```
  body:{
        symbol:'btsusdt',
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.post('/forget_orders', jwt, controller.ccr.forget_orders);// 立即停止 忘记订单

```
  body:{
        symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
       coinPairChoiceId:'',//自选货币对id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.post('/sell_all_orders', jwt, controller.ccr.sell_all_orders);// 立即停止 清仓卖出

```
  body:{
        symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
       coinPairChoiceId:'',//自选货币对id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.get('/getAllKeys', jwt, controller.ccr.getAllKeys);// 获取 redis 所有 key

```

```

## router.get('/getRedisValue', jwt, controller.ccr.getRedisValue);// 获取 redis 某 key 的值

```
 query:{
     key:'xxx'
 }
```

## response

```
{
          symbol: item.symbol,// 货币对名
          quote_currency,// 计价火币名
          accessKey,
          secretKey,
          account_id,// 火币账户id
          max_trade_order,// 最大交易单数 @Number
          canSendMsg2Node: -1,// canSendMsg2Node :1 可以给node发消息， -1 暂时不用发
          budget: average_budget,// 货币对预算
          finished_order: 0, // 买入订单的数量
          leverage,// 杠杆
          trade_times: cur_symbol.trade_times, // 交易倍数，计算买入量需要
          policy_series, // 策略
          buy_volume, // 交易量
          first_order_price: openPrice_map[item.symbol], // 首单现价
          isFollowBuild: '0', // 做是否触发追踪建仓的标示 0否1是
          isNeedRecordMaxRiskBenefitRatio: '0', // 是否需要做记录最高收益比标识 0否1是
          min_averagePrice: 0, // 最小均价
          store_split: cur_symbol.store_split, // 建仓间隔
          trade_status: '0', // 本身拥有的： 未交易0,交易中自动循环 1，     人为干预才有的：交易中暂停买入 3
          history_max_riskBenefitRatio: '0', // 历史最高收益比
          position_average: '0', // 持仓均价
          position_cost: '0', // 持仓费用
          position_num: '0', // 持仓数量
          real_time_earning_ratio: 0, // 实时收益率
          stopProfitRatio, // 止盈比例
          emit_ratio: stopProfitTraceTriggerRate, // 追踪止盈触发比例
          turn_down_ratio: stopProfitTraceDropRate, // 追踪止盈回降比例
          is_trigger_trace_stop_profit: '0', // 是否启用追踪止盈
          target_profit_price: null, // 止盈金额默认null 要在参数设置才能更改
}

```

## router.post('/verify_api', controller.ccr.verify_api); // 验证添加的 api 是否合法

````
request:
  query:{
       id:'',
       plantFormName:'',// 平台名 @required
        secret:'', @required
        nickname:'', @required
        tradePlatformId :''，@required
        sign:'', okex 是填写手机号
  }

  response:
    平台存在该用户
    ```
      [
    {
        "id": 8032430,
        "type": "spot",
        "subtype": "",
        "state": "working"
    }
]
    ```

    api不存在时
      ```
         {
    "name": "Error",
    "errors": {
        "status": "error",
        "err-code": "api-signature-not-valid",
        "err-msg": "Signature not valid: Verification failure [校验失败]",
        "data": null
    },
    "status_code": 500
}
      ```
````

## 解绑 api router.post('/remove_api', jwt,controller.ccr.remove_api);

```
body:{
  id:'',
  tradePlatformApiBindProductComboId:'',
  plantFormName:'',
}
```

## 绑定 api router.post('/bind_api', jwt,controller.ccr.bind_api);

```
body={
  secret,
  id,
  tradePlatformApiId,
  userProductComboId,
  plantFormName,
}
```
