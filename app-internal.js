'use strict';

class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  async configWillLoad() {
    const { app } = this;

    const acmConfig = app.options.acmConfig;

    if (acmConfig != null) {
      const acmConfToJson = JSON.parse(acmConfig);
      if (typeof acmConfToJson === 'object') {
        Object.keys(acmConfToJson).forEach(item => {
          app.config[item] = app.config[item] || {};

          Reflect.get(acmConfToJson, item)
            ? Object.assign(app.config[item], Reflect.get(acmConfToJson, item))
            : '';
        });
      }
    }
  }


}

module.exports = AppBootHook;
