'use strict';
const Service = require('egg').Service;
const mqtt = require('mqtt');
const CryptoJS = require('crypto-js');
let client;
class WsOkexService extends Service {
  async init() {
    const { app, ctx } = this;
    const {
      accessKey,
      secretKey,
      clientId,
      instanceId,
      host,
      okexTopicList,
    } = await app.config.mqtt;
    const username = 'Signature|' + accessKey + '|' + instanceId;
    const password = CryptoJS.HmacSHA1(clientId, secretKey).toString(
      CryptoJS.enc.Base64
    );
    const options = {
      username,
      password,
      clientId,
      keepalive: 90,
      connectTimeout: 3000,
    };
    if (!client) {
      client = mqtt.connect(`tcp://${host}:1883`, options);
    }
    // TODO 与okex建立mq通信 @fsg 2019.11.28
    client.on('connect', () => {
      for (const _module of Object.values(okexTopicList)) {
        for (const topic of Object.values(_module)) {
          client.subscribe(topic, () => {
          });
        }
      }
    });
    // 10秒获取一次redis中的现价

    client.on('message', (topic, payload) => {
      // if (topic !== okexTopicList.common.symbolPrice) {
      console.log('okex ws topic:', topic, payload.toString());
      // }
    });
    client.on('disconnect', function(packet) {
      console.log('packet', packet);
    });
    client.on('error', function(error) {
      console.log('okex ws err=====', error);
    });
  }
  async emit(data) {
    const { ctx } = this;
    const { okexTopicList } = await this.app.config.mqtt;
    const { type, plantFormName, signId } = data;
    if (type === 'tradeError') {
      const topic = `${okexTopicList.private.tradeError}/${plantFormName}/${signId}`;
      if (client) {
        try {
          client.publish(topic, JSON.stringify(data));
        } catch (err) {
          console.log(err);
        }
      }
    }
    if (type === 'updateSymbolTradeInfo') {
      const topic = `${okexTopicList.private.symbolTradeInfo}/${plantFormName}/${signId}`;
      if (client) {
        try {
          console.log('emit okex mqtt updateSymbolTradeInfo');
          client.publish(topic, JSON.stringify(data));
        } catch (err) {
          console.log(err);
        }
      }
    }
    if (type === 'updateCurrencyBalance') {
      const topic = `${okexTopicList.private.currencyBalance}/${plantFormName}/${signId}`;
      if (client) {
        try {
          console.log('emit okex mqtt updateCurrencyBalance');
          client.publish(topic, JSON.stringify(data));
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
}
module.exports = WsOkexService;
