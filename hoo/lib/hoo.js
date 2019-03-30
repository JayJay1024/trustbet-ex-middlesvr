'use strict';

const base = require('./base');

class HooV1 extends base {
    constructor(host, openid, secret, logger) {
        super(host, openid, secret, logger);
        this.logger = logger;
    }

    /**
     * 查询账户
     * GET /api/open/user
     * 说明: 商户用来验证jssdk拿到的client_id是否正确
     * 参数(参数名、参数类型、是否必须、描述):
     *     client_id:  string  是  账户名
     */
    async checkUser(params) {
        try {
            let path = '/api/open/user';
            let vp = await this.getValidParams(params);
            return await this.sendGET(path, vp);
        } catch (err) {
            this.logger.error('catch error when check hoo user:', err);
        }
    }

    /**
     * 创建收款单
     * POST /api/open/invoices
     * 说明: 商户生成闪电网络收款码，此操作为商户方用户的充值操作
     * 参数(参数名、参数类型、是否必须、描述):
     *     memo:      string    否    备注(100字以内)
     *     amount:    int       是    收款金额，以聪为单位
     *     tradeno:   string    否    在客户系统中唯一订单号, 60字以内
     *     extra:     string    否    扩展，可存任何信息，200字以内
     */
    async createInvoices(params) {
        try {
            let path = '/api/open/invoices';
            let vp = await this.getValidParams(params);
            return await this.sendPOST(path, vp);
        } catch (err) {
            this.logger.error('[hoo]catch error when create invoices:', err);
        }
    }

    /**
     * 收款单详情
     * GET /api/open/invoices
     * 说明: 商户查询收款码状态
     * 参数(参数名、参数类型、是否必须、描述):
     *     payment_hash:  string  是  收款单hash id
     */
    async getInvoices(params) {
        try {
            let path = '/api/open/invoices';
            let vp = await this.getValidParams(params);
            return await this.sendGET(path, vp);
        } catch (err) {
            this.logger.error('[hoo]catch error when get invoices:', err);
        }
    }

    /**
     * 解码收款单
     * POST /api/open/invoices/decode
     * 说明: 商户对收款码进行解码，获取收款金额和备注等信息
     * 参数(参数名、参数类型、是否必须、描述):
     *     invoice:  string  是  收款单hash
     */
    async decodeInvoices(params) {
        try {
            let path = '/api/open/invoices/decode';
            let vp = await this.getValidParams(params);
            return await this.sendPOST(path, vp);
        } catch (err) {
            this.logger.error('[hoo]catch error when decode invoices:', err);
        }
    }

    /**
     * 支付
     * POST /api/open/invoices/pay
     * 说明: 此操作为商户方的用户提现操作，而不是商户自己生成一个收款码，自己支付
     * 参数(参数名、参数类型、是否必须、描述):
     *     invoice:   string   是   收款单hash
     *     amount:    int      否   金额
     *     memo:      string   否   备注
     * 注: amount为可选参数，若invoice为固定金额收款，则以invoice为准，若invoice为不固定金额收款，刚以amount参数为准
     */
    async pay2User(params) {
        try {
            let path = '/api/open/invoices/pay';
            let vp = await this.getValidParams(params);
            return await this.sendPOST(path, vp);
        } catch (err) {
            this.logger.error('[hoo]catch error when pay to user:', err);
        }
    }

    /**
     * 余额
     * GET /api/open/balance
     * 说明: 获取商户的闪电网络余额
     * 参数(参数名、参数类型、是否必须、描述):
     *     无
     */
    async getAppBalance() {
        try {
            let path = '/api/open/balance';
            let vp = await this.getValidParams({});
            return await this.sendGET(path, vp);
        } catch (err) {
            this.logger.error('[hoo]catch error when get app balance:', err);
        }
    }

    /**
     * 充值地址
     * GET /api/open/address
     * 说明: 获取商户的BTC充值地址，充值完成，可通过余额接口查询
     * 参数(参数名、参数类型、是否必须、描述):
     *     无
     */
    async getAppAddress() {
        try {
            let path = '/api/open/address';
            let vp = await this.getValidParams({});
            return await this.sendGET(path, vp);
        } catch (err) {
            this.logger.error('[hoo]catch error when get app address:', err);
        }
    }
}

module.exports = HooV1;
