'use strict';

const Subscription = require('egg').Subscription;

const popular = [
  'XMR',
  'HB10',
  'HC',
  'XEM',
  'QTUM',
  'NEO',
  'HT',
  'IOTA',
  'ADA',
  'ZEC',
  'DASH',
  'OMG',
  'XRP',
  'EOS',
  'LTC',
  'TEC',
  'BCH',
  'ETH',
  'USDT',
  'BTC',
  'ETC',
];

const official = [ 'XRP', 'EOS', 'LTC', 'BTC', 'BCH', 'ETH', 'ETC' ];

const new_popular = popular.map(item => item.toUpperCase());
const new_official = official.map(item => item.toUpperCase());

class SymbolCache extends Subscription {
  static get schedule() {
    return {
      interval: '24h', // 24h执行一次
      type: 'worker',
      immediate: false,
      disable: true,
      // immediate: true,
    };
  }

  async subscribe() {
    // 需要的计价货币 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos'
    const { app, ctx } = this;
    // 执行该任务时候还没有拿到代理ip的缓存，直接请求 @fsg 2019.08.25
    const data = await app
      .curl(`${app.config.okex.url}/api/spot/v3/instruments`, {
        method: 'GET',
        dataType: 'json',
      })
      .then(res => res.data);
    // console.log('data', data);
    const obj = {};
    const quote_obj = {};
    data.forEach(item => {
      const { quote_currency, instrument_id } = item;
      item.symbol = item.instrument_id;
      obj[instrument_id] = item;
      if (!quote_obj[quote_currency]) {
        quote_obj[quote_currency] = [];
        quote_obj[quote_currency].push(item);
      } else {
        quote_obj[quote_currency].push(item);
      }
    });
    // currencies.forEach(currency => {
    //   quote_obj[currency] = [];
    //   data.forEach(item => {
    //     if (item.quote_currency === currency) {
    //       item.symbol = item.instrument_id;
    //       obj[item.instrument_id] = item;
    //       quote_obj[currency].push(item);
    //     }
    //   });
    // });

    await app.redis.set('okex_symbol_map', JSON.stringify(obj));
    await app.redis.set('okex_symbol_list', JSON.stringify(data));

    await app.redis.set('okex_quote_symbol_map', JSON.stringify(quote_obj));

    const symbol_map = JSON.parse(await app.redis.get('okex_quote_symbol_map'));
    // 清除 redis缓存的 货币对
    for (const [ key, value ] of Object.entries(symbol_map)) {
      for (const item of value) {
        const score = await this.verificationIconsType(
          item.base_currency,
          item.quote_currency
        );
        await app.redis.zrevrangebyscore(
          `${item.quote_currency}`,
          score,
          score
        );
        await app.redis.zrevrangebyscore(
          `${item.base_currency}_${item.quote_currency}`,
          score,
          score
        );
      }
    }

    // 缓存货币对
    for (const [ key, value ] of Object.entries(symbol_map)) {
      // zadd score  0未知 | 1 主流 | 2 官方 | 3 主流和官方
      for (const item of value) {
        const score = await this.verificationIconsType(
          item.base_currency,
          item.quote_currency
        );
        // console.log('score', score, 'item', item);
        await this.coinPairsSetRedis(`${item.quote_currency}`, score, item);
        await this.coinPairsSetRedis(
          `${item.base_currency}_${item.quote_currency}`,
          score,
          item
        );
      }
    }
  }

  async verificationIconsType(base, quote) {
    let score = 0;
    // console.log(new_popular, 'base', base);
    const is_popular = new_popular.includes(base);
    const is_official = new_official.includes(base);

    if (is_popular && is_official) {
      score = 3;
      return score;
    } else if (is_popular) {
      score = 1;
    } else if (is_official) {
      score = 2;
    }

    return score;
  }

  async coinPairsSetRedis(key, score, item) {
    const { app } = this;
    const new_item = Object.assign(item, { score });
    await app.redis.zadd(key, score, JSON.stringify(new_item));
  }
}
module.exports = SymbolCache;
