'use strict'

const uuid = require('uuid-js');
const config = require('../config');
const logger = require('../common/logger');
const redisClient = require('../common/redis');
// const Trustbet = require('../trustbet/trustbet');
const dv1 = require('./lib/dragonex');

const dragonex = new dv1.DragonExV1(config.dragonex.host,
                                    config.dragonex.company_id,
                                    config.dragonex.app_id,
                                    config.dragonex.access_key,
                                    config.dragonex.secret_key,
                                    config.dragonex.resp_check_key);
// const trustbet = new Trustbet(applyPay2User);  // 由于Trustbet中有需要向用户支付的情景

/**
 * 判断参数 checkStr 是不是 html 标签
 */
const isHtml = async (checkStr) => {
    let reg = /<[^>]+>/g;
    return reg.test(checkStr);
}

/**
 * 获取用户AccessToken
 * DragonEx授权登录，需要提供以下参数：
 *     code:    string   申请登录授权时拿到的AccessCode
 *     app_id:  string   访问DragonEx授权登录页面传入的app_id字段
 *     scopes:  string   访问DragonEx授权登录页面传入的scopes字段
 *     state:   string   访问DragonEx授权登录页面传入的state字段
 *     device:  string   访问DragonEx授权登录页面传入的device字段
 * 返回值data信息：
 *     access_token:       string   授权登录拿到的AccessToken
 *     access_token_et:    int      AccessToken有效期，秒级时间戳
 *     refresh_token:      string   授权登录拿到的RefreshToken
 *     refresh_token_et:   int      RefreshToken有效期，秒级时间戳
 *     company_id:         string   CompanyId
 *     app_id:             string   AppId
 *     open_id:            string   用户的OpenId
 *     union_id:           string   用户的UnionId
 *     scopes:             []int    获取到的权限
 */
const getUserToken = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params && params.code && params.scopes && params.state && params.device) {
            ret = await new Promise((resolve, reject) => {
                dragonex.getToken(params.code, params.scopes, params.state, params.device, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('get user token exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('get user token fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when get user token:', err);
    }
}

/**
 * 刷新用户AccessToken
 */
const refreshUserToken = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params && params.access_token && params.refresh_token) {
            ret = await new Promise((resolve, reject) => {
                dragonex.refreshToken(params.access_token, params.refresh_token, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('refresh user token exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('refresh user token fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when refresh user token:', err);
    }
}

/**
 * 主动将用户AccessToken下线
 */
const forgetUserToken = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params && params.access_token) {
            ret = await new Promise((resolve, reject) => {
                dragonex.forgetToken(params.access_token, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('forget user token exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('forget user token fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when forget user token:', err);
    }
}

/**
 * 获取授权用户的信息
 */
const getUserDetail = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params && params.open_id) {
            ret = await new Promise((resolve, reject) => {
                dragonex.getUserDetail(params.open_id, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('get user detail exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('get user detail fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when get user detail:', err);
    }
}

/**
 * 保存未确认的订单
 * 因为未经过DragonEx确认，所有还没有订单号，这时候以trade_no作为key来保存
 * 为什么需要保存未确认的订单？因为这里有我们需要的信息，等后面确认后，我们从这里取回信息
 */
const saveCacheOrder = async (params) => {
    try {
        let dataJson = params;
        dataJson.trustbet_status = 0;
        let dataStr = JSON.stringify(dataJson), key = `dg:cacheorder:${dataJson.trade_no}`, retry = 15;
        while (retry--) {
            if (await redisClient.set(key, dataStr, 'EX', 129600) === 'OK') {  // 36H: 129600 = 36 * 3600
                return true;
            }
        }
        logger.error('save cache order fail:', dataStr);
        return false;
    } catch (err) {
        logger.error('catch error when save cache order:', err);
    }
}

/**
 * 申请支付（用户向接入方支付）
 * DragonEx支付接口，需要提供以下参数：
 *     trade_no:      string  转账流水号，接入方需保证唯一，只允许数字、字母、下划线，最长64个字节
 *     coin_code:     string  支付币种，如：usdt, dt
 *     volume:        string  支付数量
 *     scene:         string  支付场景，100个字符以下
 *     desc:          string  支付描述信息，100个字符以下
 *     device:        string  申请支付的设备信息，长度[8, 16]个字符之间
 *     state:         string  长度[8, 16]个字符之间，用于防止CSRF攻击，可用随机字符串或其他方式生成的不可预测的字符串，且使用后立即失效
 *     redirect_url:  string  支付成功或失败后，浏览器跳转到的接入方的链接，以https://或http://打头
 * 另外为了保存玩家下注，前端还需要提供以下参数：
 *     union_id:      string  用户的UnionId，对同一公司下的所有app一致
 *     open_id:       string  用户的OpenId，对同一公司下不同app没有联系
 */
const applyPay2App = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params &&
            params.union_id && params.open_id &&  // 这两个保存他用，向drsgonex发起请求不需要用到
            params.trade_no &&
            params.coin_code &&
            params.volume &&
            params.scene &&
            params.desc &&
            params.device &&
            params.state &&
            params.redirect_url) {
            logger.info('apply pay to app:', JSON.stringify(params));
            ret = await new Promise((resolve, reject) => {
                dragonex.pay2App(params.trade_no, params.coin_code, params.volume, params.scene, params.desc, params.device, params.state, params.redirect_url, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('pay to app exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('pay to app fail:', ret);
            } else {
                saveCacheOrder(params);
            }
        }

        return ret;
    } catch (err) {
        logger.error('catch error when apply play to app:', err);
    }
}

/**
 * 申请支付（从接入方转账给用户）
 * DragonEx支付接口，需要提供以下参数：
 *     trade_no:   string  转账流水号，接入方需保证唯一，只允许数字、字母、下划线，最长64个字节
 *     open_id:    string  用户的OpenId，在接入方有使用龙网登录时可使用此参数
 *     uid:        int     要转账给用户的DragonExUid，在接入方没有使用龙网登录，且知道用户uid时可以使用此参数，open_id与uid必选其一
 *     coin_code:  string  支付币种，如：usdt, dt
 *     volume:     string  支付数量
 *     scene:      string  支付场景
 *     desc:       string  支付描述信息
 *     device:     string  发起支付的设备信息
 * 返回值data字段信息：
 *     id:           int      此订单在DragonEx的唯一标识
 *     arrive_time:  int      到帐时间
 *     coin_code:    string   支付币种
 *     create_time:  string   申请支付时间
 *     direction:    int      方向
 *     status:       int      支付状态
 *     trade_no:     string   交易流水号
 *     uid:          int      DragonEx Uid
 *     volume:       string   支付数量
 *     cut_volume:   string   收取佣金数量
 */
async function applyPay2User(params) {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params &&
            (params.open_id || params.uid) &&
            params.coin_code &&
            params.volume &&
            params.scene &&
            params.desc) {
            params.uid ? params.uid : 0;
            params.device = 'trustbetdevice';
            params.coin_code = params.coin_code.toLowerCase();
            params.trade_no = uuid.create().toString().replace(/\-/g, '_');
            logger.info('apply pay to user:', JSON.stringify(params));
            ret = await new Promise((resolve, reject) => {
                dragonex.pay2User(params.trade_no, params.open_id, params.uid, params.coin_code, params.volume, params.scene, params.desc, params.device, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('pay to user exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('pay to user fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when apply pay to user:', err);
    }
}

/**
 * 查询订单详情
 */
const getOrderDetail = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params && params.trade_no) {
            ret = await new Promise((resolve, reject) => {
                dragonex.getOrderDetail(params.trade_no, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('get order detail exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('get order detail fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when get order detail:', err);
    }
}

/**
 * 查询订单历史记录
 */
const getOrderHistory = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params &&
            params.coin_code &&
            params.uid &&
            params.direction &&
            params.start_time &&
            params.end_time &&
            params.offset &&
            params.limit) {
            ret = await new Promise((resolve, reject) => {
                dragonex.getOrderHistory(params.coin_code, params.uid, params.direction, params.start_time, params.end_time, params.offset, params.limit, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('get order detail exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('get order history fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when get order history:', err);
    }
}

/**
 * 接入方主动要求某支付记录发起回调（不论成功与否，也不论之前是否回调成功过均会再次发起回调）
 */
const redoCallback = async (params) => {
    try {
        let ret = JSON.stringify({ ok: false, code: -2, msg: 'invalid params', data: params });

        if (params && params.trade_no) {
            ret = await new Promise((resolve, reject) => {
                dragonex.redoCallback(params.trade_no, (res) => {
                    let html = '';
                    res.on('data', (data) => {
                        html += data;
                    });
                    res.on('end', () => {
                        resolve(html);
                    });
                });
            }).then(res => { return res; });
        }

        if (isHtml(ret)) {
            logger.error('redo callback exceptional result:', ret);
        } else {
            let retJson = JSON.parse(ret);
            if (retJson.ok !== true || retJson.code !== 1) {
                logger.warn('redo callback fail:', ret);
            }
        }
        return ret;
    } catch (err) {
        logger.error('catch error when redo callback:', err);
    }
}

/**
 * 取消预约上庄
 */
const cancelOndealerlater = async (params) => {
    try {
        // return await trustbet.cancelOndealerlater(params);
        return 'OK';
    } catch (err) {
        logger.error('catch error when cancel ondealerlater in api:', err);
    }
}
/**
 * 立即下庄、预约下庄，取消预约下庄
 */
const offdealer = async (params) => {
    try {
        // return await trustbet.offdealer(params);
        return 'OK';
    } catch (err) {
        logger.error('catch error when offdealer in api:', err);
    }
}

/**
 * 保存DragonEx确认的传给支付回调的订单
 * 根据id保存，id唯一确定订单
 */
const saveConfirmedOrder = async (dataJson) => {
    try {
        let retry = 25;
        let key = 'dg:cb:order', score = dataJson.id, dataStr = JSON.stringify(dataJson);
        while (retry--) {
            // 最多保留最新的 20480 条记录
            let count = await redisClient.zcount(key, 0, '+inf');
            if (count > 20480) {
                this.redis.client.zremrangebyrank(key, 0, count - 20480);
            }

            // 同一个订单DragonEx可能回调多次，但不用检查是否已经保存，
            // 因为最新的转态可能更新了，如果已经保存，用最新的覆盖即可，相当于更新
            if (await redisClient.zadd(key, score, dataStr)) {
                return true;
            }
        }
        logger.warn('save order fail:', dataStr);
        return false;
    } catch (err) {
        logger.error('catch error when save order:', err);
    }
}

/**
 * 处理支付回调的订单
 * DragonEx传回来的参数包括(文档的说明)：
 *     id:          int     此订单在DragonEx的唯一标识
 *     uid:         int     此次实际付款用户的DragonExUid
 *     coin_code:   string  支付币种
 *     volume:      string  支付数量
 *     cut_volume:  string  收取佣金数量
 *     trade_no:    string  转账流水号
 *     direction:   int     订单方向  1: DragonEx 用户 --> 接入方  2: 接入方 --> DragonEx 用户
 *     status:      int     订单状态  1: 成功  2: 失败  3: 转账中（若长期处于转账中，说明有异常，请联系DragonEx处理）
 * 实际返回的是下面的参数：
 *     arrive_time: int     到帐时间
 *     coin_code:   string  支付币种
 *     cut_volume:  string  收取佣金数量
 *     direction:   int     订单方向
 *     id:          int     此订单在DragonEx的唯一标识
 *     status:      int     订单状态
 *     trans_no:    string  转账流水号
 *     volume:      string  支付数量
 */
const dealWithOrder = async (params) => {
    try {
        let dataJson = params;
        let dataStr = JSON.stringify(dataJson);

        logger.info('order from dragonex:', dataStr);
        saveConfirmedOrder(dataJson);  // 先保存支付订单

        if (dataJson.status === 2) {  // 转账失败
            logger.warn('transfer fail:', dataStr);
        } else if (dataJson.status === 3) {  // 转账中（若长期处于转账中，说明有异常，请联系DragonEx处理）
            logger.info('transfer ing:', dataStr);
        } else if (dataJson.status === 1 && dataJson.direction === 1) {  // 向我们转账成功
            // trustbet.dealWithPay2AppSuccessOrder(dataStr);
        }
        return 'OK';
    } catch (err) {
        logger.error('catch error when deal with order:', err);
    }
}

module.exports = {
    getUserToken: getUserToken,
    refreshUserToken: refreshUserToken,
    forgetUserToken: forgetUserToken,
    getUserDetail: getUserDetail,
    applyPay2App: applyPay2App,
    applyPay2User: applyPay2User,
    getOrderDetail: getOrderDetail,
    getOrderHistory: getOrderHistory,
    redoCallback: redoCallback,
    cancelOndealerlater: cancelOndealerlater,
    offdealer: offdealer,
    dealWithOrder: dealWithOrder,
}
