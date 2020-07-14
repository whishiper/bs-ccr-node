'use strict';

const Service = require('egg').Service;
class FormulaService extends Service {
  /*
  @author:fsg
  @time:2020-02-26 15:52:50
  @params deep_bids:
      // 买入的深度
      bids:[
          [
              0.2327,
              194.03
          ],
      ],
  buy_price:1,
   positionNum:1,
   positionCost:1
  @description:
  */
  async realTimeEarningRatio({
    deep_bids,
    // buy_price,
    positionNum,
    positionCost
  }) {
    let priceSum = 0;
    for (const item of deep_bids) {
      const [price, num] = item;
      if (positionNum - 0 - num >= 0) {
        priceSum += price * num;
        positionNum -= num;
      } else {
        priceSum += price * positionNum;
        break;
      }
    }
    return priceSum / positionCost;
  }
}
module.exports = FormulaService;
