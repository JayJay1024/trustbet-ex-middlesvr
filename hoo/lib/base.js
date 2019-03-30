'use strict';

const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const rp = require('request-promise');

class Base {
    constructor(host, openid, secret, logger) {
        this.host = host;
        this.openid = openid;
        this.secret = secret;
        this.logger = logger;
    }

    /**
     * 根据hoo开发文档，对参数进行签名
     */
    async getSign(params) {
        try {
            let payload = '';

            // 对参数按key排序，然后拼接
            let keys = Object.keys(params).sort();
            for (let k of keys) {
                payload.length ? payload += '&' : '';
                payload += `${k}=${params[k]}`;
            }

            let digest = crypto.createHmac('sha256', this.secret)
                            .update(payload)
                            .digest('base64');
            let sign = encodeURI(digest);

            return sign;
        } catch (err) {
            this.logger.error('[hoo]catch error when get sign:', err);
        }
    }

    /**
     * 获取有效参数，即签名后的参数，包括公共参数，和传进来的各个接口需要的参数
     * 传进来的参数为某个hoo接口需要提供的参数
     * 不需要提供参数的hoo接口，则应该传空对象 {} 到这里
     */
    async getValidParams(params) {
        try {
            let stamp = Math.round(Date.now() / 1000);
            let openid = this.openid;
            let nonce = uuidv4().split('-')[4].substring(0, 10);

            // combine
            let data = Object.assign({
                stamp: stamp,
                openid: openid,
                nonce: nonce,
            }, params);

            // get sign and add to data
            let sign = await this.getSign(data);
            data.sign = sign;

            return data;
        } catch (err) {
            this.logger.error('[hoo]catch error when get valid params:', err);
        }
    }

    /**
     * GET方法请求
     */
    async sendGET(path, params) {
        try {
            let url = this.host + path;
            let ps = new URLSearchParams(params);

            let result = await rp({
                url: `${url}?${ps.toString()}`,
                method: 'GET',
                json: true,
                timeout: 5000,
            });
            return result;
        } catch (err) {
            this.logger.error('[hoo]catch error when send hoo GET:', err);
        }
    }

    /**
     * POST方法请求
     */
    async sendPOST(path, params) {
        try {
            let url = this.host + path;
            let ps = new URLSearchParams(params);

            let result = await rp({
                url: `${url}?${ps.toString()}`,  // hoo暂不支持json的body
                method: 'POST',
                json: true,
                timeout: 5000,
            });
            return result;
        } catch (err) {
            this.logger.error('[hoo]catch error when send POST:', err);
        }
    }
}

module.exports = Base;
