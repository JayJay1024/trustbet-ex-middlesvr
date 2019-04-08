'use strict'

const Eos = require('eosjs');
const rp = require('request-promise');
const redisPub = require('../common/redis');
const redisClient = require('../common/redis');
const config = require('../config');
const logger = require('../common/logger');
const eosClient = Eos(config.eos_config);

class Bull {
    constructor(pay2User, updateCacheOrder) {
        this.lastAseq = 0;
        this.pay2User = pay2User;
        this.updateCacheOrder = updateCacheOrder;

        // this.monitorActions();
    }

    /**
     * 取消预约上庄
     * 合约接口：lreondealer(const string &player , const symbol &sym);
     */
    async cancelOndealerlater2(player='test', sym='4,EOS') {
        try {
            logger.debug(`cancle ondealerlater 2, p(${player}), s(${sym})`);

            let contractHandle = await eosClient.contract(config.contract.bull);
            let result = await contractHandle.lreondealer(
                player, sym,
                {authorization: config.action_pusher.bull}
            );

            logger.info('cancle ondealerlater 2 action result:', result);
            return result;
        } catch (err) {
            logger.error('catch catch error when cancel ondealerlater 2 in bull:', err);
            return err;
        }
    }
    async cancelOndealerlater(params) {
        try {
            logger.debug('cancelOndealerlater:', JSON.stringify(params));
            if (params && params.open_id && params.coin_code) {
                let player = params.open_id, sym = `4,${params.coin_code.toUpperCase()}`;
                let contractHandle = await eosClient.contract(config.contract.bull);
                let result = await contractHandle.lreondealer(
                    player, sym,
                    {authorization: config.action_pusher.bull}
                );
                result.act_status = 'success';
                return JSON.stringify(result);
            }
            return JSON.stringify({
                act_status: 'fail',
                msg: 'invalid params',
                data: params,
            });
        } catch (err) {
            logger.error('catch error when cancel ondealerlater in bull:', err);
            try {
                let errJson = JSON.parse(err);
                errJson.act_status = 'fail';
                return JSON.stringify(errJson);
            } catch (err2) {
                logger.error('catch catch error when cancel ondealerlater in bull:', err);
            }
        }
    }
    /**
     * 立即下庄、预约下庄，取消预约下庄
     * 合约接口：loffdealer(const string &player, const symbol &sym ,const uint64_t &status);  //0：立即下庄 1：预约下庄  2:取消预约下庄
     */
    async offdealer2(player='test', sym='4,EOS', status=0) {
        try {
            logger.debug(`offdealer2, p(${player}), sy(${sym}), st(${status})`);

            let contractHandle = await eosClient.contract(config.contract.bull);
            let result = await contractHandle.loffdealer(
                player, sym, status,
                {authorization: config.action_pusher.bull}
            );

            logger.info('cancle offdealer 2 action result:', result);
            return result;
        } catch (err) {
            logger.error('catch error when offdealer 2 in bull:', err);
            return err;
        }
    }
    async offdealer(params) {
        try {
            logger.debug('offdealer:', JSON.stringify(params));
            if (params && params.open_id && params.coin_code && params.status) {
                let player = params.open_id, sym = `4,${params.coin_code.toUpperCase()}`, status = params.status;
                let contractHandle = await eosClient.contract(config.contract.bull);
                let result = await contractHandle.loffdealer(
                    player, sym, status,
                    {authorization: config.action_pusher.bull}
                );
                result.act_status = 'success';
                return JSON.stringify(result);
            }
            return JSON.stringify({
                act_status: 'fail',
                msg: 'invalid params',
                data: params,
            });
        } catch (err) {
            logger.error('catch error when offdealer in bull:', err);
            try {
                let errJson = JSON.parse(err);
                errJson.act_status = 'fail';
                return JSON.stringify(errJson);
            } catch (err2) {
                logger.error('catch catch error when offdealer in bull:', err);
            }
        }
    }

    /**
     * 缓存playbull结果
     */
    async savePlayRes(params) {
        try {
            let dataJson = params, retry = 15;
            let key = `dg:play:result:${dataJson.trade_no}`, dataStr = JSON.stringify(dataJson);
            while (retry--) {
                if (await redisClient.set(key, dataStr, 'EX', 3600) === 'OK') {
                    return true;
                }
            }
            logger.warn('save play result fail:', dataStr);
            return false;
        } catch (err) {
            logger.error('catch error when save play result:', err);
        }
    }

    /**
     * 牛牛下注、立即上庄、预约上庄
     * 合约接口: placebet(const string &player, const asset &quantity, const string &memo)
     */
    async playBull2(player='test', quantity='0.0000 EOS', memo='test', cmd='bet') {
        try {
            logger.debug(`play bull 2, p(${player}), q(${quantity}), m(${memo})`);

            let contractHandle = await eosClient.contract(config.contract.bull);
            let result =  await contractHandle.placebet(
                player, quantity, memo,
                {authorization: config.action_pusher.bull}
            );

            logger.info('play bull2 action result:', result);
            return result;
        } catch (err) {
            logger.error('catch error when play bull2:', err);
            return err;
        }
    }
    async playBull(params, cmd) {
        try {
            let dataJson = params;
            let player = dataJson.open_id;
            let quantity = `${dataJson.volume} ${dataJson.coin_code.toUpperCase()}`;
            let memo = dataJson.desc;
            let contractHandle = await eosClient.contract(config.contract.bull);
            let result = await contractHandle.placebet(
                player, quantity, memo,
                {authorization: config.action_pusher.bull}
            );
            if (result && result.processed && result.processed.receipt && result.processed.receipt.status && result.processed.receipt.status === 'executed') {
                // 特别地需要判断 status === 'executed'，避免 hard_fail 攻击
                // 现在可以认为push action成功了
                logger.info('push action success:', JSON.stringify(dataJson));
                this.updateCacheOrder(dataJson);

                let playRes = {
                    act_status: 'success',
                    open_id: dataJson.open_id,
                    trade_no: dataJson.trade_no,
                }
                this.savePlayRes(playRes);
            } else {
                logger.warn('push action fail:', JSON.stringify(dataJson));

                let p = {
                    uid: 0,
                    open_id: dataJson.open_id,
                    scene: dataJson.scene,
                    volume: dataJson.volume,
                    coin_code: dataJson.coin_code,
                    desc: 'so sorry play bull fail, pay back to you now',
                };
                this.pay2User(p);

                let playRes = {
                    act_status: 'fail',
                    open_id: dataJson.open_id,
                    trade_no: dataJson.trade_no,
                }
                this.savePlayRes(playRes);
                redisPub.publish('ProPlayBull', JSON.stringify(playRes));
            }
        } catch (err) {
            logger.error('catch error when play bull:', err);
            try {
                if (typeof err === 'string') {
                    let errJson = JSON.parse(err);
                    if (errJson && errJson.error && errJson.error.details && errJson.error.details.length) {  // 这里判断是eos的断言错误，push action失败
                        let dataJson = params;
                        logger.warn('push action error:', JSON.stringify(dataJson));

                        let p = {
                            uid: 0,
                            open_id: dataJson.open_id,
                            scene: dataJson.scene,
                            volume: dataJson.volume,
                            coin_code: dataJson.coin_code,
                            desc: 'so sorry play bull fail, pay back to you now',
                        };
                        this.pay2User(p);

                        errJson.act_status = 'fail';
                        errJson.open_id = dataJson.open_id;
                        errJson.trade_no = dataJson.trade_no;
                        this.savePlayRes(errJson);
                        redisPub.publish('ProPlayBull', JSON.stringify(errJson));
                    }
                }
            } catch (err2) {
                logger.error('catch catch error when play bull:', err2);
            }
        }
    }

    /**
     * 监控亮牌结果，下庄
     * @param {*} pos 
     * @param {*} offset 
     */
    async monitorActions(pos = -1, offset = -1) {
        try {
            let body = await rp({
                url: config.getActionsUri,
                method: 'POST',
                json: true,
                timeout: 5000,
                body: { account_name: config.contract.bull, pos: pos, offset: offset },
            });

            if (body.actions && body.actions.length) {
                let latestAseq = body.actions[body.actions.length-1].account_action_seq;

                if (latestAseq > this.lastAseq) {
                    for (let trace of body.actions) {
                        if (trace &&
                            trace.action_trace &&
                            trace.action_trace.act &&
                            (trace.action_trace.act.name === 'lresult' || trace.action_trace.act.name === 'dealerinfo') &&
                            trace.action_trace.act.account === config.contract.bull &&
                            trace.action_trace.act.data) {

                            if (trace.action_trace.act.name === 'lresult') {
                                let data = trace.action_trace.act.data.res;
                                data.block_time = trace.block_time;
                                if (await this.isFinishResult(data) === false) {
                                    await this.payBet(data);
                                    await this.saveResult(data);
                                }
                            } else if (trace.action_trace.act.name === 'dealerinfo') {  // 下庄
                                let data = trace.action_trace.act.data;
                                if (await this.isFinishOffdealer(data) === false) {
                                    await this.payOffdealer(data);
                                    await this.saveOffdealer(data);
                                }
                            }
                        }
                    }
                    this.lastAseq = latestAseq;
                }
            }

            setTimeout(() => {
                let p = this.lastAseq > 0 ? this.lastAseq + 1 : -1;
                let o = p > 0 ? 200 : -1;
                this.monitorActions(p, o);
            }, 300);
        } catch (err) {
            logger.error('catch error when monitor bull actions:', err);
            this.monitorActions(pos, offset);
        }
    }

    /**
     * 保存最近的已经处理过的result actions
     * 这样在启动服务，get result actions时，如果查看该action数据已经存在，说明已经处理过，忽略它
     */
    async saveResult(data) {
        try {
            if (data && data.id) {
                let key = 'pro:bull:finishresult', score = data.id;
                let dataStr = JSON.stringify(data), retry = 25;
                while (retry--) {
                    redisClient.watch(key);
                    if (await redisClient.zrank(key, dataStr) !== null) {
                        redisClient.unwatch();
                        return false;
                    }

                    // 保留最新的 1024 条记录
                    let count = await redisClient.zcount(key, 0, '+inf');
                    if (count > 1024) {
                        redisClient.zremrangebyrank(key, 0, count - 1024);
                    }

                    if (await redisClient.zadd(key, score, dataStr)) {
                        return true;
                    }
                }
                logger.warn('save bull result fail:', dataStr);
                return false;
            }
        } catch (err) {
            logger.error('catch error when save bull result:', err);
        }
    }

    /**
     * 保存最近的已经处理过的下庄 actions
     * 这样在启动服务，get 下庄 actions时，如果查看该action数据已经存在，说明已经处理过，忽略它
     */
    async saveOffdealer(data) {
        try {
            if (data && data.id) {
                let key = 'pro:bull:finishdealer', score = data.id;
                let dataStr = JSON.stringify(data), retry = 25;
                while (retry--) {
                    redisClient.watch(key);
                    if (await redisClient.zrank(key, dataStr) !== null) {
                        redisClient.unwatch();
                        return false;
                    }

                    // 保留最新的 1024 条记录
                    let count = await redisClient.zcount(key, 0, '+inf');
                    if (count > 1024) {
                        redisClient.zremrangebyrank(key, 0, count - 1024);
                    }

                    if (await redisClient.zadd(key, score, dataStr)) {
                        return true;
                    }
                }
                logger.warn('save bull off dealer fail:', dataStr);
                return false;
            }
        } catch (err) {
            logger.error('catch error when save off dealer:', err);
        }
    }

    /**
     * 如果redis中保存有该result action的数据，
     * 说明该result action已经处理过
     */
    async isFinishResult(data) {
        try {
            let key = 'pro:bull:finishresult';
            let dataStr = JSON.stringify(data), retry = 15;
            while (retry--) {
                redisClient.watch(key);
                if (await redisClient.zrank(key, dataStr) !== null) {
                    redisClient.unwatch();
                    return true;
                }
            }
            return false;
        } catch (err) {
            logger.error('catch error when check finish bull result:', err);
        }
    }

    /**
     * 如果redis中保存有该action的数据，
     * 说明该action已经处理完成
     */
    async isFinishOffdealer(data) {
        try {
            let key = 'pro:bull:finishdealer';
            let dataStr = JSON.stringify(data), retry = 15;
            while (retry--) {
                redisClient.watch(key);
                if (await redisClient.zrank(key, dataStr) !== null) {
                    redisClient.unwatch();
                    return true;
                }
            }
            return false;
        } catch (err) {
            logger.error('catch error when check finish bull off dealer:', err);
        }
    }

    /**
     * 亮牌后支付玩家本局下注
     */
    async payBet(data) {
        try {
            if (data.bets.length) {
                logger.debug('pay bet:', JSON.stringify(data.bets));
                for (let bet of data.bets) {
                    let payout = bet.payout.split(' ');
                    if (payout[0] * 1.0 > 0) {
                        // let p = {
                        //     uid: 0,
                        //     open_id: bet.player,
                        //     volume: payout[0],
                        //     coin_code: payout[1],
                        //     scene: 'trusbetbull bet result pay',
                        //     desc: `trustbetbull pay, round ${data.round}, period ${data.period}, bet id ${bet.id}, site ${bet.site}, payin ${bet.payin}`,
                        // };
                        let p = {
                            client_id: bet.player,
                            amount: parseInt(payout[0]),
                            memo: `trustbetbull pay, round ${data.round}, period ${data.period}, bet id ${bet.id}, site ${bet.site}, payin ${bet.payin}`,
                        }
                        this.pay2User(p);
                        logger.debug('payed bet:', JSON.stringify(p));
                    }
                }
            }
        } catch (err) {
            logger.error('catch error when pay bet:', err);
        }
    }

    /**
     * 支付庄家下庄的资金
     */
    async payOffdealer(data) {
        try {
            logger.debug('pay offdealer:', JSON.stringify(data));
            let quantity = data.offdealerinfo.quantity.split(' ');
            if (quantity[0] * 1.0 > 0) {
                // let p = {
                //     uid: 0,
                //     open_id: data.offdealerinfo.dealer,
                //     volume: quantity[0],
                //     coin_code: quantity[1],
                //     scene: 'trusbetbull offdealer play',
                //     desc: `trusbetbull offdealer play, id ${data.id}`,
                // };
                let p = {
                    client_id: data.offdealerinfo.dealer,
                    amount: parseInt(payout[0]),
                    memo: `trusbetbull offdealer play, id ${data.id}`,
                }
                this.pay2User(p);
                logger.debug('payed offdealer:', JSON.stringify(p));
            }
        } catch (err) {
            logger.error('catch error when pay offdealer:', err);
        }
    }
}

module.exports = Bull;
