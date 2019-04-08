'use strict';

const api = require('../hoo/api');
const Router = require('koa-router');
const router = new Router();

// 查询账户
router.post('/hoo/api/open/user', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.checkUser(params);
});

// 创建商户收款单
router.post('/hoo/api/open/invoices/create', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.createInvoices(params);
});

// 收款单详情
router.post('/hoo/api/open/invoices/detail', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.getInvoices(params);
});

// 解码收款单
router.post('/hoo/api/open/invoices/decode', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.decodeInvoices(params);
});

// 用户收款单支付(正式上线应该屏蔽该路由)
// router.post('/hoo/api/open/invoices/pay', async (ctx, next) => {
//     await next();
//     let params = ctx.request.body;
//     ctx.body = await api.pay2Invoices(params);
// });

// 站内支付(正式上线应该屏蔽该路由)
router.post('/hoo/api/open/user/pay', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.pay2User(params);
});

// 余额查询
router.post('/hoo/api/open/balance', async (ctx, next) => {
    await next();
    ctx.body = await api.getAppBalance();
});

// 充值地址
router.post('/hoo/api/open/address', async (ctx, next) => {
    await next();
    ctx.body = await api.getAppAddress();
});

// 取消预约上庄
router.post('/trust/ondealer/later/cancel', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.cancelOndealerlater(params);
});
// 立即下庄、预约下庄，取消预约下庄
router.post('/trust/offdealer', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.body = await api.offdealer(params);
});


// 收款成功回调(收款成功后hoo回调的地址)
// POST 商户回调地址
// 注：此接口为Hoo虎符钱包回调商户系统
router.post('/trust/callback/hoo', async (ctx, next) => {
    await next();
    let params = ctx.request.body;
    ctx.status = 200;
    ctx.body = await api.dealWithInvoices(params);
});

module.exports = router;
