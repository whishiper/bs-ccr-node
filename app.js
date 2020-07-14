'use strict';
const httpclient = require('urllib');
const { Consumer } = require('ali-ons');
let closeTimes = 0;
class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  async configWillLoad() {
    const { app } = this;

    const acmConfig = app.options.acmConfig;
    console.log('---------okex acmConfig-------', acmConfig);
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
    const { javaChannel } = app.config.rocketMq;
    const connectMq = () => {
      // 这个key标识mq连接是否出错 0否1是
      app.redis.set('is_mq_connect_error', 0);
      // 交易相关
      const javaTradeConsumer = new Consumer(
        Object.assign(javaChannel, {
          httpclient,
        })
      );
      javaTradeConsumer.subscribe(javaChannel.topic_sub, '*', async function(
        msg
      ) {
        ctx.logger.error('body==', msg.body.toString());
        const body = JSON.parse(msg.body.toString());
        const { type, plantFormName } = body;
        if (plantFormName === 'okex') {
          if (type === 'buy') {
            await ctx.service.okex.buy(body);
          } else {
            await ctx.service.okex.sell(body);
          }
        }
      });

      javaTradeConsumer.on('close', err => {
        closeTimes++;
        ctx.logger.error('okex mq is close', closeTimes);
        if (closeTimes > 3) {
          app.redis.set('is_mq_connect_error', 1);
        } else {
          connectMq();
        }
      });
      javaTradeConsumer.on('error', err => {
        // ctx.logger.error(err)
      });
    };
    connectMq();
    // 配置
  }
}

module.exports = AppBootHook;
