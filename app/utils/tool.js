'use strict';
const formatTime = (time, type = 'ymdhms') => {
  const _formatFn = unit => (unit < 10 ? '0' + unit : '' + unit);
  // if (time.toString().includes('-')) {
  //   time = time.replace(/-/g, '/');
  // }
  // const timezone = 8; // 目标时区时间，东八区
  // const ti = new Date(time);
  // ti.setTime(ti.getTime() + (timezone * 60) * 60 * 1000);
  // ti.toUTCString();
  const t = new Date(time);
  const y = t.getFullYear();
  let month = t.getMonth() + 1;
  month = _formatFn(month);
  let d = t.getDate();
  d = _formatFn(d);
  let h = t.getHours();
  h = _formatFn(h);
  let min = t.getMinutes();
  min = _formatFn(min);
  let s = t.getSeconds();
  s = _formatFn(s);
  const day = t.getDay();
  const op = {
    timeNumber: `${y}${month}${d}${h}${min}`,
    timeStamp: t.getTime(),
    ymdhms: `${y}-${month}-${d} ${h}:${min}:${s}`,
    ymdhm: `${y}-${month}-${d} ${h}:${min}`,
    ymdh: `${y}-${month}-${d} ${h}`,
    ymd: `${y}-${month}-${d}`,
    ymd_num: `${y}${month}${d}`,
    _mdhm: `${month}:${d}:${h}:${min}`,
    hmin: `${h}:${min}`,
    ymd_zn: `${y}年${month}月${d}日`,
    ym_zn: `${y}年${month}月`,
    ymdhms_ios: `${y}/${month}/${d} ${h}:${min}:${s}`,
    ymdhm_ios: `${y}/${month}/${d} ${h}:${min}`,
    ymdh_ios: `${y}/${month}/${d} ${h}`,
    ymd_ios: `${y}/${month}/${d}`,
    timeObj: {
      timeStamp: t,
      year: y,
      month,
      date: d,
      hour: h,
      min,
      day,
    },
  };
  try {
    return op[type];
  } catch (err) {
    throw new Error('时间格式化类型不对');
  }
};
function randomInt(n) {
  return Array(n)
    .fill(0)
    .reduce((t, cur) => {
      const num = Math.random()
        .toString()
        .substr(2, 1);
      t += num;
      return t;
    }, '');
}
const getFloatNum = num => ('' + num).replace('0.', '').length;
exports.getFloatNum = getFloatNum;
const gendGroupId = (userid, coinPairId) => {
  const timezone = 8; // 目标时区时间，东八区
  const ti = new Date();
  ti.setTime(ti.getTime() + timezone * 60 * 60 * 1000);
  ti.toUTCString();
  const ymd_num = formatTime(new Date(ti), 'timeNumber');
  coinPairId = coinPairId.toString().padStart(6, '0');
  return `${ymd_num}${randomInt(4)}${coinPairId}${userid}`;
};
exports.gendGroupId = gendGroupId;
// 127.0.0.1:7100=>127.0.0.1
exports.removePort = host => {
  const idx = host.search(':');
  const ip = host.slice(0, idx);
  return ip;
};
exports.formatTime = formatTime;
// 是否json字符串
exports.isJSON = str => {
  const isType = data => Object.prototype.toString.call(data).slice(8, -1);
  if (isType(str) === 'String') {
    try {
      const obj = JSON.parse(str);
      if (isType(obj) === 'Object' && obj) {
        return true;
      }
      return false;
    } catch (e) {
      // console.log('error：' + str + '!!!' + e);
      return false;
    }
  }
};
// 过滤okex返回的响应数据
exports.filterOkexResponse = res => {
  if (res) {
    if (res.status === 'error') {
      console.log('res', res);
      const err = new Error();
      err.name = res['err-code'];
      err.message = res['err-msg'];
      err.explain_message = res['err-msg'];

      err.status = 422;

      throw err;
    }
  }
  return res;
};
// 浮点型加法函数
exports.floatAdd = (a, b) => {
  let r1,
    r2,
    m;
  try {
    r1 = a.toString().split('.')[1].length;
  } catch (e) {
    r1 = 0;
  }
  try {
    r2 = b.toString().split('.')[1].length;
  } catch (e) {
    r2 = 0;
  }
  m = Math.pow(10, Math.max(r1, r2));
  return ((a * m + b * m) / m).toFixed(2);
};
// 浮点型乘法
exports.floatMul = (a, b) => {
  let c = 0;
  const d = a.toString();
  const e = b.toString();
  try {
    c += d.split('.')[1].length;
  } catch (f) {}
  try {
    c += e.split('.')[1].length;
  } catch (f) {}
  return (
    (Number(d.replace('.', '')) * Number(e.replace('.', ''))) / Math.pow(10, c)
  );
};
exports.debouce = function(func, delay, immediate) {
  let timer = null;
  return function() {
    const context = this;
    const args = arguments;
    if (timer) clearTimeout(timer);
    if (immediate) {
      // 根据距离上次触发操作的时间是否到达delay来决定是否要现在执行函数
      const doNow = !timer;
      // 每一次都重新设置timer，就是要保证每一次执行的至少delay秒后才可以执行
      timer = setTimeout(function() {
        timer = null;
      }, delay);
      // 立即执行
      if (doNow) {
        func.apply(context, args);
      }
    } else {
      timer = setTimeout(function() {
        func.apply(context, args);
      }, delay);
    }
  };
};
exports.hashSet = async ({ redis, dataSource, key }) => {
  for (const [ field, value ] of Object.entries(dataSource)) {
    if (typeof value === 'object') {
      await redis.hset(key, field, JSON.stringify(value));
    } else {
      await redis.hset(key, field, value);
    }
  }
};
exports.guid = () => {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  );
};
