'use strict';

const api = require('./api');
const Router = require('koa-router');
const router = new Router();

// 获取用户AccessToken
router.post('/login/do', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.getUserToken(params);
});

// 刷新用户AccessToken
router.post('/login/refresh', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.refreshUserToken(params);
});

// 主动将AccessToken下线
router.post('/login/logout', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.forgetUserToken(params);
});

// 获取授权用户的信息
router.post('/user/detail', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.getUserDetail(params);
});

// 申请支付（用户向接入方支付）
router.post('/pay/user2app/pre', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.applyPay2App(params);
});

// 申请支付（从接入方转账给用户）
// router.post('/pay/app2user/do', async (ctx, next) => {
//     await next();
//     let params = ctx.request.body;
//     ctx.body = await api.applyPay2User(params);
// });

// 查询订单详情
router.post('/pay/order/detail', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.getOrderDetail(params);
});

// 查询订单历史记录
router.post('/pay/order/history', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.getOrderHistory(params);
});

// 接入方主动要求某支付记录发起回调（不论成功与否，也不论之前是否回调成功过均会再次发起回调）
// router.post('/pay/callback/redo', async (ctx, next) => {
//     await next();
//     let params = ctx.request.body;
//     ctx.body = await api.redoCallback(params);
// });

// 取消预约上庄
router.post('/ondealer/later/cancel', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.cancelOndealerlater(params);
});
// 立即下庄、预约下庄，取消预约下庄
router.post('/offdealer', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.offdealer(params);
});

// 用户支付成功或失败后跳转到的回调地址（app管理员设置的回调地址）
// 在这里确认用户是否真实转账成功
router.post('/trustbet/callback', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.status = 200;  // 不响应200，dragonex可能重复回调
    ctx.body = await api.dealWithOrder(params);  // 处理订单
});




const crypto = require('crypto');
const rp = require('request-promise');
const uuidv4 = require('uuid/v4');
const host = 'https://lnd.hoo.com';
const logger = require('../common/logger');
async function getSign(params) {
    try {
        let payload = '';
        let keys = Object.keys(params).sort();

        for (let k of keys) {
            payload.length ? payload += '&' : '';
            payload += `${k}=${params[k]}`;
        }
        let secret = '0S4A68F6JG91WtXcvSbG4g36LCcEHVYLBkmy4rDY4gxVEC6AmM50behmP3wa18FG';

        let digest = crypto.createHmac('sha256', secret)
                           .update(payload)
                           .digest('base64');
        let sign = encodeURI(digest);

        return sign;
    } catch (err) {
        logger.info('catch error when get sign:', err);
    }
}

async function createInvoices(params) {
    try {
        let path = '/api/open/invoices';

        let stamp = Math.round(Date.now() / 1000);
        let openid = 'tYRETgwNny1jY083u2ub';
        let nonce = uuidv4().split('-')[4].substring(0, 10);

        let data = Object.assign({
            stamp: stamp,
            openid: openid,
            nonce: nonce,
        }, params);
        let sign = await getSign(data);

        data.sign = sign;
        let ps = new URLSearchParams(data);

        let result = await rp({
            url: `${host}${path}${ps.toString()}`,
            method: 'GET',
            json: true,
            timeout: 5000,
        });

        return result;
    } catch (err) {
        logger.error('catch error when create invoices:', err);
    }
}

// 创建收款单
// POST /api/open/invoices
router.post('/api/open/invoices', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await createInvoices(params);
});

async function getUser(params) {
    try {
        let path = '/api/open/invoices';

        let stamp = Math.round(Date.now() / 1000);
        let openid = 'tYRETgwNny1jY083u2ub';
        let nonce = uuidv4().split('-')[4].substring(0, 10);

        let data = Object.assign({
            stamp: stamp,
            openid: openid,
            nonce: nonce,
        }, params);
        let sign = await getSign(data);

        data.sign = sign;
        let ps = new URLSearchParams(data);

        let result = await rp({
            url: `${host}${path}?${ps.toString()}`,
            method: 'GET',
            json: true,
            timeout: 5000,
        });

        return result;
    } catch (err) {
        logget.error('catch error when get user:', err);
    }
}

// 查询账户
// GET /api/open/user
router.post('/api/open/user', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await getUser(params);
});



router.post('/trust/callback/hoo', async (ctx, next) => {
    await next();
    ctx.status = 200;
    ctx.body = 'OK';
});

module.exports = router;
