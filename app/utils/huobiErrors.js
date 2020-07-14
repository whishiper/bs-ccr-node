'use strict';
const HUOBI_ERRORS = {
  // 'api-signature-not-valid': 'API签名错误',
  // 'gateway-internal-error': '系统繁忙，请稍后再试',
  // 'order-accountbalance-error': '账户余额不足',
  // 'order-limitorder-price-error': '限价单下单价格超出限制',
  'order-limitorder-amount-error': '预算过高，请忘记订单重设预算',
  // 'order-orderprice-precision-error': '下单价格超出精度限制',
  // 'order-orderamount-precision-error': '下单数量超过精度限制',
  'order-marketorder-amount-error': '预算过高，请忘记订单重设预算',
  // 'order-queryorder-invalid': '查询不到此条订单',
  // 'order-orderstate-error': '订单状态错误',
  // 'order-datelimit-error': '查询超出时间限制',
  // 'order-update-error': '订单更新出错',
  'order-value-min-error': '预算过低，请忘记订单重设预算',
  'account-frozen-balance-insufficient-error': '余额不足',
  'api-signature-not-valid': 'API Key已经过期',
};
exports.HUOBI_ERRORS = HUOBI_ERRORS;
module.exports = {
  HUOBI_ERRORS,
};
