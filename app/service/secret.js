'use strict';

const Service = require('egg').Service;
const nodeRsa = require('node-rsa');
const fs = require('fs');
const path = require('path');
const resolve = dir => path.join(__dirname, '..', dir);

class SecretService extends Service {
  async readFile(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
  // 加密
  async encrypt(value) {
    const pbKey = await this.readFile(resolve('/cert/rsa_public_key.key'));
    const publicKey = new nodeRsa(pbKey, {
      encryptionScheme: 'pkcs1',
    });
    return publicKey.encrypt(value, 'base64');
  }
  // 解密
  async decrypt(encryptedData) {
    try {
      const pom = await this.readFile(resolve('/cert/rsa_private_key.key'));
      const privatekey = new nodeRsa(pom, {
        encryptionScheme: 'pkcs1',
      });
      return privatekey.decrypt(encryptedData, 'utf8');
    } catch (e) {
      throw e;
    }
  }
  // 专门解密 `${accessKey}_${secretKey}_${passphrase}`
  async decryptSecret(encryptedData) {
    try {
      const pom = await this.readFile(resolve('/cert/rsa_private_key.key'));
      const privatekey = new nodeRsa(pom, {
        encryptionScheme: 'pkcs1',
      });
      const secret = privatekey.decrypt(encryptedData, 'utf8');
      const [ accessKey, secretKey, passphrase ] = secret.split('_');
      return {
        accessKey,
        secretKey,
        passphrase,
      };
    } catch (e) {
      throw e;
    }
  }
}
module.exports = SecretService;
