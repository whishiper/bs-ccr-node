'use strict';

const Command = require('egg-bin').Command;

const ACMClient = require('acm-client').ACMClient;
class NspCommand extends Command {
  get description() {
    return 'nsp check';
  }

  async run({ cwd, rawArgv }) {
    const acmClient = new ACMClient({
      endpoint: 'acm.aliyun.com', // Available in the ACM console
      namespace: '9056bc66-b393-49d5-89a6-fea8d039342e', // Available in the ACM console
      accessKey: 'LTAI4Fd1zNzk8YdGKrgF5ohp', // Available in the ACM console
      secretKey: 'aja6ZkZUeA11ZroIdOADMQRKzhSjOJ',
      requestTimeout: 6000,
    });

    const acmConfig = await acmClient.getConfig(
      'prod-egg-master',
      'DEFAULT_GROUP'
    );

    // if (acmConfig != null) {
    //   const acmConfToJson = JSON.parse(acmConfig);
    //   if (typeof acmConfToJson === 'object') {
    //     Object.keys(acmConfToJson).forEach(item => {
    //       config[item] = Reflect.get(acmConfToJson, item) ? Reflect.get(acmConfToJson, item) : {};
    //     });
    //   }
    // }

    console.log('----acmConfig----', JSON.parse(acmConfig));
    await console.log('run nsp check at %s with %j', cwd, rawArgv);
  }
}

module.exports = NspCommand;
