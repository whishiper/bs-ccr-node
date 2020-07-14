'use strict';

const Command = require('egg-bin').TestCommand;

class TestDebugCommand extends Command {
  get description() {
    return 'test';
  }

  * run(context) {
    const testArgs = yield this.formatTestArgs(context);
    console.log('%j', testArgs);
  }
}

module.exports = TestDebugCommand;
