'use strict';

const Service = require('egg').Service;
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

const new_popular = popular.map(item => item.toLowerCase());
const new_official = official.map(item => item.toLowerCase());

class SymbolCache extends Service {

  async subscribe() {
    // 需要的计价货币 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos'
    const currencies = [ 'usdt', 'btc', 'eth', 'ht', 'husd', 'eos' ];
    const { app, ctx } = this;
    const { text } = await ctx.service.proxy.requestProxy({
      endpoint: `${app.config.huobi.url}/v1/common/symbols`,
    });
    if (!text) {
      return;
    }
    const { data } = JSON.parse(text);
    const obj = {};
    const quote_obj = {};
    data.forEach(item => {
      // const quote_currency = item['quote-currency'];
      const { symbol } = item;
      obj[symbol] = item;
      // if (!quote_obj[quote_currency]) {
      //   quote_obj[quote_currency] = [];
      //   quote_obj[quote_currency].push(item);
      // } else {
      //   quote_obj[quote_currency].push(item);
      // }
    });
    currencies.forEach(currency => {
      quote_obj[currency] = [];
      data.forEach(item => {
        if (item.symbol.includes(currency)) {
          // obj[item.symbol] = item;
          quote_obj[currency].push(item);
        }
      });
    });

    await app.redis.set('symbol_map', JSON.stringify(obj));
    await app.redis.set('huobi_symbol_list', JSON.stringify(data));

    await app.redis.set('quote_symbol_map', JSON.stringify(quote_obj));

    const symbol_map = JSON.parse(await app.redis.get('quote_symbol_map'));
    // 清除 redis缓存的 货币对
    for (const [ key, value ] of Object.entries(symbol_map)) {
      for (const item of value) {
        const score = await this.verificationIconsType(
          item['base-currency'],
          item['quote-currency']
        );
        await app.redis.zrevrangebyscore(
          `${item['quote-currency']}`,
          score,
          score
        );
        await app.redis.zrevrangebyscore(
          `${item['base-currency']}_${item['quote-currency']}`,
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
          item['base-currency'],
          item['quote-currency']
        );
        await this.coinPairsSetRedis(`${item['quote-currency']}`, score, item);
        await this.coinPairsSetRedis(
          `${item['base-currency']}_${item['quote-currency']}`,
          score,
          item
        );
      }
    }
  }

  async verificationIconsType(base, quote) {
    let score = 0;
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
