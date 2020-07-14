'use strict';

const Service = require('egg').Service;

class coinPairs extends Service {
  // 展开数组
  flatArr(arr) {
    return arr.reduce((t, cur) => {
      Array.isArray(cur) ? (t = t.concat(this.flatArr(cur))) : t.push(cur);
      return t;
    }, []);
  }


  async getCoinPairsPromise(
    quot_currency_name,
    base_currency_name,
    type,
    plantFormName
  ) {
    const { app } = this;
    // let coinPairsPromise;

    let cur_server_url = app.config.huobiServer.url;
    if (plantFormName === 'huobi') {

      if (quot_currency_name) {
        quot_currency_name = quot_currency_name.toLocaleLowerCase();
      }

      if (base_currency_name) {
        base_currency_name = base_currency_name.toLocaleLowerCase();
      }

      if (quot_currency_name && base_currency_name) {

        return await app.redis.get('internal').zrevrangebyscore(
          `${base_currency_name}_${quot_currency_name}`,
          type,
          type
        );
      }
      return app.redis.get('internal').zrevrangebyscore(
        `${quot_currency_name}`,
        type,
        type
      );
    }

    if (plantFormName === 'okex') {
      cur_server_url = app.config.okexServer.url;

      if (quot_currency_name) {
        quot_currency_name = quot_currency_name.toLocaleUpperCase();
      }

      if (base_currency_name) {
        base_currency_name = base_currency_name.toLocaleUpperCase();
      }

    }

    if (quot_currency_name && base_currency_name) {
      return app
        .curl(
          `${cur_server_url}/zrevrangebyscore?key=${`${base_currency_name}_${quot_currency_name}`}&type=${type}`,
          {
            method: 'GET',
            dataType: 'json',
          }
        )
        .then(res => res.data);
    }
    return app
      .curl(
        `${cur_server_url}/zrevrangebyscore?key=${quot_currency_name}&type=${type}`,
        {
          method: 'GET',
          dataType: 'json',
        }
      )
      .then(res => res.data);
  }


  async searchCoinPairs() {
    const { ctx, app } = this;
    const {
      quot_currency_name,
      base_currency_name,
      type,
      plantFormName,
    } = ctx.request.body;

    let coinPairs = [];
    if (quot_currency_name && base_currency_name) {
      // 根据计价货币 和 基础货币 查货币对 0 未知  1 官方  2 主流  3 主流+官方
      const coin_pairs0_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        0,
        plantFormName
      );
      const coin_pairs1_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        1,
        plantFormName
      );
      const coin_pairs2_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        2,
        plantFormName
      );
      const coin_pairs3_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        3,
        plantFormName
      );
      const list = await Promise.all([
        coin_pairs0_promise,
        coin_pairs1_promise,
        coin_pairs2_promise,
        coin_pairs3_promise,
      ]);
      coinPairs = this.flatArr(list);
    } else if (
      quot_currency_name &&
      !base_currency_name &&
      Number(type) === 1
    ) {
      // 根据 计价货币 查 主流 货币对
      const coin_pairs1_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        1,
        plantFormName
      );
      const coin_pairs3_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        3,
        plantFormName
      );

      const list = await Promise.all([
        coin_pairs1_promise,
        coin_pairs3_promise,
      ]);
      coinPairs = this.flatArr(list);
    } else if (
      quot_currency_name &&
      !base_currency_name &&
      Number(type) === 2
    ) {
      // 根据 计价货币 查 官方 货币对
      const coin_pairs2_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        2,
        plantFormName
      );
      const coin_pairs3_promise = this.getCoinPairsPromise(
        quot_currency_name,
        base_currency_name,
        3,
        plantFormName
      );

      const list = await Promise.all([
        coin_pairs2_promise,
        coin_pairs3_promise,
      ]);

      coinPairs = this.flatArr(list);
    }
    const obj = coinPairs
      .map(item => JSON.parse(item))
      .reduce((t, cur) => {
        if (plantFormName === 'huobi') {
          t[cur.symbol] = cur;
        } else if (plantFormName === 'okex') {
          t[cur.instrument_id] = cur;
        }
        return t;
      }, {});

    return Object.values(obj);
  }
}

module.exports = coinPairs;
