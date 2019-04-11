'use strict'

const redisPub = require('../common/redis');
const redisClient = require('../common/redis');
const logger = require('../common/logger');
const Bull = require('./bull');

class TrustBet {
    constructor(pay2User) {
        this.pay2User = pay2User;
        this.bull = new Bull(pay2User, this.updateCacheOrder);
    }

    /**
     * 保存dragonex玩家到redis
     * dragonex玩家有唯一的union_id
     */
    // async savePlayer(param) {
    //     try {
    //         let dataStr  = param;
    //         let dataJson = JSON.parse(dataStr);
    
    //         if (dataJson.ok && dataJson.code === 1 && dataJson.data && dataJson.data.union_id) {
    //             let key = `dg:user:${dataJson.data.union_id}`;
    //             if (await redisClient.set(key, dataStr) === 'OK') { return true; }
    //         }
    //         logger.warn('save player fail:', dataStr);
    //         return false;
    //     } catch (err) {
    //         logger.error('catch error when save user:', err);
    //     }
    // }

    /**
     * 取消预约上庄
     */
    async cancelOndealerlater2(player, sym) {
        try {
            let res = await this.bull.cancelOndealerlater2(player, sym);
            logger.debug('cancelOndealerlater 2 result:', res);
            return res;
        } catch (err) {
            logger.error('catch error when cancel ondealerlater 2 in trustbet:', err);
        }
    }
    async cancelOndealerlater(params) {
        try {
            let res = await this.bull.cancelOndealerlater(params);
            logger.debug('cancelOndealerlater result:', res);
            return res;
        } catch (err) {
            logger.error('catch error when cancel ondealerlater in trustbet:', err);
        }
    }
    /**
     * 立即下庄、预约下庄，取消预约下庄
     */
    async offdealer2(player, sym, status) {
        try {
            let res = await this.bull.offdealer2(player,sym, status);
            logger.debug('offdealer 2 result:', res);
            return res;
        } catch (err) {
            logger.error('catch error when offdealer 2 in trustbet:', err);
        }
    }
    async offdealer(params) {
        try {
            let res = await this.bull.offdealer(params);
            logger.debug('offdealer result:', res);
            return res;
        } catch (err) {
            logger.error('catch error when offdealer in trustbet:', err);
        }
    }

    /**
     * 更新状态
     */
    async updateCacheOrder(params) {
        try {
            let dataJson = params, key = `dg:cacheorder:${dataJson.trade_no}`, retry = 15;
            dataJson.trustbet_status = 1;  // 主要更新这个状态
            let dataStr = JSON.stringify(dataJson);
            // 更新而不是直接删除，是为了防止dragon在36小时内多次发起同一笔订单的支付确认回调，我们把这笔处理过订单保存36小时
            // 这样只要dragon发起重复的回调，但我们查看订单trustbet_status为1，就不用管它
            while (retry--) {
                if (await redisClient.set(key, dataStr, 'EX', 129600) === 'OK') {  // 36H: 129600 = 36 * 3600
                    return true;
                }
            }
            logger.error('update cache order fail:', dataStr);
            return false;
        } catch (err) {
            logger.error('catch error when update cache order:', err);
        }
    }


    /**
     * key是订单的trade_no
     */
    async getCacheOrder(trade_no) {
        try {
            let key = `dg:cacheorder:${trade_no}`;
            let ret = await redisClient.get(key);
            return ret;
        } catch (err) {
            logger.error('catch error when get cache order:', err);
        }
    }

    /**
     * 龙网处理成功支付给我们的订单
     */
    async dealWithPay2AppSuccessOrder(params) {
        try {
            let confirmedOrderStr = params;
            let confirmedOrderJson = JSON.parse(confirmedOrderStr);
            let cacheOrderStr = await this.getCacheOrder(confirmedOrderJson.trans_no);  // 注意这里变成trans_no了不是trade_no，踩坑ed

            if (cacheOrderStr) {
                let cacheOrderJson = JSON.parse(cacheOrderStr);

                if (confirmedOrderJson.coin_code    === cacheOrderJson.coin_code &&
                    confirmedOrderJson.volume * 1.0 === cacheOrderJson.volume * 1.0) {

                    if (cacheOrderJson.trustbet_status === 0) {
                        // 判断支付场景
                        let scene = cacheOrderJson.scene.split(':');  // 合约账号:动作
                        if (scene.length === 2) {
                            if (scene[0] === 'trustbetbull') {
                                switch (scene[1]) {
                                    case 'bet':              // 牛牛下注
                                    case 'ondealernow':      // 牛牛立即上庄
                                    case 'ondealerlater': {  // 牛牛预约上庄
                                        this.bull.playBull(cacheOrderJson, scene[1]);
                                        break;
                                    }
                                    default: {
                                        logger.warn('invalid bull cmd:', cacheOrderJson.scene);
                                    }
                                }
                            } else {
                                logger.info('others scene_1:', cacheOrderJson.scene);
                            }
                        } else {
                            logger.info('others scene_2:', cacheOrderJson.scene);
                        }
                    } else {
                        logger.info('order already deal with:', cacheOrderJson);
                    }
                } else {
                    logger.warn('different order, confirmed vs cache:', confirmedOrderStr, cacheOrderJson);
                }
            } else {
                logger.warn('cache order not found:', confirmedOrderStr);
            }
        } catch (err) {
            logger.error('catch error when deal with pay to app success order:', err);
        }
    }

    /**
     * 缓存playbull2结果
     */
    async savePlayBull2Res(params) {
        try {
            let dataJson = params, retry = 15;
            let key = `pro:play:result:${dataJson.trade_no}`, dataStr = JSON.stringify(dataJson);
            while (retry--) {
                if (await redisClient.set(key, dataStr, 'EX', 3600) === 'OK') {
                    return true;
                }
            }
            logger.warn('save play bull 2 result fail:', dataStr);
            return false;
        } catch (err) {
            logger.error('catch error when save play bull 2 result:', err);
        }
    }

    /**
     * hoo收款成功订单
     */
    async dealWithInvoices(params) {
        try {
            let playRes = {
                act_status: 'wait',
                player: params.payer,
                trade_no: params.tradeno,
            }

            let player   = params.payer ? params.payer : 'test';
            let quantity = params.amount ? params.amount + ' SAT' : '0.0000 EOS';
            let memo     = params.memo ? params.memo : 'test';
            let cmd      = params.extra ? params.extra : 'test';

            let result = await this.bull.playBull2(player, quantity, memo, cmd);
            if (result && result.processed && result.processed.receipt && result.processed.receipt.status && result.processed.receipt.status === 'executed') {
                // 特别地需要判断 status === 'executed'，避免 hard_fail 攻击
                // 现在可以认为push action成功了
                logger.info('play bull2 action success, params: ', JSON.stringify(params));
                playRes.act_status = 'success';
            } else {
                logger.warn('play bull2 action fail, params: ', params);
                playRes.act_status = 'fail';

                // 退回款项
                let pb = {
                    client_id: params.payer,
                    amount: params.amount,
                    memo: `play bull fail, pay back to you now.${cmd}-${memo}`,
                }
                if (pb.memo.length >= 150) {pb.memo = 'play bull fail, pay back to you now.';}
                this.pay2User(pb);

                // 推送失败信息
                if (typeof result === 'string') {
                    result = JSON.parse(result);
                }
                result.act_status = 'fail';
                result.trade_no = params.tradeno;
                result.player = params.payer;
                redisPub.publish('ProPlayBull', JSON.stringify(result));
            }

            this.savePlayBull2Res(playRes);
        } catch (err) {
            logger.error('catch error when deal with invoices in trustbet:', err);
        }
    }
}

module.exports = TrustBet;
