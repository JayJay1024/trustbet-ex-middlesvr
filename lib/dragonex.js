'use strict';

const base = require('./base');

// 
class DragonExV1 extends base.Base {
	constructor(host, companyId, appId, accessKey, secretKey, respCheckKey) {
		super(host, companyId, appId, accessKey, secretKey, respCheckKey);
	}

	//
	createNewToken(callback) {
		let path = "/api/v1/token/new/";
		return this.sendPOST(path, {}, null, callback);
	}

	//
	tokenStatus(callback) {
		let path = "/api/v1/token/status/";
		this.sendPOST(path, {}, null, callback);
	}

	//
	getAllCoins(callback) {
		let path = "/api/v1/coin/all/";
		this.sendGET(path, null, null, callback);
	}

	//
	getUserOwnCoins(callback) {
		let path = "/api/v1/user/own/";
		this.sendPOST(path, {}, null, callback);
	}

	//
	getAllSymbos(callback) {
		let path = "/api/v1/symbol/all/";
		this.sendGET(path, null, null, callback);
	}

	//
	getAllSymbos2(callback) {
		let path = "/api/v1/symbol/all2/";
		this.sendGET(path, null, null, callback);
	}

	//
	getMarketLine(symbolID, startTime, searchDirection, count, klineType) {
		let path = "/api/v1/market/kline/";
		let params = {
			'symbol_id': symbolID,
			'st': startTime,
			'direction': searchDirection,
			'count': count,
                  	'kline_type': klineType
		};
		this.sendGET(path, params, null, callback);
	}

	//
	getMarketBuy(symbolID, callback) {
		let path = "/api/v1/market/buy/";
		let params = {"symbol_id": symbolID};
		this.sendGET(path, params, null, callback);
	}

	//
	getMarketSell(symbolID, callback) {
		let path = "/api/v1/market/sell/";
		let params = {"symbol_id": symbolID};
		this.sendGET(path, params, null, callback);
	}

	//
	getMarketDepth(symbolID, callback) {
		let path = "/api/v1/market/depth/";
		let params = {"symbol_id": symbolID};
		this.sendGET(path, params, null, callback);
	}

	//
	getMarketReal(symbolID, callback) {
		let path = "/api/v1/market/real/";
		let params = {"symbol_id": symbolID};
		this.sendGET(path, params, null, callback);
	}

	//
	addOrderBuy(symbolID, price, volume, callback) {
		let path = "/api/v1/order/buy/";
		let data = {'symbol_id': symbolID, 'price': price.toString(), 'volume': volume.toString()};
		this.sendPOST(path, data, null, callback);
	}

	//
	addOrderSell(symbolID, price, volume, callback) {
		let path = "/api/v1/order/sell/";
		let data = {'symbol_id': symbolID, 'price': price.toString(), 'volume': volume.toString()};
		this.sendPOST(path, data, null, callback);

	}

	//
	cancelOrder(symbolID, orderID, callback) {
		let path = "/api/v1/order/cancel/";
		let data = {'symbol_id': symbolID, 'order_id': orderID};
		this.sendPOST(path, data, null, callback);
	}

	//
	getOrderDetail(symbolID, orderID, callback) {
		let path = '/api/v1/order/detail/';
		let data = {'symbol_id': symbolID, 'order_id': orderID};
		this.sendPOST(path, data, null, callback);
	}

	//
	getUserOrderHistory(symbolID, searchDirection, startTime, count, s, callback) {
		let path = '/api/v1/order/history/';
		let data = {
			'symbol_id': symbolID,
			'direction': searchDirection,
			'start': startTime,
			'count': count,
                	'status': s
		};
		this.sendPOST(path, data, null, callback);
	}

	//
	getuserDealHistory(symbolID, searchDirection, startTime, count, callback) {
		let path = "/api/v1/deal/history/";
		let data = {
			"symbol_id": symbolID,
			"direction": searchDirection,
			"start": startTime,
			"count": count
		};
		this.sendPOST(path, data, null, callback);
	}

	//
	getToken(code, scopes, state, device, callback) {
		let path = "/api/v1/login/do/";
		let data = {
			"code": code,
			"app_id": this.getAppId(),
			"scopes": scopes,
			"state": state,
			"device": device
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	refreshToken(accessToken, refreshToken, callback) {
		let path = "/api/v1/login/refresh/";
		let data = {
			"access_token": accessToken,
			"refresh_token": refreshToken
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	forgetToken(accessToken, callback) {
		let path = "/api/v1/login/logout/";
		let data = {
			"access_token": accessToken
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	getUserDetail(openId, callback) {
		let path = "/api/v1/user/detail/";
		let data = {
			"open_id": openId
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	pay2App(tradeNo, coinCode, volume, scene, desc, device, state, redirectUrl, callback) {
		let path = "/api/v1/pay/user2app/pre/";
		let data = {
			"trade_no": tradeNo,
			"coin_code": coinCode,
			"volume": volume,
			"scene": scene,
			"desc": desc,
			"device": device,
			"state": state,
			"redirect_url": redirectUrl
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	pay2User(tradeNo, openId, uid, coinCode, volume, scene, desc, device, callback) {
		let path = "/api/v1/pay/app2user/do/";
		let data = {
			"trade_no": tradeNo,
			"open_id": openId,
			"uid": uid,
			"coin_code": coinCode,
			"volume": volume,
			"scene": scene,
			"desc": desc,
			"device": device
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	getOrderDetail(tradeNo, callback) {
		let path = "/api/v1/pay/order/detail/";
		let data = {
			"trade_no": tradeNo
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	getOrderHistory(coinCode, uid, direction, startTime, endTime, offset, limit, callback) {
		let path = "/api/v1/pay/order/history/";
		let data = {
			"coin_code": coinCode,
			"uid": uid,
			"direction": direction,
			"start_time": startTime,
			"end_time": endTime,
			"offset": offset,
			"limit": limit
		}
		this.sendPOST(path, data, null, callback);
	}

	//
	redoCallback(tradeNo, callback) {
		let path = "/api/v1/pay/callback/redo/";
		let data = {
			"trade_no": tradeNo
		}
		this.sendPOST(path, data, null, callback);
	}
}

module.exports = {
	DragonExV1: DragonExV1
};
