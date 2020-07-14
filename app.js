'use strict';
const httpclient = require('urllib');
// const { Consumer } = require('ali-ons');
const { Consumer } = require('./app/utils/ons/index');

// const { disableList } = require('./app/utils/ipList');
const Logger = require('./logger');

let closeTimes = 0;
class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  async configWillLoad() {
    const { app } = this;

    const acmConfig = app.options.acmConfig;
    // console.log('-------huobi acmConfig--------', acmConfig);

    if (acmConfig != null) {
      const acmConfToJson = JSON.parse(acmConfig);
      if (typeof acmConfToJson === 'object') {
        Object.keys(acmConfToJson).forEach(item => {
          app.config[item] = app.config[item] || {};

          Reflect.get(acmConfToJson, item)
            ? Object.assign(app.config[item], Reflect.get(acmConfToJson, item))
            : '';
        });
      }
    }
  }

  async didReady() {
    const { app } = this;
    const ctx = await app.createAnonymousContext();
    Logger();

    const { javaChannel } = app.config.rocketMq;
    // 配置
    const connectMq = () => {
      // 这个key标识mq连接是否出错 0否1是
      app.redis.set('is_mq_connect_error', 0);
      // 交易相关
      const javaTradeConsumer = new Consumer(
        Object.assign(javaChannel, {
          httpclient,
          persistent: true,
          pullThresholdForQueue: 5000,
        })
      );
      javaTradeConsumer.subscribe(javaChannel.topic_sub, '*', async function(
        msg
      ) {
        console.error('body==', msg.body.toString(), new Date());
        const body = JSON.parse(msg.body.toString());
        const { type, plantFormName } = body;
        if (plantFormName === 'huobi') {
          if (type === 'buy') {
            await ctx.service.huobi.buy(body);
          } else {
            await ctx.service.huobi.sell(body);
          }
        }
      });
      // javaTradeConsumer.on(`topic_${javaChannel.topic_sub}_changed`, data => {
      //   console.log('change', data);
      // });
      javaTradeConsumer.on('close', err => {
        closeTimes++;
        console.error('huobi-server mq is close', closeTimes);
        if (closeTimes > 3) {
          app.redis.set('is_mq_connect_error', 1);
        } else {
          connectMq();
        }
      });
      javaTradeConsumer.on('error', err => {
        console.error(err);
      });
    };
    connectMq();
  }
}

module.exports = AppBootHook;
