'use strict';

const Service = require('egg').Service;
// const aws = require('aws-sdk');
const httpclient = require('urllib');
const { Producer, Message } = require('ali-ons');
const { guid, formatTime } = require('../../utils/tool');

let javaProducer;
// let internalEggProducer;
// let sqs;
class PriceService extends Service {
  /*
  @author:fsg
  @time:2019-08-05 10:46:46
  @params
  @description:rocketmq发消息
  */
  async emit(symbol) {
    const { app, ctx } = this;
    if (!javaProducer) {
      javaProducer = new Producer(
        Object.assign(app.config.rocketMq.javaChannel, {
          httpclient,
        })
      );
    }
    // 现价
    const price = await ctx.service.commonApi.latestOpenPrice({
      symbol,
    });
    if (!price) {
      return Promise.resolve(0);
    }
    const tick = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments/${symbol}/book`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    if (!tick) {
      return Promise.resolve(0);
    }
    try {
      const send2JavaData = {
        price,
        deep: {
          bids: tick.bids,
          asks: tick.asks,
        },
        symbol,
        plantFormName: 'okex',
      };
      // await app.redis.hset('okex-symbol-price-list', symbol, price.buy);
      // 买入深度，用于建仓成功后计算实时收益比
      await app.redis.hset(
        'okex-symbol-deep-bids-list',
        symbol,
        JSON.stringify(tick.bids)
      );
      const msg = new Message(
        app.config.rocketMq.javaChannel.topic_pub, // topic
        `${symbol}_${formatTime(new Date())}`, // tag

        JSON.stringify(send2JavaData) // body
      );
      // set Message#keys
      msg.keys = [ guid() ];
      javaProducer.send(msg);
      return Promise.resolve(1);
    } catch (e) {
      // ctx.service.handleErrors.throw_error(e);
      return Promise.resolve(0);
    }
  }
}
module.exports = PriceService;
