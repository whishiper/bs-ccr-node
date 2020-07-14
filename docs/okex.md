# 以下接口全都要加 参数 plantFormName:'okex'

## router.get('/getSymbolByCurrency', jwt, controller.ccr.getSymbolByCurrency); // 计价货币下的所有货币对

```
query:
    {
        currency:'usdt',// 计价货币
        currency_id:'',//计价货币id
    },


```

## router.post('/addSymbol', controller.ccr.addSymbol); // 添加自选货币

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

## router.post('/delSymbol', controller.ccr.delSymbol); // delete 自选货币

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

## router.post('/setting', controller.ccr.setting);// 一键设置
```
body:[
    {
        symbol_list:[{"symbol":"btsusdt","id":"5","coinPairChoiceId":"1","policy_id":1,"budget":20},{"symbol":"xxx","id":"xx",,"coinPairChoiceId":"2","policy_id":1,"budget":20}],// JSON字符串
        signId:'',
        plantFormName:''
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

# 批量操作

## router.post('/batch_pause_trade', jwt, controller.ccr.batch_pause_trade); // 批量货币对暂停买入

``
body:{
plantFormName:'',
list:[{symbol:'', signId:''}],// JSON字符串
}

``

## router.post('/batch_stop_profit_trade', jwt, controller.ccr.batch_stop_profit_trade); // 批量设置止盈后停止

``
body:{
plantFormName:'',
list:[{symbol:'', signId:''}]
}

``

## router.post('/batch_recover_buy', jwt, controller.ccr.batch_recover_buy); // 批量回复买入

``
body:{
plantFormName:'',
list:[{symbol:'', signId:''}]
}

``

## router.post('/batch_cancel_stop_profit_trade', jwt, controller.ccr.batch_cancel_stop_profit_trade); // 批量取消止盈后停止

``
body:{
plantFormName:'',
list:[{symbol:'', signId:''}]
}

``

## router.post('/batch_sell_all_orders', jwt, controller.ccr.batch_sell_all_orders); // 批量立即停止 清仓卖出

``
body:{
plantFormName:'',
list:[{symbol:'', signId:''}]
}

``
