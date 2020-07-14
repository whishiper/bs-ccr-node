"use strict";

const Service = require("egg").Service;
// const aws = require('aws-sdk');
const httpclient = require("urllib");
const { Producer, Message } = require("../../utils/ons/index");
const { guid, formatTime } = require("../../utils/tool");
let javaProducer;
// let internalEggProducer;
// let sqs;
class PriceService extends Service {
  // constructor(ctx) {
  //   super(ctx);
  //   // this.commonApi=ctx.service.commonApi
  // }
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
          httpclient
        })
      );
    }
    // 现价
    const price = await ctx.service.commonApi.latestOpenPrice({
      symbol
    });
    if (!price) {
      return Promise.resolve(0);
      // return Promise.resolve(0);
    }
    // 火币深度数据
    const { text } = await ctx.service.proxy.requestProxy({
      endpoint: `${app.config.huobi.url}/market/depth?symbol=${symbol}&type=step0`
    });
    if (!text) {
      ctx.logger.error(text);
      // return Promise.resolve(0);
      return Promise.resolve(0);
    }
    const { tick } = JSON.parse(text);
    const send2JavaData = {
      price,
      deep: {
        bids: tick.bids,
        asks: tick.asks
      },
      symbol,
      plantFormName: "huobi"
    };
    // await app.redis.hset('huobi-symbol-price-list', symbol, price.buy);
    // 买入深度，用于建仓成功后计算实时收益比
    await app.redis.hset(
      "huobi-symbol-deep-bids-list",
      symbol,
      JSON.stringify(tick.bids)
    );
    try {
      const msg = new Message(
        app.config.rocketMq.javaChannel.topic_pub, // topic
        `${symbol}_${formatTime(new Date())}`, // tag
        JSON.stringify(send2JavaData) // body
      );
      // set Message#keys
      msg.keys = [guid()];
      javaProducer.send(msg);
      return Promise.resolve(1);
    } catch (e) {
      return Promise.resolve(0);
    }
  }
}
module.exports = PriceService;
