'use strict';

const Service = require('egg').Service;
const httpclient = require('urllib');
const { Consumer } = require('ali-ons');
// 火币，ok等设置了止盈后停止,结单了要停止继续交易
// let sqs;
let closeTimes = 0;
class InternalWithExternalService extends Service {
  async init() {
    const { app, ctx } = this;

    const { InternalWithExternalChannel } = app.config.rocketMq;
    const connectMq = () => {
      app.redis.get('internal').set('is_mq_connect_error', 0);

      const consumer = new Consumer(
        Object.assign(InternalWithExternalChannel, {
          httpclient,
        })
      );
      consumer.subscribe(
        InternalWithExternalChannel.topic_sub,
        '*',
        async function(msg) {
          const data = JSON.parse(msg.body.toString());
          const { mqType, plantFormName } = data;
          if (mqType === 'mqtt-stopProfit') {
            ctx.service.ccrCommon.stopProfit(data);
          }
          if ([ 'mqtt-tradeError' ].includes(mqType)) {
            if (plantFormName === 'huobi') {
              ctx.service.ws.wsHuobi.emit(data);
            }
            if (plantFormName === 'okex') {
              ctx.service.ws.wsOkex.emit(data);
            }
          }
          if ([ 'mqtt-tradeInfo' ].includes(mqType)) {
            console.log('交易情况变化', plantFormName);
            if (plantFormName === 'huobi') {
              ctx.service.ws.wsHuobi.emit(data);
              try {
                // 更新余额等
                const {
                  currency,
                  quote_currency_id,
                  secret,
                  signId,
                  robotId,
                  tradePlatformApiBindProductComboId,
                  userId,
                } = data;
                const access_token = await app.redis
                  .get('internal')
                  .hget('user_token_relation_table', userId);
                if (!access_token) {
                  return;
                }
                // huobi的余额会加入缓存，所以与其他交易所处理不同
                const currencyInfo = await ctx.service.ccrHuobi.cache_currencyInfo({
                  currency,
                  currency_id: quote_currency_id,
                  secret,
                  robotId,
                  signId,
                  tradePlatformApiBindProductComboId,
                  custom_set_token: access_token,
                });
                // console.log('huobi updateCurrencyBalance currencyInfo success');

                const d = {
                  plantFormName: 'huobi',
                  type: 'updateCurrencyBalance',
                  signId,
                  currency,
                  ...currencyInfo,
                };
                ctx.service.ws.wsHuobi.emit(d);
              } catch (err) {
                console.log('huobi updateCurrencyBalance err', err);
              }
            }
            if (plantFormName === 'okex') {
              ctx.service.ws.wsOkex.emit(data);
              try {
                // 更新余额等
                const {
                  currency,
                  quote_currency_id,
                  secret,
                  signId,
                  tradePlatformApiBindProductComboId,
                  userId,
                } = data;
                const access_token = await app.redis
                  .get('internal')
                  .hget('user_token_relation_table', userId);
                // ctx.service.aliyunApiGateway.setHeaders = {
                //   Authorization: `Bearer ${access_token}`
                // };
                if (!access_token) {
                  return;
                }
                const currencyInfo = await ctx.service.ccrOkex.currencyInfo({
                  currency,
                  currency_id: quote_currency_id,
                  secret,
                  signId,
                  tradePlatformApiBindProductComboId,
                  custom_set_token: access_token,
                });
                // console.log('okex updateCurrencyBalance currencyInfo success');

                const d = {
                  plantFormName: 'okex',
                  type: 'updateCurrencyBalance',
                  signId,
                  currency,
                  ...currencyInfo,
                };
                ctx.service.ws.wsOkex.emit(d);
              } catch (err) {
                console.log('okex updateCurrencyBalance err', err);
              }
            }
          }
        }
      );
      consumer.on('close', err => {
        closeTimes++;
        ctx.logger.error('master mq is close', closeTimes);
        if (closeTimes > 3) {
          app.redis.get('internal').set('is_mq_connect_error', 1);
        } else {
          connectMq();
        }
      });
      consumer.on('error', err => {
        ctx.logger.error('ppp===', err);
      });
    };
    connectMq();
  }
}
module.exports = InternalWithExternalService;
