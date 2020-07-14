'use strict';

module.exports = {
  info() {},
  warn(...args) {
    // console.warn(...args);
    global.logger.warn(...args);
  },
  error(...args) {
    // console.error(...args);
    global.logger.error(...args);
  },
  debug() {},
};
