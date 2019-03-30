## Trustbet-EX NodeJs MiddleServer

### 虎符钱包前端请求接口（所有接口使用POST方法）：
```
/**
 * 查询账户
 * 说明: 商户用来验证jssdk拿到的client_id是否正确
 * 参数(参数名、参数类型、是否必须、描述):
 *     client_id:  string  是  账户名
 */
http://161.117.4.243:3030/hoo/api/open/user

/**
 * 创建收款单
 * 说明: 商户生成闪电网络收款码，此操作为商户方用户的充值操作
 * 参数(参数名、参数类型、是否必须、描述):
 *     memo:      string    否    备注(100字以内)
 *     amount:    int       是    收款金额，以聪为单位
 *     tradeno:   string    否    在客户系统中唯一订单号, 60字以内
 *     extra:     string    否    扩展，可存任何信息，200字以内
 */
http://161.117.4.243:3030/hoo/api/open/invoices/create


/**
 * 收款单详情
 * 说明: 商户查询收款码状态
 * 参数(参数名、参数类型、是否必须、描述):
 *     payment_hash:  string  是  收款单hash id
 */
http://161.117.4.243:3030/hoo/api/open/invoices/detail

/**
 * 解码收款单
 * 说明: 商户对收款码进行解码，获取收款金额和备注等信息
 * 参数(参数名、参数类型、是否必须、描述):
 *     invoice:  string  是  收款单hash
 */
http://161.117.4.243:3030/hoo/api/open/invoices/decode

/**
 * 余额查询
 * 说明: 获取商户的闪电网络余额
 * 参数(参数名、参数类型、是否必须、描述):
 *     无
 */
http://161.117.4.243:3030/hoo/api/open/balance

/**
 * 充值地址
 * 说明: 获取商户的BTC充值地址，充值完成，可通过余额接口查询
 * 参数(参数名、参数类型、是否必须、描述):
 *     无
 */
http://161.117.4.243:3030/hoo/api/open/address

/**
 * 取消预约上庄
 * 参数(参数名、参数类型、是否必须、描述):
 *     client_id:  string  是  闪电网络玩家id
 *     coin_code:  string  是  该值固定位 'SAT,0'
 */
http://161.117.4.243:3030/hoo/ondealer/later/cancel

/**
 * 立即下庄、预约下庄，取消预约下庄
 * 参数(参数名、参数类型、是否必须、描述):
 *     client_id:  string  是  闪电网络玩家id
 *     coin_code:  string  是  该值固定位 'SAT,0'
 *     status:     int     是  0: 立即下庄, 1: 预约下庄, 2: 取消预约下庄
 */
http://161.117.4.243:3030/hoo/offdealer
```

### 虎符前端创建收款单时传递extra字段：
- 牛牛下注：     trustbetbull:bet
- 牛牛立即上庄：  trustbetbull:ondealernow
- 牛牛预约上庄：  trustbetbull:ondealerlater

### 虎符前端创建收款单时传递memo字段：
- 牛牛下注：     传递EOS下注时的memo参数
- 牛牛立即上庄：  传递EOS牛牛立即上庄memo参数
- 牛牛预约上庄：  传递EOS牛牛预约上庄memo参数



### 龙网前端请求接口：
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

### 龙网前端传递scene字段格式（合约账号:动作）：
- 牛牛下注：     trustbetbull:bet
- 牛牛立即上庄：  trustbetbull:ondealernow
- 牛牛预约上庄：  trustbetbull:ondealerlater

### 龙网前端传递desc字段格式：
- 牛牛下注：     传递EOS下注时的memo参数
- 牛牛立即上庄：  传递EOS牛牛立即上庄memo参数
- 牛牛预约上庄：  传递EOS牛牛预约上庄memo参数

### 龙网服务端需要处理包括：
- 从确认支付中判断如果是下注，则去下注到合约中，如果下注失败，退还资金给玩家，通知前端下注情况
- 从确认支付中判断如果是立即上庄、预约上庄，则去合约中申请立即上庄、预约上庄，如果申请失败，退还资金给玩家
- 监控合约龙网下注的每局结果action，给下注的龙网玩家支付代币
- 监控合约龙网玩家下庄action，给下庄玩家支付代币
