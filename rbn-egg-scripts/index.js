'use strict';

const path = require('path');
const EggScriptsCommand = require('egg-scripts');

class EggScripts extends EggScriptsCommand {
  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: egg-scripts [command] [options]';

    // load directory
    this.load(path.join(__dirname, 'lib/cmd'));
  }
}

module.exports = exports = EggScripts;
