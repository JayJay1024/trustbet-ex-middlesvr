## Trustbet-DragonEX Node Server

### 前端请求接口：
```
// 获取 AccessToken
http://161.117.4.243:3030/login/do
参数： code, scopes, state, device
方法： POST

// 刷新AccessToken
http://161.117.4.243:3030/login/refresh
参数： access_token, refresh_token
方法： POST

// 主动将AccessToken下线
http://161.117.4.243:3030/login/logout
参数： access_token
方法： POST

// 获取授权用户的信息
http://161.117.4.243:3030/user/detail
参数： open_id
方法： POST

// 申请支付（用户向接入方支付）
http://161.117.4.243:3030/pay/user2app/pre
参数： union_id, open_id, access_token, trade_no, coin_code, volume, scene, desc, device, state, redirect_url
方法： POST
scene格式： 合约账号:动作

// 查询订单详情
http://161.117.4.243:3030/pay/order/detail
参数： trade_no
方法： POST

// 取消预约上庄
http://161.117.4.243:3030/ondealer/later/cancel
参数： open_id, coin_code
方法： POST

// 立即下庄、预约下庄，取消预约下庄
http://161.117.4.243:3030/offdealer
参数： open_id, coin_code, status(0: 立即下庄, 1: 预约下庄, 2: 取消预约下庄)
方法： POST
```

### 前端传递scene字段格式（合约账号:动作）：
- 牛牛下注：     trustbetbull:bet
- 牛牛立即上庄：  trustbetbull:ondealernow
- 牛牛预约上庄：  trustbetbull:ondealerlater

### 前端传递desc字段格式：
- 牛牛下注：     传递EOS下注时的memo参数
- 牛牛立即上庄：  传递EOS牛牛立即上庄memo参数
- 牛牛预约上庄：  传递EOS牛牛预约上庄memo参数

### 服务端需要处理包括：
- 从确认支付中判断如果是下注，则去下注到合约中，如果下注失败，退还资金给玩家，通知前端下注情况
- 从确认支付中判断如果是立即上庄、预约上庄，则去合约中申请立即上庄、预约上庄，如果申请失败，退还资金给玩家
- 监控合约龙网下注的每局结果action，给下注的龙网玩家支付代币
- 监控合约龙网玩家下庄action，给下庄玩家支付代币
