'use strict';
exports.isJsonString = str => {
  try {
    if (typeof JSON.parse(str) === 'object') {
      return true;
    }
  } catch (e) {}
  return false;
};
// 过滤java的报错
exports.filterJavaResponse = (ctx, res, handleType = 'ctxHandleError') => {
  // {data:null,msg:''}
  // {data:0}
  const { data } = res;
  if (!data) {
    const err = new Error();
    err.name = res.msg || res.success;
    err.message = data;
    err.data = data;
    err.msg = res.msg || res.success;
    err.status = 422;
    if (handleType === 'ctxHandleError') {
      ctx.service.handleErrors.throw_error(err);
    } else {
      return err;
    }
  }
  return res;
};
// 过滤火币返回的响应数据
exports.filterHuobiResponse = res => {
  // console.log('res=====', res);
  if (!res) {
    const err = new Error();
    err.name = 'huobi response error';
    err.message = '火币验证错误';
    err.status = 422;

    throw err;
  }
  if (res.name === 'Error' || Reflect.has(res, 'errors')) {
    console.log('filterHuobiResponse res', typeof res, res);

    // console.log('res errors======', res.errors);
    const { errors } = res;
    const err = new Error();
    err.name = 'huobi response error';
    err.message = errors['err-msg'] || errors.message || '火币验证错误';
    err.status = 422;
    err.detail = errors;
    throw err;
  }
  return res;
};
// TODO
exports.filterOkexResponse = res => {
  if (!res) {
    const err = new Error();
    err.name = 'okex response error';
    err.message = 'okex验证错误';
    err.status = 422;

    throw err;
  }
  if (Reflect.has(res, 'err_code')) {
    const { errors, message } = res;
    const err = new Error();
    err.name = 'okex response error';
    err.message = message || 'okex验证错误';
    err.status = 422;
    err.detail = errors;
    throw err;
  }
  return res;
};
// TODO 数据结构待确认 @fsg 2020.4.9
exports.filterZbResponse = res => {
  if (!res) {
    const err = new Error();
    err.name = '中币 response error';
    err.message = '中币验证错误';
    err.status = 422;

    throw err;
  }
  if (Reflect.has(res, 'err_code')) {
    const { errors, message } = res;
    const err = new Error();
    err.name = '中币 response error';
    err.message = message || '中币验证错误';
    err.status = 422;
    err.detail = errors;
    throw err;
  }
  return res;
};
// 时间格式化
exports.formatTime = (time, type = 'ymdhms') => {
  const _formatFn = unit => (unit < 10 ? '0' + unit : '' + unit);
  // if (time.toString().includes('-')) {
  //   time = time.replace(/-/g, '/');
  // }
  const timezone = 8; // 目标时区时间，东八区
  const ti = new Date(time);
  ti.setTime(ti.getTime() + (timezone * 60) * 60 * 1000);
  ti.toUTCString();
  const t = new Date(ti);
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
    timeStamp: t.getTime(),
    ymdhms: `${y}-${month}-${d} ${h}:${min}:${s}`,
    ymdhm: `${y}-${month}-${d} ${h}:${min}`,
    ymdh: `${y}-${month}-${d} ${h}`,
    ymd: `${y}-${month}-${d}`,
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
// 深拷贝
const deepCopy = obj1 => {
  const type = Object.prototype.toString.call(obj1);
  let resObj;
  // 引用类型
  if (type.includes('object')) {
    if (type === '[object Array]') {
      resObj = [];
      for (let i = 0; i < obj1.length; i++) {
        if (typeof obj1[i] === 'object') {
          resObj[i] = deepCopy(obj1[i]);
        } else {
          resObj[i] = obj1[i];
        }
      }
    }
    if (type === '[object Object]') {
      resObj = {};
      for (const key in obj1) {
        if (typeof obj1[key] === 'object') {
          resObj[key] = deepCopy(obj1[key]);
        } else {
          resObj[key] = obj1[key];
        }
      }
    }
  } else {
    // 基本类型
    resObj = obj1;
  }
  return resObj;
};

exports.deepCopy = deepCopy;
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
      return false;
    }
  }
}
;
