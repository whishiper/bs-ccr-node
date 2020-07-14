'use strict';

const Command = require('egg-bin');

class ErrorCommand extends Command {
  * run() {
    const err = new Error('this is an error');
    throw err;
  }
}

module.exports = ErrorCommand;
