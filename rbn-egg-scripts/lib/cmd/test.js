'use strict';

const StartCommand = require('egg-scripts').StartCommand;
const ACMClient = require('acm-client').ACMClient;

class MyStartCommand extends StartCommand {
  * run(context) {

    const endpoint = process.env.acm_endpoint;
    const namespace = process.env.acm_namespace;
    const accessKey = process.env.acm_accessKey;
    const secretKey = process.env.acm_secretKey;
    const requestTimeout = process.env.acm_requestTimeout || 6000;

    const dataId = process.env.acm_dataId || 'test-egg-master';
    const group = process.env.acm_group || 'DEFAULT_GROUP';

    if (!endpoint || !namespace || !accessKey || !secretKey) {
      throw new Error('ACM Config Fail');
    }

    const acmClient = new ACMClient({ endpoint, namespace, accessKey, secretKey, requestTimeout });


    const acmConfig = yield acmClient.getConfig(dataId, group);

    yield acmClient.close();

    context.argv.acmConfig = acmConfig;


    yield super.run(context);

  }
}

module.exports = MyStartCommand;
