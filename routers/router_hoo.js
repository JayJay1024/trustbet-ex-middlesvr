'use strict';

const api = require('../hoo/api');
const Router = require('koa-router');
const router = new Router();

// 查询账户
router.post('/api/open/user', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.checkUser(params);
});

// 创建商户收款单
router.post('/api/open/invoices/create', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.createInvoices(params);
});

// 收款单详情
router.post('/api/open/invoices/detail', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.getInvoices(params);
});

// 解码收款单
router.post('/api/open/invoices/decode', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.decodeInvoices(params);
});

// 向用户支付(前端不能发起向用户的支付)
// router.post('/api/open/invoices/pay', async (ctx, next) => {
//     await next();
//     let params = ctx.request.body;
//     ctx.body = await api.pay2User(params);
// });

// 余额查询
router.post('/api/open/balance', async (ctx, next) => {
    await next();
    ctx.body = await api.getAppBalance();
});

// 充值地址
router.post('/api/open/address', async (ctx, next) => {
    await next();
    ctx.body = await api.getAppAddress();
});


// 收款成功回调(收款成功后hoo回调的地址)
// POST 商户回调地址
// 注：此接口为Hoo虎符钱包回调商户系统
router.post('/trust/callback/hoo', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.status = 200;
    ctx.body = await api.dealwithInvoices(params);
});

module.exports = router;
