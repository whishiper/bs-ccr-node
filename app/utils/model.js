'use strict';

const redisRule = {
  string: {
    set: [
      // {
      //   "key": "key1",
      //   "value": "value1"
      // }
    ],
    del: [],
  },
  hash: {
    hset: [
      // {
      //   "table": "tableName",
      //   "field": "fieldName",
      //   "value": "value1"
      // }
    ],
    hdel: [
      // {
      //   "table": "tableName",
      //   "field": "fieldName"
      // }
    ],
  },
  zset: {
    zadd: [
      // {
      //   "zsetName": "",
      //   "value": "",
      //   "key": ""
      // }
    ],
    zrem: [
      // {
      //   "zsetName": "",
      //   "key": ""
      // }
    ],
  },
  set: {
    sadd: [
      // {
      //   "key": "",
      //   "value": ""
      // }
    ],
  },
};
exports.redisRule = redisRule;
