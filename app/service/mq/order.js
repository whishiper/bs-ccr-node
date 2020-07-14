'use strict';

const Service = require('egg').Service;
// const aws = require('aws-sdk');
const httpclient = require('urllib');
const { Producer, Message } = require('ali-ons');
const { guid } = require('../../utils/tool');

let orderGroupProducer;

// let sqs;
class OrderService extends Service {
  async orderGroup({ orderGroupData, redis_key, redis_table }) {
    const { name, createdAt, isEnd } = orderGroupData;
    const { app, ctx } = this;
    if (!orderGroupProducer) {
      orderGroupProducer = new Producer(
        Object.assign(app.config.rocketMq.javaOrderGroupChannel, {
          httpclient,
        })
      );
    }
    try {
      const msg = new Message(
        app.config.rocketMq.javaOrderGroupChannel.topic_pub, // topic
        `${name}_${createdAt}`, // tag
        JSON.stringify(
          orderGroupData
          // plantFormName: 'okex',
        ) // body
      );
      // set Message#keys
      msg.keys = [ guid() ];
      const sendRes = await orderGroupProducer.send(msg);
      const { msgId, sendStatus } = sendRes;

      if (sendStatus !== 'SEND_OK') {
        return;
      }
      // 记录发送次数
      const tableName = 'okex_mq_order_send_record';
      const key = `${name}_${isEnd}_${createdAt}`;
      let value = await app.redis.hget(tableName, key);
      if (!value) {
        value = 1;
      } else {
        value += 1;
      }
      app.redis.hset(tableName, key, value);
      app.redis.hdel(redis_table, redis_key);
    } catch (e) {
      ctx.logger.error(e);
      // ctx.service.handleErrors.throw_error(e);
    }
  }
}
module.exports = OrderService;
