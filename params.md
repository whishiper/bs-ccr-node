## router.get('/getSymbolByCurrency', jwt, controller.ccr.getSymbolByCurrency); // 计价货币下的所有货币对

```
query:
    {
        currency:'usdt',// 计价货币
        currency_id:'',//计价货币id
    },


```
##   router.get('/addSymbol', controller.ccr.addSymbol); // 添加自选货币

```
body:[
    {
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
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
        symbol_list:[{"symbol":"btsusdt","id":"5"},{"symbol":"xxx","id":"xx"}],// 
        budget:20,// 输入总预算
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
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

## router.get('/currencyInfo', controller.ccr.currencyInfo);// 某计价货币交易信息(总持仓费用，总预算，交易货币对数量,资产 etc

```
query:
    {
        currency:'usdt',// 计价货币
        currency_id:'',//计价货币id
        userId:'',// 用户id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24',
    },


```


## router.post('/start_trade', jwt, controller.ccr.start_trade);// 货币对开始交易

```
  body:{
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```


## router.post('/pause_trade', jwt, controller.ccr.pause_trade);// 货币对暂停交易

```
  body:{
       symbol:'btsusdt',
       symbol_id:'',//货币对id
       userId:'',// 用户id
        accessKey:'90854b9e-mn8ikls4qg-d8a152e7-cd30e',
        secretKey:'97d74615-f1e7bf4a-756a0261-c1f24'
  }
```

## router.get('/getAllKeys', jwt, controller.ccr.getAllKeys);// 获取redis所有key

```
 
```

## router.get('/getRedisValue', jwt, controller.ccr.getRedisValue);// 获取redis某key的值

```
 query:{
     key:'xxx'
 }
```

## response
```
{
    "symbol": "btsusdt",
    "accessKey": "90854b9e-mn8ikls4qg-d8a152e7-cd30e",
    "secretKey": "97d74615-f1e7bf4a-756a0261-c1f24",
    "max_trade_order": 4,// 最大交易单数
    "budget": 20,// 预算
    "finished_order": 0,// 已完成单数
    "leverage": 3,
    "trade_times": 8563,// 交易倍数
    "policy_series": [
        "1",
        "2",
        "4",
        "8"
    ],// 策略
    "buy_volume": {
        "0": "856.30",
        "1": "1712.60",
        "2": "3425.20",
        "3": "6850.40"
    },// 每单买入量
    "first_order_price": 0.0449,// 首单价格
    "isFollowBuild": "0",// 是否开启追踪建仓
    "isNeedRecordMaxRiskBenefitRatio": "0",// 是否需要记录最大收益比
    "min_averagePrice": 0,// 最小均价
    "store_split": "0.008023",// 建仓间隔
    "trade_status": "1",// 交易状态 1 开启 0停止
    "history_max_riskBenefitRatio": "0",//历史最高收益比
    "position_average": "0",// 持仓均价
    "position_cost": "0",// 持仓费用
    "position_num": "0",// 持仓数量
    "emit_ratio": "0.2",// 触发比例
    "turn_down_ratio": "0.1",//
    "follow_lower_ratio": "0.01",
    "follow_callback_ratio": "0.1",
    "is_use_follow_target_profit": "1",
    "target_profit_price": "50"
}

```