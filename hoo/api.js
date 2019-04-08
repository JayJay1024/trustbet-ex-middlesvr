'use strict';

const config = require('../config');
const HooV1 = require('./lib/hoo');
const logger = require('../common/logger');
const Trustbet = require('../trustbet/trustbet');

const hoo = new HooV1(
                      config.hoo.host,
                      config.hoo.openid,
                      config.hoo.secret,
                      logger);
const trustbet = new Trustbet(pay2User);

/**
 * 查询账户
 * 说明: 商户用来验证jssdk拿到的client_id是否正确
 * 参数(参数名、参数类型、是否必须、描述):
 *     client_id:  string  是  账户名
 */
const checkUser = async (params) => {
    return await hoo.checkUser(params);
}

/**
 * 创建收款单
 * 说明: 商户生成闪电网络收款码，此操作为商户方用户的充值操作
 * 参数(参数名、参数类型、是否必须、描述):
 *     memo:      string    否    备注(100字以内)
 *     amount:    int       是    收款金额，以聪为单位
 *     tradeno:   string    否    在客户系统中唯一订单号, 60字以内
 *     extra:     string    否    扩展，可存任何信息，200字以内
 */
const createInvoices = async (params) => {
    return await hoo.createInvoices(params);
}

/**
 * 收款单详情
 * 说明: 商户查询收款码状态
 * 参数(参数名、参数类型、是否必须、描述):
 *     payment_hash:  string  是  收款单hash id
 */
const getInvoices = async (params) => {
    return await hoo.getInvoices(params);
}

/**
 * 解码收款单
 * 说明: 商户对收款码进行解码，获取收款金额和备注等信息
 * 参数(参数名、参数类型、是否必须、描述):
 *     invoice:  string  是  收款单hash
 */
const decodeInvoices = async (params) => {
    return await hoo.decodeInvoices(params);
}

/**
 * 支付
 * 说明: 此操作为商户方的用户提现操作，而不是商户自己生成一个收款码，自己支付
 * 参数(参数名、参数类型、是否必须、描述):
 *     invoice:   string   是   收款单hash
 *     amount:    int      否   金额
 *     memo:      string   否   备注
 * 注: amount为可选参数，若invoice为固定金额收款，则以invoice为准，若invoice为不固定金额收款，刚以amount参数为准
 */
async function pay2Invoices(params) {
    return await hoo.pay2Invoices(params);
}

/**
 * 站内支付
 * 说明: 此操作为商户方主动给用户打币，无需用户发起操作，此接口仅支持虎符站内。
 * 参数(参数名、参数类型、是否必须、描述):
 *     client_id:  string  是  虎符钱包内的用户闪电网络账户id
 *     amount:     int     是  金额
 *     memo:       string  否  备注
 */
async function pay2User(params) {
    logger.info('[hoo]pay to user:', JSON.stringify(params));
    let result = await hoo.pay2User(params);
    logger.info('[hoo]pay to user result:', result);
    return result;
}

/**
 * 余额查询
 * 说明: 获取商户的闪电网络余额
 * 参数(参数名、参数类型、是否必须、描述):
 *     无
 */
const getAppBalance = async () => {
    return await hoo.getAppBalance();
}

/**
 * 充值地址
 * 说明: 获取商户的BTC充值地址，充值完成，可通过余额接口查询
 * 参数(参数名、参数类型、是否必须、描述):
 *     无
 */
const getAppAddress = async () => {
    return await hoo.getAppAddress();
}

/**
 * 取消预约上庄
 */
const cancelOndealerlater = async (params) => {
    let player = params.player ? params.player : 'test';
    let sym    = params.coin_code ? `0,${params.coin_code.toUpperCase()}` : '4,EOS';
    return await trustbet.cancelOndealerlater2(player, sym);
}
/**
 * 立即下庄、预约下庄，取消预约下庄
 */
const offdealer = async (params) => {
    let player = params.player ? params.player : 'test';
    let sym    = params.coin_code ? `0,${params.coin_code.toUpperCase()}` : '4,EOS';
    let status = params.status ? params.status : 0;
    return await trustbet.offdealer2(player, sym, status);
}

/**
 * 收款成功回调
 * 说明: 此接口为Hoo虎符钱包回调商户系统
 * 参数(参数名、参数类型、是否必须、描述):
 *     payment_hash:   string    是   收款码id
 *     tradeno:        string    是   客户系统唯一订单号
 *     memo:           string    是   原样返回
 *     extra:          string    是   原样返回
 *     amount:         string    是   收款金额(聪)
 *     payer:          string    是   支付者的client_id
 */
const dealWithInvoices = async (params) => {
    try {
        this.logger.info('[hoo]invoices cb from hoo:', params);
        trustbet.dealWithInvoices(params);
        return 'OK';
    } catch (err) {
        this.logger.error('[hoo]catch error when deal with invoices:', err);
    }
}

module.exports = {
    checkUser: checkUser,
    createInvoices: createInvoices,
    getInvoices: getInvoices,
    decodeInvoices: decodeInvoices,
    pay2Invoices: pay2Invoices,
    pay2User: pay2User,
    getAppBalance: getAppBalance,
    getAppAddress: getAppAddress,
    cancelOndealerlater: cancelOndealerlater,
    offdealer: offdealer,
    dealWithInvoices: dealWithInvoices,
}
