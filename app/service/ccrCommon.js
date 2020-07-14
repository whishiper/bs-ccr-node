'use strict';

const Service = require('egg').Service;
const { filterJavaResponse } = require('../utils/tool');

class CcrCommonService extends Service {
  /*
 @author:fsg
 @time:2020-01-09 14:31:53
 @params
 @description:停止继续交易
 */
  async stopProfit(data) {
    const { ctx, app } = this;
    const {
      symbol_id,
      coinPairChoiceId,
      userId,
      tradePlatformApiBindProductComboId,
    } = data;
    try {
      const access_token = await app.redis
        .get('internal')
        .hget('user_token_relation_table', userId);
      const res = await ctx.service.aliyunApiGateway
        .index(
          '/coin_pair_choice/',
          'put',
          'default_handle_result',
          {
            coinPairId: symbol_id,
            id: coinPairChoiceId,
            isStart: 1, //
            orderStatus: 0,
            userId,
            tradePlatformApiBindProductComboId,
          },
          access_token
        )
        .then(res => filterJavaResponse(ctx, res));
      console.log('止盈后停止成功', res);
      if (!res) {
        return;
      }
      const flag = await app.redis
        .get('internal')
        .hget(`user_${userId}_stopProfit_table`, coinPairChoiceId);
      if (flag) {
        app.redis
          .get('internal')
          .hdel(`user_${userId}_stopProfit_table`, coinPairChoiceId);
      }
      return res;
    } catch (e) {
      // 将用户所有需要设置止盈后停止的货币对加入到缓存中，防止有用户在非登陆有效期间需要止盈又401到情况，然后用户在前端登录后在调接口将这部分滞后的货币对停止 @fsg 2020.4.2
      app.redis
        .get('internal')
        .hset(
          `user_${userId}_stopProfit_table`,
          coinPairChoiceId,
          JSON.stringify(data)
        );
      console.log('止盈后停止失败', e);
    }
  }
}
module.exports = CcrCommonService;
