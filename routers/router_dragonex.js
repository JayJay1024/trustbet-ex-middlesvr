'use strict';

const api = require('../dragonex/api');
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

module.exports = router;
