'use strict';

const path = require('path');
const DevCommand = require('egg-bin').DevCommand;
const ACMClient = require('acm-client').ACMClient;
class MyDevCommand extends DevCommand {
  * run(context) {

    const endpoint = process.env.acm_endpoint;
    const namespace = process.env.acm_namespace;
    const accessKey = process.env.acm_accessKey;
    const secretKey = process.env.acm_secretKey;
    const requestTimeout = process.env.acm_requestTimeout || 6000;

    const dataId = process.env.acm_dataId || 'dev-egg-okex-server';
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

module.exports = MyDevCommand;
