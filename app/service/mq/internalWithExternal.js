'use strict';

const Service = require('egg').Service;
// const aws = require('aws-sdk');
const httpclient = require('urllib');
const { Producer, Message } = require('ali-ons');
const { guid, formatTime } = require('../../utils/tool');
let internalEggProducer;
// let sqs;
class ProducerService extends Service {
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
  async emit(data) {
    const { mqType } = data;
    const { app, ctx } = this;
    if (!internalEggProducer) {
      internalEggProducer = new Producer(
        Object.assign(app.config.rocketMq.InternalWithExternalChannel, {
          httpclient,
        })
      );
    }

    try {
      const msg = new Message(
        app.config.rocketMq.InternalWithExternalChannel.topic_pub, // topic
        `${mqType}_${formatTime(new Date())}`, // tag
        JSON.stringify(data) // body
      );
      // set Message#keys
      msg.keys = [ guid() ];
      internalEggProducer.send(msg);
    } catch (e) {
      ctx.service.handleErrors.throw_error(e);
    }
  }
}
module.exports = ProducerService;
