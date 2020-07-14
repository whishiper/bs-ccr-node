'use strict';

const fetch = require('node-fetch');
const DEFAULT_OPTIONS = {
  timeout: 3000,
};
exports.request = function(url, options) {
  return fetch(url, {
    ...DEFAULT_OPTIONS,
    ...options,
  })
    .then(res => res.json())
    .then(res => {
      if (res.status === 'ok') {
        return Promise.resolve(res.data);
      }
      if (res.status === 'error') {
        return Promise.reject(res);
      }
    })
    .catch(ex => {
      // console.error(ex);
      const err = new Error();
      err.message = ex;
      return Promise.reject(err);
    });
};
